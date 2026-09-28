-- Apply once to a NEW Supabase project. See docs/BACKEND_SETUP.md.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 100),
 role text not null default 'student' check (role in ('student','teacher','moderator')),
 requested_role text not null default 'student' check (requested_role in ('student','teacher')),
 status text not null default 'active' check (status in ('active','pending','suspended')),
 created_at timestamptz not null default now()
);
create table public.study_progress (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1500000),
 updated_at timestamptz not null default now()
);
create table public.study_rooms (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.profiles(id),
 title text not null check (char_length(trim(title)) between 1 and 120),
 subject text not null check (subject in ('Mathematics','Physical Science','Both subjects')),
 join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 archived boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.room_members (
 room_id uuid not null references public.study_rooms(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'requested' check (status in ('requested','active')),
 created_at timestamptz not null default now(),
 primary key (room_id,user_id)
);
create index room_members_user on public.room_members(user_id);
create index study_rooms_owner on public.study_rooms(owner_id);
create table public.room_materials (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.study_rooms(id) on delete cascade,
 owner_id uuid not null default auth.uid() references public.profiles(id),
 title text not null check (char_length(trim(title)) between 1 and 180),
 chapter_id text not null check (chapter_id ~ '^(M(0[1-9]|1[0-9]|2[0-4])|C(0[1-9]|1[0-4])|P(0[1-9]|1[0-5]))$'),
 kind text not null check (kind in ('resource','assignment')),
 body text not null default '' check (char_length(body) <= 10000),
 url text not null default '' check (url = '' or (url ~ '^https://' and char_length(url) <= 2000)),
 hidden boolean not null default false,
 created_at timestamptz not null default now()
);
create index room_materials_room on public.room_materials(room_id);
create table public.moderation_log (
 id bigint generated always as identity primary key,
 actor_id uuid not null references public.profiles(id),
 action text not null,
 target_id uuid not null,
 created_at timestamptz not null default now()
);

-- No claim supplied by the browser can assign a privileged role.
create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name,requested_role,status)
 values (new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),100),''),'Learner'),
  case when new.raw_user_meta_data->>'requested_role' = 'teacher' then 'teacher' else 'student' end,
  case when new.raw_user_meta_data->>'requested_role' = 'teacher' then 'pending' else 'active' end);
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();

