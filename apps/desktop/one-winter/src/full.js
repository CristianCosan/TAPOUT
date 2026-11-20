// ---------- the full game (D-135, Sir 2026-11-19 "I want everything back fully") ----------
// Sir's rules run the run: v12 and every change he made since, from rules.js (window.TAPOUT). This
// part of the page only draws what the run says and sends clicks back. It decides nothing. The
// function declarations below replace the One Winter ones of the same name above.
const T=window.TAPOUT,SES=T.session;
const noEmo=s=>String(s==null?'':s).replace(/(\d)\s*⚡/g,'$1 energy').replace(/[\p{Extended_Pictographic}️‍]/gu,'').replace(/[ \t]{2,}/g,' ').replace(/^\s+|\s+$/g,'');
const inert=h=>noEmo(h).replace(/\sonclick="/g,' data-handler="');
let V=null,VW=null,OWX=null,PENDFLY=false,V12M=false,LASTRES=0,ENDSHOWN=false;
// One Winter's own things kept next to the run: the map, felled trees, the walk-in, seasons and winters.
function loadX(){try{return JSON.parse(localStorage.getItem('oneWinter.x')||'null')}catch(e){return null}}
function saveX(){try{localStorage.setItem('oneWinter.x',JSON.stringify(OWX))}catch(e){}}
const WXMAP={clear:'clear',overcast:'over',rain:'over',cold:'clear',snow:'snow',storm:'storm'};
// Sir's v12 sections, in his order. Hunt chain and Recover & call show everywhere.
const SECTIONS={camp:[['Fire & food',['a-fire','a-friction','a-firenoferro','a-boil','a-cook','a-smoke','a-smokeHuge','a-woodCamp','a-wood','a-rocks','a-dropoff']],
    ['Build & craft',['a-shelter','a-dugout','a-insulate','a-firepit','a-rack','a-hugeRack','a-cache','a-jug','a-picker','a-campSnares','a-stove','a-reflector','a-shingles','a-snowWall']],
    ['Gear & repairs',['a-sharpenAxe','a-maintainFerro','a-haftAxe','a-repairBoots','a-patchRoof','a-poultice']],
    ['Comforts',['a-flute','a-chair','a-table','a-bed','a-confess','a-treemark','a-feedjay','a-wash','a-letterPartner','a-letterParents']]],
  shore:[['Fishing',['a-lines','a-iceLine','a-iceFish','a-checkIce','a-iceCache','a-moveLine','a-net','a-deploynet','a-checkShore']],['Shoreline',['a-fetch','a-rocks','a-clay','a-stream']]],
  woods:[['Food',['a-forage','a-snare','a-moveSnare','a-checkTraps']],['The hunt',['a-scout']],['Materials',['a-wood','a-firewood','a-moss']]],
  all:[['Hunt chain',['a-follow','a-shot','a-trail','a-carve','a-haul','a-invest']],['Recover & call',['a-tinder','a-call','a-music','a-rest','a-sitwatch','a-poultice']]]};
// Places in the picture, each holding the actions done there. Clicking one opens them.
const SPOTS={camp:{fire:['a-fire','a-friction','a-firenoferro','a-boil','a-cook','a-firepit','a-stove','a-reflector','a-jug'],pot:['a-boil','a-cook'],
    shelter:['a-shelter','a-dugout','a-insulate','a-bed','a-shingles','a-snowWall','a-patchRoof','sleep','early'],pile:['a-woodCamp','a-wood','a-rocks','a-dropoff','a-sharpenAxe','a-haftAxe'],
    rack:['a-rack','a-hugeRack','a-smoke','a-smokeHuge','a-campSnares'],cache:['a-cache'],stump:['a-chair','a-table','a-flute','a-picker','a-maintainFerro','a-repairBoots','a-poultice','a-music'],
    crate:['a-confess','a-treemark','a-letterPartner','a-letterParents','a-feedjay','a-wash'],pack:['pack']},
  shore:{rock:['a-rocks','a-clay','a-iceFish','a-checkIce','a-iceCache'],line:['a-lines','a-iceLine','a-moveLine','a-net','a-deploynet','a-checkShore'],drift:['a-fetch','a-stream'],bush:['a-tinder']},
  woods:{deadfall:['a-firewood','a-wood'],snares:['a-snare','a-moveSnare','a-checkTraps'],snag:['a-forage','a-moss','a-tinder'],tree:['a-wood']}};
const SPOTNAME={fire:'The fire',pot:'The pot',shelter:'Your shelter',pile:'Woodpile',rack:'Smoking rack',cache:'Food cache',stump:'The stump',crate:'Camera crate',pack:'Your pack',rock:'The rocks',line:'Lines and net',drift:'The water',bush:'The bushes',deadfall:'Deadfall',snares:'Snare runs',snag:'Old snag',tree:'Spruce'};
const PATHS={'a-shelter':'shelter','a-dugout':'dugout','a-firepit':'firepit','a-rack':'rack','a-cache':'cache'};
const entryMap=()=>{const m=new Map();(VW?VW.panel:[]).forEach(e=>m.set(e.id,e));
  const h=VW&&VW.hud,ht=id=>h&&h.get(id)?noEmo(String(h.get(id).html||(h.get(id).text??'')).replace(/<[^>]+>/g,'')):'';
  if(h){m.set('sleep',{id:'sleep',label:'Sleep',onclick:'actSleep()',loc:'all',visible:true,enabled:!(h.get('sleepBtn')||{}).disabled&&!V.over,detail:ht('sleep-sub')});
    m.set('early',{id:'early',label:ht('early-label')||'Turn in early',onclick:'actTurnInEarly()',loc:'all',visible:!(h.get('earlyBtn')||{}).hidden,enabled:!V.over,detail:ht('early-sub')});
    m.set('pack',{id:'pack',label:'Open your pack',onclick:'',loc:'camp',visible:true,enabled:true,detail:'What you carry, what you wear, food and water.'})}
  return m};
function blankS(){return{day:1,hour:6,site:'camp',shelter:0,fire:0,wood:0,fish:0,hares:0,hips:4,snares:0,caught:0,lines:[{n:'',set:false,fish:0},{n:'',set:false,fish:0}],deadfall:N.deadfall,pitch:0,
  felled:OWX?OWX.felled:[],flags:OWX?OWX.flags:{},mapSeed:OWX?OWX.mapSeed:1,rivals:new Array(9).fill(''),wx:['over'],temps:[10],iceDay:999,phase:'day',over:false,log:[],story:[],items:[],turn:0,
  season:OWX?OWX.season:1,winter:OWX?OWX.winter:WINTERS[0].id,mods:seasonMods(OWX?OWX.season:1),offer:[]}}
function shelterLevel(){return V.dugout?1:Math.max(0,Math.min(3,V.structure|0))}
function syncS(){VW=SES.getView();V=VW?VW.state:null;if(!S)S=blankS();if(!V)return;
  const d=V.day;S.day=d;S.hour=V.hour;S.site=V.loc;S.over=!!V.over;S.shelter=shelterLevel();const late=V.lateBuilt||[];S.b={st:V.structure|0,dug:V.dugout|0,pit:V.firepitTier|0,rack:V.rackTier|0,cache:V.cacheTier|0,bed:!!V.bed,refl:late.includes('reflector')};S.fire=V.fireH||0;
  S.wood=Math.round((V.stock.wood||0)+(V.stock.firewood||0));S.fish=Math.min(4,V.smoked|0);S.hares=0;S.hips=4;
  S.snares=Math.min(3,(V.snareList||[]).length);S.caught=0;
  const ls=(V.lineList||[]).slice(0,2).map(l=>({n:String(l.spotId||'line'),set:true,fish:0}));while(ls.length<2)ls.push({n:'',set:false,fish:0});S.lines=ls;
  S.wx=[];S.temps=[];S.wx[d-1]=WXMAP[V.weather]||'over';S.temps[d-1]=Math.round(T.ambientTempC());S.iceDay=T.iceCm()>0?1:999;
  S.rivals=new Array(Math.max(0,V.rivals|0)).fill('');if(!OWX.deck){OWX.deck=owDeck();OWX.used=[];OWX.events=[]}S.deck=OWX.deck;S.used=OWX.used;S.events=OWX.events;S.felled=OWX.felled;S.flags=OWX.flags;S.mapSeed=OWX.mapSeed;S.season=OWX.season;S.winter=OWX.winter;S.phase='day';
  S.log=(V.log||[]).slice(0,2).reverse().map(l=>noEmo(l.msg))}
const vDusk=()=>V?T.duskHour():N.dusk0;
// ---------- start of a run ----------
function owDeck(){return shuffle(['cache','wolves','moose','aurora','boots','kerry','dream','flare','mouse','snareNight','ice','dream2','owl','radio','fever','stars','wolverine','fire2','thaw',...['lynx','plane','chocolate','silence'].filter(()=>R()<.35)])}
function newRun(){const L=levelPick();OWX={mapSeed:1+(R()*999983|0),felled:[],flags:{},season:L.season,winter:L.winter,deck:owDeck(),used:[],events:[]};S=blankS();V=null;VW=null;ENDSHOWN=false}
// Sir 2026-11-19: start with the standard ten; later kit opens by how a run went, about one or two
// after a first run, a third now and then, a fourth only if you play for it. Every requirement shows.
const KIT_UNLOCK={rations:{how:'Reach day 6 in a run.',test:v=>v.day>=6},
  tarp:{how:'Finish the framed hut in a run.',test:v=>(v.structure|0)>=2},
  net:{how:'Land 6 fish in one run.',test:v=>((v.tot.lines|0)+(v.tot.net|0))>=6},
  knife:{how:'Bring down big or medium game with the bow in a run.',test:v=>(v.tot.animalsKilled|0)>=1},
  salt:{how:'Smoke meat twice in one run.',test:v=>(v.tot.smoked|0)>=2},
  shovel:{how:'Finish the timber shelter in a run.',test:v=>(v.structure|0)>=3},
  soap:{how:'Reach day 15 in a run.',test:v=>v.day>=15}};
const kitName=k=>k.label,kitDo=k=>{const t=noEmo(k.has);return t.charAt(0).toUpperCase()+t.slice(1)+'.'};
// ---------- harder levels after a win (D-136, Sir chose "Yes, as harder levels after a win") ----------
// A normal run is season 1 in an ordinary winter and stays pure v12. Each win opens the next season (up to 6).
// Only effects the full game can carry are used; their numbers ride on the run as state.level.
const LV_SEASONS=[
  {t:'Season 1',d:'A normal winter.',m:{}},
  {t:'Season 2 · Early winter',d:'Every day is 3 °C colder.',m:{temp:-3}},
  {t:'Season 3 · Lean shore',d:'Also: fish bite less on lines and the net.',m:{temp:-3,fish:-.08}},
  {t:'Season 4 · Hungry woods',d:'Also: snares catch less.',m:{temp:-3,fish:-.08,snare:-.06}},
  {t:'Season 5 · The long dark',d:'Also: every night costs 2 morale.',m:{temp:-3,fish:-.08,snare:-.06,nightMorale:2}},
  {t:'Season 6 · The North',d:'Also: 5 °C colder in all, and every night costs 3 morale.',m:{temp:-5,fish:-.08,snare:-.06,nightMorale:3}}];
const LV_WINTERS=[
  {id:'plain',t:'An ordinary winter',d:'Cold, then colder.',m:{}},
  {id:'mild',t:'A slow start',d:'The first week is 4 °C milder. From day 12 it is 3 °C colder.',m:{mild:true}},
  {id:'snowy',t:'A snowy winter',d:'Hare tracks are easy to read, so snares catch more.',m:{snare:.06}},
  {id:'windy',t:'A windy winter',d:'Chop on the lake, so fish bite more.',m:{fish:.05}}];
function levelPick(){const mx=Math.max(1,Math.min(6,META.maxSeason|0||1)),p=META.level||{};
  return {season:Math.max(1,Math.min(mx,p.season|0||1)),winter:LV_WINTERS.some(w=>w.id===p.winter)&&mx>1?p.winter:'plain'}}
function levelOf(season,winter){const a=(LV_SEASONS[season-1]||LV_SEASONS[0]).m,b=(LV_WINTERS.find(w=>w.id===winter)||LV_WINTERS[0]).m;
  if(season<=1&&winter==='plain')return null;const m={season,winter};
  ['temp','fish','snare','nightMorale'].forEach(k=>{const v=(a[k]||0)+(b[k]||0);if(v)m[k]=Math.round(v*100)/100});if(b.mild)m.mild=true;return m}
const levelName=()=>{const L=V&&V.level;if(!L)return '';const w=LV_WINTERS.find(x=>x.id===L.winter);return (LV_SEASONS[L.season-1]||LV_SEASONS[0]).t.split(' · ')[0]+(w&&w.id!=='plain'?' · '+w.t.toLowerCase():'')};
function levelRows(){const mx=Math.max(1,Math.min(6,META.maxSeason|0||1));if(mx<2)return null;const p=levelPick();
  const box=document.createElement('div');box.className='levels';
  const row=(label,items,cur,set)=>{const h=document.createElement('p');h.innerHTML=`<b>${label}</b>`;box.appendChild(h);const g=document.createElement('div');g.className='kit';box.appendChild(g);
    items.forEach(it=>{const b=btn(`<b>${it.t}</b><small>${it.d}</small>`,()=>{set(it);g.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on')},'choice'+(it.key===cur?' on':''));g.appendChild(b)})};
  row('Season',LV_SEASONS.slice(0,mx).map((x,i)=>({...x,key:i+1})),p.season,it=>{META.level={...levelPick(),season:it.key};saveMeta(META)});
  row('Kind of winter',LV_WINTERS.map(x=>({...x,key:x.id})),p.winter,it=>{META.level={...levelPick(),winter:it.key};saveMeta(META)});
  return box}
function intro(){current=ensureScene('camp');refresh();if(!META.kit)META.kit={runs:0,open:[]};
  if(SES.hasSave()&&!intro.skipSaved){let day='';try{const s=JSON.parse(localStorage.getItem('oneWinter.x')||'null');if(s&&s.day)day=' '+s.day}catch(e){}
    cardEl.innerHTML=`<p class="k">HOLDOUT</p><h2>Your run is waiting</h2><p>Pick up where you left it.</p>`;
    cardEl.appendChild(btn(`Continue day${day}`,()=>{startSound();resume()},'go'));
    cardEl.appendChild(btn('Start a new run',()=>{intro.skipSaved=true;SES.abandonRun();newRun();intro();prefetch()},'choice'));openModal();return}
  const K=META.kit,std=T.KIT_POOL.filter(k=>k.std),opt=T.KIT_POOL.filter(k=>!k.std),open=opt.filter(k=>K.open.includes(k.id)),locked=opt.filter(k=>!K.open.includes(k.id));
  const choose=open.length>0,pick=new Set(std.map(k=>k.id)),best=META.best;
  cardEl.innerHTML=`<p class="k">HOLDOUT · Day 1${best?` · your best: day ${best.day}`:''}</p><h2>The boat leaves at dawn</h2><p>Ten people on ten stretches of shore, nobody in sight of anyone. Last one in wins $400,000.</p><p><b>${choose?`Pick ${PICK} for your pack.`:'Your pack: the standard ten.'}</b></p>`;cardEl.classList.add('wide');
  const grid=document.createElement('div');grid.className='kit';cardEl.appendChild(grid);
  const go=btn('Start the run',()=>{startRun([...pick])},'go');
  const upd=()=>{go.disabled=pick.size!==PICK;go.textContent=pick.size===PICK?'Start the run':pick.size<PICK?`Pick ${PICK-pick.size} more`:`Take ${pick.size-PICK} out`};
  [...std,...open].forEach(k=>{const b=btn(`${kitIcon(k.id)}<b>${kitName(k)}</b><small>${kitDo(k)}</small>`,()=>{if(!choose)return;if(pick.has(k.id))pick.delete(k.id);else pick.add(k.id);b.classList.toggle('on',pick.has(k.id));upd()},'choice'+(pick.has(k.id)?' on':''));if(!choose)b.disabled=false;grid.appendChild(b)});
  upd();const lr=levelRows();if(lr)cardEl.appendChild(lr);cardEl.appendChild(go);
  if(locked.length){const d=document.createElement('details');d.className='past';d.open=K.runs===0;
    d.innerHTML=`<summary>More kit to earn (${locked.length})</summary><ol>${locked.map(k=>`<li><b>${kitName(k)}</b>: ${KIT_UNLOCK[k.id]?KIT_UNLOCK[k.id].how:'Keep playing.'} <span class="muted">${kitDo(k)}</span></li>`).join('')}</ol>`;cardEl.appendChild(d)}
  const H=META.kit.history||[];if(H.length){const d=document.createElement('details');d.className='past';
    d.innerHTML=`<summary>Your past runs (${H.length})</summary><ol>${H.map(h=>`<li><b>Day ${h.day}</b> · ${h.title}</li>`).join('')}</ol>`;cardEl.appendChild(d)}
  openModal()}
function startRun(kit){startSound();closeModal();const L=levelPick();OWX.season=L.season;OWX.winter=L.winter;SES.newRun(kit,String(OWX.mapSeed));
  const lv=levelOf(L.season,L.winter);if(lv){SES.getView().state.level=lv;SES.click('hideModal()')}syncS();saveX();refresh();
  const first=[[`Day 1`,`${hhmm(V.hour)} · ${WXL()} · ${LEFT()}`]];if(lv)first.push([levelName(),'']);
  startCine(()=>flyover(first,()=>refresh()))}
// v12's 'cold' weather drains warmth but does not lower the thermometer; above 5 °C it reads as a raw chill (Build 0.0.61).
const WXL=()=>{if(!V)return'';const t=Math.round(T.ambientTempC()),W=T.WEATHER_TEXT;let l=noEmo(T.WEATHER[V.weather].label);if(W&&t>W.coldSnapAtOrBelow)l=l.replace(W.coldSnap,W.rawChill);return l+' · '+deg(t)};
function resume(){if(!SES.continueRun()){intro.skipSaved=true;newRun();intro();return}OWX=loadX()||{mapSeed:1+(R()*999983|0),felled:[],flags:{},season:1,winter:WINTERS[0].id};
  delete OWX.flags.introStage;S=blankS();syncS();closeModal();refresh();onView();
  if(!VW.modal&&!VW.endScreen)flyover([[`Day ${V.day}`,`${hhmm(V.hour)} · ${WXL()} · ${LEFT()}`]],()=>refresh())}
function save(){if(OWX){if(V)OWX.day=V.day;saveX()}}
// ---------- everything the run says, drawn ----------
let OWCARD=false,NIGHTCH=0;
// sirNights (Sir 2026-11-20): at midnight there is no choice. Dan walks back to the shelter on his own, the words on
// screen, and only then does the run go to sleep.
function bedCine(){if(CINE)return;closeModal();V12M=false;const from=V.loc,txt='With the last bits of energy you drag your tired body back to the shelter and fall asleep.';
  const steps=[];if(from!=='camp')steps.push({sx:-60,k:'Midnight',t:()=>txt,dur:3.5});
  steps.push({site:'camp',from:from==='shore'?1500:from==='woods'?110:P.x,sx:SP.camp.shelter[0]+40,k:'Midnight',t:()=>txt,dur:5});
  P.face=-1;CINE={i:-1,b:0,steps,locked:true,done:()=>SES.click('hideModal(); forcedSleep()')};music.mood('night');cineEl.hidden=false;$('game').classList.add('cine');$('cineSkip').hidden=true;nextCine()}
function onView(){const before=S?S.day:0;syncS();if(!V)return;
  if(VW.modal&&/forcedSleep\(\)/.test(VW.modal)){refresh();if(!CINE)bedCine();return}if(V.day>before&&before>0){PENDFLY=true;NIGHTCH=0}
  if(VW.modal&&PENDFLY&&(VW.modal.match(/onclick=/g)||[]).length>=2&&VW.modal!==onView.last)NIGHTCH++;onView.last=VW.modal;
  if(OWCARD&&VW.endScreen)OWCARD=false;if(OWCARD&&!VW.modal){refresh();save();return}
  refresh();save();
  if(VW.modal){showV12()}else if(V12M){V12M=false;closeModal()}
  if(VW.result&&VW.result.id!==LASTRES&&!VW.modal){LASTRES=VW.result.id;popResult(VW.result)}
  if(VW.endScreen&&!VW.modal){if(!ENDSHOWN)showEnd();return}
  if(PENDFLY&&!VW.modal&&!FLY&&!CINE){if(!NIGHTCH&&OWX.cardDay!==V.day&&!V.over){OWX.cardDay=V.day;saveX();if(showOWCard())return}PENDFLY=false;dayFly()}}
SES.subscribe(()=>{if(OWX)onView()});
const LEFT=(n)=>`${n===undefined?V.rivals:n} remaining`;
// Sir's approved flyover (11-17): the count as it was, each rival who tapped out, then the new count.
function dayFly(){const out=(V.rivalOrder||[]).filter(r=>r.day===V.day);const lines=[[`Day ${V.day}`,`${hhmm(V.hour)} · ${WXL()} · ${LEFT(V.rivals+out.length)}`]];
  if(out.length){out.forEach(r=>lines.push([r.name,'tapped out']));lines.push([LEFT(),''])}
  if(T.iceCm()>0)lines.push(['Ice on the lake',Math.round(T.iceCm())+' cm']);
  if(V.weather==='storm')lines.push(['A storm today','']);
  closeModal();music.mood('day');flyover(lines,()=>refresh())}
const STORENAME={wood:'logs',raw:'raw water',water:'clean water'};
const POPBARS={energy:'energy',health:'health',hunger:'food',thirst:'water',warmth:'warmth',morale:'morale',stress:'stress'};
function popResult(r){const at=[P.x,P.y-210],parts=[];Object.entries(r.bars||{}).forEach(([k,d])=>{d=Math.round(d);if(d&&POPBARS[k])parts.push({t:`${d>0?'+':'−'}${Math.abs(d)} ${POPBARS[k]}`,good:k==='stress'?d<0:d>0})});
  Object.entries(r.stores||{}).forEach(([k,d])=>{d=Math.round(d);k=k.replace(/^inv-/,'');k=STORENAME[k]||k;if(d)parts.push({t:`${d>0?'+':'−'}${Math.abs(d)} ${k}`,good:d>0})});
  parts.filter(p=>p.good).slice(0,5).forEach((p,i)=>pops.push({x:at[0],y:at[1]-i*38,t:p.t,b:performance.now()/1000+i*.12,good:p.good}))}
function showV12(){V12M=true;const html=inert(VW.modal);
  if(cardEl.dataset.v!==html){cardEl.classList.remove('wide');cardEl.innerHTML=`<div class="v12">${html}</div>`;cardEl.dataset.v=html}
  for(const [id,el] of VW.elements){if(id.startsWith('end'))continue;const n=cardEl.querySelector('#'+CSS.escape(id));if(!n)continue;
    if(el.innerHTML)n.innerHTML=inert(el.innerHTML);else if(el.textContent)n.textContent=noEmo(el.textContent)}
  cardEl.querySelectorAll('.mbtn').forEach(b=>b.classList.add('choice'));music.mood(V.hour>=vDusk()||V.hour<T.dawnHour()?'night':'day');openModal()}
cardEl.addEventListener('click',e=>{const t=e.target.closest('[data-handler]');if(!t||t.disabled)return;e.preventDefault();sfx('step');cardEl.dataset.v='';SES.click(t.getAttribute('data-handler'))});
function showEnd(){ENDSHOWN=true;const el=id=>VW.elements.get(id)||{},tx=id=>noEmo(el(id).textContent||''),hx=id=>inert(el(id).innerHTML||'');
  const K=META.kit||(META.kit={runs:0,open:[]});K.runs++;
  const fresh=T.KIT_POOL.filter(k=>!k.std&&!K.open.includes(k.id)&&KIT_UNLOCK[k.id]&&KIT_UNLOCK[k.id].test(V));fresh.forEach(k=>K.open.push(k.id));
  const best=META.best,isBest=!best||V.day>best.day;if(isBest)META.best={day:V.day,place:best?best.place:10};
  K.history=[{day:V.day,title:tx('endTitle')||'Run over'},...(K.history||[])].slice(0,10);saveMeta(META);try{localStorage.removeItem('oneWinter.x')}catch(e){}
  let lvUp='';if(V.cause==='win'){const mx=Math.max(1,META.maxSeason|0||1);if(mx<6){META.maxSeason=mx+1;saveMeta(META);const nx=LV_SEASONS[mx];lvUp=`<p style="color:var(--fire)">A harder level is open: <b>${nx.t}</b>. ${nx.d} Pick it, and a kind of winter, before your next run.</p>`}}
  const unl=lvUp+fresh.map(k=>`<p style="color:var(--fire)">New kit unlocked: <b>${kitName(k)}</b>. ${kitDo(k)}</p>`).join('');
  cardEl.classList.remove('wide');cardEl.dataset.v='';
  cardEl.innerHTML=`<p class="k">HOLDOUT · Day ${V.day}${isBest?' · your best yet':''}</p><h2>${tx('endTitle')}</h2><p>${tx('endCause')}</p>${unl}<div class="v12 end">${hx('endEpilogue')}${hx('endStats')}</div>`;
  const b=btn('Play again',()=>{SES.leaveRun();newRun();intro();prefetch()},'go');cardEl.appendChild(b);openModal();b.focus()}
// ---------- One Winter's own night cards and day events, next to Sir's (D-135, Sir chose "Keep both") ----------
// A One Winter night card comes on a morning when Sir's own night brought no choice. Its numbers land on the
// run's own bars: Warmth on warmth, Food on food, Body on health, Will on morale; wood is firewood, a fish 2 meat, a hare 3.
const owWords=t=>String(t).replace(/\bWill\b/g,'Morale').replace(/\bBody\b/g,'Health');
const meatNow=()=>(V.meatQ||[]).reduce((a,e)=>a+(e.n||0),0);
function owStats(){S.warmth=V.warmth;S.food=V.hunger;S.body=V.health;S.will=V.morale;S.wood=V.stock.firewood|0;const m=meatNow();S.fish=m>=2?1:0;S.hares=m>=5?1:0;S.hung=(V.cacheTier|0)>0;S.ankle=0;S.caught=0;S.snares=Math.min(3,(V.snareList||[]).length);S.caughtHares=V.tot.snared|0}
function owApply(fn){owStats();const b={w:S.warmth,f:S.food,h:S.body,m:S.will,wd:S.wood,fi:S.fish,ha:S.hares};const text=fn();
  const c=(k,d)=>{if(d)V[k]=clamp(Math.round((V[k]+d)*10)/10,0,100)};c('warmth',S.warmth-b.w);c('hunger',S.food-b.f);c('health',S.body-b.h);c('morale',S.will-b.m);
  V.stock.firewood=Math.max(0,(V.stock.firewood|0)+Math.round(S.wood-b.wd));
  const meat=(S.fish-b.fi)*2+(S.hares-b.ha)*3;if(meat>0){V.meatQ.push({n:meat,abs:V.day*24+V.hour});V.tot.food+=meat}
  else if(meat<0){let n=-meat;while(n>0&&V.meatQ.length){const e=V.meatQ[0],t=Math.min(e.n,n);e.n-=t;n-=t;if(e.n<=0)V.meatQ.shift()}}
  SES.click('hideModal()');return owWords(text)}
function owCardHtml(k,title,text){cardEl.classList.remove('wide');cardEl.dataset.v='';cardEl.innerHTML=`<p class="k">${k}</p><h2>${title}</h2><p>${owWords(text)}</p>`}
function showOWCard(){owStats();const id=pickCard(),card=CARDS[id];OWX.deck=S.deck;OWX.used=S.used;if(!card)return false;OWCARD=true;saveX();
  owCardHtml(`Night ${V.day-1}`,card.title,card.text());
  card.choices.forEach(ch=>{const d=typeof ch.d==='function'?ch.d():ch.d;const b=btn(`<b>${ch.t}</b><small>${owWords(d)}</small>`,()=>{
      if(ch.tap){OWCARD=false;closeModal();SES.click('confirmTapOut()');return}
      const tx=owApply(()=>ch.run());cardEl.innerHTML=`<p class="k">Night ${V.day-1}</p><p>${tx}</p>`;const g=btn('Start the day',()=>{OWCARD=false;closeModal();onView()},'go');cardEl.appendChild(g);openModal();g.focus()},'choice'+(ch.danger?' danger':''));
    if(ch.can&&!ch.can())b.disabled=true;cardEl.appendChild(b)});openModal();return true}
function maybeEvent(){if(!V||V.over||VW.modal||OWCARD||!modalEl.hidden||OWX.evDay===V.day||V.hour>=vDusk()-1||R()>=.3)return;owStats();
  const ids=Object.keys(EVENTS).filter(id=>EVENTS[id].site===V.loc&&!OWX.events.includes(id)&&(!EVENTS[id].when||EVENTS[id].when()));if(!ids.length)return;
  const id=ids[R()*ids.length|0],ev=EVENTS[id];OWX.evDay=V.day;OWX.events.push(id);saveX();OWCARD=true;
  owCardHtml(`Day ${V.day} · ${SCENES[V.loc].name}`,ev.title,ev.text);
  ev.choices.forEach(ch=>cardEl.appendChild(btn(`<b>${ch.t}</b><small>${owWords(ch.d)}</small>`,()=>{const tx=owApply(()=>ch.run());OWCARD=false;closeModal();log(tx);refresh()},'choice')));openModal()}
function endRun(){if(V&&!V.over)SES.click('confirmTapOut()')}
function morning(){}
function after(){refresh()}
// ---------- the picture: places you can click ----------
function rebuildActions(){Object.keys(ACTIONS).forEach(k=>delete ACTIONS[k]);
  Object.entries(SPOTS).forEach(([site,spots])=>Object.entries(spots).forEach(([spot,ids])=>{ACTIONS[site+':'+spot]={site,spot,ids,name:()=>SPOTNAME[spot]||spot}}))}
rebuildActions();
function avail(id){const a=ACTIONS[id];if(!a||!V)return null;const m=entryMap(),es=a.ids.map(i=>m.get(i)).filter(e=>e&&e.visible);if(!es.length)return null;return es.some(e=>e.enabled)?true:noEmo(es[0].detail)}
function canNow(){return true}
function spotOf(id){const a=ACTIONS[id];if(!a||!a.spot||!S||a.site!==S.site)return null;
  if(a.spot==='tree'){if(S.site!=='woods')return null;const i=S.target!=null?S.target:standing()[0];if(i==null)return null;const t=sideTreeOf(i);return[t.x,t.b-t.h*.35,Math.max(40,t.h*.25)]}
  if(a.spot==='cache'){const c=SP.camp.cache;return[c[0],c[1]-34,62]}
  if(a.spot==='line'){const l=SP.shore.lines;return[(l[0][0]+l[1][0])/2+40,(l[0][1]+l[1][1])/2-40,110]}
  return sideSpot(a.spot)}
function doAction(id){if(!S||!V||S.over||!modalEl.hidden||FLY||CINE)return;const a=ACTIONS[id];if(!a||a.site!==S.site)return;
  const s=spotOf(id);if(s)walkTo(s);spotCard(a)}
function travel(site){if(!V||V.over||!modalEl.hidden||V.loc===site||FLY||CINE)return;const t=VW.hud.get('tab-'+site);if(t&&t.disabled)return;sfx('step');SES.click(`goTo('${site}')`);if(V.loc===site&&!VW.modal)setTimeout(maybeEvent,900)}
function treeClick(i){if(!S||!V||S.over||!modalEl.hidden||FLY||CINE)return;
  if(S.site==='woods'){const e=entryMap().get('a-wood');if(!e||!e.visible){log('The axe stays in the belt. Logs come later.');return}S.target=i;
    if(!e.enabled){log(noEmo(e.detail));return}const t=sideTreeOf(i);if(t){walkTo([t.x,t.b,40]);P.work=1.3}const w0=V.stock.wood+V.carry.wood;runEntry(e);
    if(VW&&VW.state.stock.wood+VW.state.carry.wood>w0&&!OWX.felled.includes(i)){OWX.felled.push(i);saveX();refresh()}return}
  const t=sideScene(S.site).mid[i];if(t)walkTo([t.x,t.b,40]);log(S.site==='camp'?'You leave it standing. The trees around camp keep the wind off you.':'Spruce, too far from camp to drag.')}
function log(t){logEl.innerHTML=`<p>${noEmo(t)}</p>`}
function runEntry(e){if(!e||!V||V.over)return;if(!e.enabled){log(noEmo(e.detail));return}
  if(e.id==='pack'){packCard();return}
  const path=PATHS[e.id],plan=path&&T.upgradePath(path);if(plan&&T.jobPlan){const nx=plan.steps.find(s=>s.state==='next');if(nx&&T.jobPlan(`${path}.${nx.step}`)){buildCard(path,e);return}}
  if(e.id==='a-insulate'&&T.jobPlan(`a-insulate.${(V.insulation|0)+1}`)){jobCard(`a-insulate.${(V.insulation|0)+1}`,noEmo(e.label),e);return}
  if(T.jobPlan&&T.jobPlan(e.id)){jobCard(e.id,noEmo(e.label),e);return}
  P.work=1.3;sfx(/wood|fell|firewood/i.test(e.onclick)?'chop':'step');closeModal();SES.click(e.onclick)}
function entryBtn(e){const b=btn(`<b>${noEmo(e.label)}</b>${e.detail?`<small>${noEmo(e.detail)}</small>`:''}`,()=>{closeModal();runEntry(e)},'choice');b.disabled=!e.enabled;return b}
function spotCard(a){const m=entryMap(),es=a.ids.map(i=>m.get(i)).filter(e=>e&&e.visible);if(!es.length)return;
  if(es.length===1&&es[0].id!=='pack'&&!PATHS[es[0].id]){runEntry(es[0]);return}if(es[0].id==='pack'){packCard();return}
  cardEl.classList.remove('wide');cardEl.dataset.v='';cardEl.innerHTML=`<p class="k">${SCENES[S.site].name} · ${clockStr()}</p><h2>${a.name()}</h2>`;
  es.forEach(e=>cardEl.appendChild(entryBtn(e)));cardEl.appendChild(btn('Back',closeModal,'go'));openModal()}
// Sir's builds (rc.4, rc.8): each step is a few small jobs, one click each, paid as you go.
function buildCard(path,e){const U=T.UPGRADE_TEXT,p=T.upgradePath(path),nx=p.steps.find(s=>s.state==='next');cardEl.classList.remove('wide');cardEl.dataset.v='';
  const names=U.names[path],steps=U.steps[path];
  cardEl.innerHTML=`<p class="k">${U.routes[path].title} · ${clockStr()}</p><h2>${names[p.current]}</h2><p>${U.about[path][p.current]}</p>
   <p class="night">${p.steps.map(s=>s.state==='built'?'■':s.state==='next'?'▣':'□').join(' ')}</p>
   ${nx?`<p><b>${U.stepOf(nx.step,p.steps.length,steps[nx.step-1]||'')}</b><br><span class="muted">${Object.entries(nx.needs).map(([m,n])=>`${n} ${m}`).join(', ')||'no materials'} · ${nx.energy} energy · ${durStr(nx.hours)}</span></p>`:`<p>${U.done}</p>`}
   ${p.settling?`<p class="muted">${U.settling}</p>`:''}`;
  if(nx){const key=`${path}.${nx.step}`;const b=btn(`<b>${(T.jobPlan(key)||{}).done>0?U.resume(steps[nx.step-1]):U.go(steps[nx.step-1])}</b>`,()=>jobCard(key,steps[nx.step-1],e),'choice');b.disabled=!(T.jobPlan(key)||{}).open;if(b.disabled&&e.detail)b.innerHTML+=`<small>${noEmo(e.detail)}</small>`;cardEl.appendChild(b)}
  cardEl.appendChild(btn('Back',closeModal,'go'));openModal()}
function jobCard(key,name,e){const spec=T.BUILD_TASKS[key],plan=T.jobPlan(key);if(!spec||!plan){closeModal();SES.click(e.onclick);return}
  const done=plan.done,job=plan.jobs[done];cardEl.classList.remove('wide');cardEl.dataset.v='';
  cardEl.innerHTML=`<p class="k">${name} · ${clockStr()}</p><ol class="story">${spec.jobs.map((j,i)=>`<li style="opacity:${i<done?.45:1}">${i<done?'Done: ':''}${j}${i===done&&job?` <span class="muted">· ${Object.entries(job.needs).map(([m,n])=>`${n} ${m}`).join(', ')}${Object.keys(job.needs).length?' · ':''}${job.energy} energy · ${durStr(job.hours)}</span>`:''}</li>`).join('')}</ol>`;
  const go=btn(`<b>${spec.jobs[done]}</b>`,()=>{const d0=V.day,a0=JSON.stringify(V.acts);P.work=1.3;sfx(spec.motion==='chop'?'chop':'step');SES.click(`actJob('${key}')`);
    if(VW.modal||VW.endScreen||V.day!==d0)return;const p2=T.jobPlan(key);if(p2&&p2.done>done&&p2.done<p2.of)jobCard(key,name,e);else if(JSON.stringify(V.acts)!==a0||!p2)closeModal();else jobCard(key,name,e)},'choice');
  go.disabled=!plan.open;cardEl.appendChild(go);cardEl.appendChild(btn('Stop for now',closeModal,'go'));openModal()}
function packCard(){const h=VW.hud,ht=id=>h.get(id)?noEmo(carryWords(String(h.get(id).html||(h.get(id).text??'')).replace(/<[^>]+>/g,''))):'';cardEl.classList.remove('wide');cardEl.dataset.v='';
  cardEl.innerHTML=`<p class="k">Your pack · ${clockStr()}</p><h2>What you have</h2>
   <div class="stats"><span>Logs<b>${ht('inv-wood')}</b></span><span>Firewood<b>${ht('inv-firewood')}</b></span><span>Moss<b>${ht('inv-moss')}</b></span><span>Tinder<b>${ht('inv-tinder')}</b></span>
   <span>Rocks<b>${ht('inv-rocks')}</b></span><span>Clay<b>${ht('inv-clay')}</b></span><span>Meat<b>${ht('inv-meat')}</b></span><span>Arrows<b>${ht('inv-arrows')}</b></span></div>
   <p class="muted">Kit: ${T.KIT_POOL.filter(k=>hasKit(k.id)).map(k=>{const w=(V.gear||{})[k.id],I=T.INVENTORY_TEXT;return k.label+(w!==undefined&&I?` (${I.condition(w)})`:'')}).join(', ')}</p>`;
  const eat=[['eatBerriesBtn','eatBerries()','Eat berries'],['eatCookedBtn','eatCooked()','Eat a cooked meal'],['eatSmokedBtn','eatSmoked()','Eat smoked meat'],['drinkBtn','actDrink()','Drink clean water']];
  eat.forEach(([id,on,t])=>{const x=h.get(id);if(!x||x.hidden)return;const b=btn(`<b>${t}</b><small>${ht(id)}</small>`,()=>{closeModal();sfx('step');SES.click(on)},'choice');b.disabled=x.disabled||V.over;cardEl.appendChild(b)});
  const r=T.rationsLeft?T.rationsLeft():0;if(r>0)cardEl.appendChild(btn(`<b>Eat a ration</b><small>${r} left · +20 food</small>`,()=>{closeModal();SES.click('eatRation()')},'choice'));
  if(T.wearing)['jacket','shell'].forEach(g=>{const on=T.wearing(g);cardEl.appendChild(btn(`<b>${on?'Take off':'Put on'} the ${g==='jacket'?'thick jacket':'rain shell'}</b><small>${on?'You have it on.':'In the pack.'} A minute.</small>`,()=>{closeModal();SES.click(`wear('${g}')`)},'choice'))});
  cardEl.appendChild(btn('Close the pack',closeModal,'go'));openModal()}
const hasKit=id=>V.kit instanceof Set?V.kit.has(id):Array.isArray(V.kit)?V.kit.includes(id):!!(V.kit&&V.kit[id]);
function shelterCard(){spotCard(ACTIONS['camp:shelter'])}
// ---------- the screen around the picture ----------
const OPEN={};
const BARS=[['energy','Energy','#E0B050'],['health','Health','#7F9DAD'],['hunger','Food','#A7AC98'],['thirst','Water','#6F9FC0'],['warmth','Warmth','#D07A2C'],['morale','Morale','#E4E7E3'],['stress','Stress','#9C6B8E']];
// First-run tips (Playtest 2: fading tips for discoverability). Each shows once, says how the screen works and
// never what to do next; Settings or "No more tips" turns them off.
Object.assign(TIPS,{
  start:'Last one in wins. Your actions are in the list on the right: click a group to open it, or click things in the picture. Every action takes time and energy.',
  places:'Camp, Shore and Woods are along the top (or press C, S, W). Walking there takes time.',
  bars:'Food, water and warmth fall by the hour. If health runs out, the run ends.',
  pack:'Your pack at camp holds your food, water and clothes. Click it to look inside.'});
function hintFor(){if(!V||V.over||META.tipsOff||FLY||CINE||VW.modal||OWCARD)return null;const no=k=>!(META.tipsSeen||[]).includes(k);
  if(no('start'))return 'start';
  if(no('places')&&(V.day>1||V.hour>=7))return 'places';
  if(no('bars')&&(V.hunger<50||V.thirst<50||V.warmth<50))return 'bars';
  if(no('pack')&&V.loc==='camp'&&(V.day>1||V.hour>=9))return 'pack';
  return null}
setInterval(()=>{if(modalEl.hidden)showHint()},1500);
// v12's carry chip names the load by emoji only; say it in words, as the rest of the screen does.
const CARRYW={'\u{1FAB5}':'logs','\u{1FAA8}':'rocks','\u{1F33F}':'moss','\u{1F9F1}':'clay'};
const carryWords=t=>t.replace(/(\u{1FAB5}|\u{1FAA8}|\u{1F33F}|\u{1F9F1})\s*(\d+\/\d+)/gu,(m,e,n)=>n+' '+CARRYW[e]).replace(/\u{1F33F}\u00D7(\d+)/gu,'insulated ×$1');
function refresh(){if(!S)return;current=ensureScene(S.site);
  const gctx=$('ground').getContext('2d');gctx.drawImage(drawSideBg(S.site),0,0);drawSideProps(gctx);
  if(!V){$('cDay').textContent='DAY 1 · 6:00';$('cWx').textContent='';$('cFc').textContent='';$('rivals').innerHTML='';hud.innerHTML='';$('gear').innerHTML='';acts.innerHTML='';$('map').innerHTML='';return}
  const h=VW.hud,ht=id=>h.get(id)?noEmo(carryWords(String(h.get(id).html||(h.get(id).text??'')).replace(/<[^>]+>/g,''))):'';
  $('cDay').textContent=`DAY ${V.day} · ${hhmm(V.hour)}`;$('cWx').textContent=WXL();$('cFc').textContent=ht('chip-wet')+' · '+ht('pillWeight');
  {const a=T.dawnHour(),b=vDusk()+1.5,el=$('cSlots');el.innerHTML=`<b style="width:${clamp((V.hour-a)/(b-a),0,1)*100}%"></b><u style="left:${(vDusk()-a)/(b-a)*100}%"></u>`}
  $('rivals').innerHTML=`<b>${V.rivals}</b> ${V.rivals===1?'rival':'rivals'} left`;$('rivals').hidden=false; // Sir 11-19: "show"
  const mp=$('map');mp.innerHTML='';['camp','shore','woods'].forEach(k=>{const b=document.createElement('button');b.type='button';b.textContent=SCENES[k].name;if(k===V.loc)b.className='here';
    const tb=h.get('tab-'+k);b.disabled=k===V.loc||!!(tb&&tb.disabled)||V.over;b.title=ht('tt-'+k)+` (${k[0].toUpperCase()})`;b.onclick=()=>travel(k);mp.appendChild(b)});
  const bar=(k,n,c)=>{const v=k==='energy'?V.energy/V.maxEnergy*100:V[k],val=k==='energy'?ht('val-energy'):Math.round(V[k]),low=k==='stress'?v>75:v<25;
    return `<div class="row${low?' low':''}"><span>${n}</span><div class="bar"><span style="width:${clamp(v,0,100)}%;--c:${c}"></span></div><b>${val}</b></div>`};
  const chips=[ht('chip-fire'),ht('chip-shelter'),!(h.get('chip-injury')||{}).hidden?ht('chip-injury'):'',!(h.get('chip-wolf')||{}).hidden?ht('chip-wolf'):'',ht('conditionChips'),ht('carryChips'),ht('gearChips')].filter(Boolean);
  hud.innerHTML=BARS.map(([k,n,c])=>bar(k,n,c)).join('')+`<p class="chips">${chips.join(' · ')}</p>`;
  const ic=(k,n,title,off)=>`<span class="${off?'off':''}" title="${title}"><svg viewBox="0 0 24 24">${ICONS[k]}</svg>${n?`<i>${n}</i>`:''}</span>`;
  const food=[['eatBerriesBtn','eatBerries()','Berries'],['eatCookedBtn','eatCooked()','Meal'],['eatSmokedBtn','eatSmoked()','Smoked'],['drinkBtn','actDrink()','Water']];
  $('gear').innerHTML=`<div class="inv">${ic('wood',V.stock.wood,'Logs: '+V.stock.wood,!V.stock.wood)}${ic('fire',S.fire>0?Math.ceil(S.fire)+'h':0,S.fire>0?`Fire: about ${Math.ceil(S.fire)} more hours`:'Fire: out',!(S.fire>0))}</div>
    <div class="eat">${food.map(([id,on,t])=>{const x=h.get(id);if(!x||x.hidden)return'';return `<button type="button" data-on="${on}" ${x.disabled||V.over?'disabled':''} title="${ht(id)}">${t} <b>${(ht(id).match(/\d+(\/\d+)?/)||[''])[0]}</b></button>`}).join('')}</div>`;
  $('gear').querySelectorAll('button[data-on]').forEach(b=>b.onclick=()=>{if(!modalEl.hidden||FLY||CINE)return;sfx('step');SES.click(b.dataset.on)});
  // the actions: Sir's sections, one open at a time
  const m=entryMap(),loc=V.loc,secs=[...(SECTIONS[loc]||[]),...SECTIONS.all].map(([t,ids])=>[t,ids.map(i=>m.get(i)).filter(e=>e&&e.visible)]).filter(([,es])=>es.length);
  const hunt=secs.find(([t])=>t==='Hunt chain');if(hunt)OPEN[loc]='Hunt chain';
  if(!secs.some(([t])=>t===OPEN[loc]))OPEN[loc]=(secs.find(([,es])=>es.some(e=>e.enabled))||secs[0]||[''])[0];
  acts.innerHTML=`<h3>${SCENES[loc].name} · ${hhmm(V.hour)}</h3>${ht('signsLine')&&loc!=='camp'?`<p class="signs">${ht('signsLine')}</p>`:''}`;
  secs.forEach(([t,es])=>{const hd=document.createElement('button');hd.type='button';hd.className='sec'+(OPEN[loc]===t?' on':'');hd.innerHTML=`${t}<span>${es.filter(e=>e.enabled).length}/${es.length}</span>`;hd.onclick=()=>{OPEN[loc]=OPEN[loc]===t?'':t;refresh()};acts.appendChild(hd);
    if(OPEN[loc]!==t)return;es.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='act';b.dataset.id=e.id;b.innerHTML=`<b>${noEmo(e.label)}</b>${e.detail?`<small>${noEmo(e.detail)}</small>`:''}`;b.disabled=!e.enabled||V.over;b.onclick=()=>{if(!modalEl.hidden||FLY||CINE)return;runEntry(e)};acts.appendChild(b)})});
  const night=document.createElement('div');night.className='night';[['sleep','Sleep'],['early','Turn in early']].forEach(([id,t])=>{const e=m.get(id);if(!e||!e.visible)return;const b=document.createElement('button');b.type='button';b.className='act';b.innerHTML=`<b>${t}</b><small>${noEmo(e.detail)}</small>`;b.disabled=!e.enabled;b.onclick=()=>{if(!modalEl.hidden||FLY||CINE)return;runEntry(e)};night.appendChild(b)});
  const tp=document.createElement('button');tp.type='button';tp.className='act phone';tp.innerHTML='<b>Sat phone</b>';tp.disabled=!!(h.get('tapBtn')||{}).disabled||V.over;tp.onclick=()=>{if(!modalEl.hidden||FLY||CINE)return;SES.click('confirmTapOut()')};night.appendChild(tp);acts.appendChild(night);
  [...acts.querySelectorAll('.act')].slice(0,9).forEach((b,i)=>b.dataset.k=i+1);
  logEl.innerHTML=S.log.map(l=>`<p>${l}</p>`).join('')}
/*FULL-END*/
