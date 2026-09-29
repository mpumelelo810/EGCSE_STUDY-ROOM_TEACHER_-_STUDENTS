/* Real PostgreSQL policies run in PGlite; no mocked authorization decisions. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
test('database enforces student, teacher and moderator boundaries',async t=>{
 const db=new PGlite();
 const ids={student:'10000000-0000-0000-0000-000000000001',other:'10000000-0000-0000-0000-000000000002',teacher:'20000000-0000-0000-0000-000000000001',unrelated:'20000000-0000-0000-0000-000000000002',pending:'20000000-0000-0000-0000-000000000003',mod:'30000000-0000-0000-0000-000000000001'};
 const as=async who=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[who]||'']);await db.exec('set role '+(who==='anon'?'anon':'authenticated'));};
 const query=async(sql,args=[])=> (await db.query(sql,args)).rows;
 const rpc=(name,args)=>query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args);
 const denied=async fn=>{await assert.rejects(fn,/permission denied|row-level security|account required|access required|Only the class teacher|Group membership required|Check the group code/);};
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  const migrations=path.join(__dirname,'../supabase/migrations');
  for(const file of fs.readdirSync(migrations).filter(file=>file.endsWith('.sql')).sort())
   await db.exec(fs.readFileSync(path.join(migrations,file),'utf8'));
  for(const [name,id] of Object.entries(ids))await query('insert into auth.users values($1,$2)',[id,JSON.stringify({display_name:name,requested_role:['teacher','unrelated','pending'].includes(name)?'teacher':'moderator',role:'moderator',status:'active'})]);
  await query("update public.profiles set role='moderator' where id=$1",[ids.mod]);
  await t.test('signup metadata cannot create moderator or approved teacher',async()=>{
   const p=await query('select * from public.profiles where id=$1',[ids.student]);assert.equal(p[0].role,'student');
   const pending=await query('select * from public.profiles where id=$1',[ids.pending]);assert.equal(pending[0].role,'student');assert.equal(pending[0].status,'pending');
   await as('pending');await denied(()=>query("insert into public.study_rooms(title,subject) values('Blocked','Mathematics')"));
  });
  await t.test('anonymous requests cannot read account data or call privileged functions',async()=>{
   await as('anon');for(const table of ['profiles','study_progress','study_rooms','room_members','room_materials','moderation_log','subjects','class_lessons','study_groups','study_group_members','study_group_posts'])await denied(()=>query('select * from public.'+table));
   await denied(()=>rpc('moderate_account',[ids.pending,'approve_teacher']));
   await denied(()=>rpc('save_study_progress',[{version:1,completed:{},sessions:{}}]));
  });
  await t.test('only moderator can approve a teacher; direct role changes denied',async()=>{
   await as('student');await denied(()=>rpc('moderate_account',[ids.pending,'approve_teacher']));
   await denied(()=>query("update public.profiles set role='moderator' where id=$1",[ids.student]));
   await denied(()=>query("update public.profiles set status='active' where id=$1",[ids.pending]));
   await as('mod');await rpc('moderate_account',[ids.teacher,'approve_teacher']);await rpc('moderate_account',[ids.unrelated,'approve_teacher']);
   await assert.rejects(()=>rpc('moderate_account',[ids.mod,'suspend']),/project owner/);
  });
  let room,material;
  await t.test('teachers create owned classes; students cannot create or take them over',async()=>{
   await as('teacher');room=(await query("insert into public.study_rooms(title,subject) values('Form 5','Mathematics') returning *"))[0];
   material=(await query("insert into public.room_materials(room_id,title,chapter_id,kind,body,url) values($1,'Fractions','M03','assignment','Try question 2','https://example.org/paper.pdf') returning *",[room.id]))[0];
   await as('student');assert.equal((await query('select * from public.study_rooms')).length,0);
   await denied(()=>query("insert into public.study_rooms(title,subject) values('Fraud','Mathematics')"));
   await denied(()=>query('update public.study_rooms set owner_id=$1 where id=$2',[ids.student,room.id]));
   await as('unrelated');assert.equal((await query('select * from public.room_materials')).length,0);
   await denied(()=>query("insert into public.room_materials(room_id,title,chapter_id,kind) values($1,'Intrusion','M01','resource')",[room.id]));
  });
  await t.test('a class code creates a request; only the class owner admits a learner',async()=>{
   await as('student');await rpc('request_room_access',[room.join_code]);assert.equal((await query('select * from public.room_materials')).length,0);
   await denied(()=>query("update public.room_members set status='active' where user_id=$1",[ids.student]));
   await as('unrelated');await denied(()=>rpc('review_room_member',[room.id,ids.student,true]));
   await as('teacher');assert.equal((await query('select * from public.profiles where id=$1',[ids.student])).length,1);
   await rpc('review_room_member',[room.id,ids.student,true]);
   await as('student');assert.equal((await query('select * from public.room_materials')).length,1);
   await as('other');assert.equal((await query('select * from public.room_materials')).length,0);
  });
  await t.test('private progress stays private; teachers receive only their own class counts',async()=>{
   await as('student');await rpc('save_study_progress',[{version:1,completed:{M01:true},sessions:{M01:{attempts:2}},notes:{M01:'PRIVATE'}}]);
   assert.equal((await query('select * from public.study_progress')).length,1);
   await denied(()=>query("insert into public.study_progress(user_id,data) values($1,'{}')",[ids.other]));
   await as('other');assert.equal((await query('select * from public.study_progress')).length,0);
   await as('teacher');assert.equal((await query('select * from public.study_progress')).length,0);
   const rows=await query('select * from public.class_progress($1)',[room.id]);assert.equal(rows.length,1);assert.equal(rows[0].reviewed,1);assert.equal(rows[0].attempted,1);assert.equal(JSON.stringify(rows).includes('PRIVATE'),false);
   await as('unrelated');await denied(()=>rpc('class_progress',[room.id]));
   await as('mod');assert.equal((await query('select * from public.study_progress')).length,0);await denied(()=>rpc('class_progress',[room.id]));
  });
  await t.test('teachers own class lessons and moderators see no learning content',async()=>{
   await as('teacher');await denied(()=>query("insert into public.subjects(name) values('History')"));
   const lesson=(await query("insert into public.class_lessons(room_id,title,overview,practice_question,practice_answer) values($1,'Decimals','Place value','Round 2.45','2.5') returning *",[room.id]))[0];
   await as('student');assert.equal((await query('select * from public.class_lessons')).length,1);
   await denied(()=>query("insert into public.class_lessons(room_id,title) values($1,'Forgery')",[room.id]));
   await denied(()=>query("insert into public.subjects(name) values('Forged subject')"));
   await denied(()=>query("insert into public.room_materials(room_id,title,chapter_id,kind) values($1,'Forged','M01','resource')",[room.id]));
   await as('unrelated');assert.equal((await query('select * from public.class_lessons')).length,0);
   await as('mod');assert.equal((await query('select * from public.study_rooms')).length,0);
   assert.equal((await query('select * from public.room_materials')).length,0);
   assert.equal((await query('select * from public.class_lessons')).length,0);
   await denied(()=>query("insert into public.class_lessons(room_id,title) values($1,'Admin lesson')",[room.id]));
   await denied(()=>rpc('moderate_material',[material.id,true]));
   await query("insert into public.subjects(name) values('Pilot subject')");
   await as('teacher');assert.equal((await query('select * from public.class_lessons where id=$1',[lesson.id])).length,1);
  });
  await t.test('only approved classmates can form and discuss in a group',async()=>{
   await as('student');const created=await rpc('create_study_group',[room.id,'Study team']);const code=created[0].create_study_group;
   const group=(await query('select * from public.study_groups'))[0];
   await query("insert into public.study_group_posts(group_id,body) values($1,'Let us practise decimals')",[group.id]);
   assert.equal((await query('select * from public.group_discussion($1)',[group.id])).length,1);
   await as('other');assert.equal((await query('select * from public.study_groups')).length,0);
   await denied(()=>rpc('join_study_group',[code]));
   await as('teacher');assert.equal((await query('select * from public.study_groups')).length,0);
   await as('mod');assert.equal((await query('select * from public.study_group_posts')).length,0);
   await denied(()=>rpc('group_discussion',[group.id]));
  });
  await t.test('suspension immediately blocks an existing account identity; restoration works',async()=>{
   await as('mod');await rpc('moderate_account',[ids.student,'suspend']);
   await as('student');assert.equal((await query('select * from public.study_progress')).length,0);assert.equal((await query('select * from public.room_materials')).length,0);
   await denied(()=>rpc('save_study_progress',[{version:1,completed:{},sessions:{}}]));
   await as('mod');await rpc('moderate_account',[ids.student,'restore']);
   assert.ok((await query('select * from public.moderation_log')).length>=4);
   await denied(()=>query("insert into public.moderation_log(actor_id,action,target_id) values($1,'fake',$1)",[ids.mod]));
   await as('student');assert.equal((await query('select * from public.room_materials')).length,1);await rpc('leave_room',[room.id]);assert.equal((await query('select * from public.room_materials')).length,0);
  });
  await t.test('moderator publishes global subject lessons while teachers edit only classes',async()=>{
   await as('mod');
   await query("insert into public.subjects(name,available) values('French pilot',true)");
   const topic=(await query("insert into public.subject_topics(subject_name,position,title) values('French pilot',1,'Greetings') returning *"))[0];
   const global=(await query("insert into public.global_lessons(topic_id,title,overview,published) values($1,'Bonjour','A greeting',false) returning *",[topic.id]))[0];
   await as('teacher');
   assert.equal((await query('select * from public.global_lessons where id=$1',[global.id])).length,0);
   await denied(()=>query("insert into public.global_lessons(topic_id,title) values($1,'Teacher edit')",[topic.id]));
   await as('mod');
   await query('update public.global_lessons set published=true where id=$1',[global.id]);
   await as('teacher');
   assert.equal((await query('select * from public.global_lessons where id=$1',[global.id])).length,1);
   assert.equal((await query("update public.global_lessons set overview='Teacher edit' where id=$1 returning *",[global.id])).length,0);
   await as('student');
   assert.equal((await query('select * from public.global_lessons where id=$1',[global.id])).length,1);
   await denied(()=>query("insert into public.subject_topics(subject_name,position,title) values('French pilot',2,'Forged')"));
  });
  await t.test('malformed payloads and unsafe links are rejected',async()=>{
   await as('student');await assert.rejects(()=>rpc('save_study_progress',[{version:1,completed:[],sessions:{}}]),/Invalid progress/);
   await as('teacher');await assert.rejects(()=>query("insert into public.room_materials(room_id,title,chapter_id,kind,url) values($1,'Bad','M01','resource','javascript:alert(1)')",[room.id]),/check constraint/);
  });
 }finally{await db.close();}
});
