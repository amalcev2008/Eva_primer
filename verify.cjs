const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app.js','utf8');
const nodes=new Map();function element(){return {addEventListener(){},value:'',textContent:'',className:'',style:{setProperty(){}},dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},focus(){},remove(){}}}
const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,querySelector(){return element()},querySelectorAll(sel){return sel==='.answer'?doc.getElementById('answers').children:sel==='#topicSettings input:checked'?doc.getElementById('topicSettings').children.map(r=>r.children[0]).filter(i=>i.checked):[]},body:element()};
let calls=0,mode='ok';
const ctx=vm.createContext({document:doc,localStorage:{getItem(){return null},setItem(k,v){this.saved=v}},window:{matchMedia:()=>({matches:true})},setTimeout,clearTimeout,AbortController,URLSearchParams,fetch:async(url,opts)=>{calls++;assert.equal(opts.method,'POST');if(mode==='network')throw new TypeError('offline');if(mode==='403')return {ok:false,status:403,json:async()=>({ok:false,error_code:403})};if(mode==='bad')return {ok:true,json:async()=>({ok:true,result:{}})};return {ok:true,json:async()=>({ok:true,result:{message_id:42,chat:{id:322209589}}})}}});
vm.runInContext(fs.readFileSync('settings.js','utf8'),ctx);
for(const file of fs.readdirSync('questions'))vm.runInContext(fs.readFileSync('questions/'+file,'utf8'),ctx);
vm.runInContext(source,ctx);
const run=s=>vm.runInContext(s,ctx);

(async()=>{
 assert(!source.includes('localStorage'));assert(!source.includes('openSettings'));
 const topics=run('topics');assert.equal(topics.length,10);
 for(const topic of topics){assert.equal(topic.questions.length,100);assert.equal(new Set(topic.questions.map(q=>q.text)).size,100)}
 let slots=new Map(),recent=new Map(),names=new Set();
 for(let i=0;i<10000;i++){
 const q=run('drawQuestion()');const nums=q.text.match(/\d+/g).join(',');
 assert.notEqual(nums,slots.get(q.id));slots.set(q.id,nums);
 const history=recent.get(q.category)||[];assert(!history.includes(q.text));history.push(q.text);if(history.length>300)history.shift();recent.set(q.category,history);
 assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<=1000);assert(q.explanation.length>0);
 for(const name of ['Ева','Артур','Алина','Саша','Алла','Олег','Ира','Дима'])if(q.text.includes(name))names.add(name);
 const choices=run('makeVariants('+q.answer+')');assert.equal(new Set(choices).size,4);assert(choices.includes(q.answer));
 }
 assert.equal(names.size,8);
 for(const m of ['network','403','bad']){mode=m;await run('startGame()');assert.equal(run('phase'),'start')}
 mode='ok';await run('startGame()');assert.equal(run('phase'),'game');
 for(let i=0;i<25;i++){run('checkAnswer(current.answer,document.getElementById("answers").children.find(b=>Number(b.dataset.value)===current.answer))');run('checkAnswer(current.answer,document.getElementById("answers").children[0])');run('nextQuestion()')}
 assert.equal(run('balance'),50);assert.equal(run('answered'),25);assert.equal(run('phase'),'game');
 run('checkAnswer(-1,document.getElementById("answers").children[0])');assert.equal(run('balance'),46);
 run('cashOut()');await new Promise(r=>setTimeout(r,0));assert.equal(run('resultSent'),true);
 const before=calls;await run('sendTelegramResult()');assert.equal(calls,before);
 console.log('PASS: 1000 regenerated samples, 10000 random questions, changed numbers on repeated slots, no recent duplicates, all 8 names, endless play, rewards and Telegram mocks. No real messages sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
