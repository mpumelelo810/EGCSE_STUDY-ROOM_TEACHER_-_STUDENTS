/* Browser UI tests use a deterministic Auth/API fixture. SQL security is tested separately. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.EGCSE_QA_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'egcse-roles-'));
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const route=decodeURIComponent(req.url.split('?')[0]).replace(/^\/project\//,'/');
 const file=path.resolve(root,'.'+(route==='/'?'/index.html':route));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
const uid=n=>`${n}0000000-0000-0000-0000-000000000001`;
const accounts={student:{id:uid(1),display_name:'Student One',role:'student',status:'active'},teacher:{id:uid(2),display_name:'Teacher One',role:'teacher',status:'active'},moderator:{id:uid(3),display_name:'Moderator',role:'moderator',status:'active'},pending:{id:uid(4),display_name:'Waiting Teacher',role:'student',requested_role:'teacher',status:'pending'},other:{id:uid(5),display_name:'Student Two',role:'student',status:'active'},suspended:{id:uid(6),display_name:'Suspended Student',role:'student',status:'suspended'}};
const room={id:uid(7),owner_id:uid(2),title:'Form 5 Mathematics',subject:'Mathematics',join_code:'ABC123DEF456',archived:false};
const rooms=[room],members=[],materials=[],progress={};let recoveryRequests=0;
const user=p=>({id:p.id,email:Object.keys(accounts).find(k=>accounts[k]===p)+'@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()});
const session=p=>({access_token:[{alg:'HS256',typ:'JWT'},{sub:p.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user:user(p)});
async function fixtures(context,base){
 await context.route('**/assets/backend-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.STUDY_BACKEND={url:'https://fixture.supabase.co',publishableKey:'sb_publishable_test_only'};"}));
 await context.route('https://fixture.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),method=req.method();let body={};try{body=req.postDataJSON()||{};}catch{}
  let sub;try{sub=JSON.parse(Buffer.from((req.headers().authorization||'').split('.')[1],'base64url').toString()).sub;}catch{}
  const me=Object.values(accounts).find(a=>a.id===sub);
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/auth/v1/token'){const p=accounts[body.email?.split('@')[0]];return p?send(session(p)):send({msg:'Invalid login credentials'},400);}
  if(url.pathname==='/auth/v1/user'&&method==='GET')return me?send(user(me)):send({msg:'Not signed in'},401);
  if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
  if(url.pathname==='/auth/v1/recover'){recoveryRequests++;return send({});}
  if(url.pathname==='/auth/v1/signup'){assert.equal(body.data.requested_role,'teacher');assert.equal(body.data.role,undefined);return send(user(accounts.pending));}
  if(!me)return send({message:'Authentication required'},401);
  const table=url.pathname.split('/').pop(),single=(req.headers().accept||'').includes('vnd.pgrst.object+json');
  const rows=data=>send(single?data[0]||null:data);
  if(url.pathname.includes('/rpc/')){
   if(table==='save_study_progress')progress[me.id]=body.payload;
   if(table==='class_progress')return send(members.filter(m=>m.status==='active').map(m=>({user_id:m.user_id,display_name:accounts.student.display_name,reviewed:1,attempted:0})));
   if(table==='request_room_access')members.push({room_id:room.id,user_id:me.id,status:'requested'});
   if(table==='review_room_member'){const m=members.find(m=>m.user_id===body.uid);if(m)m.status=body.approve?'active':'removed';}
   if(table==='moderate_account'){const p=Object.values(accounts).find(a=>a.id===body.target);p.role=body.decision==='approve_teacher'?'teacher':p.role;p.status=body.decision==='suspend'?'suspended':'active';}
   if(table==='moderate_material'){materials.find(m=>m.id===body.target).hidden=body.hide;}
   return send(null);
  }
  if(table==='profiles'){let ps=Object.values(accounts);const id=url.searchParams.get('id');if(id)ps=ps.filter(p=>p.id===id.slice(3));return rows(ps);}
  if(table==='study_progress')return rows(progress[me.id]?[{data:progress[me.id]}]:[]);
  if(table==='study_rooms'){
   if(method==='POST'){const r={...room,...body,id:uid(8)};rooms.push(r);return rows([r]);}
   if(method==='PATCH'){room.archived=body.archived;return send(null);}
   return rows(me.role==='teacher'?rooms:members.some(m=>m.user_id===me.id&&m.status==='active')?[room]:[]);
  }
  if(table==='room_members')return rows(me.role==='student'?members.filter(m=>m.user_id===me.id):members);
  if(table==='room_materials'){
   if(method==='POST'){materials.push({...body,id:uid(9),owner_id:me.id,hidden:false});return send(null);}
   return rows(materials.filter(m=>me.role!=='student'||!m.hidden));
  }
  if(table==='moderation_log')return rows([]);
  return send({message:'Unexpected fixture endpoint '+url.pathname},500);
 });
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/project/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.EGCSE_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const errors=[];
 try{
  const fresh=await browser.newContext({viewport:{width:1440,height:1000}}),p=await fresh.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.locator('.role-card').first().waitFor();assert.equal(await p.locator('.role-card').count(),3);
  await p.screenshot({path:path.join(out,'role-choice-desktop.png'),fullPage:true});
  await p.setViewportSize({width:390,height:900});await p.screenshot({path:path.join(out,'role-choice-mobile.png'),fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await p.locator('[data-role=teacher]').click();assert.equal(await p.locator('#auth-email').isDisabled(),true);
  await p.goto(base+'#moderator');assert.equal(await p.locator('.workspace').isVisible(),false);
  await fresh.close();console.log('PASS three-role entry, mobile layout, setup state and signed-out deep-link guard.');
  const ctx=await browser.newContext({viewport:{width:1440,height:1000}});await fixtures(ctx,base);const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  const login=async(role,email=role)=>{await page.goto(base);await page.locator(`[data-role=${role}]`).click();await page.locator('#auth-email').fill(email+'@example.test');await page.locator('#auth-password').fill('test-password-123');await page.locator('#auth-form button').click();};
  const signout=async()=>{await page.locator('#sign-out').click();await page.locator('.role-card').first().waitFor();};
  await login('moderator','student');await page.waitForFunction(()=>document.getElementById('auth-status').textContent.includes('student role'));assert.equal(await page.locator('.workspace').isVisible(),false);
  await page.locator('#back-roles').click();await page.locator('[data-role=student]').click();await page.locator('#reset-password').click();await page.locator('#auth-email').fill('student@example.test');await page.locator('#auth-form button').click();await page.waitForFunction(()=>document.getElementById('auth-status').textContent.includes('reset link'));assert.equal(recoveryRequests,1);
  await login('teacher','pending');await page.getByRole('heading',{name:'Your teacher request is waiting for approval'}).waitFor();assert.equal(await page.locator('.workspace').isVisible(),false);await page.locator('#gate-signout').click();await page.locator('.role-card').first().waitFor();
  await login('student','suspended');await page.getByRole('heading',{name:'Your account is suspended'}).waitFor();await page.locator('#gate-signout').click();await page.locator('.role-card').first().waitFor();
  await login('student');await page.locator('.subject-card').first().waitFor();
  assert.equal(await page.locator('[data-route=teacher]').isVisible(),false);assert.equal(await page.locator('[data-route=moderator]').isVisible(),false);
  await page.goto(base+'#moderator');await page.getByRole('heading',{name:'Access unavailable'}).waitFor();
  await page.goto(base+'#chapter/M01');await page.locator('#chapter-note').fill('STUDENT_ONE_PRIVATE_NOTE');await page.evaluate(()=>StudyProgress.flush());assert.equal(progress[uid(1)].notes.M01,'STUDENT_ONE_PRIVATE_NOTE');assert.equal(await page.locator('#reference-form').count(),0);
  await page.reload();await page.locator('#chapter-note').waitFor();assert.equal(await page.locator('#chapter-note').inputValue(),'STUDENT_ONE_PRIVATE_NOTE');
  await page.goto(base+'#rooms');await page.locator('#join-room input').fill(room.join_code);await page.locator('#join-room button').click();await page.waitForFunction(()=>document.getElementById('room-status')?.textContent.includes('Request sent'));
  await signout();await login('student','other');await page.goto(base+'#chapter/M01');await page.locator('#chapter-note').waitFor();assert.equal(await page.locator('#chapter-note').inputValue(),'');await signout();
  console.log('PASS wrong-role login, recovery request, pending/suspended gates, student controls and account isolation.');
  await login('teacher');await page.locator('#create-room').waitFor();await page.locator('[data-approve=true]').click();await page.locator('#room-detail').getByText('1 chapters reviewed', {exact:false}).waitFor();
  assert.equal(await page.locator('#main').textContent().then(t=>t.includes('STUDENT_ONE_PRIVATE_NOTE')),false);
  await page.locator('.publish-box summary').click();await page.locator('#publish-material [name=title]').fill('Practice fractions');await page.locator('#publish-material [name=chapter_id]').selectOption('M03');await page.locator('#publish-material [name=body]').fill('Try question 2. <img src=x onerror=alert(1)>');await page.locator('#publish-material [name=url]').fill('https://example.org/paper.pdf');await page.locator('#publish-material button').click();await page.locator('.room-material').waitFor();assert.equal(await page.locator('.room-material img').count(),0);
  await page.screenshot({path:path.join(out,'teacher-dashboard.png'),fullPage:true});
  await page.goto(base+'#moderator');await page.getByRole('heading',{name:'Access unavailable'}).waitFor();await signout();
  await login('student');await page.goto(base+'#rooms');await page.locator('.room-material').waitFor();assert.match(await page.locator('.room-material').textContent(),/Practice fractions/);assert.equal(await page.locator('#publish-material').count(),0);await signout();
  await login('moderator');await page.locator('#account-list').waitFor();assert.equal(await page.locator('#create-room').count(),0);await page.locator(`[data-account="${uid(4)}"][data-decision=approve_teacher]`).click();await page.waitForFunction(()=>!document.querySelector('[data-decision=approve_teacher]'));assert.equal(accounts.pending.role,'teacher');await page.locator('[data-material]').click();await page.waitForFunction(()=>document.querySelector('[data-material]')?.textContent.includes('Restore material'));
  await page.screenshot({path:path.join(out,'moderator-dashboard.png'),fullPage:true});
  await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await signout();await login('student');await page.goto(base+'#rooms');await page.getByRole('heading',{name:'Class materials & tasks'}).waitFor();assert.equal(await page.locator('.room-material').count(),0);
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS class admission, safe publishing, student reading, teacher approval, moderation and zero browser errors.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
