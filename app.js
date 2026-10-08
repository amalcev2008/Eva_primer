
const TELEGRAM_BOT_TOKEN = "8641422884:AAEoBSQ7X1ABMqwur3VuBaP-IAoWXNqGbSs";
const TELEGRAM_CHAT_ID = "322209589";
let balance=0,correctCount=0,wrongCount=0,answered=0,locked=true;
let phase='start',current=null,startPending=false,resultPending=false,resultSent=false,session=0;
let soundEnabled=true,audioContext;
const $=id=>document.getElementById(id);
const rnd=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function makeVariants(answer){let a=[answer];while(a.length<4){let n=answer+rnd(-10,10);if(n>=0&&!a.includes(n))a.push(n)}return shuffle(a)}
function showOnly(id){['startScreen','gameScreen','finalScreen'].forEach(s=>$(s).classList.toggle('hidden',s!==id))}
function showStart(){if(startPending||resultPending)return;phase='start';showOnly('startScreen')}
function status(id,text,kind=''){ $(id).textContent=text;$(id).className='telegram-status '+kind }
async function sendTelegram(text){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch('https://api.telegram.org/bot'+TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',body:new URLSearchParams({chat_id:TELEGRAM_CHAT_ID,text}),signal:controller.signal});
  let data;try{data=await response.json()}catch(e){throw new Error('network')}
  if(!response.ok||!data.ok){let e=new Error('telegram');e.code=data.error_code||response.status;e.retryAfter=data.parameters?.retry_after;throw e}
  if(!Number.isInteger(data.result?.message_id)||String(data.result?.chat?.id)!==TELEGRAM_CHAT_ID)throw new Error('network');
  return data.result;
 }finally{clearTimeout(timer)}
}
function telegramError(e){
 if(e.code===401||e.code===404)return 'Не удалось подключить бота. Попроси взрослого проверить токен.';
 if(e.code===400||e.code===403)return 'Бот не может написать в чат. Попроси взрослого открыть бота, нажать /start и проверить Chat ID.';
 if(e.code===429)return `Telegram просит подождать ${e.retryAfter||30} секунд. Затем попробуй ещё раз.`;
 return 'Ева включи VPN';
}
async function startGame(){
 if(startPending||resultPending)return;
 if(configError){status('startStatus',configError,'error');return;}
 if(!settings.enabled.length){status('startStatus','Включите хотя бы одну тему в файле settings.js.','error');return;}
 initAudio();startPending=true;showOnly('startScreen');phase='checking';$('startButton').disabled=true;
 status('startStatus','Проверяем связь с Telegram…');
 try{
  await sendTelegram('Ева начала решать');
  session++;balance=correctCount=wrongCount=answered=0;resultSent=false;resetDecks();phase='game';
  status('startStatus','✓ Telegram подтвердил отправку','ok');updateStats();showOnly('gameScreen');generateQuestion();playSound('start');
 }catch(e){phase='start';status('startStatus',telegramError(e),'error');$('startButton').textContent='Проверить ещё раз →'}
 finally{startPending=false;$('startButton').disabled=false}
}
function updateStats(){ $('balance').textContent=balance+' ₽';$('correctCount').textContent=correctCount;$('wrongCount').textContent=wrongCount }
function generateQuestion(){
 if(phase!=='game')return;locked=false;current=drawQuestion();currentReward=settings.reward;currentPenalty=settings.penalty;
 $('stepLabel').textContent=`Задание ${answered+1} · без ограничений`;$('category').textContent='✦ '+current.category;
 $('question').textContent=current.text;$('question').className=current.text.length>35?'story':'';
 $('message').textContent='';$('message').className='';$('nextButton').classList.add('hidden');
 $('answers').replaceChildren();makeVariants(current.answer).forEach(value=>{let b=document.createElement('button');b.className='answer';b.textContent=value+(current.unit?' '+current.unit:'');b.dataset.value=value;b.onclick=()=>checkAnswer(value,b);$('answers').appendChild(b)});
 const card=document.querySelector('.quiz-card');card.classList.remove('enter');void card.offsetWidth;card.classList.add('enter');
}
function checkAnswer(value,button){
 if(locked||phase!=='game')return;locked=true;answered++;
 const good=value===current.answer;balance+=good?currentReward:-currentPenalty;if(good)correctCount++;else wrongCount++;
 document.querySelectorAll('.answer').forEach(b=>{b.disabled=true;if(Number(b.dataset.value)===current.answer)b.classList.add('correct');else if(b===button)b.classList.add('wrong');else b.classList.add('dim')});
 $('message').className=good?'good':'bad';$('message').textContent=(good?`Верно! +${currentReward} ₽. `:`Пока не получилось. −${currentPenalty} ₽. `)+current.explanation;
 updateStats();playSound(good?'correct':'wrong');if(good){animateCoin();confetti(12)}
 $('nextButton').textContent='Следующее задание →';$('nextButton').classList.remove('hidden');$('nextButton').focus({preventScroll:true});
}
function nextQuestion(){if(!locked||phase!=='game')return;generateQuestion()}
function cashOut(){
 if(phase!=='game')return;phase='final';locked=true;$('finalMoney').textContent=balance+' ₽';$('finalStats').textContent=`Решено ${answered} · Верно: ${correctCount} · Ошибок: ${wrongCount}`;
 showOnly('finalScreen');playSound('finish');confetti(45);sendTelegramResult();
}
async function sendTelegramResult(){
 if(resultPending||resultSent||phase!=='final')return;resultPending=true;const ticket=session;
 $('retryResult').classList.add('hidden');document.querySelectorAll('#finalScreen button').forEach(b=>b.disabled=true);status('telegramStatus','Отправляем результат в Telegram…');
 try{await sendTelegram(`💰 Результат игры\n\nЕва заработала ${balance} ₽\n✅ Правильных ответов: ${correctCount}\n❌ Ошибок: ${wrongCount}\nРешено: ${answered}`);
 if(ticket===session){resultSent=true;status('telegramStatus','✓ Telegram подтвердил отправку результата','ok')}}
 catch(e){if(ticket===session){status('telegramStatus',telegramError(e)+'. Результат не подтверждён. При повторе возможен дубликат.','error');$('retryResult').classList.remove('hidden')}}
 finally{resultPending=false;document.querySelectorAll('#finalScreen button').forEach(b=>b.disabled=false)}
}
function animateCoin(){const c=$('coinFloat');c.classList.remove('show');void c.offsetWidth;c.classList.add('show')}
function confetti(count){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<count;i++){let el=document.createElement('i');el.className='confetti';el.style.setProperty('--x',rnd(2,98)+'vw');el.style.setProperty('--color',['#ae7bee','#f8cb6c','#7bceae','#ef92b8'][rnd(0,3)]);el.style.setProperty('--delay',rnd(0,300)+'ms');document.body.appendChild(el);setTimeout(()=>el.remove(),2300)}}
function initAudio(){try{if(!audioContext){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioContext=new AC()}if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{})}catch(e){}}
function toggleSound(){soundEnabled=!soundEnabled;$('soundButton').textContent=soundEnabled?'♫ Звук вкл.':'♪ Звук выкл.';$('soundButton').setAttribute('aria-pressed',soundEnabled);if(soundEnabled){initAudio();playSound('start')}}
function playSound(kind){if(!soundEnabled)return;try{initAudio();if(!audioContext)return;const notes={correct:[659,880,1175],wrong:[330,277],start:[523,659,784],finish:[523,659,784,1047]}[kind];notes.forEach((freq,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.12;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.26);o.onended=()=>{o.disconnect();g.disconnect()}})}catch(e){}}


