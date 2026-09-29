(() => {
 'use strict';
 const A=window.StudyAuth,$=id=>document.getElementById(id),esc=A.esc;
 let generation=0;
 const result=async p=>{const r=await p;if(r.error)throw r.error;return r.data;};
 const source=(url,label)=>{try{const u=new URL(url);return u.protocol==='https:'?'<a href="'+esc(u.href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':'';}catch{return '';}};
 const body=x=>esc(x||'').replace(/\n/g,'<br>');
 const fields=(lesson={})=>'<label class="field"><span class="field-label">Lesson title</span><input name="title" maxlength="180" required value="'+esc(lesson.title||'')+'"></label>'+
  '<label class="field"><span class="field-label">Introduction</span><textarea name="overview" maxlength="10000" rows="3">'+esc(lesson.overview||'')+'</textarea></label>'+
  '<label class="field"><span class="field-label">Steps and explanation</span><textarea name="steps" maxlength="12000" rows="4">'+esc(lesson.steps||'')+'</textarea></label>'+
  '<label class="field"><span class="field-label">Worked example</span><textarea name="worked_example" maxlength="12000" rows="4">'+esc(lesson.worked_example||'')+'</textarea></label>'+
  '<label class="field"><span class="field-label">Practice question</span><textarea name="practice_question" maxlength="3000" rows="3">'+esc(lesson.practice_question||'')+'</textarea></label>'+
  '<label class="field"><span class="field-label">Answer and method</span><textarea name="practice_answer" maxlength="6000" rows="3">'+esc(lesson.practice_answer||'')+'</textarea></label>'+
  '<label class="field"><span class="field-label">Supplementary HTTPS link</span><input name="resource_url" type="url" maxlength="2000" pattern="https://.*" value="'+esc(lesson.resource_url||'')+'"></label>'+
  '<label class="field"><input name="published" type="checkbox" '+(lesson.published?'checked':'')+'> Publish for students and teachers</label>';
 function lessonView(l){
  return '<div class="class-lesson"><h3>'+esc(l.title)+'</h3>'+
   (l.overview?'<p class="lesson-body">'+body(l.overview)+'</p>':'')+
   (l.steps?'<h4>Learn the method</h4><p class="lesson-body">'+body(l.steps)+'</p>':'')+
   (l.worked_example?'<h4>Worked example</h4><p class="lesson-body">'+body(l.worked_example)+'</p>':'')+
   (l.practice_question?'<div class="practice-corner"><h4>Practice corner</h4><p class="lesson-body">'+body(l.practice_question)+'</p><label class="field"><span class="field-label">Try it first (stays on this device)</span><textarea rows="2"></textarea></label><details><summary>Compare with the answer</summary><p class="lesson-body">'+body(l.practice_answer||'Answer pending.')+'</p></details></div>':'')+
   (l.resource_url?source(l.resource_url,'Supplementary resource'):'')+'</div>';
 }
 async function list(){
  const token=++generation;$('main').innerHTML='<div class="page-head"><h1>Subjects</h1><p role="status">Loading the subject catalogue…</p></div>';
  try{const subjects=await result(A.client.from('subjects').select('name,syllabus_url,available').eq('available',true).order('name'));if(token!==generation)return;
   $('main').innerHTML='<div class="page-head"><div class="eyebrow">GLOBAL SUBJECTS</div><h1>Choose a subject</h1><p>Each subject uses the same syllabus, topic, lesson and practice layout. Global lessons are published by the moderator; your class teacher may add more for your class.</p></div><div class="subject-grid">'+subjects.map(s=>'<a class="subject-card" href="#subject/'+encodeURIComponent(s.name)+'"><span class="subject-symbol">▤</span><h2>'+esc(s.name)+'</h2><strong>View topics →</strong></a>').join('')+'</div>';
  }catch(e){if(token===generation)$('main').innerHTML='<div class="page-head"><h1>Subjects unavailable</h1><p role="alert">'+esc(e.message)+'</p></div>';}
 }
 async function subject(name){
  const token=++generation,mod=A.profile?.role==='moderator';$('main').innerHTML='<div class="page-head"><h1>Loading subject…</h1></div>';
  try{
   const subjects=await result(A.client.from('subjects').select('name,syllabus_url,available').eq('name',name).limit(1));
   const selected=subjects[0];if(!selected||!selected.available&&!mod)throw Error('This subject is not available yet.');
   const topics=await result(A.client.from('subject_topics').select('id,title,position').eq('subject_name',name).order('position'));
   const lessons=await result(A.client.from('global_lessons').select('*').in('topic_id',topics.length?topics.map(t=>t.id):['00000000-0000-0000-0000-000000000000']));
   if(token!==generation)return;
   const originals=(name==='Mathematics'||name==='Physical Science')?window.STUDY_CONTENT.lessons.filter(x=>x.subject===(name==='Mathematics'?'maths':'science')):[];
   $('main').innerHTML='<div class="page-head"><div class="eyebrow">SUBJECT DASHBOARD</div><h1>'+esc(name)+'</h1><p>'+topics.length+' syllabus topics · Global lessons are published by the moderator. Teachers add their own explanations and exercises inside their classes.</p><div class="actions"><a href="#subjects">← All subjects</a>'+(selected.syllabus_url?source(selected.syllabus_url,'Open or download syllabus'):'')+'</div></div>'+
    '<p id="catalog-status" role="status" aria-live="polite"></p>'+
    (mod?'<section class="panel"><h2>Global syllabus structure</h2><p>Add a topic for this subject. The topic becomes available to every teacher and student.</p><form id="new-global-topic" class="inline-form"><label class="field"><span class="field-label">New topic name</span><input name="title" maxlength="180" required></label><button class="button" type="submit">Add topic</button></form></section>':'')+
    '<section class="panel no-print"><label class="field"><span class="field-label">Find a topic</span><input id="catalog-search" type="search" placeholder="Search syllabus topics"></label><p class="small-text" id="catalog-count"></p></section><div id="catalog-topics" class="course-grid"></div>';
   const paint=()=>{const q=$('catalog-search').value.toLowerCase().trim(),shown=topics.filter(t=>t.title.toLowerCase().includes(q));$('catalog-count').textContent=shown.length+' topics';
    $('catalog-topics').innerHTML=shown.map(t=>{const l=lessons.find(x=>x.topic_id===t.id),original=originals[t.position-1];return '<article class="panel catalog-topic"><div class="eyebrow">TOPIC '+t.position+'</div><h2>'+esc(t.title)+'</h2>'+
     (original?'<p>'+esc(original.summary)+'</p><a href="#chapter/'+esc(original.id)+'">Open the original guided chapter →</a>':'')+
     (l?lessonView(l):'<p class="small-text muted">The moderator has not published a guided lesson for this topic yet. Open the syllabus or your teacher’s class for more.</p>')+
     (mod?'<details class="publish-box"><summary>'+esc(l?'Edit global lesson':'Add global lesson')+'</summary><form data-global-topic="'+t.id+'" class="form-grid">'+fields(l)+'<div class="actions"><button class="button" type="submit">Save global lesson</button>'+(l?'<button class="button secondary" type="button" data-global-delete="'+l.id+'">Remove lesson</button>':'')+'</div></form></details><form data-rename-topic="'+t.id+'" class="inline-form"><label class="field"><span class="field-label">Rename topic</span><input name="title" maxlength="180" required value="'+esc(t.title)+'"></label><button class="button small secondary" type="submit">Save topic name</button></form>':'')+'</article>';}).join('')||'<p>No topics found. Try a different search.</p>';
    if(mod){
     document.querySelectorAll('[data-global-topic]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const data=Object.fromEntries(new FormData(form));data.published=form.elements.published.checked;const l=lessons.find(x=>x.topic_id===form.dataset.globalTopic);if(l)await result(A.client.from('global_lessons').update({...data,updated_at:new Date().toISOString()}).eq('id',l.id));else await result(A.client.from('global_lessons').insert({...data,topic_id:form.dataset.globalTopic}));await subject(name);$('catalog-status').textContent='Global lesson saved.';}catch(err){$('catalog-status').textContent=err.message;button.disabled=false;}});
     document.querySelectorAll('[data-global-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this global lesson?'))return;try{await result(A.client.from('global_lessons').delete().eq('id',b.dataset.globalDelete));await subject(name);$('catalog-status').textContent='Global lesson removed.';}catch(err){$('catalog-status').textContent=err.message;}});
     document.querySelectorAll('[data-rename-topic]').forEach(form=>form.onsubmit=async e=>{e.preventDefault();try{await result(A.client.from('subject_topics').update({title:new FormData(form).get('title').trim()}).eq('id',form.dataset.renameTopic));await subject(name);$('catalog-status').textContent='Topic updated.';}catch(err){$('catalog-status').textContent=err.message;}});
    }
   };$('catalog-search').oninput=paint;paint();
   if(mod)$('new-global-topic').onsubmit=async e=>{e.preventDefault();try{await result(A.client.from('subject_topics').insert({subject_name:name,position:(topics.at(-1)?.position||0)+1,title:new FormData(e.target).get('title').trim()}));await subject(name);$('catalog-status').textContent='Topic added for everyone.';}catch(err){$('catalog-status').textContent=err.message;}};
  }catch(e){if(token===generation)$('main').innerHTML='<div class="page-head"><h1>Could not open subject</h1><p role="alert">'+esc(e.message)+'</p><a href="#subjects">All subjects</a></div>';}
 }
 window.StudyCatalog={list,subject,leave:()=>generation++};
})();