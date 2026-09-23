(() => {
 'use strict';
 const C=window.STUDY_CONTENT,Q=window.QuestionBank,T=window.StudyTools;
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key='egcse.study.v1',byId=new Map(C.lessons.map(c=>[c.id,c]));
 const branchName={maths:'Mathematics',chemistry:'Chemistry',physics:'Physics'};
 const empty=()=>({version:1,track:'core',completed:{},notes:{},sessions:{},exams:{},customRefs:{},last:'M01'});
 function safeURL(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}}
 function sanitise(raw){
  const s=empty();if(!raw||raw.version!==1)throw new Error('This is not an EGCSE progress backup.');
  if(raw.track==='extended')s.track='extended';
  if(byId.has(raw.last))s.last=raw.last;
  for(const c of C.lessons){
   const id=c.id;if(raw.completed?.[id]===true)s.completed[id]=true;
   if(typeof raw.notes?.[id]==='string')s.notes[id]=raw.notes[id].slice(0,10000);
   if(raw.exams?.[id]===true)s.exams[id]=true;
   const p=raw.sessions?.[id];
   if(p&&Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=0xFFFFFFFF)s.sessions[id]={
    seed:p.seed,input:String(p.input??'').slice(0,500),checked:p.checked===true,show:p.show===true,
    unlocked:p.unlocked===true,attempts:Math.min(100000,Math.max(0,Number(p.attempts)||0)),
    firstCorrect:p.firstCorrect===true
   };
   const r=raw.customRefs?.[id];
   if(r&&typeof r.url==='string'&&safeURL(r.url))s.customRefs[id]={url:safeURL(r.url),label:String(r.label||'Teacher-added paper').slice(0,180),question:String(r.question||'').slice(0,120)};
  }return s;
 }
 let state=empty(),storageOK=true,toastTimer;
 try{const saved=localStorage.getItem(key);if(saved)state=sanitise(JSON.parse(saved));}catch{storageOK=false;}
 function save(){
  try{localStorage.setItem(key,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}
  $('storage-warning').hidden=storageOK;
  $('storage-warning').textContent=storageOK?'':'Automatic saving is unavailable. Download a progress backup before closing this page.';
  $('save-status').textContent=storageOK?'Progress saved on this device':'Use a progress backup';
 }
 function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
 function download(name,text,type='application/json'){
  const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
  a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);
 }
 const format=text=>T.formatAnswer(text);
 const external=(url,label,cls='')=>`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
 function paperLabel(p){return `EGCSE ${p.code}/${String(p.number).padStart(2,'0')} · ${p.session} ${p.year} · ${p.track}`;}
 const seedFor=id=>[...id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,731);
 function session(id){
  if(!state.sessions[id])state.sessions[id]={seed:seedFor(id)+101,input:'',checked:false,show:false,unlocked:false,attempts:0,firstCorrect:false};
  return state.sessions[id];
 }
 function filteredLessons(subject){
  return C.lessons.filter(c=>(!subject||c.subject===subject)&&(state.track==='extended'||c.level!=='Extended'));
 }
 function trackControl(){
  return `<label class="field track-control"><span class="field-label">Mathematics pathway</span><select id="maths-track"><option value="core"${state.track==='core'?' selected':''}>Core · Papers 1 & 2</option><option value="extended"${state.track==='extended'?' selected':''}>Extended · Papers 3 & 4</option></select></label>`;
 }
 function wireTrack(callback){if($('maths-track'))$('maths-track').onchange=()=>{state.track=$('maths-track').value;save();callback();};}
 function card(c){
  return `<a class="course-card chapter-tile" href="#chapter/${c.id}"><div class="course-card-top"><span class="chapter-code">${c.id}</span><span class="course-time">${state.completed[c.id]?'✓ Reviewed':'10–20 min'}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><div class="course-foot"><span>${c.level==='Extended'?'Extended only':branchName[c.branch]}</span><span>Open chapter →</span></div></a>`;
 }
 function overview(){
  const done=Object.values(state.completed).filter(Boolean).length,attempted=Object.values(state.sessions).filter(s=>s.attempts>0).length;
  $('main').innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">ESWATINI · EGCSE · 2024–2026 EDITION</div><h1>A little practice.<br><em>A clearer idea.</em></h1><p>Your Mathematics and Physical Science study room. Learn a chapter, work through the steps and try a fresh question.</p><a class="button gold" href="#chapter/${esc(state.last)}">${attempted?'Continue studying':'Start learning'} →</a></div><div class="hero-visual study-map" aria-label="The study process"><div class="map-grid" aria-hidden="true"><span>f(x)</span><span>H₂O</span><span>△</span><span>V = IR</span></div><ol><li><span>01</span>Understand the idea</li><li><span>02</span>Try an exam skill</li><li><span>03</span>Practise it again</li></ol></div></section>
  <div class="stat-grid"><div class="stat"><strong>53</strong><span class="stat-label">Topic guides</span></div><div class="stat"><strong>${done}</strong><span class="stat-label">Marked reviewed</span></div><div class="stat"><strong>${attempted}</strong><span class="stat-label">Chapters attempted</span></div></div>
  <div class="section-heading"><h2>Choose your subject</h2><span>One chapter at a time</span></div>
  <div class="subject-grid"><a class="subject-card" href="#maths"><span class="subject-symbol">ƒ</span><span class="eyebrow">6880 · 24 TOPICS</span><h2>Mathematics</h2><p>From number skills to graphs, geometry and probability. Core foundations with clearly marked Extended study.</p><strong>Explore Mathematics →</strong></a><a class="subject-card science-card" href="#science"><span class="subject-symbol">⚛</span><span class="eyebrow">6888 · 29 TOPICS</span><h2>Physical Science</h2><p>Chemistry and Physics, with explanations, calculations, practical reasoning and worked examples.</p><strong>Explore Physical Science →</strong></a></div>
  <section class="study-routine"><div class="routine-icon">↻</div><div><h3>Try before you regenerate</h3><p>Attempt a chapter question or open its worked answer to unlock “Generate similar”. Each new question has its own checked calculation or concept explanation.</p></div></section>
  <section class="panel edition-note"><h2>Built around your syllabus</h2><p>These guided revision lessons follow the topic headings in the 2024–2026 ECESWA syllabuses supplied by Khanyisa. They are a starting point for study; use the full syllabus checklist, class teaching and practical work for complete preparation.</p><div class="actions"><a href="#resources">View syllabus & exam structure →</a><a href="#archive">Find or upload past papers →</a></div></section>`;
 }
 function course(subject){
  const science=subject==='science';
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">${science?'6888 · CHEMISTRY + PHYSICS':'6880 · CORE + EXTENDED'}</div><h1>${science?'Physical Science':'Mathematics'}</h1><p>Learn the chapter, study an example, then answer the questions at the end. Use the underlined refresher links whenever a step needs revisiting.</p></div>
  <section class="panel no-print course-controls"><label class="field"><span class="field-label">Find a chapter</span><input id="chapter-search" type="search" placeholder="Search a topic or syllabus code"></label>${science?'<label class="field"><span class="field-label">Section</span><select id="science-section"><option value="all">Chemistry & Physics</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>':trackControl()}</section><p class="small-text muted" id="chapter-count" role="status"></p><div id="chapter-grid" class="course-grid"></div>`;
  const paint=()=>{
   const query=$('chapter-search').value.trim().toLowerCase(),branch=$('science-section')?.value||'all';
   const list=filteredLessons(subject).filter(c=>(branch==='all'||c.branch===branch)&&[c.id,c.title,c.summary,c.extended].join(' ').toLowerCase().includes(query));
   $('chapter-count').textContent=`${list.length} chapters · Syllabus 2024–2026${science?'':' · Extended builds on Core material'}`;
   $('chapter-grid').innerHTML=list.map(card).join('')||'<p>No chapters found. Try a different search.</p>';
  };
  $('chapter-search').oninput=paint;if($('science-section'))$('science-section').onchange=paint;wireTrack(paint);paint();
 }
 function solution(q){
  return `<ol class="guided-steps">${q.steps.map((s,i)=>`<li><h3>${esc(s.title)}</h3><div>${format(s.text)}</div>${s.resource?`<p class="step-refresher">Need a reminder? ${T.refreshLink(s.resource)}</p>`:''}</li>`).join('')}</ol><div class="answer-final"><strong>Answer</strong><span>${esc(q.display)}</span></div>`;
 }
 function drawExample(q){
  if(q.chapter==='P12')return '<div class="logic-visual" aria-label="Two input signals pass through a logic gate to produce one output"><span>A, B</span><span aria-hidden="true">→</span><strong>Logic rule</strong><span aria-hidden="true">→</span><span>0 or 1</span></div>';
  if(q.chapter==='M13'){
   const nums=q.question.match(/\d+(?:\.\d+)?/g),a=nums?.[0],b=nums?.[1];
   return `<figure class="lesson-diagram"><svg viewBox="0 0 410 205" role="img" aria-label="Right triangle with angle theta, labelled opposite and adjacent sides; not to scale"><path d="M60 160 L340 160 L340 30 Z" fill="#eef4ea" stroke="#20614f" stroke-width="2"/><path d="M325 160 V145 H340" fill="none" stroke="#20614f"/><text x="96" y="150">θ</text><text x="174" y="187">${b} cm (adjacent)</text><text x="355" y="97">${a} cm</text><text x="165" y="24">Not to scale</text></svg></figure>`;
  }return '';
 }
 function refsHTML(c){
  const items=c.refs.map(ref=>{
   const p=C.papers.find(p=>p.id===ref.paper);
   return `<article class="exam-reference"><span class="tag">Original exam · publisher PDF</span><h3>${esc(paperLabel(p))}</h3><p><strong>Question ${esc(ref.question)} · PDF page ${ref.page}</strong></p><p>${esc(ref.skill)}</p>${external(p.url+'#page='+ref.page,'Open original question','button secondary small')}</article>`;
  });
  const custom=state.customRefs[c.id];
  if(custom)items.push(`<article class="exam-reference"><span class="tag">Teacher-added reference · verify before use</span><h3>${esc(custom.label)}</h3><p>Question / page: ${esc(custom.question)}</p>${external(custom.url,'Open teacher’s paper','button secondary small')}</article>`);
  return items.join('')||'<p class="empty-reference">No specific exam question has been verified for this chapter in the selected 2020–2021 papers. The practice below is original. A teacher can add a paper reference here.</p>';
 }
 function refEditor(c){
  const v=state.customRefs[c.id]||{};
  return `<details class="no-print teacher-reference"><summary>Teacher: add or update a paper reference</summary><form id="reference-form"><div class="form-grid"><label class="field wide"><span class="field-label">Subject code, paper, year and session</span><input id="reference-label" maxlength="180" placeholder="EGCSE 6888/02 · October/November 2025" value="${esc(v.label||'')}" required></label><label class="field"><span class="field-label">Question / page</span><input id="reference-question" maxlength="120" placeholder="Q4(b), PDF page 6" value="${esc(v.question||'')}" required></label><label class="field wide"><span class="field-label">Public paper link (include #page=6 if useful)</span><input id="reference-url" type="url" value="${esc(v.url||'')}" required></label></div><div class="actions"><button class="button small" type="submit">Save reference on this device</button><button class="button secondary small" type="button" id="export-references">Download references for class</button></div><p class="small-text">Exported references can be imported by students in My progress & notes. Your personal notes are excluded from this export.</p><p id="reference-status" role="status"></p></form></details>`;
 }
 function wireRefs(c){
  if(!$('reference-form'))return;
  $('reference-form').onsubmit=e=>{
   e.preventDefault();const url=safeURL($('reference-url').value);
   if(!url){$('reference-status').textContent='Use an http or https paper URL.';return;}
   state.customRefs[c.id]={label:$('reference-label').value.trim(),question:$('reference-question').value.trim(),url};
   save();$('exam-links').innerHTML=refsHTML(c);$('reference-status').textContent='Reference saved. Download references for class to share it with students.';
  };
  $('export-references').onclick=()=>download('EGCSE-class-references.json',JSON.stringify({kind:'egcse-references',version:1,customRefs:state.customRefs},null,2));
 }
 function chapter(id,practiceOnly=false){
  const c=byId.get(id);if(!c){notFound();return;}state.last=id;save();
  const example=Q.generate(id,seedFor(id)),s=session(id);
  if(Q.generate(id,s.seed).question===example.question&&!s.checked)s.seed=Q.next(id,s.seed,example.question).seed;
  const others=filteredLessons(c.subject),position=others.findIndex(x=>x.id===id),next=others[position+1];
  $('main').innerHTML=`<div class="page-head"><a class="back-link no-print" href="#${c.subject}">← ${c.subject==='maths'?'Mathematics':'Physical Science'}</a><div class="eyebrow">${esc(branchName[c.branch])} · SYLLABUS TOPIC ${c.syllabusTopic} · ${c.level}</div><h1>${esc(c.title)}</h1><p>${esc(c.summary)}</p></div>
  ${practiceOnly?'<p class="no-print"><a href="#chapter/'+id+'">Read this chapter first →</a></p>':`
  <nav class="chapter-jumps no-print" aria-label="Chapter sections"><a href="#chapter/${id}" data-jump="lesson-reading">1 · Learn</a><a href="#chapter/${id}" data-jump="worked-example">2 · Worked example</a><a href="#chapter/${id}" data-jump="chapter-questions">3 · Questions</a></nav>
  ${c.level==='Extended'?'<div class="extended-note">Extended Mathematics only · Differentiation is outside the Core pathway.</div>':''}
  <section class="panel lesson-body" id="lesson-reading"><div class="panel-label">01 · LEARN THE IDEA</div>${c.ideas.map(i=>`<h2>${esc(i.title)}</h2>${format(i.body)}`).join('')}<div class="formula">${format(c.formula)}</div><div class="watch-for"><strong>Watch for this</strong><p>${esc(c.watch)}</p></div>${c.extended&&c.level!=='Extended'?`<details class="extended-outline"${state.track==='extended'?' open':''}><summary>Extended study: what to add</summary><p>${esc(c.extended)}</p><p class="small-text">Use the full syllabus and class notes for these additional skills. The worked example below focuses on one chapter skill.</p></details>`:''}<p class="small-text">Step back when needed: ${T.refreshLink(c.resource)} · ${external(C.syllabus[c.subject],'Full syllabus, topic '+c.syllabusTopic)}</p></section>
  <section class="panel guided-card" id="worked-example"><div class="panel-label">02 · FOLLOW A WORKED EXAMPLE</div><p class="small-text muted">Original teaching example · selected chapter skill</p><div class="example-question">${format(example.question)}</div>${drawExample(example)}<details class="guided-solution" id="example-solution"><summary>Work through the steps</summary>${solution(example)}</details><button class="button secondary small no-print" id="example-practise">Try a similar example</button><p class="small-text muted no-print">Open the worked steps to unlock similar practice.</p></section>`}
  <section class="panel" id="chapter-questions"><div class="panel-label">03 · END-OF-CHAPTER QUESTIONS</div><h2>Connect this skill to a past paper</h2><p class="small-text">The original question stays in its publisher’s PDF. Use the question and page below; on phones a PDF may open at its first page. Older papers are practice sources, while this course follows the 2024–2026 syllabus.</p><div id="exam-links">${refsHTML(c)}</div>${(c.refs.length||state.customRefs[id])?`<div class="actions no-print"><button class="button secondary small" id="exam-attempt">${state.exams[id]?'✓ Original question attempted':'I have tried the original question'}</button></div>`:''}${refEditor(c)}</section>
  <section class="panel question-panel" id="practice-question"></section>
  <section class="panel"><div class="panel-label">QUESTION 2 · EXPLAIN IT</div><h2>Check your understanding</h2><p>${esc(c.check.question)}</p><label class="field no-print"><span class="field-label">Write your explanation before checking</span><textarea id="explain-attempt" rows="2" placeholder="Explain the idea in your own words. This scratch answer is not saved."></textarea></label><details><summary>Compare with the explanation</summary><p>${esc(c.check.answer)}</p></details></section>
  <section class="panel note-box no-print"><h2>Keep a useful note</h2><label class="field"><span class="field-label">What did you understand? What needs revisiting?</span><textarea id="chapter-note" maxlength="10000" rows="3">${esc(state.notes[id]||'')}</textarea></label><div class="actions"><button class="button" id="mark-reviewed">${state.completed[id]?'✓ Reviewed · undo':'Mark chapter reviewed'}</button>${next?`<a class="button secondary" href="#chapter/${next.id}">Next: ${esc(next.title)} →</a>`:''}</div><p class="small-text muted">“Reviewed” is your own checkmark, not an exam-readiness score.</p></section>`;
  $('chapter-note').oninput=()=>{state.notes[id]=$('chapter-note').value;save();};
  $('mark-reviewed').onclick=()=>{state.completed[id]=!state.completed[id];save();$('mark-reviewed').textContent=state.completed[id]?'✓ Reviewed · undo':'Mark chapter reviewed';};
  $('exam-attempt')?.addEventListener('click',()=>{state.exams[id]=true;s.unlocked=true;save();$('exam-attempt').textContent='✓ Original question attempted';paintQuestion(c);});
  if($('example-practise')){
   $('example-practise').disabled=!s.unlocked;
   $('example-solution').addEventListener('toggle',()=>{
    if($('example-solution').open){s.unlocked=true;save();$('example-practise').disabled=false;paintQuestion(c);}
   });
   $('example-practise').onclick=()=>{newQuestion(c);$('practice-question').scrollIntoView({behavior:'smooth'});};
  }
  document.querySelectorAll('[data-jump]').forEach(a=>a.onclick=e=>{e.preventDefault();$(a.dataset.jump)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  wireRefs(c);paintQuestion(c);
 }
 function paintQuestion(c){
  const s=session(c.id),q=Q.generate(c.id,s.seed),hasAnswer=s.input.trim()!=='',correct=hasAnswer&&Q.check(q,s.input);
  $('practice-question').innerHTML=`<div class="panel-label">QUESTION 1 · PRACTISE THE CHAPTER SKILL</div><div class="question-heading"><h2>Your practice question</h2><span class="tag">Variant ${s.seed}</span></div><p class="small-text muted">${q.origin}. This practises a selected skill from ${esc(c.title.toLowerCase())}.</p><div class="question-text">${format(q.question)}</div>${q.type==='choice'?`<ol class="print-only printed-choices" type="A">${q.options.map(a=>`<li>${esc(a)}</li>`).join('')}</ol>`:''}<form id="answer-form" class="no-print">
  ${q.type==='choice'?`<fieldset class="practice-choices"><legend>Choose an answer</legend>${q.options.map((a,i)=>`<label class="choice"><input type="radio" name="practice-answer" value="${esc(a)}"${s.input===a?' checked':''} required><span>${esc(a)}</span></label>`).join('')}</fieldset>`:`<label class="field answer-field"><span class="field-label">Your answer${q.unit?' ('+esc(q.unit)+')':''} · enter the number only</span><input id="numeric-answer" type="text" inputmode="text" value="${esc(s.input)}" autocomplete="off" maxlength="100" placeholder="A number, decimal or fraction such as 3/4" required></label>`}
  <div class="actions"><button class="button" type="submit">Check answer</button><button class="button secondary" id="show-answer" type="button">${s.show?'Hide worked answer':'Show worked answer'}</button></div></form>
  <p id="answer-feedback" class="answer-feedback ${s.checked?(correct?'correct':'retry'):''}" role="status">${s.checked?(correct?'Correct. Read the steps and explain why they work.':'Not quite. Compare your method with the steps, then try again.'):'Try this question before opening the answer.'}</p>
  <details class="question-hint no-print"><summary>Give me a hint</summary>${format(q.hint)}</details>
  <div id="worked-answer"${s.show?'':' hidden'}>${solution(q)}</div>
  <div class="practice-toolbar no-print"><button class="button" id="generate-similar"${s.unlocked?'':' disabled'}>↻ Generate similar question</button><button class="button secondary" id="ask-ai">Take this question to AI</button><button class="button secondary" id="print-question">Question PDF</button></div><p class="small-text muted no-print">${s.unlocked?'Similar practice unlocked. New values or a new concept example; the worked answer updates too.':'Unlock by checking an answer, opening a worked solution, or attempting the referenced paper question.'}</p>`;
  const read=()=>{s.input=q.type==='choice'?document.querySelector('input[name="practice-answer"]:checked')?.value||'':$('numeric-answer').value;};
  $('answer-form').oninput=()=>{read();s.checked=false;save();$('answer-feedback').textContent='Answer changed. Check it when you are ready.';$('answer-feedback').className='answer-feedback';};
  $('answer-form').onsubmit=e=>{
   e.preventDefault();read();
   if(q.type==='number'&&!Number.isFinite(Q.parseNumber(s.input))){$('answer-feedback').textContent='Enter a number or fraction without units, for example 1.25 or 5/4.';return;}
   if(!s.input.trim())return;
   if(s.attempts===0)s.firstCorrect=Q.check(q,s.input);
   s.attempts++;s.checked=true;s.unlocked=true;save();paintQuestion(c);$('answer-feedback').scrollIntoView({block:'nearest'});
  };
  $('show-answer').onclick=()=>{read();s.show=!s.show;if(s.show)s.unlocked=true;save();paintQuestion(c);};
  $('generate-similar').onclick=()=>newQuestion(c);
  $('ask-ai').onclick=()=>{read();T.prepareQuestion({paper:'EGCSE original practice · '+c.id,question:q.question,topic:c.id,attempt:s.input||'I have not yet answered.',page:'Variant '+s.seed,title:c.title+' · worked solution'});};
  $('print-question').onclick=()=>{document.body.classList.add('print-question-only');window.print();};
 }
 function newQuestion(c){
  const s=session(c.id);if(!s.unlocked)return;
  try{
   const old=Q.generate(c.id,s.seed),next=Q.next(c.id,s.seed,old.question);
   s.seed=next.seed;s.input='';s.checked=false;s.show=false;save();paintQuestion(c);toast('Fresh question ready. Work it through before checking.');
  }catch(e){toast(e.message);}
 }
 function practice(){
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">SMALL STEPS · FRESH QUESTIONS</div><h1>Practice studio</h1><p>Choose a chapter to practise. Start with a question, check the method, then generate a similar one. Worked answers and generation are built in and work offline.</p></div><section class="panel"><div class="form-grid">${trackControl()}<label class="field"><span class="field-label">Chapter</span><select id="practice-topic">${filteredLessons().map(c=>`<option value="${c.id}">${c.id} · ${esc(c.title)}</option>`).join('')}</select></label></div><div class="actions"><button class="button" id="start-practice">Start practice →</button></div></section>`;
  if(filteredLessons().some(c=>c.id===state.last))$('practice-topic').value=state.last;
  $('start-practice').onclick=()=>{location.hash='practice/'+$('practice-topic').value;};wireTrack(practice);
 }
 function curated(){
  if(!$('curated-papers'))return;
  $('curated-papers').innerHTML=`<h2>Papers used in the chapter references</h2><p class="small-text">These links were checked on 23 September 2026. Papers 1–2 in Mathematics are Core; Papers 3–4 are Extended. Physical Science Paper 4 is Alternative to Practical.</p><div class="paper-directory">${C.papers.map(p=>`<div><strong>${esc(p.subject)} · Paper ${p.number}</strong><span>${p.year} · ${p.track}</span>${external(p.url,'Open PDF')}</div>`).join('')}</div><p class="small-text">${external('https://www.khanyisa.online/educare/markingschemes/form5/','Browse available marking schemes')} · Availability varies by year. In-app practice answers are our own explanations, not official mark schemes.</p>`;
 }
 function resources(){
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">THE RIGHT RESOURCE AT THE RIGHT STEP</div><h1>Resources & syllabus</h1><p>The syllabus sets the scope. Books, articles, videos and simulations help you revisit a concept, then return to your question.</p></div>
  <section class="panel"><h2>ECESWA syllabus · 2024–2026</h2><p>Khanyisa's supplied Form 5 collection contains this edition. Check with your teacher which syllabus edition and Mathematics pathway apply to your examination.</p><div class="actions">${external(C.syllabus.maths,'Mathematics 6880 syllabus','button secondary')}${external(C.syllabus.science,'Physical Science 6888 syllabus','button secondary')}${external('https://www.khanyisa.online/educare/syllabus/','Khanyisa syllabus collection')}</div>
  <div class="table-wrap"><table><caption>Assessment overview for the supplied 2024–2026 edition</caption><thead><tr><th>Route</th><th>Components</th></tr></thead><tbody><tr><td>Mathematics Core</td><td>Paper 1: 1 hour, 60 marks (40%) · Paper 2: 2 hours, 90 marks (60%)</td></tr><tr><td>Mathematics Extended</td><td>Paper 3: 1½ hours, 80 marks (40%) · Paper 4: 2½ hours, 120 marks (60%)</td></tr><tr><td>Physical Science</td><td>Paper 1: 1 hour, 40 marks (27%) · Paper 2: 1¼ hours, 80 marks (53%) · either Paper 3 practical: 1¼ hours, or Paper 4 Alternative to Practical: 1 hour (40 marks, 20%)</td></tr></tbody></table></div><p class="small-text">Core includes basic matrices, vectors and inequality regions. Differentiation is Extended only. Extended builds on Core and adds further skills within many chapters.</p></section>
  <section class="panel"><h2>How to use the study room</h2><ol class="usage-list"><li>Read one chapter and explain its main idea.</li><li>Follow the worked example. Hover or focus an underlined concept to see its refresher bubble.</li><li>Open the linked original exam question and attempt it on paper.</li><li>Answer the chapter practice question, then generate another.</li><li>Use Print / PDF to save the current chapter. “Question PDF” prints just the practice question and any revealed answer.</li></ol><p>These 53 guides cover the topic headings with selected examples. They are not a full textbook or a replacement for practical laboratory teaching. Supplementary books may include material beyond EGCSE; the official syllabus remains your scope.</p></section>
  <section class="panel" id="resource-shelf"></section>
  <section class="panel"><h2>Offline & free hosting</h2><p>The lessons, practice generator and equation formatter run entirely in your browser. Open EGCSE-Offline.html for a self-contained copy. External videos, original papers and chat services need internet. ChatGPT and Gemini open your own chat; use copy and paste to bring the explanation back.</p><p>Upload this package's extracted contents to a GitHub Pages repository with index.html at its root. The included README has the steps. Uploaded PDFs and progress are local to the browser; use class copies and progress backups to share or transfer them.</p></section>`;
  T.renderResourceShelf();
 }
 function progress(){
  const done=C.lessons.filter(c=>state.completed[c.id]),tried=C.lessons.filter(c=>state.sessions[c.id]?.attempts>0);
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">SEE WHAT YOU HAVE WORKED ON</div><h1>My progress & notes</h1><p>${done.length} of 53 chapters marked reviewed · ${tried.length} chapters with an answer attempted. Your work is stored in this browser.</p></div>
  <section class="panel no-print"><h2>Keep or move your progress</h2><div class="actions"><button class="button" id="export-progress">Download progress backup</button><label class="button secondary">Import backup / class references<input id="import-progress" type="file" accept=".json,application/json" hidden></label><button class="button text" id="reset-progress">Reset progress</button></div><p class="small-text">A progress backup includes chapter notes, current questions and teacher references. Papers and AI drafts have their own export controls. Importing a progress backup replaces this study progress; class references only merge paper links.</p><p role="status" id="import-status"></p></section>
  <section class="panel"><h2>Your chapter log</h2><div class="progress-log">${C.lessons.map(c=>`<article><div><span class="tag">${c.id}</span><h3><a href="#chapter/${c.id}">${esc(c.title)}</a></h3><p class="small-text">${state.completed[c.id]?'✓ Reviewed':'Not marked reviewed'} · ${state.sessions[c.id]?.attempts||0} answer checks</p></div>${state.notes[c.id]?`<p class="saved-note">${esc(state.notes[c.id])}</p>`:''}</article>`).join('')}</div></section>`;
  $('export-progress').onclick=()=>download('EGCSE-progress.json',JSON.stringify(state,null,2));
  $('reset-progress').onclick=()=>$('reset-dialog').showModal();
  $('import-progress').onchange=async e=>{
   const f=e.target.files[0];if(!f)return;
   try{
    if(f.size>1500000)throw new Error('Choose a JSON backup smaller than 1.5 MB.');
    const raw=JSON.parse(await f.text());
    if(raw.kind==='egcse-references'){
     const clean=sanitise({version:1,customRefs:raw.customRefs});Object.assign(state.customRefs,clean.customRefs);save();$('import-status').textContent=Object.keys(clean.customRefs).length+' class references imported.';
    }else{
     const next=sanitise(raw);
     if(!confirm('Replace your EGCSE progress and notes with this backup?'))return;
     state=next;save();progress();$('import-status').textContent='Progress restored.';
    }
   }catch(error){$('import-status').textContent=error instanceof SyntaxError?'This file is not valid JSON.':error.message;}
   finally{e.target.value='';}
  };
 }
 function notFound(){$('main').innerHTML='<div class="page-head"><h1>Choose a study chapter</h1><p>This page is not in the course. <a href="#overview">Return to your study room</a>.</p></div>';}
 let activeRoute='';
 function route(){
  T.leaveRoute();document.body.classList.remove('print-question-only');document.body.dataset.route='';
  let path;try{path=decodeURIComponent(location.hash.slice(1)||'overview');}catch{path='missing';}
  const [section,id]=path.split('/');
  activeRoute=section;
  const navSection=byId.has(id)&&['chapter','practice'].includes(section)?(section==='practice'?'practice':byId.get(id).subject):section;
  document.querySelectorAll('[data-route]').forEach(a=>{const active=a.dataset.route===navSection;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('navigation').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');
  const titles={overview:'My study room',maths:'Mathematics',science:'Physical Science',chapter:'Chapter',practice:'Practice',archive:'Past exam papers',ai:'AI study desk',resources:'Resources & syllabus',progress:'Progress & notes'};
  $('page-label').textContent=byId.get(id)?.title||titles[section]||'Study room';
  document.title=($('page-label').textContent)+' · EGCSE Study Room';document.body.dataset.route=section;
  if(section==='main'){$('main').focus();return;}
  if(section==='overview')overview();
  else if(section==='maths'||section==='science')course(section);
  else if(section==='chapter'&&id)chapter(id);
  else if(section==='practice'&&id)chapter(id,true);
  else if(section==='practice'||section==='examples')practice();
  else if(section==='archive'){T.renderArchive();curated();}
  else if(section==='ai')T.renderAI();
  else if(section==='resources')resources();
  else if(section==='progress')progress();
  else notFound();
  window.scrollTo(0,0);$('main').focus({preventScroll:true});
 }
 $('menu-toggle').onclick=()=>{const open=$('navigation').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));};
 $('print-page').onclick=()=>{document.body.classList.remove('print-question-only');window.print();};
 window.addEventListener('afterprint',()=>document.body.classList.remove('print-question-only'));
 $('cancel-reset').onclick=()=>$('reset-dialog').close();
 $('confirm-reset').onclick=()=>{state=empty();save();$('reset-dialog').close();progress();};
 window.addEventListener('hashchange',route);
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){$('navigation').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}});
 // A standalone class file can export itself as an offline copy.
 if(location.protocol==='file:'){
  const a=document.querySelector('.sidebar-bottom a[download]');a.href=location.href.split('#')[0];a.download='EGCSE-Offline.html';
 }
 save();route();
})();
