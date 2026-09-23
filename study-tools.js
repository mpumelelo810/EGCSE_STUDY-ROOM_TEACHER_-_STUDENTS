/* Local study tools. External chats open only on the student's click. */
(() => {
 'use strict';
 const C=window.STUDY_CONTENT,$=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const resources=new Map(C.resources.map(r=>[r.id,r]));
 const MAX_FILE=20*1024*1024,MAX_TOTAL=60*1024*1024;
 const topicOptions=(all='All topics')=>`<option value="all">${all}</option>`+C.lessons.map(l=>`<option value="${l.id}">${l.id} · ${esc(l.title)}</option>`).join('');
 let tipId=0,db=null,memoryOnly=false,records=[],ready,generation=0;
 const urls=new Map(),sizeLabel=n=>n<1048576?`${Math.ceil(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
 const safeName=n=>String(n||'paper').replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(0,140);
 function download(name,content,type='text/plain'){
  const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type})),a=document.createElement('a');
  a.href=url;a.download=safeName(name);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 function message(id,text,error=false){const n=$(id);if(n){n.textContent=text;n.hidden=!text;n.classList.toggle('error',error);}}
 function refreshLink(id,label){
  const r=resources.get(id);if(!r)return '';const tip='learn-tip-'+(++tipId);
  return `<span class="concept-wrap"><a class="concept-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-describedby="${tip}">${esc(label||r.title)}</a><span role="tooltip" id="${tip}" class="concept-tip">Click to learn ${esc(r.title.toLowerCase())}<small>${esc(r.provider)} · opens in a new tab</small></span></span>`;
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.concept-wrap').forEach(n=>n.classList.add('tip-dismissed'));});
 function positionTip(e){
  const wrap=e.target.closest?.('.concept-wrap');if(!wrap)return;
  wrap.classList.remove('tip-dismissed');const tip=wrap.querySelector('.concept-tip'),a=wrap.querySelector('a').getBoundingClientRect();
  tip.style.left=Math.max(16,Math.min(a.left,innerWidth-tip.offsetWidth-16))+'px';
  tip.style.top=(a.top>tip.offsetHeight+16?a.top-tip.offsetHeight-9:a.bottom+9)+'px';
 }
 document.addEventListener('pointerover',positionTip);
 document.addEventListener('focusin',positionTip);
 function exampleCard(e,open=false){
  return `<article class="panel guided-card" data-example="${e.id}"><div class="panel-label">${esc(C.lessons.find(l=>l.id===e.topic).title)}</div><h2>${esc(e.title)}</h2><p class="example-question">${e.question}</p><details class="guided-solution"${open?' open':''}><summary>Work through the steps</summary><ol class="guided-steps">${e.steps.map(([title,body,link])=>`<li><h3>${esc(title)}</h3><div>${body}</div>${link?`<p class="step-refresher">Need a reminder? ${refreshLink(link)} <span class="resource-format">${esc(resources.get(link).kind)}</span></p>`:''}</li>`).join('')}</ol><div class="try-it"><strong>Now try it yourself</strong><p>${esc(e.challenge)}</p><details><summary>Check your reasoning</summary><p>${e.answer}</p></details></div></details></article>`;
 }
 function lessonExamples(topic){return `<section class="lesson-examples"><div class="section-heading"><div><h2>Follow a worked example</h2><p>Open the refresher you need, then return to this step.</p></div></div>${C.examples.filter(e=>e.topic===topic).map(e=>exampleCard(e)).join('')}</section>`;}
 function renderExamples(){
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">ONE STEP. ONE USEFUL REMINDER.</div><h1>Step-by-step examples</h1><p>Try the question first. If a step feels unfamiliar, follow its underlined concept link and come straight back. Hover or focus a link for a short explanation.</p></div><div class="panel no-print"><label class="field" for="example-topic"><span class="field-label">Choose a topic</span><select id="example-topic">${topicOptions()}</select></label></div><div id="guided-list"></div>`;
  const paint=()=>{const topic=$('example-topic').value;$('guided-list').innerHTML=C.examples.filter(e=>topic==='all'||e.topic===topic).map(e=>exampleCard(e,e.id==='exponential-mean'||topic!=='all')).join('');};$('example-topic').onchange=paint;paint();
 }
 function renderResourceShelf(){
  const root=$('resource-shelf');if(!root)return;
  root.innerHTML=`<h2>Books, articles & videos</h2><p class="small-text">Free starting points for the concept you need now. Links open in a new tab; the example stays here. External reading and videos need internet.</p><div class="form-grid no-print"><label class="field"><span class="field-label">Topic</span><select id="resource-topic">${topicOptions()}</select></label><label class="field"><span class="field-label">Format</span><select id="resource-kind"><option value="all">All formats</option>${['Video','Book','Article','Notes','Simulation'].map(k=>`<option>${k}</option>`).join('')}</select></label></div><p id="resource-count" class="small-text muted" role="status"></p><div id="resource-results" class="resource-list"></div>`;
  const paint=()=>{const list=C.resources.filter(r=>($('resource-topic').value==='all'||r.topics.includes($('resource-topic').value))&&($('resource-kind').value==='all'||r.kind===$('resource-kind').value));$('resource-count').textContent=`${list.length} resources`;$('resource-results').innerHTML=list.map(r=>`<div class="resource-item"><span class="tag">${r.kind}</span><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a></h3><p>${esc(r.note)}</p><p class="resource-provider">${esc(r.provider)}</p></div>`).join('')||'<p>No matches. Try another format.</p>';};$('resource-topic').onchange=paint;$('resource-kind').onchange=paint;paint();
 }
 function allPapers(){return [...records].sort((a,b)=>String(b.year).localeCompare(String(a.year))||a.title.localeCompare(b.title));}
 function blobURL(p){if(!urls.has(p.id))urls.set(p.id,URL.createObjectURL(p.blob));return urls.get(p.id);}
 function openDB(){return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(new Error('Storage unavailable'));
  let settled=false;const req=indexedDB.open('egcse-papers-v1',1);
  const timer=setTimeout(()=>{settled=true;reject(new Error('Storage unavailable'));},4000);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('papers'))req.result.createObjectStore('papers',{keyPath:'id'});};
  req.onsuccess=()=>{if(settled){req.result.close();return;}settled=true;clearTimeout(timer);resolve(req.result);};
  req.onerror=req.onblocked=()=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('Storage unavailable'));}};
 });}
 function transaction(action,values){return new Promise((resolve,reject)=>{
  const tx=db.transaction('papers',action==='getAll'?'readonly':'readwrite'),store=tx.objectStore('papers');let result;
  if(action==='getAll'){const req=store.getAll();req.onsuccess=()=>{result=req.result;};}else for(const value of values)store[action](value);
  tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||new Error('Paper storage failed'));
 });}
 function decodeShared(raw){
  if(!raw||typeof raw.data!=='string'||!raw.data.startsWith('data:application/pdf;base64,')||raw.data.length>MAX_FILE*1.4)return null;
  const bytes=Uint8Array.from(atob(raw.data.slice(28)),c=>c.charCodeAt(0));if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return null;
  return {id:String(raw.id).slice(0,100),title:String(raw.title||'Past paper').slice(0,180),filename:safeName(raw.filename||'paper.pdf'),faculty:String(raw.faculty||'').slice(0,120),course:String(raw.course||'').slice(0,60),year:String(raw.year||'').slice(0,4),size:bytes.length,shared:true,blob:new Blob([bytes],{type:'application/pdf'})};
 }
 function initPapers(){if(ready)return ready;ready=(async()=>{
  let total=0;for(const raw of (Array.isArray(window.SHARED_PAPERS)?window.SHARED_PAPERS:[]).slice(0,200)){try{const p=decodeShared(raw);if(p&&total+p.size<=MAX_TOTAL){total+=p.size;records.push(p);}}catch{}}
  try{db=await openDB();for(const p of await transaction('getAll'))if(p.blob instanceof Blob&&!records.some(x=>x.id===p.id))records.push(p);db.onversionchange=()=>{db.close();memoryOnly=true;};}catch{memoryOnly=true;}
 })();return ready;}
 function dataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read this PDF.'));r.readAsDataURL(blob);});}
 const scriptJSON=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 async function exportClassCopy(selected){
  if(!window.PUBLIC_APP_TEMPLATE)throw new Error('Sharing template missing. Open the complete app folder or EGCSE-Offline.html.');
  if(!selected.length)throw new Error('Select at least one paper.');
  if(selected.reduce((n,p)=>n+p.size,0)>MAX_TOTAL)throw new Error('Choose no more than 60 MB of papers.');
  const papers=[];for(const p of selected)papers.push({id:p.id,title:p.title,filename:p.filename,faculty:p.faculty,course:p.course,year:p.year,data:await dataURL(p.blob)});
  const boot='<script>window.SHARED_PAPERS='+scriptJSON(papers)+';window.PUBLIC_APP_TEMPLATE='+scriptJSON(window.PUBLIC_APP_TEMPLATE)+';<\/script>';
  download('EGCSE-Class-Study.html',window.PUBLIC_APP_TEMPLATE.replace('<!--SHARED_PAPERS-->',()=>boot),'text/html;charset=utf-8');
 }
 async function renderArchive(){
  const token=++generation;
  $('main').innerHTML=`<div class="page-head"><div class="eyebrow">PAST PAPERS → PRACTICE → UNDERSTANDING</div><h1>Past exam papers</h1><p>Find a paper, attempt a question, then work through what you missed.</p></div>
  <section class="archive-banner"><div><span class="eyebrow">MTN EDUCARE · KHANYISA</span><h2>EGCSE past papers</h2><p>Choose Form 5 / EGCSE, a year, then Mathematics (6880) or Physical Science (6888). Original questions open on the publisher’s website. Download a PDF to add it to your class collection below.</p></div><a class="button gold" href="https://www.khanyisa.online/educare/exampapers/form5/" target="_blank" rel="noopener noreferrer">Open EGCSE papers ↗</a></section><section id="curated-papers" class="panel"></section>
  <div class="study-shortcuts"><a href="#practice">Choose a chapter and practise →</a><a href="#ai">Open the AI study desk →</a></div>
  <section class="panel no-print"><h2>Add papers to this study room</h2><p class="small-text">PDFs you add are saved in this browser. To give students the same papers, select them below and download a class copy.</p><form id="add-papers"><div class="form-grid">
  <label class="field wide"><span class="field-label">PDF files · up to 20 MB each, 60 MB per collection</span><input id="paper-files" type="file" accept=".pdf,application/pdf" multiple required></label>
  <label class="field wide"><span class="field-label">Title (optional; multiple files use their filenames)</span><input id="paper-title" maxlength="180" placeholder="EGCSE Mathematics · Paper 1"></label>
  <label class="field"><span class="field-label">Subject code</span><input id="paper-course" maxlength="60" value="6880"></label><label class="field"><span class="field-label">Year (optional)</span><input id="paper-year" inputmode="numeric" maxlength="4" pattern="[12][0-9]{3}" placeholder="2023"></label>
  <label class="field wide"><span class="field-label">Subject</span><input id="paper-faculty" maxlength="120" value="Mathematics"></label></div><div class="actions form-actions"><button class="button" type="submit" id="add-paper-button">Add PDF papers</button></div></form><p id="paper-status" class="small-text" role="status" hidden></p></section>
  <section class="panel"><div class="section-heading"><div><h2>Your paper collection</h2><p id="paper-count" role="status">Loading papers…</p></div></div><label class="field no-print"><span class="field-label">Find a paper</span><input type="search" id="paper-search" placeholder="Search title, subject code or year"></label><p id="paper-storage" class="small-text muted"></p><div id="paper-list"></div>
  <div class="class-copy no-print"><h3>Share papers with your students</h3><p class="small-text">Tick the papers to include, then download one HTML file containing the app and those PDFs. Send it to students to open in a browser, or publish that file as your website’s index.html. Your notes, quiz answers and AI draft are not copied.</p><button class="button" id="export-class" disabled>Download class copy</button><p id="class-status" class="small-text" role="status"></p></div></section>
  <dialog id="remove-paper-dialog" aria-labelledby="remove-paper-title"><h2 id="remove-paper-title">Remove this paper?</h2><p>This removes your local copy from this browser. It does not change an already downloaded class copy.</p><div class="actions"><button class="button secondary" id="keep-paper">Keep paper</button><button class="button danger" id="remove-paper-confirm">Remove paper</button></div></dialog>`;
  const selected=new Set();let removeId;
  const paint=()=>{
   if(token!==generation||!$('paper-list'))return;
   const papers=allPapers(),query=$('paper-search').value.trim().toLowerCase(),matches=papers.filter(p=>[p.title,p.faculty,p.course,p.year].join(' ').toLowerCase().includes(query));
   $('paper-count').textContent=`${papers.length} ${papers.length===1?'paper':'papers'} · ${sizeLabel(papers.reduce((s,p)=>s+p.size,0))}`;
   $('paper-storage').textContent=memoryOnly?'Saving is unavailable here. Added papers last for this visit only; download a class copy before closing.':'Saved in this browser. Papers marked “Included” also travel with this class copy.';
   $('export-class').disabled=!selected.size;
   $('paper-list').innerHTML=matches.map(p=>`<article class="uploaded-paper"><div class="paper-selection no-print"><input type="checkbox" data-include="${esc(p.id)}" id="include-${esc(p.id)}"${selected.has(p.id)?' checked':''}><label for="include-${esc(p.id)}">Include in class copy</label></div><h3>${esc(p.title)}</h3><p class="small-text muted">${[p.course,p.year,p.faculty,sizeLabel(p.size),p.shared?'Included in this copy':'Added on this device'].filter(Boolean).map(esc).join(' · ')}</p><div class="actions"><a class="button secondary small" href="${blobURL(p)}" target="_blank" rel="noopener noreferrer">Open PDF ↗</a><a class="button secondary small" href="${blobURL(p)}" download="${esc(p.filename)}">Download PDF</a><button class="button small" data-study="${esc(p.id)}">Study a question</button>${p.shared?'':`<button class="button text small" data-remove="${esc(p.id)}">Remove</button>`}</div></article>`).join('')||`<div class="empty-collection"><strong>${papers.length?'No matching papers':'Your collection starts here'}</strong><p>${papers.length?'Try a course code or another year.':'Open the Khanyisa archive and download a paper, or add a PDF you already have.'}</p></div>`;
   $('paper-list').querySelectorAll('[data-include]').forEach(n=>n.onchange=()=>{n.checked?selected.add(n.dataset.include):selected.delete(n.dataset.include);$('export-class').disabled=!selected.size;});
   $('paper-list').querySelectorAll('[data-study]').forEach(n=>n.onclick=()=>{const p=records.find(x=>x.id===n.dataset.study);draft.paper=p.title;draft.paperId=p.id;saveDraft();location.hash='ai';});
   $('paper-list').querySelectorAll('[data-remove]').forEach(n=>n.onclick=()=>{removeId=n.dataset.remove;$('remove-paper-dialog').showModal();});
  };
  $('paper-search').oninput=paint;
  $('keep-paper').onclick=()=>$('remove-paper-dialog').close();
  $('remove-paper-confirm').onclick=async()=>{
   const button=$('remove-paper-confirm');button.disabled=true;
   try{if(db)await transaction('delete',[removeId]);records=records.filter(p=>p.id!==removeId);selected.delete(removeId);$('remove-paper-dialog')?.close();paint();}
   catch{message('paper-status','Could not remove the saved paper. Close other copies and try again.',true);}
   finally{button.disabled=false;}
  };
  $('add-papers').onsubmit=async event=>{
   event.preventDefault();const button=$('add-paper-button');button.disabled=true;
   const form=event.currentTarget,files=Array.from($('paper-files').files),title=$('paper-title').value.trim(),course=$('paper-course').value.trim(),year=$('paper-year').value.trim(),faculty=$('paper-faculty').value.trim();
   try{
    await initPapers();if(!files.length)throw new Error('Choose at least one PDF.');
    if(records.reduce((s,p)=>s+p.size,0)+files.reduce((s,f)=>s+f.size,0)>MAX_TOTAL)throw new Error('This collection would exceed 60 MB. Remove some papers or create a separate class copy.');
    const pending=[];
    for(const file of files){
     if(file.size>MAX_FILE)throw new Error(`${file.name} exceeds 20 MB. Choose a smaller PDF.`);
     if(!/\.pdf$/i.test(file.name)||await file.slice(0,5).text()!=='%PDF-')throw new Error(`${file.name} is not a recognised PDF. No files from this batch were added.`);
     pending.push({id:'p-'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)),title:files.length===1&&title?title:file.name.replace(/\.pdf$/i,''),filename:safeName(file.name),course,year,faculty,size:file.size,blob:new Blob([file],{type:'application/pdf'}),shared:false});
    }
    if(db&&!memoryOnly){try{await transaction('put',pending);}catch{memoryOnly=true;}}
    records.push(...pending);pending.forEach(p=>selected.add(p.id));
    if(token===generation&&form.isConnected){$('paper-files').value='';message('paper-status',`${pending.length} ${pending.length===1?'paper added':'papers added'}. ${memoryOnly?'Download a class copy now to keep them.':'Saved in this browser.'}`);paint();}
   }catch(error){if(token===generation)message('paper-status',error.message,true);}
   finally{if(button.isConnected)button.disabled=false;}
  };
  $('export-class').onclick=async()=>{
   const button=$('export-class');button.disabled=true;message('class-status','Preparing the selected PDFs…');
   try{await exportClassCopy(records.filter(p=>selected.has(p.id)));message('class-status','Class copy downloaded. Send EGCSE-Class-Study.html to your students.');}
   catch(error){message('class-status',error.message,true);}
   finally{if(button.isConnected)button.disabled=!selected.size;}
  };
  await initPapers();if(token!==generation||!$('paper-list'))return;records.forEach(p=>selected.add(p.id));paint();
 }
 const emptyDraft=()=>({paper:'',paperId:'',question:'',page:'',topic:'M01',mode:'hints',attempt:'',solution:'',source:'',title:'My worked solution'});
 let draft=emptyDraft(),draftSaved=true,draftTimer;
 try{const raw=JSON.parse(localStorage.getItem('egcse.ai-draft.v1')||'null');if(raw&&typeof raw==='object')for(const key of Object.keys(draft))if(typeof raw[key]==='string')draft[key]=raw[key].slice(0,key==='solution'?60000:12000);}
 catch{draftSaved=false;}
 function saveDraft(){
  try{localStorage.setItem('egcse.ai-draft.v1',JSON.stringify(draft));draftSaved=true;}catch{draftSaved=false;}
  if($('draft-status'))$('draft-status').textContent=draftSaved?'Draft saved in this browser.':'Draft is not saved automatically. Download your solution or a text backup before leaving.';
 }
 function buildPrompt(){
  if(!draft.question.trim())return '';
  const refs=C.resources.filter(r=>r.topics.includes(draft.topic)&&['Video','Notes','Article','Book','Simulation'].includes(r.kind)).slice(0,4);
  return `Help me study this EGCSE ${C.lessons.find(l=>l.id===draft.topic)?.subject==='maths'?'Mathematics (6880)':'Physical Science (6888)'} question, using the 2024–2026 syllabus. Topic: ${C.lessons.find(l=>l.id===draft.topic)?.title||draft.topic}. ${draft.mode==='hints'?'Start with a small hint and one question that checks my understanding. Let me try before revealing the solution.':'Give a complete, numbered step-by-step solution, explaining why each step is valid.'}

Paper: ${draft.paper||'Practice question'}${draft.page?'\nQuestion/page: '+draft.page:''}
Question (use exactly these details):
${draft.question}

My attempt / where I am stuck:
${draft.attempt||'I am starting this question.'}

State assumptions and define symbols. If a diagram, scan or number is missing or unclear, ask me for it instead of guessing. Show the intermediate reasoning, calculations and units, check the final answer, and give one similar question for me to try. Distinguish approximate from exact answers.
When a step uses a prerequisite, name that concept explicitly (for example, "fractions", "Pythagoras" or "balancing equations") beside that step. Give only relevant refresher links from this verified list; do not invent URLs:
${refs.map(r=>r.title+': '+r.url).join('\n')}
Use LaTeX with \\( ... \\) for inline maths and \\[ ... \\] for display maths. Keep the solution readable when copied into a study sheet.

The study app has not attached the PDF to this chat. If the question needs a figure or a full page, ask me to upload it here.`;
 }
 // Raw HTML is escaped. KaTeX emits local, native MathML with trust disabled.
 function formatAnswer(raw){
  const blocks=[],put=html=>'\uE000'+(blocks.push(html)-1)+'\uE001';
  let text=String(raw).slice(0,60000).replace(/[\uE000\uE001]/g,'').replace(/\r\n?/g,'\n');
  text=text.replace(/```[^\n]*\n([\s\S]*?)```/g,(_,code)=>put('<pre>'+esc(code)+'</pre>'));
  text=text.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|(?<![\\$\w])\$([^$\n]+)\$(?!\w)/g,(full,a,b,c,d)=>{
   const tex=a??b??c??d,display=a!==undefined||b!==undefined;
   if(!window.katex||tex.length>8000)return put('<code>'+esc(full)+'</code>');
   try{return put(`<span class="${display?'answer-math-block':'answer-math-inline'}">`+katex.renderToString(tex,{output:'mathml',displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxSize:10,maxExpand:1000})+'</span>');}
   catch{return put('<code class="math-fallback">'+esc(full)+'</code>');}
  });
  const inline=line=>{
   let value=esc(line).replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s<>]+)\)/g,(_,label,url)=>{
    const decoder=document.createElement('textarea');decoder.innerHTML=url;let link;try{link=new URL(decoder.value);}catch{return label;}
    return ['https:','http:'].includes(link.protocol)?put(`<a href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`):label;
   });
   value=value.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
   return value.replace(/\uE000(\d+)\uE001/g,(_,n)=>blocks[Number(n)]||'');
  };
  let output='',list=null,section=false;const close=()=>{if(list){output+=`</${list}>`;list=null;}};
  for(const line of text.split('\n')){
   if(!line.trim()){close();continue;}
   const item=line.match(/^\s*(?:([-*])|(\d+)[.)])\s+(.+)$/);
   if(item){const kind=item[1]?'ul':'ol';if(list!==kind){close();output+=`<${kind}${kind==='ol'?' start="'+Number(item[2])+'"':''}>`;list=kind;}output+='<li>'+inline(item[3])+'</li>';continue;}
   close();const heading=line.match(/^#{1,6}\s+(.+)$/);if(heading){if(section)output+='</section>';section=true;output+='<section class="answer-section"><h3>'+inline(heading[1])+'</h3>';}else output+='<p>'+inline(line)+'</p>';
  }
  close();if(section)output+='</section>';return output;
 }
 function linkConcepts(root){
  const entries=C.resources.flatMap(r=>r.terms.map(term=>({term,r}))).sort((a,b)=>b.term.length-a.term.length);
  const pattern=entries.map(e=>e.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),regex=new RegExp('\\b('+pattern+')\\b','gi'),seen=new Set();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('a,math,code,pre,.concept-wrap'))nodes.push(n);}
  for(const node of nodes){
   let last=0,match,changed=false;const fragment=document.createDocumentFragment();regex.lastIndex=0;
   while((match=regex.exec(node.textContent))){
    const entry=entries.find(e=>e.term.toLowerCase()===match[0].toLowerCase());if(!entry||seen.has(entry.r.id))continue;
    fragment.append(node.textContent.slice(last,match.index));const wrapper=document.createElement('span');wrapper.innerHTML=refreshLink(entry.r.id,match[0]);fragment.append(...wrapper.childNodes);last=regex.lastIndex;seen.add(entry.r.id);changed=true;
   }
   if(changed){fragment.append(node.textContent.slice(last));node.replaceWith(fragment);}
  }
 }
 function renderSolution(){
  if(!$('solution-document'))return;const has=!!draft.solution.trim();
  $('solution-document').hidden=!has;$('save-solution-pdf').disabled=!has;$('save-solution-text').disabled=!has;if(!has){message('format-status','');return;}
  $('solution-document').innerHTML=`<div class="panel-label">EGCSE · STUDY SHEET</div><h2>${esc(draft.title||'My worked solution')}</h2><p class="small-text muted">${[draft.paper,draft.page,draft.source].filter(Boolean).map(esc).join(' · ')}</p><h3>Question</h3><div class="solution-question">${formatAnswer(draft.question||'No question supplied.')}</div><h3>Worked solution</h3><div id="formatted-answer">${formatAnswer(draft.solution)}</div><p class="solution-note">Study draft · Check the assumptions, arithmetic and reasoning against your course notes or with your tutor.</p>`;
  linkConcepts($('formatted-answer'));message('format-status',$('formatted-answer').querySelector('.math-fallback')?'Some equations could not be formatted and are shown as text. Check their LaTeX before saving.':'');
 }
 function syncDraft(){
  const mapping={paper:'ai-paper-name',page:'ai-page',question:'ai-question',topic:'ai-topic',mode:'ai-mode',attempt:'ai-attempt',solution:'ai-solution',source:'ai-source',title:'ai-title'};
  for(const [key,id] of Object.entries(mapping))if($(id))draft[key]=$(id).value;
  saveDraft();const prompt=buildPrompt();if($('ai-prompt'))$('ai-prompt').value=prompt;if($('copy-prompt'))$('copy-prompt').disabled=!prompt;
 }
 function renderAI(){
  const token=++generation;
  $('main').innerHTML=`<div class="page-head no-print"><div class="eyebrow">GET HELP. UNDERSTAND THE STEPS. KEEP YOUR WORK.</div><h1>AI study desk</h1><p>Prepare a question here, open your own ChatGPT or Gemini chat, then paste the answer back to make a study sheet. Answers return through copy and paste.</p></div><div class="ai-workspace">
  <section class="panel no-print"><div class="panel-label">1 · PREPARE YOUR QUESTION</div><h2>What are you working on?</h2><div class="form-grid">
  <label class="field wide"><span class="field-label">Choose a paper from your collection</span><select id="ai-paper"><option value="">A question without an uploaded paper</option></select></label><div id="ai-paper-action" class="wide small-text"></div>
  <label class="field"><span class="field-label">Paper / course name</span><input id="ai-paper-name" maxlength="180"></label><label class="field"><span class="field-label">Question number / page</span><input id="ai-page" maxlength="120" placeholder="Question 2(b), page 3"></label>
  <label class="field"><span class="field-label">Topic</span><select id="ai-topic">${topicOptions().replace('<option value="all">All topics</option>','')}</select></label><label class="field"><span class="field-label">How would you like to learn?</span><select id="ai-mode"><option value="hints">Hints first · let me try</option><option value="steps">Full step-by-step solution</option></select></label>
  <label class="field wide"><span class="field-label">Paste or type the exact question</span><textarea id="ai-question" rows="5" maxlength="12000" placeholder="Include every number, unit and assumption. Describe a diagram, or attach the PDF in your AI chat."></textarea><small>The app does not extract PDF text. Copy selectable text, or attach a scan directly in your AI chat.</small></label>
  <label class="field wide"><span class="field-label">My attempt / where I got stuck</span><textarea id="ai-attempt" maxlength="12000" rows="3" placeholder="I know the formula, but I am unsure which values to substitute…"></textarea></label></div></section>
  <section class="panel no-print"><div class="panel-label">2 · TAKE IT TO YOUR CHAT</div><h2>Copy the prompt, then open a chat</h2><p class="small-text">Paste this prompt into your chat. If the question needs a diagram or a scanned page, attach the PDF there too. Opening a chat does not send the PDF or your question automatically.</p><label class="field"><span class="field-label">Your study prompt</span><textarea id="ai-prompt" rows="7" readonly placeholder="Enter a question above to create your prompt."></textarea></label><div class="actions"><button id="copy-prompt" class="button">Copy study prompt</button><a class="button secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a><a class="button secondary" href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">Open Gemini ↗</a></div><p id="copy-status" class="small-text" role="status"></p></section>
  <section class="panel no-print"><div class="panel-label">3 · BRING BACK THE EXPLANATION</div><h2>Make your solution a study sheet</h2><p class="small-text">Copy the response from your chat and paste it here. Maths in LaTeX is formatted locally; recognised concepts get relevant refresher links.</p><div class="form-grid"><label class="field"><span class="field-label">Study sheet title</span><input id="ai-title" maxlength="180"></label><label class="field"><span class="field-label">Solution source (optional)</span><input id="ai-source" maxlength="180" placeholder="ChatGPT · checked with my tutor"></label><label class="field wide"><span class="field-label">Solution text</span><textarea id="ai-solution" rows="10" maxlength="60000" placeholder="Paste a solution here. Use \\(x^2\\) for inline maths or \\[ ... \\] for a displayed equation."></textarea></label></div><div class="actions"><button class="button" id="preview-solution">Format solution</button><button class="button secondary" id="save-solution-pdf" disabled>Save solution as PDF</button><button class="button secondary" id="save-solution-text" disabled>Download text backup</button><button class="button text" id="clear-draft">Clear draft</button></div><p class="small-text muted">PDF opens your browser’s print dialog: choose “Save as PDF”. Review the preview and paper size before saving.</p><p id="format-status" class="small-text" role="status"></p><p id="draft-status" class="small-text" role="status"></p></section>
  <article class="panel solution-document" id="solution-document" hidden></article></div>
  <dialog id="clear-draft-dialog" aria-labelledby="clear-draft-title"><h2 id="clear-draft-title">Clear this study draft?</h2><p>The question and pasted solution will be removed from this browser. Download a text backup or PDF first if you need them.</p><div class="actions"><button class="button secondary" id="keep-draft">Keep draft</button><button class="button danger" id="confirm-clear-draft">Clear draft</button></div></dialog>`;
  const mapping={paper:'ai-paper-name',page:'ai-page',question:'ai-question',topic:'ai-topic',mode:'ai-mode',attempt:'ai-attempt',solution:'ai-solution',source:'ai-source',title:'ai-title'};
  if(!C.lessons.some(l=>l.id===draft.topic))draft.topic='M01';if(!['hints','steps'].includes(draft.mode))draft.mode='hints';
  for(const [key,id] of Object.entries(mapping)){$(id).value=draft[key];$(id).addEventListener('input',()=>{syncDraft();clearTimeout(draftTimer);draftTimer=setTimeout(renderSolution,350);});}
  $('copy-prompt').onclick=async()=>{syncDraft();const prompt=buildPrompt();if(!prompt)return;try{await navigator.clipboard.writeText(prompt);message('copy-status','Prompt copied. Open a chat and paste it.');}catch{$('ai-prompt').focus();$('ai-prompt').select();message('copy-status','The prompt is selected. Use Copy (Ctrl+C / Cmd+C, or your device’s Copy command), then paste it in your chat.');}};
  $('preview-solution').onclick=()=>{syncDraft();renderSolution();if(draft.solution.trim())$('solution-document').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  $('save-solution-pdf').onclick=()=>{syncDraft();renderSolution();window.print();};
  $('save-solution-text').onclick=()=>{syncDraft();download('EGCSE-solution-backup.txt',`${draft.title}\n${draft.paper} ${draft.page}\nSource: ${draft.source}\n\nQUESTION\n${draft.question}\n\nSOLUTION\n${draft.solution}`);};
  $('clear-draft').onclick=()=>$('clear-draft-dialog').showModal();$('keep-draft').onclick=()=>$('clear-draft-dialog').close();
  $('confirm-clear-draft').onclick=()=>{draft=emptyDraft();saveDraft();$('clear-draft-dialog').close();renderAI();};
  syncDraft();renderSolution();
  initPapers().then(()=>{
   if(token!==generation||!$('ai-paper'))return;
   $('ai-paper').insertAdjacentHTML('beforeend',allPapers().map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join(''));$('ai-paper').value=records.some(p=>p.id===draft.paperId)?draft.paperId:'';
   const show=()=>{const p=records.find(p=>p.id===$('ai-paper').value);$('ai-paper-action').innerHTML=p?`<a href="${blobURL(p)}" target="_blank" rel="noopener noreferrer">Open selected PDF ↗</a> · <a href="${blobURL(p)}" download="${esc(p.filename)}">Download to attach in chat</a>`:'';};
   $('ai-paper').onchange=()=>{const p=records.find(p=>p.id===$('ai-paper').value);draft.paperId=p?.id||'';if(p)$('ai-paper-name').value=p.title;syncDraft();show();};show();
  });
 }
 function prepareQuestion(context){for(const key of ['paper','page','question','topic','attempt','title'])if(typeof context[key]==='string')draft[key]=context[key];draft.paperId='';draft.solution='';draft.source='';saveDraft();location.hash='ai';}
 function leaveRoute(){generation++;clearTimeout(draftTimer);}
 window.StudyTools={prepareQuestion,refreshLink,lessonExamples,renderExamples,renderResourceShelf,renderArchive,renderAI,leaveRoute,formatAnswer};
})();