const topics=Object.values(window.EVA_TOPICS||{});
const config=window.EVA_CONFIG;
const validMoney=n=>Number.isInteger(n)&&n>=0&&n<=1000;
const configError=!config||!validMoney(config.reward)||!validMoney(config.penalty)||!config.topics||topics.some(t=>typeof config.topics[t.id]!=='boolean')?'Проверьте файл settings.js: суммы от 0 до 1000, темы — true или false.':'';
const settings={enabled:topics.filter(t=>config?.topics?.[t.id]===true).map(t=>t.id),reward:config?.reward,penalty:config?.penalty};
let decks={},topicQueue=[],lastTopic=null,currentReward=2,currentPenalty=4;
const recentQuestions={},previousNumbers={};
function resetDecks(){decks={};topicQueue=[];lastTopic=null}
function drawQuestion(){
 if(!topicQueue.length){topicQueue=shuffle(settings.enabled.slice());if(topicQueue.length>1&&topicQueue[topicQueue.length-1]===lastTopic){[topicQueue[0],topicQueue[topicQueue.length-1]]=[topicQueue[topicQueue.length-1],topicQueue[0]]}}
 const id=topicQueue.pop();lastTopic=id;const topic=topics.find(t=>t.id===id);
 if(!decks[id]?.length)decks[id]=shuffle(topic.questions.slice());
 const slot=decks[id].pop();const history=recentQuestions[id]||(recentQuestions[id]=[]);
 let question,numbers;
 for(let attempt=0;attempt<2000;attempt++){
  question=topic.generate(rnd);numbers=(question.text.match(/\d+/g)||[]).join(',');
  if(!history.includes(question.text)&&numbers!==previousNumbers[slot.id])break;
 }
 previousNumbers[slot.id]=numbers;history.push(question.text);if(history.length>300)history.shift();
 return {...question,id:slot.id};
}
$('gameRules').textContent=configError||`Играй сколько захочешь! Включено тем: ${settings.enabled.length}. За правильный ответ +${settings.reward} ₽, за ошибку −${settings.penalty} ₽.`;
if(configError||!settings.enabled.length){$('startButton').disabled=true;status('startStatus',configError||'Включите хотя бы одну тему в файле settings.js.','error')}
