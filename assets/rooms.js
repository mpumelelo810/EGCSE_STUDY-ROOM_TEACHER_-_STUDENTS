(() => {
 'use strict';
 const A=window.StudyAuth,$=id=>document.getElementById(id),esc=A.esc;
 let generation=0;
 const result=async p=>{const r=await p;if(r.error)throw r.error;return r.data;};
 const link=(url,text)=>{try{const u=new URL(url);return u.protocol==='https:'?`<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`:'';}catch{return '';}};
 const chapterName=id=>window.STUDY_CONTENT.lessons.find(c=>c.id===id)?.title||id;
 const options=()=>window.STUDY_CONTENT.lessons.map(c=>`<option value="${c.id}">${esc(c.id+' · '+c.title)}</option>`).join('');
 function material(m,moderator=false){return `<article class="room-material"><div class="eyebrow">${esc(m.kind)} · ${esc(m.chapter_id)}${m.hidden?' · HIDDEN':''}</div><h3>${esc(m.title)}</h3><p class="material-body">${esc(m.body)}</p><div class="actions"><a href="#chapter/${esc(m.chapter_id)}">Revise ${esc(chapterName(m.chapter_id))} →</a>${m.url?link(m.url,'Open learning material'):''}${moderator?`<button class="button small secondary" data-material="${m.id}" data-hide="${!m.hidden}">${m.hidden?'Restore material':'Hide material'}</button>`:''}</div></article>`;}
 function action(button,fn){button.onclick=async()=>{button.disabled=true;try{await fn();}catch(e){if($('room-status'))$('room-status').textContent=e.message||'The request could not be completed.';}finally{if(button.isConnected)button.disabled=false;}};}
 async function render(section,roomId){
  const token=++generation;
  if(!A.allowed(section)||!A.client){$('main').innerHTML='<div class="page-head"><h1>Access unavailable</h1><p>This page is not available for your account.</p><a href="#overview">Return to your dashboard</a></div>';return;}
  const role=A.profile.role;
  $('main').innerHTML='<div class="page-head"><h1>Loading your workspace…</h1><p role="status">Checking your account access.</p></div>';
  try{
   if(section==='moderator'){await moderation(token);return;}
   const rooms=await result(A.client.from('study_rooms').select('*').order('created_at',{ascending:false}));
   const members=await result(A.client.from('room_members').select('*'));
   if(token!==generation)return;
   const selected=rooms.find(r=>r.id===roomId)||rooms[0];
   const teacher=role==='teacher';
   $('main').innerHTML=`<div class="page-head"><div class="eyebrow">${teacher?'TEACHER WORKSPACE':'LEARN TOGETHER'}</div><h1>${teacher?'My teaching classes':'My classes'}</h1><p>${teacher?'Share focused practice and follow the learners in your classes.':'Find the resources and practice your teacher has shared with you.'}</p></div><p id="room-status" role="status" aria-live="polite"></p>
    <section class="panel">${teacher?`<h2>Create a study class</h2><form id="create-room" class="form-grid"><label class="field"><span class="field-label">Class name</span><input name="title" maxlength="120" required placeholder="Form 5 · Mathematics"></label><label class="field"><span class="field-label">Subject</span><select name="subject"><option>Mathematics</option><option>Physical Science</option><option>Both subjects</option></select></label><div><button class="button" type="submit">Create class</button></div></form>`:`<h2>Join your teacher’s class</h2><p>Enter the code from your teacher. Once they approve you, they can see your chapter review and practice counts. Your notes and AI drafts remain private.</p><form id="join-room" class="inline-form"><label class="field"><span class="field-label">Class code</span><input name="code" autocomplete="off" minlength="12" maxlength="12" pattern="[A-Fa-f0-9]{12}" required placeholder="12-character code"></label><button class="button" type="submit">Request to join</button></form>${members.filter(m=>m.status==='requested').length?`<p class="status-pill">${members.filter(m=>m.status==='requested').length} request(s) waiting for teacher approval</p>`:''}`}</section>
    <section class="panel"><label class="field"><span class="field-label">${teacher?'Your classes':'Approved classes'}</span><select id="room-picker">${rooms.map(r=>`<option value="${r.id}"${selected?.id===r.id?' selected':''}>${esc(r.title)}${r.archived?' · Archived':''}</option>`).join('')||'<option>No classes yet</option>'}</select></label><div id="room-detail">${!selected?'<p>Your classes will appear here.</p>':''}</div></section>`;
   $('room-picker').onchange=()=>{location.hash=section+'/'+$('room-picker').value;};
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
   let profiles=[],summaries=[];
   if(teacher){profiles=await result(A.client.from('profiles').select('id,display_name,status'));summaries=await result(A.client.rpc('class_progress',{rid:selected.id}));}
   if(token!==generation)return;
   const roster=members.filter(m=>m.room_id===selected.id);
   $('room-detail').innerHTML=`<div class="section-heading"><div><h2>${esc(selected.title)}</h2><p>${esc(selected.subject)}</p></div>${teacher?`<button id="archive-room" class="button small secondary">${selected.archived?'Reopen class':'Archive class'}</button>`:'<button id="leave-room" class="button small secondary">Leave class</button>'}</div>
    ${teacher?`<p class="invite-code">Class code <strong>${esc(selected.join_code)}</strong></p><p class="small-text">Share this code with your learners, then approve each request below.</p><h3>Class members</h3><div class="member-list">${roster.map(m=>{const p=profiles.find(p=>p.id===m.user_id),s=summaries.find(s=>s.user_id===m.user_id);return `<article><div><strong>${esc(p?.display_name||'Learner')}</strong><p>${m.status==='requested'?'Waiting for approval':s?`${s.reviewed} chapters reviewed · ${s.attempted} chapters attempted`:'Account currently unavailable'}</p></div><div class="actions">${m.status==='requested'?`<button class="button small" data-member="${m.user_id}" data-approve="true">Approve</button>`:''}<button class="button small secondary" data-member="${m.user_id}" data-approve="false">${m.status==='requested'?'Decline':'Remove'}</button></div></article>`;}).join('')||'<p>No learners have joined yet.</p>'}</div><p class="small-text muted">Counts are learner activity, not marks or exam-readiness scores. Private notes are not visible.</p>
    ${!selected.archived?`<details class="publish-box"><summary>Share a resource or practice task</summary><form id="publish-material"><div class="form-grid"><label class="field wide"><span class="field-label">Title</span><input name="title" maxlength="180" required></label><label class="field"><span class="field-label">Chapter</span><select name="chapter_id">${options()}</select></label><label class="field"><span class="field-label">Type</span><select name="kind"><option value="resource">Learning resource</option><option value="assignment">Practice task</option></select></label><label class="field wide"><span class="field-label">Instructions or paper reference</span><textarea name="body" maxlength="10000" rows="4" placeholder="For a past paper, include the code, year, question and page."></textarea></label><label class="field wide"><span class="field-label">Learning link (optional, https://)</span><input name="url" type="url" maxlength="2000" pattern="https://.*" placeholder="https://"></label></div><button class="button" type="submit">Publish to this class</button><p class="small-text">Use a publisher’s paper link or a resource you have permission to share. Personal PDF imports remain in your session.</p></form></details>`:'<p>This class is archived. Reopen it to share new materials.</p>'}`:''}
    <h3>Class materials & tasks</h3>${materials.map(m=>material(m)).join('')||'<p>No shared materials yet.</p>'}`;
   if(teacher){
    action($('archive-room'),async()=>{await result(A.client.from('study_rooms').update({archived:!selected.archived}).eq('id',selected.id));await render(section,selected.id);});
    document.querySelectorAll('[data-member]').forEach(b=>action(b,async()=>{await result(A.client.rpc('review_room_member',{rid:selected.id,uid:b.dataset.member,approve:b.dataset.approve==='true'}));await render(section,selected.id);}));
    if($('publish-material'))$('publish-material').onsubmit=async e=>{
     e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;
     try{const data=Object.fromEntries(new FormData(form));data.room_id=selected.id;data.url=data.url.trim();await result(A.client.from('room_materials').insert(data));await render(section,selected.id);}catch(e){if(token===generation)$('room-status').textContent=e.message;}finally{if(b.isConnected)b.disabled=false;}
    };
   }else action($('leave-room'),async()=>{if(confirm('Leave this class? Your teacher will no longer see your progress.')){await result(A.client.rpc('leave_room',{rid:selected.id}));await render(section);}});
  }catch(e){if(token===generation)$('main').innerHTML=`<div class="page-head"><h1>Could not load this workspace</h1><p role="alert">${esc(e.message)}</p><button class="button" id="retry-room">Try again</button></div>`;if($('retry-room'))$('retry-room').onclick=()=>render(section,roomId);}
 }
 async function moderation(token){
  const [profiles,materials,log]=await Promise.all([
   result(A.client.from('profiles').select('id,display_name,role,status,requested_role,created_at').order('created_at',{ascending:false}).limit(200)),
   result(A.client.from('room_materials').select('*').order('created_at',{ascending:false}).limit(100)),
   result(A.client.from('moderation_log').select('*').order('created_at',{ascending:false}).limit(20))
  ]);
  if(token!==generation)return;
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">MODERATOR WORKSPACE</div><h1>Look after the study room</h1><p>Review teacher requests, manage account access and check shared materials.</p></div><p id="room-status" role="status" aria-live="polite"></p><div class="stat-grid"><div class="stat"><strong>${profiles.filter(p=>p.status==='pending').length}</strong><span class="stat-label">Requests in this list</span></div><div class="stat"><strong>${profiles.filter(p=>p.status==='suspended').length}</strong><span class="stat-label">Suspended in this list</span></div></div><section class="panel"><h2>Accounts & teacher requests</h2><p class="small-text">Showing the 200 most recent accounts. Moderator access is assigned by the project owner.</p><label class="field"><span class="field-label">Filter these accounts</span><input id="account-filter" type="search" placeholder="Search name, role or status"></label><div class="member-list" id="account-list"></div></section><section class="panel"><h2>Shared materials</h2><p class="small-text">100 most recent items. Hidden materials are unavailable to students.</p>${materials.map(m=>material(m,true)).join('')||'<p>No materials published yet.</p>'}</section><section class="panel"><h2>Recent moderation</h2><ol>${log.map(l=>`<li>${esc(l.action.replace(/_/g,' '))} · ${esc(new Date(l.created_at).toLocaleString())}</li>`).join('')||'<li>No actions yet.</li>'}</ol></section>`;
  const paint=()=>{
   const q=$('account-filter').value.toLowerCase();
   $('account-list').innerHTML=profiles.filter(p=>[p.display_name,p.role,p.status,p.requested_role].join(' ').toLowerCase().includes(q)).map(p=>`<article><div><strong>${esc(p.display_name)}</strong><p>${esc(p.role)} · ${esc(p.status)}${p.status==='pending'?' · Teacher request':''}</p><small>${esc(p.id)}</small></div><div class="actions">${p.role==='moderator'?'':p.status==='pending'?`<button class="button small" data-account="${p.id}" data-decision="approve_teacher">Approve teacher</button><button class="button small secondary" data-account="${p.id}" data-decision="decline_teacher">Keep as student</button>`:`<button class="button small secondary" data-account="${p.id}" data-decision="${p.status==='suspended'?'restore':'suspend'}">${p.status==='suspended'?'Restore access':'Suspend access'}</button>`}</div></article>`).join('')||'<p>No matching accounts.</p>';
   document.querySelectorAll('[data-account]').forEach(b=>action(b,async()=>{if(b.dataset.decision==='suspend'&&!confirm('Suspend this account’s access? You can restore it later.'))return;await result(A.client.rpc('moderate_account',{target:b.dataset.account,decision:b.dataset.decision}));await render('moderator');}));
  };$('account-filter').oninput=paint;paint();
  document.querySelectorAll('[data-material]').forEach(b=>action(b,async()=>{await result(A.client.rpc('moderate_material',{target:b.dataset.material,hide:b.dataset.hide==='true'}));await render('moderator');}));
 }
 window.StudyRooms={render,leave:()=>generation++};
})();
