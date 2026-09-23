'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const Q=require('../assets/generators.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/content.js'),'utf8'),context);
const C=context.window.STUDY_CONTENT;
test('all 53 chapters have generators, valid resources and genuine paper identifiers',()=>{
 assert.equal(C.lessons.length,53);assert.equal(Q.ids.length,53);
 assert.equal(C.lessons.filter(c=>c.branch==='maths').length,24);
 assert.equal(C.lessons.filter(c=>c.branch==='chemistry').length,14);
 assert.equal(C.lessons.filter(c=>c.branch==='physics').length,15);
 assert.deepEqual([...new Set(C.lessons.map(c=>c.id))].sort(),[...Q.ids].sort());
 for(const c of C.lessons){
  assert.ok(C.resources.some(r=>r.id===c.resource),c.id);
  for(const r of c.refs){assert.ok(C.papers.some(p=>p.id===r.paper));assert.ok(r.page>1);assert.ok(r.question);}
 }
});
test('26,500 variants have finite answers, working checks and different next questions',()=>{
 for(const id of Q.ids)for(let seed=1;seed<=500;seed++){
  const q=Q.generate(id,seed);
  assert.ok(q.question.length>10,id);assert.ok(q.steps.length>=3,id);
  assert.deepEqual(q,Q.generate(id,seed));
  assert.equal(Q.check(q,q.answer),true,id+' answer');
  if(q.type==='number'){
   assert.equal(Number.isFinite(q.answer),true,id);
   assert.equal(Q.check(q,q.answer+100),false,id+' wrong');
   assert.equal(Q.check(q,''),false,id+' blank');
  }else{
   assert.ok(q.options.includes(q.answer));
   assert.ok(q.options.length>=2);
   assert.equal(Q.check(q,q.options.find(a=>a!==q.answer)),false);
  }
  for(const s of q.steps)if(s.resource)assert.ok(C.resources.some(r=>r.id===s.resource),id+' refresher');
  assert.notEqual(Q.next(id,seed,q.question).question,q.question);
 }
});
test('independent arithmetic checks from generated question inputs',()=>{
 for(let seed=1;seed<=100;seed++){
  let q=Q.generate('M04',seed),n=q.question.match(/\d+(?:\.\d+)?/g).map(Number);
  assert.ok(Math.abs(q.answer-(n[1]-n[0])/n[0]*100)<1e-8);
  q=Q.generate('M12',seed);n=q.question.match(/\d+/g).map(Number);assert.equal(q.answer,n[2]/(n[0]*n[1]));
  q=Q.generate('M13',seed);n=q.question.match(/\d+/g).map(Number);assert.ok(Math.abs(Math.tan(q.answer*Math.PI/180)-n[0]/n[1])<1e-10);
  q=Q.generate('M14',seed);n=q.question.match(/\d+/g).map(Number);assert.equal((q.answer-n[0]+360)%360,180);
  q=Q.generate('C01',seed);n=q.question.match(/\d+(?:\.\d+)?/g).map(Number);assert.ok(Math.abs(q.answer-(n[1]-n[0]))<1e-10);
  q=Q.generate('C08',seed);n=q.question.match(/\d+(?:\.\d+)?/g).map(Number);assert.ok(Math.abs(q.answer*160-n[0])<1e-9);
  q=Q.generate('P04',seed);n=q.question.match(/\d+/g).map(Number);assert.equal(q.answer,n[0]*n[1]*n[2]);
  q=Q.generate('P09',seed);n=q.question.match(/\d+/g).map(Number);
  if(q.question.includes('parallel'))assert.ok(Math.abs(1/q.answer-(1/n[0]+1/n[1]))<1e-10);
  else assert.equal(q.answer,n[0]+n[1]);
  q=Q.generate('P14',seed);n=q.question.match(/\d+/g).map(Number);assert.equal(q.answer,n[0]/2**(n[2]/n[1]));
 }
});
test('numeric answers accept fractions, signed numbers and scientific notation without evaluating code',()=>{
 assert.equal(Q.parseNumber(' 3/4 '),.75);
 assert.equal(Q.parseNumber('−2.5'),-2.5);
 assert.equal(Q.parseNumber('1.5e3'),1500);
 for(const s of ['','1/0','Infinity','NaN','alert(1)','2+2','0;process.exit()'])assert.ok(Number.isNaN(Q.parseNumber(s)),s);
});
test('radioactivity and logic edge cases remain physically and logically meaningful',()=>{
 for(let s=1;s<=150;s++){
  const q=Q.generate('P12',s),[,gate,a,b]=q.question.match(/(AND|OR|NAND|NOR) gate receives A = (\d) and B = (\d)/);
  const and=Number(a==='1'&&b==='1'),or=Number(a==='1'||b==='1');
  assert.equal(q.answer,{AND:and,OR:or,NAND:1-and,NOR:1-or}[gate]);
  const p=Q.generate('M24',s);assert.ok(p.answer>0&&p.answer<1);
  assert.ok(Q.generate('P14',s).answer>0);
 }
});
test('displayed final answers follow the requested rounding',()=>{
 for(let seed=1;seed<=100;seed++){
  let q=Q.generate('M13',seed);assert.equal(q.display,q.answer.toFixed(1)+'°');
  q=Q.generate('M02',seed);assert.equal(q.display,q.answer.toFixed(2));
  q=Q.generate('P09',seed);
  assert.equal(q.display,(Number.isInteger(q.answer)?String(q.answer):q.answer.toFixed(3))+' Ω');
 }
});
