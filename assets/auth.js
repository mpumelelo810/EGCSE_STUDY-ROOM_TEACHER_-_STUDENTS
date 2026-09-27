/* Authentication is provided by Supabase; SQL policies enforce every permission. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const config=window.STUDY_BACKEND||{};
 const offline=window.STUDY_OFFLINE===true;
 const publicKey=k=>{if(typeof k!=='string')return false;if(k.startsWith('sb_publishable_'))return true;try{return JSON.parse(atob(k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}};
 const configured=!offline&&/^https:\/\/[^/]+$/.test(config.url||'')&&publicKey(config.publishableKey);
 let client=null,profile=null,selected='',mode='signin',error='',recovery=false,ready=false,revision=0;
 const listeners=new Set();
 const labels={student:'Student',teacher:'Teacher',moderator:'Study room moderator'};
 const currentURL=()=>location.origin+location.pathname;
 let transient={};
 const backing=k=>k.endsWith('-code-verifier')?localStorage:sessionStorage;
 const storage={getItem:k=>{try{return backing(k).getItem(k);}catch{return transient[k]??null;}},setItem:(k,v)=>{try{backing(k).setItem(k,v);}catch{transient[k]=v;}},removeItem:k=>{try{backing(k).removeItem(k);}catch{}delete transient[k];}};
 const notify=()=>listeners.forEach(fn=>fn());
 const active=()=>offline||(profile?.status==='active'&&!recovery);
 function render(){
  const gate=$('auth-gate'); if(!gate)return;
  document.body.classList.toggle('signed-out',!active());
  document.querySelector('.workspace').hidden=!active();document.querySelector('.sidebar').hidden=!active();
  gate.hidden=active();
  $('account-label').textContent=offline?'Offline student':profile?`${profile.display_name} · ${labels[profile.role]}`:'';
  $('sign-out').hidden=offline||!profile;
  document.querySelectorAll('[data-roles]').forEach(n=>n.hidden=offline||!active()||!n.dataset.roles.split(' ').includes(profile?.role));
  if(active())return;
  if(!ready){gate.innerHTML='<div class="auth-loading" role="status">Opening your study room…</div>';return;}
  const brand='<a class="auth-brand" href="#"><span class="brand-mark">Σ</span><span>EGCSE <small>THE STUDY ROOM</small></span></a>';
  if(profile&&profile.status!=='active'&&!recovery){
   gate.innerHTML=`${brand}<section class="auth-message"><span class="eyebrow">ACCOUNT STATUS</span><h1>${profile.status==='pending'?'Your teacher request is waiting for approval':'Your account is suspended'}</h1><p>${profile.status==='pending'?'A study room moderator will review your request before you can use teacher tools.':'Contact your study room moderator to review your access.'}</p><div class="actions"><button class="button" id="refresh-account">Check again</button><button class="button secondary" id="gate-signout">Sign out</button></div><p role="status">${esc(error)}</p></section>`;
   $('refresh-account').onclick=()=>refresh();$('gate-signout').onclick=signOut;return;
  }
  if(!selected&&!recovery){
   gate.innerHTML=`${brand}<p role="status">${esc(error)}</p><section class="auth-intro"><div class="eyebrow">ONE STUDY ROOM. YOUR OWN SPACE.</div><h1>How will you use<br><em>the study room?</em></h1><p>Choose your role to sign in and find the tools you need.</p></section><div class="role-grid">${[
    ['student','01','Learn at your pace','Study chapters, try questions and keep your own progress.'],
    ['teacher','02','Guide your learners','Create classes, share learning materials and follow class progress.'],
    ['moderator','03','Look after the room','Review teacher requests, manage access and moderate shared materials.']
   ].map(([role,num,title,copy])=>`<button class="role-card" data-role="${role}"><span class="role-number">${num}</span><h2>${labels[role]}</h2><strong>${title}</strong><p>${copy}</p><span class="role-action">Log in as ${role==='moderator'?'moderator':role} →</span></button>`).join('')}</div>${!configured?'<div class="account-setup" role="status"><strong>Online accounts are being set up.</strong><p>You can keep learning with the offline student edition.</p><a class="button secondary" href="EGCSE-Offline.html">Open offline student practice →</a></div>':''}<p class="auth-foot">Mathematics · Physical Science · EGCSE</p>`;
   gate.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{selected=b.dataset.role;error='';render();$('auth-email')?.focus();});return;
  }
  const signup=mode==='signup',reset=mode==='reset';
  const heading=recovery?'Set a new password':reset?'Reset your password':signup?`Create ${selected==='teacher'?'a teacher request':'your student account'}`:`${labels[selected]} login`;
  gate.innerHTML=`${brand}<section class="auth-form-wrap"><button class="button text" id="back-roles">← Choose a different role</button><div class="eyebrow">${recovery?'ACCOUNT RECOVERY':esc(labels[selected])}</div><h1>${heading}</h1><p>${signup&&selected==='teacher'?'Teacher access starts after moderator approval.':selected==='moderator'?'Use the moderator account assigned by the project owner.':'Your account decides which tools you can use.'}</p>
  ${!configured?'<div class="account-setup"><strong>Online login is not available yet.</strong><p>The project owner needs to connect the account service.</p><a href="EGCSE-Offline.html">Continue with offline student practice →</a></div>':''}
  <form id="auth-form"><fieldset ${!configured?'disabled':''}>${signup?'<label class="field"><span class="field-label">Your name</span><input id="auth-name" autocomplete="name" maxlength="100" required></label>':''}${!recovery?'<label class="field"><span class="field-label">Email address</span><input id="auth-email" type="email" autocomplete="username" required></label>':''}${!reset?`<label class="field"><span class="field-label">${recovery?'New p':'P'}assword</span><input id="auth-password" type="password" autocomplete="${signup||recovery?'new-password':'current-password'}" ${signup||recovery?'minlength="12"':''} maxlength="128" required></label>`:''}<button class="button" type="submit">${recovery?'Save password':reset?'Send reset link':signup?'Create account':'Sign in'}</button></fieldset></form><p id="auth-status" role="status" aria-live="polite">${esc(error)}</p>
  ${!recovery?`<div class="auth-switches">${selected!=='moderator'?`<button class="button text" id="switch-auth">${signup?'Already registered? Sign in':'New here? Create an account'}</button>`:''}<button class="button text" id="reset-password">${reset?'Back to sign in':'Forgot password?'}</button></div>`:''}</section>`;
  $('back-roles').onclick=()=>{selected='';mode='signin';error='';if(recovery){signOut();return;}render();};
  $('switch-auth')?.addEventListener('click',()=>{mode=signup?'signin':'signup';error='';render();});
  $('reset-password')?.addEventListener('click',()=>{mode=reset?'signin':'reset';error='';render();});
  $('auth-form').onsubmit=async e=>{
   e.preventDefault();if(!configured||!client)return;
   const button=e.target.querySelector('button');button.disabled=true;$('auth-status').textContent='Please wait…';
   try{
    const email=$('auth-email')?.value.trim(),password=$('auth-password')?.value;
    if(recovery){const r=await client.auth.updateUser({password});if(r.error)throw r.error;recovery=false;history.replaceState(null,'',currentURL());await signOut();return;}
    if(reset){const r=await client.auth.resetPasswordForEmail(email,{redirectTo:currentURL()+'?recovery=1'});if(r.error)throw r.error;$('auth-status').textContent='If the address is registered, a reset link will arrive by email. Open it in this browser.';return;}
    if(signup){
     if(!['student','teacher'].includes(selected))throw new Error('Moderator accounts are assigned by the project owner.');
     const r=await client.auth.signUp({email,password,options:{emailRedirectTo:currentURL(),data:{display_name:$('auth-name').value.trim(),requested_role:selected}}});if(r.error)throw r.error;
     if(!r.data.session){$('auth-status').textContent='Check your email to confirm your account. Open the link in this browser, then sign in.';return;}
    }else{
     const r=await client.auth.signInWithPassword({email,password});if(r.error)throw r.error;
    }
    await refresh(true);
   }catch(e){error=e.message||'Could not sign in. Please try again.';if($('auth-status'))$('auth-status').textContent=error;}
   finally{if(button.isConnected)button.disabled=false;}
  };
 }
 async function refresh(checkSelection=false){
  const n=++revision,previous=profile;
  try{
   const {data,error:e}=await client.auth.getUser();
   if(n!==revision)return;
   if(e||!data.user){
    if(e&&e.name!=='AuthSessionMissingError'&&![400,401,403].includes(e.status))throw e;
    profile=null;error=e?.name==='AuthSessionMissingError'?'':e?.message||'';
   }
   else{
    const result=await client.from('profiles').select('id,display_name,role,status,requested_role').eq('id',data.user.id).single();
    if(n!==revision)return;
    if(result.error)throw new Error('Could not load your account permissions. Please check the connection and try again.');
    if(checkSelection&&result.data.status==='active'&&selected&&result.data.role!==selected){
     const actual=result.data.role;await client.auth.signOut({scope:'local'});profile=null;error=`This account has the ${labels[actual].toLowerCase()} role. Choose that role to sign in.`;
    }else{profile=result.data;error='';}
   }
  }catch(e){
   if(n!==revision)return;profile=previous;error=e.message;
   if(previous){$('storage-warning').hidden=false;$('storage-warning').textContent='Could not refresh your account connection. Your current work is still open; reconnect to save or download a backup.';}
  }
  ready=true;render();notify();
 }
 async function signOut(){
  if(active()&&!offline){try{await window.StudyProgress?.flush();}catch{alert('Your latest work has not synced. Download a progress backup or reconnect before signing out.');return;}}
  revision++;profile=null;error='';selected='';mode='signin';recovery=false;ready=false;
  // Clear session-only drafts on a shared device, even if the network is down.
  try{Object.keys(sessionStorage).filter(k=>k.startsWith('egcse.draft.')).forEach(k=>sessionStorage.removeItem(k));}catch{}
  render();notify();
  if(client)await client.auth.signOut({scope:'local'}).catch(()=>{});
  storage.removeItem('egcse.auth.v1');storage.removeItem('egcse.auth.v1-code-verifier');location.replace(currentURL());
 }
 async function start(){
  $('sign-out').onclick=signOut;
  if(offline){profile={id:'offline',display_name:'Offline student',role:'student',status:'active'};ready=true;render();return;}
  render();
  if(!configured){ready=true;render();return;}
  if(!window.supabase?.createClient){ready=true;error='Account service could not load. Refresh to try again.';selected='student';render();return;}
  client=window.supabase.createClient(config.url,config.publishableKey,{auth:{storage,storageKey:'egcse.auth.v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  recovery=new URLSearchParams(location.search).get('recovery')==='1';
  client.auth.onAuthStateChange((event)=>{
   if(event==='PASSWORD_RECOVERY')recovery=true;
   if(event==='PASSWORD_RECOVERY'||event==='SIGNED_OUT'&&profile)setTimeout(()=>refresh(),0);
  });
  await refresh();
  // Re-check roles after returning to the tab; SQL checks remain authoritative.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&profile)refresh();});
 }
 window.StudyAuth={start,refresh,onChange:fn=>listeners.add(fn),active,render,signOut,esc,
  get client(){return client;},get profile(){return profile;},get offline(){return offline;},get configured(){return configured;},
  canTeach:()=>!offline&&active()&&profile?.role==='teacher',canModerate:()=>!offline&&active()&&profile?.role==='moderator',
  allowed:section=>active()&&(section!=='teacher'||profile?.role==='teacher')&&(section!=='moderator'||profile?.role==='moderator')&&(section!=='rooms'||!offline&&profile?.role==='student')
 };
})();
