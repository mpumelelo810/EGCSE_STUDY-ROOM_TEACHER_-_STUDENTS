-- Run as the project owner after installing all migrations.
-- Uses random, transaction-only identities. No Auth emails are sent.
-- Every fixture row is rolled back; no real accounts are modified.
begin;
set local plpgsql.check_asserts = on;
do $verify$
declare
 student_id uuid := gen_random_uuid();
 other_id uuid := gen_random_uuid();
 teacher_id uuid := gen_random_uuid();
 unrelated_id uuid := gen_random_uuid();
 pending_id uuid := gen_random_uuid();
 moderator_id uuid := gen_random_uuid();
 rid uuid;
 mid uuid;
 class_code text;
 summary jsonb;
 table_name text;
begin
 insert into auth.users(id, raw_user_meta_data) values
 (student_id, '{"display_name":"Verification student","requested_role":"moderator","role":"moderator","status":"active"}'),
 (other_id, '{"display_name":"Other verification student"}'),
 (teacher_id, '{"display_name":"Verification teacher","requested_role":"teacher"}'),
 (unrelated_id, '{"display_name":"Other verification teacher","requested_role":"teacher"}'),
 (pending_id, '{"display_name":"Pending verification teacher","requested_role":"teacher","role":"teacher","status":"active"}'),
 (moderator_id, '{"display_name":"Verification moderator"}');
 assert (select role='student' and status='active' from public.profiles where id=student_id), 'Signup metadata escalated privileges';
 assert (select role='student' and status='pending' from public.profiles where id=pending_id), 'Teacher approval was bypassed';
 update public.profiles set role='moderator' where id=moderator_id;

 perform set_config('request.jwt.claim.sub', '', true);
 execute 'set local role anon';
 foreach table_name in array array['profiles','study_progress','study_rooms','room_members','room_materials','moderation_log'] loop
  begin
   execute format('select 1 from public.%I limit 1', table_name);
   raise exception 'Anonymous access allowed to %', table_name;
  exception when insufficient_privilege then null; end;
 end loop;
 begin
  perform public.save_study_progress('{"version":1,"completed":{},"sessions":{}}');
  raise exception 'Anonymous progress write allowed';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', pending_id::text, true);
 execute 'set local role authenticated';
 begin
  insert into public.study_rooms(title,subject) values('Unauthorized class','Mathematics');
  raise exception 'Pending teacher created a class';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 begin
  update public.profiles set role='moderator' where id=student_id;
  raise exception 'Direct role escalation allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.moderate_account(teacher_id,'approve_teacher');
  raise exception 'Student approved a teacher';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', moderator_id::text, true);
 execute 'set local role authenticated';
 perform public.moderate_account(teacher_id,'approve_teacher');
 perform public.moderate_account(unrelated_id,'approve_teacher');
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', teacher_id::text, true);
 execute 'set local role authenticated';
 insert into public.study_rooms(title,subject) values('Verification class','Mathematics') returning id,join_code into rid,class_code;
 insert into public.room_materials(room_id,title,chapter_id,kind,body,url)
 values(rid,'Verification task','M03','assignment','Practice fractions','https://example.org/paper.pdf') returning id into mid;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.study_rooms where id=rid), 'Unadmitted student read a class';
 perform public.request_room_access(class_code);
 assert not exists(select 1 from public.room_materials where id=mid), 'Request immediately exposed materials';
 begin
  update public.room_members set status='active' where user_id=student_id;
  raise exception 'Student admitted themselves';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.room_materials(room_id,title,chapter_id,kind) values(rid,'Forged','M01','resource');
  raise exception 'Student published material';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', unrelated_id::text, true);
 execute 'set local role authenticated';
 begin
  perform public.review_room_member(rid,student_id,true);
  raise exception 'Unrelated teacher admitted a student';
 exception when insufficient_privilege then null; end;
 begin
  perform public.class_progress(rid);
  raise exception 'Unrelated teacher read class progress';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', teacher_id::text, true);
 execute 'set local role authenticated';
 perform public.review_room_member(rid,student_id,true);
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 assert exists(select 1 from public.room_materials where id=mid), 'Admitted student cannot read material';
 perform public.save_study_progress('{"version":1,"completed":{"M01":true},"sessions":{"M01":{"attempts":2}},"notes":{"M01":"PRIVATE_VERIFICATION_NOTE"}}');
 assert exists(select 1 from public.study_progress where user_id=student_id), 'Student cannot read own progress';
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', other_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.study_progress where user_id=student_id), 'Another student read private notes';
 assert not exists(select 1 from public.room_materials where id=mid), 'Another student read class materials';
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', teacher_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.study_progress where user_id=student_id), 'Teacher read private notes';
 select to_jsonb(p) into summary from public.class_progress(rid) p where user_id=student_id;
 assert summary->>'reviewed'='1' and summary->>'attempted'='1', 'Teacher summary counts are incorrect';
 assert position('PRIVATE_VERIFICATION_NOTE' in summary::text)=0, 'Notes leaked in teacher summary';
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', moderator_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.study_progress where user_id=student_id), 'Moderator read private notes';
 perform public.moderate_material(mid,true);
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.room_materials where id=mid), 'Hidden material still visible';
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', teacher_id::text, true);
 execute 'set local role authenticated';
 begin
  update public.room_materials set hidden=false where id=mid;
  raise exception 'Teacher bypassed moderation';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', moderator_id::text, true);
 execute 'set local role authenticated';
 perform public.moderate_material(mid,false);
 perform public.moderate_account(student_id,'suspend');
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 assert not exists(select 1 from public.study_progress where user_id=student_id), 'Suspended user read progress';
 assert not exists(select 1 from public.room_materials where id=mid), 'Suspended user read materials';
 begin
  perform public.save_study_progress('{"version":1,"completed":{},"sessions":{}}');
  raise exception 'Suspended user wrote progress';
 exception when insufficient_privilege then null; end;
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', moderator_id::text, true);
 execute 'set local role authenticated';
 perform public.moderate_account(student_id,'restore');
 assert (select count(*) from public.moderation_log where actor_id=moderator_id)=6, 'Moderation audit log missing actions';
 execute 'reset role';

 perform set_config('request.jwt.claim.sub', student_id::text, true);
 execute 'set local role authenticated';
 assert exists(select 1 from public.room_materials where id=mid), 'Restoration failed';
 perform public.leave_room(rid);
 assert not exists(select 1 from public.room_materials where id=mid), 'Former member still reads materials';
 execute 'reset role';
end;
$verify$;
rollback;
select 'PASS: role boundaries, class admission, private notes, moderation and suspension; fixtures rolled back' as verification;