create function private.actor_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id = (select auth.uid()) and status = 'active';
$$;
create function private.owns_room(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.actor_role() = 'teacher' and exists(select 1 from public.study_rooms where id=rid and owner_id=auth.uid());
$$;
create function private.can_read_room(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.actor_role() = 'moderator' or private.owns_room(rid) or (
 private.actor_role() = 'student' and exists(select 1 from public.room_members m join public.study_rooms r on r.id=m.room_id
 join public.profiles p on p.id=r.owner_id where r.id=rid and m.user_id=auth.uid() and m.status='active'
 and not r.archived and p.role='teacher' and p.status='active'));
$$;
create function private.teaches_student(uid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.actor_role()='teacher' and exists(select 1 from public.room_members m join public.study_rooms r on r.id=m.room_id
 where m.user_id=uid and r.owner_id=auth.uid() and not r.archived);
$$;

alter table public.profiles enable row level security;
alter table public.study_progress enable row level security;
alter table public.study_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_materials enable row level security;
alter table public.moderation_log enable row level security;
revoke all on public.profiles,public.study_progress,public.study_rooms,public.room_members,public.room_materials,public.moderation_log from anon,authenticated;
grant select on public.profiles,public.study_progress,public.study_rooms,public.room_members,public.room_materials,public.moderation_log to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert(title,subject) on public.study_rooms to authenticated;
grant update(title,subject,archived) on public.study_rooms to authenticated;
grant insert(room_id,title,chapter_id,kind,body,url) on public.room_materials to authenticated;
grant update(title,chapter_id,kind,body,url) on public.room_materials to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or private.actor_role()='moderator' or private.teaches_student(id));
create policy profiles_rename on public.profiles for update to authenticated using (id=auth.uid() and private.actor_role() is not null) with check (id=auth.uid());
create policy progress_private on public.study_progress for select to authenticated using (user_id=auth.uid() and private.actor_role() is not null);
create policy rooms_read on public.study_rooms for select to authenticated using ((owner_id=auth.uid() and private.actor_role()='teacher') or private.can_read_room(id));
create policy rooms_create on public.study_rooms for insert to authenticated with check (private.actor_role()='teacher' and owner_id=auth.uid() and not archived);
create policy rooms_update on public.study_rooms for update to authenticated using (private.owns_room(id)) with check (private.owns_room(id));
create policy members_read on public.room_members for select to authenticated using ((user_id=auth.uid() and private.actor_role()='student') or private.owns_room(room_id) or private.actor_role()='moderator');
create policy materials_read on public.room_materials for select to authenticated using (private.actor_role()='moderator' or (private.can_read_room(room_id) and (not hidden or private.owns_room(room_id))));
create policy materials_create on public.room_materials for insert to authenticated with check (private.owns_room(room_id) and owner_id=auth.uid() and not hidden and exists(select 1 from public.study_rooms where id=room_id and not archived));
create policy materials_update on public.room_materials for update to authenticated using (owner_id=auth.uid() and private.owns_room(room_id)) with check (owner_id=auth.uid() and private.owns_room(room_id));
create policy log_moderator on public.moderation_log for select to authenticated using (private.actor_role()='moderator');

create function public.save_study_progress(payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
 if private.actor_role() is null then raise exception 'Active account required' using errcode='42501'; end if;
 if jsonb_typeof(payload) is distinct from 'object' or payload->>'version' is distinct from '1'
 or octet_length(payload::text)>1500000 or jsonb_typeof(payload->'completed') is distinct from 'object'
 or jsonb_typeof(payload->'sessions') is distinct from 'object' then raise exception 'Invalid progress backup'; end if;
 insert into public.study_progress(user_id,data) values(auth.uid(),payload)
 on conflict(user_id) do update set data=excluded.data,updated_at=now();
end; $$;
create function public.request_room_access(code text) returns void language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
 if private.actor_role() is distinct from 'student' then raise exception 'Student account required' using errcode='42501'; end if;
 select r.id into rid from public.study_rooms r join public.profiles p on p.id=r.owner_id where r.join_code=upper(trim(code)) and not r.archived and p.role='teacher' and p.status='active';
 if rid is null then raise exception 'Check the class code with your teacher'; end if;
 insert into public.room_members(room_id,user_id) values(rid,auth.uid()) on conflict do nothing;
end; $$;
create function public.review_room_member(rid uuid,uid uuid,approve boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 if private.owns_room(rid) is not true then raise exception 'Only the class teacher can review membership' using errcode='42501'; end if;
 if approve then
  if not exists(select 1 from public.profiles where id=uid and role='student' and status='active') then raise exception 'Active student required'; end if;
  update public.room_members set status='active' where room_id=rid and user_id=uid;
 else delete from public.room_members where room_id=rid and user_id=uid;
 end if;
end; $$;
create function public.leave_room(rid uuid) returns void language plpgsql security definer set search_path = '' as $$
begin delete from public.room_members where room_id=rid and user_id=auth.uid(); end; $$;
-- Counts are returned to the responsible teacher only. Private notes never leave this function.
create function public.class_progress(rid uuid) returns table(user_id uuid,display_name text,reviewed bigint,attempted bigint) language plpgsql security definer set search_path = '' as $$
begin
 if private.owns_room(rid) is not true then raise exception 'Only the class teacher can view progress' using errcode='42501'; end if;
 return query select p.id,p.display_name,
 (select count(*) from jsonb_each(coalesce(s.data->'completed','{}'::jsonb)) e where e.value='true'::jsonb and e.key ~ '^(M(0[1-9]|1[0-9]|2[0-4])|C(0[1-9]|1[0-4])|P(0[1-9]|1[0-5]))$'),
 (select count(*) from jsonb_each(coalesce(s.data->'sessions','{}'::jsonb)) e where (e.value->>'attempts') ~ '^[1-9][0-9]*$' and e.key ~ '^(M(0[1-9]|1[0-9]|2[0-4])|C(0[1-9]|1[0-4])|P(0[1-9]|1[0-5]))$')
 from public.room_members m join public.profiles p on p.id=m.user_id left join public.study_progress s on s.user_id=p.id
 where m.room_id=rid and m.status='active' and p.status='active' and p.role='student';
end; $$;
create function public.moderate_account(target uuid,decision text) returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
 if private.actor_role() is distinct from 'moderator' then raise exception 'Moderator access required' using errcode='42501'; end if;
 select * into p from public.profiles where id=target for update;
 if p.id is null or p.role='moderator' or target=auth.uid() then raise exception 'This account must be managed by the project owner'; end if;
 if decision='approve_teacher' and p.requested_role='teacher' and p.status='pending' then
 update public.profiles set role='teacher',status='active' where id=target;
 elsif decision='decline_teacher' and p.status='pending' then
 update public.profiles set role='student',requested_role='student',status='active' where id=target;
 elsif decision='suspend' and p.status='active' then update public.profiles set status='suspended' where id=target;
 elsif decision='restore' and p.status='suspended' then update public.profiles set status='active' where id=target;
 else raise exception 'Invalid account decision'; end if;
 insert into public.moderation_log(actor_id,action,target_id) values(auth.uid(),decision,target);
end; $$;
create function public.moderate_material(target uuid,hide boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 if private.actor_role() is distinct from 'moderator' then raise exception 'Moderator access required' using errcode='42501'; end if;
 update public.room_materials set hidden=hide where id=target;
 if not found then raise exception 'Material not found'; end if;
 insert into public.moderation_log(actor_id,action,target_id) values(auth.uid(),case when hide then 'hide_material' else 'restore_material' end,target);
end; $$;

revoke all on function private.create_profile(),private.actor_role(),private.owns_room(uuid),private.can_read_room(uuid),private.teaches_student(uuid) from public,anon,authenticated;
grant execute on function private.actor_role(),private.owns_room(uuid),private.can_read_room(uuid),private.teaches_student(uuid) to authenticated;
revoke all on function public.save_study_progress(jsonb),public.request_room_access(text),public.review_room_member(uuid,uuid,boolean),public.leave_room(uuid),public.class_progress(uuid),public.moderate_account(uuid,text),public.moderate_material(uuid,boolean) from public,anon,authenticated;
grant execute on function public.save_study_progress(jsonb),public.request_room_access(text),public.review_room_member(uuid,uuid,boolean),public.leave_room(uuid),public.class_progress(uuid),public.moderate_account(uuid,text),public.moderate_material(uuid,boolean) to authenticated;
commit;
