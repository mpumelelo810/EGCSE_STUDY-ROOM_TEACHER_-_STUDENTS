(() => {
 'use strict';
 const A=window.StudyAuth,$=id=>document.getElementById(id),esc=A.esc;
 let generation=0;
 const result=async p=>{const r=await p;if(r.error)throw r.error;return r.data;};
 const link=(url,text)=>{try{const u=new URL(url);return u.protocol==='https:'?`<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`:'';}catch{return '';}};
 const chapterName=id=>window.STUDY_CONTENT.lessons.find(c=>c.id===id)?.title||id;
 const options=()=>window.STUDY_CONTENT.lessons.map(c=>`<option value="${c.id}">${esc(c.id+' · '+c.title)}</option>`).join('');
 function material(m,teacher=false){return `<article class="room-material"><div class="eyebrow">${esc(m.kind)} · ${esc(m.chapter_id)}${m.hidden?' · HIDDEN':''}</div><h3>${esc(m.title)}</h3><p class="material-body">${esc(m.body)}</p><div class="actions"><a href="#chapter/${esc(m.chapter_id)}">Revise ${esc(chapterName(m.chapter_id))} →</a>${m.url?link(m.url,'Open learning material'):''}${teacher?`<button class="button small secondary" data-edit-material="${m.id}">Edit</button><button class="button small secondary" data-delete-material="${m.id}">Remove</button>`:''}</div></article>`;}
 function lessonCard(l,teacher){
  return `<article class="panel class-lesson"><div class="eyebrow">CLASS LESSON</div><h3>${esc(l.title)}</h3>
   <p class="lesson-body">${esc(l.overview)}</p>
   ${l.steps?`<h4>Learn the method</h4><p class="lesson-body">${esc(l.steps)}</p>`:''}
   ${l.worked_example?`<h4>Worked example</h4><p class="lesson-body">${esc(l.worked_example)}</p>`:''}
   ${l.practice_question?`<div class="practice-corner"><h4>Practice corner</h4><p class="lesson-body">${esc(l.practice_question)}</p><label class="field"><span class="field-label">Try it first (your answer stays on this device)</span><textarea rows="2" placeholder="Write your attempt here"></textarea></label><details><summary>Compare with the teacher's answer</summary><p class="lesson-body">${esc(l.practice_answer||'Ask your teacher to add an answer.')}</p></details></div>`:''}
   ${l.resource_url?link(l.resource_url,'Supplementary link'):''}
   ${teacher?`<div class="actions"><button class="button small secondary" data-edit-lesson="${l.id}">Edit lesson</button><button class="button small secondary" data-delete-lesson="${l.id}">Remove lesson</button></div>`:''}</article>`;
 }
 function action(button,fn){button.onclick=async()=>{button.disabled=true;try{await fn();}catch(e){if($('room-status'))$('room-status').textContent=e.message||'The request could not be completed.';}finally{if(button.isConnected)button.disabled=false;}};}
 async function renderGroups(room,token,chosen){
  const host=$('student-groups');if(!host)return;
  try{
   const groups=await result(A.client.from('study_groups').select('id,title,join_code').eq('room_id',room.id).order('created_at'));
   if(token!==generation)return;
   const group=groups.find(g=>g.id===chosen)||groups[0];
   const posts=group?await result(A.client.rpc('group_discussion',{gid:group.id})):[];
   if(token!==generation)return;
   host.innerHTML=`<h3>Study groups</h3><p>Discuss this class with classmates. Group posts are visible only to members of that group.</p>
    <div class="form-grid"><form id="create-group"><label class="field"><span class="field-label">New group name</span><input name="title" maxlength="100" required></label><button class="button small" type="submit">Create group</button></form>
    <form id="join-group"><label class="field"><span class="field-label">Join with a group code</span><input name="code" maxlength="12" minlength="12" required></label><button class="button small secondary" type="submit">Join group</button></form></div>
    <p id="group-status" role="status" aria-live="polite"></p>
    ${group?`<label class="field"><span class="field-label">Your groups</span><select id="group-picker">${groups.map(g=>`<option value="${g.id}"${g.id===group.id?' selected':''}>${esc(g.title)}</option>`).join('')}</select></label><p class="invite-code">Share this group code with classmates: <strong>${esc(group.join_code)}</strong></p><div class="group-posts">${posts.slice().reverse().map(p=>`<article class="room-material"><strong>${esc(p.display_name)}</strong><small> · ${esc(new Date(p.created_at).toLocaleString())}</small><p class="lesson-body">${esc(p.body)}</p></article>`).join('')||'<p>No messages yet. Start the discussion.</p>'}</div><form id="group-post"><label class="field"><span class="field-label">Message or learning link</span><textarea name="body" maxlength="5000" rows="3" required></textarea></label><button class="button" type="submit">Post to group</button></form>`:'<p>Create a group or enter a classmate’s code to begin.</p>'}`;
   $('create-group').onsubmit=async e=>{e.preventDefault();try{const title=new FormData(e.target).get('title').trim();await result(A.client.rpc('create_study_group',{rid:room.id,group_title:title}));await renderGroups(room,token);$('group-status').textContent='Group created. Share its code with classmates.';}catch(err){$('group-status').textContent=err.message;}};
   $('join-group').onsubmit=async e=>{e.preventDefault();try{await result(A.client.rpc('join_study_group',{code:new FormData(e.target).get('code').trim()}));await renderGroups(room,token);$('group-status').textContent='You joined the group.';}catch(err){$('group-status').textContent=err.message;}};
   if(group){
    $('group-picker').onchange=()=>renderGroups(room,token,$('group-picker').value);
    $('group-post').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await result(A.client.from('study_group_posts').insert({group_id:group.id,body:new FormData(e.target).get('body').trim()}));await renderGroups(room,token,group.id);$('group-status').textContent='Posted to your group.';}catch(err){$('group-status').textContent=err.message;b.disabled=false;}};
   }
  }catch(err){if(token===generation)host.innerHTML=`<h3>Study groups</h3><p role="alert">${esc(err.message)}</p><button class="button secondary" id="retry-groups">Try again</button>`;if($('retry-groups'))$('retry-groups').onclick=()=>renderGroups(room,token,chosen);}
 }
 async function render(section,roomId){
  const token=++generation;
  if(!A.allowed(section)||!A.client){$('main').innerHTML='<div class="page-head"><h1>Access unavailable</h1><p>This page is not available for your account.</p><a href="#overview">Return to your dashboard</a></div>';return;}
  const role=A.profile.role;
  $('main').innerHTML='<div class="page-head"><h1>Loading your workspace…</h1><p role="status">Checking your account access.</p></div>';
  try{
   if(section==='moderator'){await moderation(token);return;}
   const subjects=await result(A.client.from('subjects').select('name').order('name'));
   const rooms=await result(A.client.from('study_rooms').select('*').order('created_at',{ascending:false}));
   const members=await result(A.client.from('room_members').select('*'));
   if(token!==generation)return;
   const selected=rooms.find(r=>r.id===roomId)||rooms[0];
   const teacher=role==='teacher';
   $('main').innerHTML=`<div class="page-head"><div class="eyebrow">${teacher?'TEACHER WORKSPACE':'LEARN TOGETHER'}</div><h1>${teacher?'My teaching classes':'My classes'}</h1><p>${teacher?'Share focused practice and follow the learners in your classes.':'Find the resources and practice your teacher has shared with you.'}</p></div><p id="room-status" role="status" aria-live="polite"></p>
    <section class="panel">${teacher?`<h2>Create a study class</h2><form id="create-room" class="form-grid"><label class="field"><span class="field-label">Class name</span><input name="title" maxlength="120" required placeholder="Form 5 · Mathematics"></label><label class="field"><span class="field-label">Subject</span><select name="subject">${subjects.map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></label><div><button class="button" type="submit">Create class</button></div></form>`:`<h2>Join your teacher’s class</h2><p>Enter the code from your teacher. Once they approve you, they can see your chapter review and practice counts. Your notes and AI drafts remain private.</p><form id="join-room" class="inline-form"><label class="field"><span class="field-label">Class code</span><input name="code" autocomplete="off" minlength="12" maxlength="12" pattern="[A-Fa-f0-9]{12}" required placeholder="12-character code"></label><button class="button" type="submit">Request to join</button></form>${members.filter(m=>m.status==='requested').length?`<p class="status-pill">${members.filter(m=>m.status==='requested').length} request(s) waiting for teacher approval</p>`:''}`}</section>
    ${teacher?'<section class="panel"><h2>Add a subject</h2><p>Create a subject name, then choose it for a class. Only teachers can add lesson content to their own classes.</p><form id="create-subject" class="inline-form"><label class="field"><span class="field-label">Subject name</span><input name="name" maxlength="100" required></label><button class="button" type="submit">Add subject</button></form></section>':''}
    <section class="panel"><label class="field"><span class="field-label">${teacher?'Your classes':'Approved classes'}</span><select id="room-picker">${rooms.map(r=>`<option value="${r.id}"${selected?.id===r.id?' selected':''}>${esc(r.title)}${r.archived?' · Archived':''}</option>`).join('')||'<option>No classes yet</option>'}</select></label><div id="room-detail">${!selected?'<p>Your classes will appear here.</p>':''}</div></section>`;
   $('room-picker').onchange=()=>{location.hash=section+'/'+$('room-picker').value;};
   if(teacher)$('create-subject').onsubmit=async e=>{e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;try{await result(A.client.from('subjects').insert({name:new FormData(form).get('name').trim()}));await render(section);if($('room-status'))$('room-status').textContent='Subject added. You can now create a class for it.';}catch(err){$('room-status').textContent=err.message;}finally{if(b.isConnected)b.disabled=false;}};
   const form=$(teacher?'create-room':'join-room');form.onsubmit=async e=>{
    e.preventDefault();const button=form.querySelector('button');button.disabled=true;
    try{
     const data=new FormData(form);
     if(teacher){const created=await result(A.client.from('study_rooms').insert({title:data.get('title').trim(),subject:data.get('subject')}).select().single());location.hash='teacher/'+created.id;}
     else{await result(A.client.rpc('request_room_access',{code:data.get('code').trim()}));await render(section);if($('room-status'))$('room-status').textContent='Request sent. Your teacher needs to approve it.';}
    }catch(e){if(token===generation)$('room-status').textContent=e.message;}finally{if(button.isConnected)button.disabled=false;}
   };
   if(!selected)return;
   const materials=await result(A.client.from('room_materials').select('*').eq('room_id',selected.id).order('created_at',{ascending:false}));
   const lessons=await result(A.client.from('class_lessons').select('*').eq('room_id',selected.id).order('created_at',{ascending:false}));
   let profiles=[],summaries=[];
   if(teacher){profiles=await result(A.client.from('profiles').select('id,display_name,status'));summaries=await result(A.client.rpc('class_progress',{rid:selected.id}));}
   if(token!==generation)return;
   const roster=members.filter(m=>m.room_id===selected.id);
   $('room-detail').innerHTML=`<div class="section-heading"><div><h2>${esc(selected.title)}</h2><p>${esc(selected.subject)}</p></div>${teacher?`<button id="archive-room" class="button small secondary">${selected.archived?'Reopen class':'Archive class'}</button>`:'<button id="leave-room" class="button small secondary">Leave class</button>'}</div>
    ${teacher?`<p class="invite-code">Class code <strong>${esc(selected.join_code)}</strong></p><p class="small-text">Share this code with your learners, then approve each request below.</p><h3>Class members</h3><div class="member-list">${roster.map(m=>{const p=profiles.find(p=>p.id===m.user_id),s=summaries.find(s=>s.user_id===m.user_id);return `<article><div><strong>${esc(p?.display_name||'Learner')}</strong><p>${m.status==='requested'?'Waiting for approval':s?`${s.reviewed} chapters reviewed · ${s.attempted} chapters attempted`:'Account currently unavailable'}</p></div><div class="actions">${m.status==='requested'?`<button class="button small" data-member="${m.user_id}" data-approve="true">Approve</button>`:''}<button class="button small secondary" data-member="${m.user_id}" data-approve="false">${m.status==='requested'?'Decline':'Remove'}</button></div></article>`;}).join('')||'<p>No learners have joined yet.</p>'}</div><p class="small-text muted">Counts are learner activity, not marks or exam-readiness scores. Private notes are not visible.</p>
    ${!selected.archived?`<details class="publish-box"><summary>Share a resource or practice task</summary><form id="publish-material"><div class="form-grid"><label class="field wide"><span class="field-label">Title</span><input name="title" maxlength="180" required></label><label class="field"><span class="field-label">Chapter</span><select name="chapter_id">${options()}</select></label><label class="field"><span class="field-label">Type</span><select name="kind"><option value="resource">Learning resource</option><option value="assignment">Practice task</option></select></label><label class="field wide"><span class="field-label">Instructions or paper reference</span><textarea name="body" maxlength="10000" rows="4" placeholder="For a past paper, include the code, year, question and page."></textarea></label><label class="field wide"><span class="field-label">Learning link (optional, https://)</span><input name="url" type="url" maxlength="2000" pattern="https://.*" placeholder="https://"></label></div><button class="button" type="submit">Publish to this class</button><p class="small-text">Use a publisher’s paper link or a resource you have permission to share. Personal PDF imports remain in your session.</p></form></details>`:'<p>This class is archived. Reopen it to share new materials.</p>'}`:''}
    <h3>Class lessons & practice</h3>
    ${teacher&&!selected.archived?`<details class="publish-box" id="lesson-editor"><summary>Add or edit a class lesson</summary><form id="lesson-form"><input type="hidden" name="lesson_id"><div class="form-grid"><label class="field wide"><span class="field-label">Lesson title</span><input name="title" maxlength="180" required placeholder="Decimals and place value"></label><label class="field wide"><span class="field-label">Introduction</span><textarea name="overview" maxlength="10000" rows="3" placeholder="What learners will understand"></textarea></label><label class="field wide"><span class="field-label">Steps and explanation</span><textarea name="steps" maxlength="12000" rows="5"></textarea></label><label class="field wide"><span class="field-label">Worked example</span><textarea name="worked_example" maxlength="12000" rows="4"></textarea></label><label class="field wide"><span class="field-label">Practice question</span><textarea name="practice_question" maxlength="3000" rows="3"></textarea></label><label class="field wide"><span class="field-label">Answer and method</span><textarea name="practice_answer" maxlength="6000" rows="3"></textarea></label><label class="field wide"><span class="field-label">Supplementary link (optional, https://)</span><input name="resource_url" type="url" maxlength="2000" pattern="https://.*"></label></div><div class="actions"><button class="button" type="submit">Save lesson</button><button class="button secondary" id="cancel-lesson-edit" type="button">Clear form</button></div></form></details>`:''}
    ${lessons.map(l=>lessonCard(l,teacher)).join('')||'<p>No class lessons yet. The original course chapters remain available to students.</p>'}
    ${!teacher?'<section class="panel" id="student-groups"><h3>Study groups</h3><p>Loading your groups…</p></section>':''}
    <h3>Class materials & tasks</h3>${materials.map(m=>material(m,teacher)).join('')||'<p>No shared materials yet.</p>'}`;
   if(teacher){
    action($('archive-room'),async()=>{await result(A.client.from('study_rooms').update({archived:!selected.archived}).eq('id',selected.id));await render(section,selected.id);});
    document.querySelectorAll('[data-member]').forEach(b=>action(b,async()=>{await result(A.client.rpc('review_room_member',{rid:selected.id,uid:b.dataset.member,approve:b.dataset.approve==='true'}));await render(section,selected.id);}));
    if($('lesson-form'))$('lesson-form').onsubmit=async e=>{
     e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;
     try{const data=Object.fromEntries(new FormData(form));const id=data.lesson_id;delete data.lesson_id;
      if(id)await result(A.client.from('class_lessons').update({...data,updated_at:new Date().toISOString()}).eq('id',id));
      else await result(A.client.from('class_lessons').insert({...data,room_id:selected.id}));
      await render(section,selected.id);if($('room-status'))$('room-status').textContent=id?'Lesson updated.':'Lesson published to this class.';
     }catch(err){$('room-status').textContent=err.message;}finally{if(b.isConnected)b.disabled=false;}
    };
    if($('cancel-lesson-edit'))$('cancel-lesson-edit').onclick=()=>{$('lesson-form').reset();$('lesson-form').elements.lesson_id.value='';};
    document.querySelectorAll('[data-edit-lesson]').forEach(b=>b.onclick=()=>{const l=lessons.find(x=>x.id===b.dataset.editLesson),form=$('lesson-form');if(!l||!form)return;for(const key of ['title','overview','steps','worked_example','practice_question','practice_answer','resource_url'])form.elements[key].value=l[key]||'';form.elements.lesson_id.value=l.id;$('lesson-editor').open=true;$('lesson-editor').scrollIntoView({behavior:'smooth'});});
    document.querySelectorAll('[data-delete-lesson]').forEach(b=>action(b,async()=>{if(!confirm('Remove this lesson from your class?'))return;await result(A.client.from('class_lessons').delete().eq('id',b.dataset.deleteLesson));await render(section,selected.id);}));
    if($('publish-material'))$('publish-material').onsubmit=async e=>{
     e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;
     try{const data=Object.fromEntries(new FormData(form));data.url=data.url.trim();
      if(form.dataset.editId)await result(A.client.from('room_materials').update(data).eq('id',form.dataset.editId));
      else await result(A.client.from('room_materials').insert({...data,room_id:selected.id}));
      await render(section,selected.id);if($('room-status'))$('room-status').textContent='Class material saved.';
     }catch(err){$('room-status').textContent=err.message;}finally{if(b.isConnected)b.disabled=false;}
    };
    document.querySelectorAll('[data-edit-material]').forEach(b=>b.onclick=()=>{const m=materials.find(x=>x.id===b.dataset.editMaterial),form=$('publish-material');if(!m||!form)return;for(const key of ['title','chapter_id','kind','body','url'])form.elements[key].value=m[key]||'';form.dataset.editId=m.id;form.closest('details').open=true;form.scrollIntoView({behavior:'smooth'});});
    document.querySelectorAll('[data-delete-material]').forEach(b=>action(b,async()=>{if(!confirm('Remove this class material?'))return;await result(A.client.from('room_materials').delete().eq('id',b.dataset.deleteMaterial));await render(section,selected.id);}));

   }else {renderGroups(selected,token);action($('leave-room'),async()=>{if(confirm('Leave this class? Your teacher will no longer see your progress.')){await result(A.client.rpc('leave_room',{rid:selected.id}));await render(section);}});}
  }catch(e){if(token===generation)$('main').innerHTML=`<div class="page-head"><h1>Could not load this workspace</h1><p role="alert">${esc(e.message)}</p><button class="button" id="retry-room">Try again</button></div>`;if($('retry-room'))$('retry-room').onclick=()=>render(section,roomId);}
 }
 async function moderation(token){
  const [profiles,subjects,log]=await Promise.all([
   result(A.client.from('profiles').select('id,display_name,role,status,requested_role,created_at').order('created_at',{ascending:false}).limit(200)),
   result(A.client.from('subjects').select('name,created_at').order('name')),
   result(A.client.from('moderation_log').select('*').order('created_at',{ascending:false}).limit(20))
  ]);
  if(token!==generation)return;
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">MODERATOR WORKSPACE</div><h1>Manage access</h1><p>Review teacher requests and manage accounts. Class lessons, practice and student discussions are private to their participants.</p></div><p id="room-status" role="status" aria-live="polite"></p>
   <div class="stat-grid"><div class="stat"><strong>${profiles.filter(p=>p.status==='pending').length}</strong><span class="stat-label">Teacher requests</span></div><div class="stat"><strong>${profiles.filter(p=>p.status==='suspended').length}</strong><span class="stat-label">Access removed</span></div></div>
   <section class="panel"><h2>Accounts & teacher requests</h2><p class="small-text">Showing the 200 most recent accounts. Remove access is reversible; account data is preserved for the owner.</p><label class="field"><span class="field-label">Filter accounts</span><input id="account-filter" type="search" placeholder="Search name, role or status"></label><div class="member-list" id="account-list"></div></section>
   <section class="panel"><h2>Subject catalog</h2><p>Teachers and moderators can add a subject name. Teachers create lessons and practice inside their own classes.</p><form id="moderator-subject" class="inline-form"><label class="field"><span class="field-label">New subject name</span><input name="name" maxlength="100" required></label><button class="button" type="submit">Add subject</button></form><p class="small-text">${subjects.map(x=>esc(x.name)).join(' · ')}</p></section>
   <section class="panel"><h2>Recent account decisions</h2><ol>${log.filter(l=>['approve_teacher','decline_teacher','suspend','restore'].includes(l.action)).map(l=>`<li>${esc(l.action.replace(/_/g,' '))} · ${esc(new Date(l.created_at).toLocaleString())}</li>`).join('')||'<li>No decisions yet.</li>'}</ol></section>`;
  $('moderator-subject').onsubmit=async e=>{e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;try{await result(A.client.from('subjects').insert({name:new FormData(form).get('name').trim()}));await moderation(token);if($('room-status'))$('room-status').textContent='Subject added to the catalog.';}catch(err){$('room-status').textContent=err.message;}finally{if(b.isConnected)b.disabled=false;}};
  const paint=()=>{
   const q=$('account-filter').value.toLowerCase();
   $('account-list').innerHTML=profiles.filter(p=>[p.display_name,p.role,p.status,p.requested_role].join(' ').toLowerCase().includes(q)).map(p=>`<article><div><strong>${esc(p.display_name)}</strong><p>${esc(p.role)} · ${esc(p.status)}${p.status==='pending'?' · Teacher request':''}</p><small>${esc(p.id)}</small></div><div class="actions">${p.role==='moderator'?'':p.status==='pending'?`<button class="button small" data-account="${p.id}" data-decision="approve_teacher">Approve teacher</button><button class="button small secondary" data-account="${p.id}" data-decision="decline_teacher">Decline request</button>`:`<button class="button small secondary" data-account="${p.id}" data-decision="${p.status==='suspended'?'restore':'suspend'}">${p.status==='suspended'?'Restore access':'Remove access'}</button>`}</div></article>`).join('')||'<p>No matching accounts.</p>';
   document.querySelectorAll('[data-account]').forEach(b=>action(b,async()=>{if(b.dataset.decision==='suspend'&&!confirm('Remove this account’s access? You can restore it later.'))return;await result(A.client.rpc('moderate_account',{target:b.dataset.account,decision:b.dataset.decision}));const decision=b.dataset.decision;await moderation(token);if($('room-status'))$('room-status').textContent=({approve_teacher:'Teacher approved. They will see an account notice.',decline_teacher:'Teacher request declined. They can continue as a student.',suspend:'Access removed. The person will see a suspension notice.',restore:'Access restored. The person will see an account notice.'})[decision];}));
  };$('account-filter').oninput=paint;paint();
 }
 window.StudyRooms={render,leave:()=>generation++};
})();
