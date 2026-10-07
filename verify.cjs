const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();function element(){return {textContent:'',className:'',style:{setProperty(){}},dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},focus(){},remove(){}}}
const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,querySelector(){return element()},querySelectorAll(sel){return sel==='.answer'?doc.getElementById('answers').children:[]},body:element()};
let calls=0,mode='ok';
const ctx=vm.createContext({document:doc,window:{matchMedia:()=>({matches:true})},setTimeout,clearTimeout,AbortController,URLSearchParams,fetch:async(url,opts)=>{calls++;assert.equal(opts.method,'POST');if(mode==='network')throw new TypeError('offline');if(mode==='403')return {ok:false,status:403,json:async()=>({ok:false,error_code:403})};if(mode==='bad')return {ok:true,json:async()=>({ok:true,result:{}})};return {ok:true,json:async()=>({ok:true,result:{message_id:42,chat:{id:322209589}}})}}});
vm.runInContext(source,ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 for(let i=0;i<1000;i++){const test=run('makeTest()');assert.equal(test.length,10);assert.equal(new Set(test.map(q=>q.category)).size,10);for(const q of test){assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<=1000);const a=run(`makeVariants(${q.answer})`);assert.equal(new Set(a).size,4);assert(a.includes(q.answer));}}
 for(const m of ['network','403','bad']){mode=m;await run('startGame()');assert.equal(run('phase'),'start');assert(doc.getElementById('startStatus').textContent.length>0)}
 mode='ok';await run('startGame()');assert.equal(run('phase'),'game');assert.equal(run('answered'),0);
 for(let i=0;i<10;i++){run('checkAnswer(current.answer, document.getElementById("answers").children.find(b=>Number(b.dataset.value)===current.answer))');run('checkAnswer(current.answer, document.getElementById("answers").children[0])');assert.equal(run('answered'),i+1);if(i<9)run('nextQuestion()')}
 assert.equal(run('balance'),20);assert.equal(doc.getElementById('progressBar').style.width,'100%');run('nextQuestion()');await new Promise(r=>setTimeout(r,0));assert.equal(run('phase'),'final');assert.equal(run('resultSent'),true);let before=calls;await run('sendTelegramResult()');assert.equal(calls,before);
 await run('startGame()');run('checkAnswer(-1,document.getElementById("answers").children[0])');assert.equal(run('balance'),-4);mode='network';run('cashOut()');await new Promise(r=>setTimeout(r,0));assert.equal(run('resultSent'),false);mode='ok';await run('sendTelegramResult()');assert.equal(run('resultSent'),true);
 console.log('PASS: 1000 mixed tests, 10000 answer sets, Telegram success/network/403/malformed response, double answer protection, 10-question completion, balance, result retry and duplicate guard. No real Telegram messages sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
