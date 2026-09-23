/* Run with PLAYWRIGHT_MODULE and EGCSE_BROWSER_PATH when not installed globally. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.EGCSE_QA_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'egcse-qa-'));
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=req.url.split('?')[0],sub=pathname.replace(/^\/project\//,'/');
 const file=path.resolve(root,'.'+(sub==='/'?'/index.html':sub));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/project/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.EGCSE_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await ctx.newPage(),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',route=>{
  if(route.request().url().startsWith(base)||/^(blob|file|data):/.test(route.request().url()))return route.continue();
  remote.push(route.request().url());return route.abort();
 });
 const go=async route=>{await page.goto(base+'#'+route);await page.locator('#main h1').waitFor();};
 try{
  await go('overview');assert.equal(await page.locator('.subject-card').count(),2);
  await page.screenshot({path:path.join(out,'overview-desktop.png'),fullPage:true});
  await go('maths');assert.equal(await page.locator('.chapter-tile').count(),23);
  await page.locator('#maths-track').selectOption('extended');assert.equal(await page.locator('.chapter-tile').count(),24);
  await page.locator('#chapter-search').fill('differentiation');assert.equal(await page.locator('.chapter-tile').count(),1);
  await go('science');assert.equal(await page.locator('.chapter-tile').count(),29);
  await page.locator('#science-section').selectOption('chemistry');assert.equal(await page.locator('.chapter-tile').count(),14);
  const ids=await page.evaluate(()=>STUDY_CONTENT.lessons.map(c=>c.id));
  for(const id of ids){
   await go('chapter/'+id);
   assert.ok((await page.locator('h1').textContent()).length>0,id);
   assert.equal(await page.locator('.math-fallback,.katex-error').count(),0,id+' formatting');
   assert.equal(await page.locator('#practice-question .question-text').count(),1,id);
  }
  console.log('PASS 53 chapters, Core/Extended filtering, curriculum search and formatted equations.');
  await go('chapter/M13');
  assert.equal(await page.locator('#generate-similar').isDisabled(),true);
  await page.locator('#numeric-answer').fill('garbage');
  await page.locator('#answer-form button[type=submit]').click();assert.match(await page.locator('#answer-feedback').textContent(),/Enter a number/);
  assert.equal(await page.locator('#generate-similar').isDisabled(),true);
  const expected=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('egcse.study.v1')).sessions.M13;return QuestionBank.generate('M13',s.seed).answer;});
  await page.locator('#numeric-answer').fill(expected.toFixed(1));await page.locator('#answer-form button[type=submit]').click();
  assert.match(await page.locator('#answer-feedback').textContent(),/Correct/);
  assert.equal(await page.locator('#generate-similar').isDisabled(),false);
  const old=await page.locator('#practice-question .question-text').textContent();
  await page.locator('#generate-similar').click();
  assert.notEqual(await page.locator('#practice-question .question-text').textContent(),old);
  assert.equal(await page.locator('#numeric-answer').inputValue(),'');
  await page.locator('#show-answer').click();assert.equal(await page.locator('#worked-answer').isVisible(),true);
  await page.locator('#chapter-note').fill('PRIVATE_NOTE_EGCSE_123');
  await page.locator('#mark-reviewed').click();await page.reload();
  assert.equal(await page.locator('#chapter-note').inputValue(),'PRIVATE_NOTE_EGCSE_123');
  assert.match(await page.locator('#mark-reviewed').textContent(),/Reviewed/);
  await page.locator('#example-solution summary').click();
  const link=page.locator('#example-solution .concept-link').first();await link.hover();
  assert.equal(await page.locator('#example-solution .concept-tip').first().isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#example-solution .concept-tip').first().isVisible(),false);
  await page.screenshot({path:path.join(out,'chapter-desktop.png'),fullPage:true});
  await page.evaluate(()=>document.body.classList.add('print-question-only'));
  await page.pdf({path:path.join(out,'practice-question.pdf'),format:'A4',printBackground:true});
  await page.evaluate(()=>document.body.classList.remove('print-question-only'));
  console.log('PASS numeric checking, unlocking, regeneration, answer refresh, persistent notes and tooltips.');
  await go('chapter/P12');await page.locator('.teacher-reference summary').click();
  await page.locator('#reference-label').fill('6888/02 · October/November 2021');
  await page.locator('#reference-question').fill('Teacher example · verify Q');
  await page.locator('#reference-url').fill('https://example.org/paper.pdf#page=3');
  await page.locator('#reference-form button[type=submit]').click();assert.match(await page.locator('#exam-links').textContent(),/Teacher-added/);
  let event=page.waitForEvent('download');await page.locator('#export-references').click();let dl=await event;
  const referenceText=fs.readFileSync(await dl.path(),'utf8');assert.ok(!referenceText.includes('PRIVATE_NOTE'));
  await go('progress');event=page.waitForEvent('download');await page.locator('#export-progress').click();dl=await event;
  const backup=fs.readFileSync(await dl.path(),'utf8');assert.ok(backup.includes('PRIVATE_NOTE_EGCSE_123'));
  await go('chapter/C08');await page.locator('#ask-ai').click();await page.waitForURL('**/#ai');
  assert.match(await page.locator('#ai-question').inputValue(),/CuSO/);
  assert.match(await page.locator('#ai-prompt').inputValue(),/Physical Science \(6888\)/);
  assert.match(await page.locator('#ai-prompt').inputValue(),/2024–2026/);
  await page.locator('#ai-solution').fill(String.raw`## Calculate the amount
The molar mass is 160 g/mol.
\[n=\frac{m}{M}\]
Use moles to compare reacting amounts.
<img src=x onerror="window.INJECTED=1">
PRIVATE_AI_EGCSE_456`);
  await page.locator('#preview-solution').click();
  assert.equal(await page.locator('#solution-document math').count(),1);
  assert.equal(await page.evaluate(()=>window.INJECTED),undefined);
  assert.equal(await page.locator('#solution-document img').count(),0);
  assert.equal(await page.locator('#solution-document .concept-link').count(),1);
  await page.pdf({path:path.join(out,'ai-solution.pdf'),format:'A4',printBackground:true});
  await page.evaluate(()=>{window.print=()=>{window.printCalled=true;};});await page.locator('#save-solution-pdf').click();
  assert.equal(await page.evaluate(()=>window.printCalled),true);
  console.log('PASS teacher references, progress export, AI handoff, safe equations and PDF control.');
  await go('archive');await page.waitForFunction(()=>document.querySelector('#paper-count').textContent.includes('0 papers'));
  assert.equal(await page.locator('.paper-directory>div').count(),9);
  assert.match(await page.locator('.archive-banner a').getAttribute('href'),/khanyisa/);
  const fixture=fs.readFileSync(path.join(out,'practice-question.pdf'));
  await page.locator('#paper-files').setInputFiles({name:'lesson-paper.pdf',mimeType:'application/pdf',buffer:fixture});
  await page.locator('#paper-title').fill('Class paper');await page.locator('#add-paper-button').click();
  await page.waitForFunction(()=>document.querySelector('#paper-count').textContent.includes('1 paper'));
  await page.reload();await page.waitForFunction(()=>document.querySelector('#paper-count').textContent.includes('1 paper'));
  event=page.waitForEvent('download');await page.getByRole('link',{name:'Download PDF',exact:true}).click();dl=await event;
  assert.deepEqual(fs.readFileSync(await dl.path()),fixture);
  event=page.waitForEvent('download');await page.locator('#export-class').click();dl=await event;
  const classFile=path.join(out,'EGCSE-Class-Study.html');await dl.saveAs(classFile);const html=fs.readFileSync(classFile,'utf8');
  assert.ok(!html.includes('PRIVATE_NOTE_EGCSE_123'));assert.ok(!html.includes('PRIVATE_AI_EGCSE_456'));assert.ok(html.includes('Class paper'));
  const fresh=await browser.newContext({acceptDownloads:true});const student=await fresh.newPage();
  await fresh.setOffline(true);await student.goto('file://'+classFile+'#archive');
  await student.waitForFunction(()=>document.querySelector('#paper-count').textContent.includes('1 paper'));
  event=student.waitForEvent('download');await student.getByRole('link',{name:'Download PDF',exact:true}).click();dl=await event;
  assert.deepEqual(fs.readFileSync(await dl.path()),fixture);
  await student.goto('file://'+classFile+'#chapter/P09');await student.locator('#show-answer').click();
  const previous=await student.locator('.question-text').textContent();await student.locator('#generate-similar').click();
  assert.notEqual(await student.locator('.question-text').textContent(),previous);await fresh.close();
  console.log('PASS PDF upload/reload/download and private-data-free offline class copies.');
  await go('resources');await page.locator('#resource-kind').selectOption('Simulation');
  assert.ok(await page.locator('.resource-item').count()>0);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});
   for(const route of ['overview','maths','chapter/M13','chapter/M21','practice/P09','archive','ai','resources','progress']){
    await go(route);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(overflow,false,'overflow '+width+' '+route);
   }
   if(width===390){await go('overview');await page.screenshot({path:path.join(out,'overview-mobile.png'),fullPage:true});await go('chapter/P09');await page.screenshot({path:path.join(out,'chapter-mobile.png'),fullPage:true});}
  }
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});Object.defineProperty(window,'indexedDB',{get(){throw new Error('blocked');}});});
  const fallback=await blocked.newPage();await fallback.goto(base+'#chapter/M04');await fallback.locator('#show-answer').click();await fallback.locator('#generate-similar').click();
  assert.equal(await fallback.locator('#storage-warning').isVisible(),true);await blocked.close();
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log('PASS 320/390/1440px layouts, resource filters, blocked storage, project-path hosting and zero external requests.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
