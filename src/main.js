import './styles.css';
import './pwa.js';

const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='flowtime_demo_v1';
const seed=()=>({user:null,subj:['Cálculo','Programación','Bases de datos'],
 acts:[{id:1,t:'Taller de derivadas',s:'Cálculo',p:30},{id:2,t:'Proyecto API REST',s:'Programación',p:55},{id:3,t:'Modelo entidad-relación',s:'Bases de datos',p:10}],
 ses:[],cur:null,brk:null,last:null,nid:10});
let S;
try{S=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){S=seed()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let tab='sesion',lyric='';

const fmt=ms=>{const s=Math.max(0,Math.floor(ms/1000));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
 return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')};
const mins=ms=>Math.round(ms/60000);
const suggest=m=>m<25?5:m<50?10:m<90?15:20;
const act=id=>S.acts.find(a=>a.id==id);
const col=s=>{let x=0;for(const c of String(s))x=(x*31+c.charCodeAt(0))%6;return `hsl(${[150,95,38,15,175,60][x]} 55% 40%)`};

function render(){
 const app=$('#app');
 if(!S.user){
  app.innerHTML=`<div class="card login hero"><h1>🌲 Flowtime</h1><p class="mut">Estudia el tiempo que tu concentración aguante. Descansa cuando la necesites.</p>
  <label for="n">Nombre</label><input id="n" placeholder="Tu nombre">
  <label for="e">Correo</label><input id="e" type="email" placeholder="correo@universidad.edu">
  <p class="note">Prototipo de demostración: no hay servidor, los datos quedan en este navegador.</p>
  <button class="btn" id="go" style="width:100%;margin-top:10px">Entrar</button></div>`;
  $('#go').onclick=()=>{const n=$('#n').value.trim();if(!n){$('#n').focus();return}S.user=n;save();render()};
  return;
 }
 const tabs=[['sesion','Sesión'],['acts','Actividades'],['hist','Historial'],['stats','Estadísticas']];
 const hr=new Date().getHours(),gr=hr<12?'Buenos días':hr<19?'Buenas tardes':'Buenas noches';
 app.innerHTML=`<header><div class="av">${esc(S.user.trim()[0].toUpperCase())}</div><div class="hi"><small>${gr}</small><b>${esc(S.user)}</b></div><button class="out" id="out">Salir</button></header>
 <nav aria-label="Secciones">${tabs.map(t=>`<button data-t="${t[0]}" class="${tab==t[0]?'on':''}"${tab==t[0]?' aria-current="page"':''}>${ICO[t[0]]}<span>${t[1]}</span></button>`).join('')}</nav><main id="v"></main>`;
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render();scrollTo(0,0)});
 $('#out').onclick=()=>{S.user=null;save();render()};
 ({sesion:vSesion,acts:vActs,hist:vHist,stats:vStats})[tab]();
}
const ic=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO={sesion:ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),acts:ic('<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10"/>'),hist:ic('<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4M12 8v4l3 2"/>'),stats:ic('<path d="M5 20V10M12 20V4M19 20v-7"/>')};
const ring=(goal,brk)=>`<div class="ringwrap"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="tr" cx="100" cy="100" r="88"/><circle class="pg" id="rg" data-goal="${goal}" cx="100" cy="100" r="88" transform="rotate(-90 100 100)"/></svg><div class="timer${brk?' brk':''}" id="tm" role="timer">00:00</div></div>`;
const empty=(e,t)=>`<div class="empty"><b>${e}</b>${t}</div>`;
let selId=null;

/* ---------- Sesión ---------- */
function vSesion(){
 const v=$('#v');
 if(S.cur){
  const a=act(S.cur.actId);
  v.innerHTML=`<div class="card center hero"><span class="tag" style="--c:${col(a.s)}">${esc(a.s)}</span><h2 style="margin-top:10px">${esc(a.t)}</h2>
  ${ring(0,false)}<p class="mut">Sin límite: termina cuando notes que pierdes el foco.</p>
  <div class="acts"><button class="btn" id="fin">Finalizar sesión</button></div></div>`;
  $('#fin').onclick=()=>{const end=Date.now(),d=end-S.cur.start;
   const ss={id:S.nid++,actId:S.cur.actId,start:S.cur.start,end,dur:d,brk:0};S.ses.push(ss);S.last=ss.id;S.cur=null;lyric='';save();render()};
  tick();return;
 }
 if(S.last){
  const ss=S.ses.find(x=>x.id==S.last),a=act(ss.actId),sug=suggest(mins(ss.dur));
  if(S.brk){
   v.innerHTML=`<div class="card center hero"><h2>Descanso</h2>${ring(sug*60000,true)}
   <p class="mut">Sugerido: ${sug} min · trabajaste ${mins(ss.dur)} min</p>
   <div class="acts"><button class="btn warn" id="eb">Terminar descanso</button></div></div>${songCard(a)}`;
   $('#eb').onclick=()=>{stopSpeak();ss.brk=Date.now()-S.brk.start;S.brk=null;S.last=null;save();render()};
   tick();bindSong(a);return;
  }
  v.innerHTML=`<div class="card center hero"><h2>Sesión guardada ✓</h2><p>Estudiaste <b>${fmt(ss.dur)}</b> en «${esc(a.t)}».</p>
  <p class="mut">Descanso sugerido: <b>${sug} minutos</b></p>
  <div class="acts"><button class="btn warn" id="sb">Iniciar descanso</button><button class="btn sec" id="sk">Omitir descanso</button></div></div>${songCard(a)}`;
  $('#sb').onclick=()=>{readPrefs();S.brk={start:Date.now()};save();if(S.auto){lyric=makeLyric(a,S.style||'rap',S.kw);playSong(lyric)}render()};
  $('#sk').onclick=()=>{stopSpeak();S.last=null;save();render()};
  bindSong(a);return;
 }
 if(!S.acts.length){v.innerHTML=`<div class="card">${empty('📚','Aún no tienes actividades.')}<div class="acts" style="margin-top:0"><button class="btn" id="ga">Crear actividad</button></div></div>`;
  $('#ga').onclick=()=>{tab='acts';render()};return}
 const t0=new Date();t0.setHours(0,0,0,0);
 const td=S.ses.filter(x=>x.start>=t0.getTime()),tm=mins(td.reduce((a,x)=>a+x.dur,0));
 if(!S.acts.some(a=>a.id==selId))selId=S.acts[0].id;
 v.innerHTML=`<div class="card center hero"><h2>${S.ses.length?'Sigue con tu ritmo':'Empieza tu primera sesión'}</h2><p class="mut">Sin cronómetro fijo: tú decides cuándo parar.</p>
 <div class="mini"><div><b>${td.length}</b><span>sesiones hoy</span></div><div><b>${tm}</b><span>min hoy</span></div></div></div>
 <div class="card"><h2>¿Qué vas a estudiar?</h2><div class="pick">${S.acts.map(a=>`<label class="opt"><input type="radio" name="sel" value="${a.id}"${a.id==selId?' checked':''}><span class="dot" style="background:${col(a.s)}"></span><span class="t"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></span><span class="pc">${a.p}%</span></label>`).join('')}</div>
 <button class="btn lg" id="st">Iniciar sesión</button></div>`;
 document.querySelectorAll('input[name=sel]').forEach(r=>r.onchange=()=>{selId=+r.value});
 $('#st').onclick=()=>{S.cur={actId:selId,start:Date.now()};save();render()};
}
let iv;
function tick(){
 clearInterval(iv);
 const f=()=>{const el=$('#tm');if(!el){clearInterval(iv);return}
  const e=Date.now()-(S.cur?S.cur.start:S.brk.start);el.textContent=fmt(e);
  const r=$('#rg');if(r){const g=+r.dataset.goal,p=g?Math.min(1,e/g):(e%60000)/60000;r.style.transition=g?'':'none';r.style.strokeDashoffset=553*(1-p)}};
 f();iv=setInterval(f,500);
}

/* ---------- Canción de repaso (simulada + voz del navegador) ---------- */
const canSpeak='speechSynthesis' in window;
/* Instrumental generado con Web Audio (sin archivos externos) */
const STY={
 rap:{bpm:88,k:'x.....x..x......',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.',w:'triangle',prog:[[110,1],[87.3,0],[130.8,0],[98,0]],rate:1.08},
 pop:{bpm:100,k:'x...x...x...x...',s:'....x.......x...',h:'..x...x...x...x.',w:'triangle',prog:[[130.8,0],[98,0],[110,1],[87.3,0]],rate:.98},
 balada:{bpm:68,k:'x.......x.......',s:'................',h:'................',w:'sine',arp:1,prog:[[110,1],[87.3,0],[130.8,0],[98,0]],rate:.85},
 rock:{bpm:120,k:'x.....x.x.......',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.',w:'sawtooth',prog:[[82.4,1],[130.8,0],[98,0],[146.8,0]],rate:1.02},
 reggaeton:{bpm:95,k:'x...x...x...x...',s:'...x..x....x..x.',h:'x.x.x.x.x.x.x.x.',w:'square',prog:[[110,1],[98,0],[87.3,0],[98,0]],rate:.96}
};
let AC=null,beat=null;
function startBeat(st){
 stopBeat();
 const P=STY[st]||STY.pop;
 AC=AC||new (window.AudioContext||window.webkitAudioContext)();
 if(AC.resume)AC.resume();
 const g=AC.createGain();g.gain.value=.26;g.connect(AC.destination);
 const nb=AC.createBuffer(1,Math.floor(AC.sampleRate*.3),AC.sampleRate),d=nb.getChannelData(0);
 for(let j=0;j<d.length;j++)d[j]=Math.random()*2-1;
 const tone=(f,t,du,ty,v)=>{const o=AC.createOscillator(),e=AC.createGain();o.type=ty;o.frequency.value=f;
  e.gain.setValueAtTime(.0001,t);e.gain.linearRampToValueAtTime(v,t+.03);e.gain.exponentialRampToValueAtTime(.0001,t+du);
  o.connect(e);e.connect(g);o.start(t);o.stop(t+du+.05)};
 const kick=t=>{const o=AC.createOscillator(),e=AC.createGain();
  o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);
  e.gain.setValueAtTime(.9,t);e.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(e);e.connect(g);o.start(t);o.stop(t+.3)};
 const hit=(t,du,v,ty,f)=>{const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),e=AC.createGain();
  s.buffer=nb;fl.type=ty;fl.frequency.value=f;e.gain.setValueAtTime(v,t);e.gain.exponentialRampToValueAtTime(.001,t+du);
  s.connect(fl);fl.connect(e);e.connect(g);s.start(t);s.stop(t+du+.02)};
 const step=60/P.bpm/4;let t=AC.currentTime+.1,i=0;
 const run=()=>{while(t<AC.currentTime+.25){
  const s=i%16,c=P.prog[Math.floor(i/16)%P.prog.length],r=c[0],ch=c[1]?[1,1.189,1.498]:[1,1.26,1.498];
  if(P.k[s]=='x')kick(t);
  if(P.s[s]=='x')hit(t,.15,.5,'bandpass',1800);
  if(P.h[s]=='x')hit(t,.05,.18,'highpass',7000);
  if(s==0)ch.forEach(x=>tone(r*2*x,t,step*15,P.w,.05));
  if(s%8==0)tone(r,t,step*6,'sine',.22);
  if(P.arp&&s%2==0)tone(r*4*ch[(s/2)%3],t,step*3,'sine',.07);
  t+=step;i++}};
 run();
 beat={g,timer:setInterval(run,40)};
 return beat;
}
function stopBeat(b){
 if(!beat||(b&&b!==beat))return;
 clearInterval(beat.timer);
 const cur=beat;beat=null;
 cur.g.gain.setTargetAtTime(0,AC.currentTime,.4);
 setTimeout(()=>{try{cur.g.disconnect()}catch(e){}},2000);
}
const esVoices=()=>{
 if(!canSpeak)return [];
 const sc=x=>/natural|neural|online|google/i.test(x.name)?0:1;
 return speechSynthesis.getVoices().filter(x=>x.lang.toLowerCase().startsWith('es')).sort((x,y)=>sc(x)-sc(y));
};
const voiceOpts=()=>{const l=esVoices();
 return l.length?l.map(v=>`<option value="${esc(v.voiceURI)}"${S.voice==v.voiceURI?' selected':''}>${esc(v.name)}</option>`).join(''):'<option value="">Voz predeterminada</option>'};
if(canSpeak)speechSynthesis.onvoiceschanged=()=>{const s=$('#vo');if(s)s.innerHTML=voiceOpts()};
let spTok=0;
function speak(t,st,done){
 speechSynthesis.cancel();
 const tok=++spTok;
 const lines=t.replace(/\[[^\]]*\]/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 const vs=esVoices(),v=vs.find(x=>x.voiceURI==S.voice)||vs[0];
 const rate=(STY[st]||STY.pop).rate*(S.rate||1);
 let k=0;
 const next=()=>{
  if(tok!==spTok)return;
  if(k>=lines.length){if(done)done();return}
  const u=new SpeechSynthesisUtterance(lines[k++]);
  if(v)u.voice=v;
  u.lang=v?v.lang:'es-ES';u.rate=rate;
  u.onend=()=>setTimeout(next,320);
  u.onerror=()=>{if(tok===spTok&&done)done()};
  speechSynthesis.speak(u);
 };
 next();
}
function playSong(t){
 const st=S.style||'rap',b=S.inst!==false?startBeat(st):null;
 if(canSpeak)speak(t,st,()=>{if(b)setTimeout(()=>stopBeat(b),800)});
 else if(b)setTimeout(()=>stopBeat(b),30000);
}
function stopSpeak(){spTok++;if(canSpeak)speechSynthesis.cancel();stopBeat()}
function makeLyric(a,st,kwText){
 const kw=(kwText||'los conceptos clave').split(',').map(x=>x.trim()).filter(Boolean);
 const k1=kw[0]||'los conceptos clave',k2=kw[1]||k1;
 return `Repaso de ${a.s}, estilo ${st}\n\n[Estrofa 1]\nHoy trabajé en «${a.t}»,\nno hay prisa, sigo mi ritmo,\n${k1} es lo que repaso,\nlo repito hasta que lo domino.\n\n[Estribillo]\n${k1} y ${k2}, los llevo en la mente,\nun descanso corto y vuelvo más fuerte,\nfluyo con calma, sin correr,\nlo que entiendo hoy lo voy a retener.`;
}
function readPrefs(){
 const s=$('#sty'),k=$('#kw'),c=$('#auto'),n=$('#inst'),vo=$('#vo'),rt=$('#rt');
 if(s)S.style=s.value;if(k)S.kw=k.value;if(c)S.auto=c.checked;if(n)S.inst=n.checked;if(vo)S.voice=vo.value;if(rt)S.rate=+rt.value;save();
}
function songCard(a){
 const est=['rap','pop','balada','rock','reggaeton'],cur=S.style||'rap';
 return `<div class="card"><h2>🎵 Canción de repaso</h2>
 <label>Estilo</label><div class="chips">${est.map(o=>`<button type="button" class="chip${cur==o?' on':''}" data-s="${o}">${o}</button>`).join('')}</div><input type="hidden" id="sty" value="${cur}">
 <label for="kw">Palabras clave</label><input id="kw" placeholder="derivada, pendiente" value="${esc(S.kw||'')}">
 <details><summary>Ajustes de voz y sonido</summary>
 <div class="row"><div><label for="vo">Voz</label><select id="vo">${voiceOpts()}</select></div>
 <div><label for="rt">Velocidad <span id="rv">${(S.rate||1).toFixed(2)}×</span></label><input type="range" id="rt" min="0.7" max="1.3" step="0.05" value="${S.rate||1}" style="width:100%"></div></div>
 <label style="display:flex;gap:8px;align-items:center;margin:12px 0 0;color:var(--ink)"><input type="checkbox" id="auto" style="width:auto"${S.auto?' checked':''}> Reproducir automáticamente al iniciar el descanso</label>
 <label style="display:flex;gap:8px;align-items:center;margin:8px 0 0;color:var(--ink)"><input type="checkbox" id="inst" style="width:auto"${S.inst!==false?' checked':''}> Con instrumental de fondo</label></details>
 <div class="acts" style="justify-content:flex-start"><button class="btn sec" id="gs">Generar letra</button>
 <button class="btn" id="pl">▶ Escuchar</button><button class="btn sec" id="sp">■ Detener</button></div>
 <pre id="ly" class="${lyric?'':'hide'}">${esc(lyric)}</pre>
 <p class="note">${canSpeak?'La voz y el instrumental los genera tu navegador (no es una canción cantada). ':'Tu navegador no soporta voz sintetizada. '}En el sistema real la letra la genera Claude desde el backend y el audio puede ser un archivo reproducido con &lt;audio autoplay&gt;. Revisa siempre los conceptos.</p></div>`;
}
function bindSong(a){
 ['#sty','#kw','#auto','#inst','#vo','#rt'].forEach(i=>{$(i).onchange=readPrefs});
 document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{$('#sty').value=c.dataset.s;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x==c));readPrefs()});
 $('#rt').oninput=()=>{$('#rv').textContent=(+$('#rt').value).toFixed(2)+'×'};
 const show=()=>{$('#ly').textContent=lyric;$('#ly').classList.remove('hide')};
 $('#gs').onclick=()=>{readPrefs();lyric=makeLyric(a,S.style||'rap',S.kw);show()};
 $('#pl').onclick=()=>{readPrefs();if(!lyric)lyric=makeLyric(a,S.style||'rap',S.kw);show();playSong(lyric)};
 $('#sp').onclick=stopSpeak;
}

/* ---------- Actividades ---------- */
function vActs(){
 $('#v').innerHTML=`<div class="card"><h2>Nueva actividad</h2>
 <div class="row"><div><label for="at">Título</label><input id="at" placeholder="Ej. Parcial de física"></div>
 <div><label for="as">Asignatura</label><input id="as" list="sl" placeholder="Elige o escribe una nueva"><datalist id="sl">${S.subj.map(s=>`<option value="${esc(s)}">`).join('')}</datalist></div></div>
 <div class="acts" style="justify-content:flex-start"><button class="btn" id="add">+ Crear actividad</button></div></div>
 <div class="card"><h2>Mis actividades</h2>${S.acts.length?S.acts.map(a=>`<div class="item"><div class="ih"><div><b>${esc(a.t)}</b> <span class="tag" style="--c:${col(a.s)}">${esc(a.s)}</span></div>
 <button class="btn del" data-d="${a.id}" aria-label="Eliminar ${esc(a.t)}">Eliminar</button></div>
 <div class="bar" style="margin-top:10px"><i style="width:${a.p}%;background:${col(a.s)}"></i></div>
 <div class="pr"><input type="range" min="0" max="100" step="5" value="${a.p}" data-id="${a.id}" aria-label="Progreso de ${esc(a.t)}"><span class="mut">${a.p}%</span></div></div>`).join(''):empty('📚','Aún no tienes actividades.<br>Crea la primera arriba.')}</div>`;
 $('#add').onclick=()=>{const t=$('#at').value.trim(),s=$('#as').value.trim();
  if(!t||!s){(!t?$('#at'):$('#as')).focus();return}
  if(!S.subj.includes(s))S.subj.push(s);S.acts.push({id:S.nid++,t,s,p:0});save();render()};
 document.querySelectorAll('input[type=range]').forEach(r=>{
  r.oninput=()=>{r.nextElementSibling.textContent=r.value+'%'};
  r.onchange=()=>{act(r.dataset.id).p=+r.value;save();render()}});
 document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
  if(S.cur&&S.cur.actId==b.dataset.d)return;
  S.acts=S.acts.filter(a=>a.id!=b.dataset.d);S.ses=S.ses.filter(x=>x.actId!=b.dataset.d);save();render()});
}

/* ---------- Historial ---------- */
function vHist(){
 const l=[...S.ses].reverse();
 $('#v').innerHTML=`<div class="card"><h2>Historial de sesiones</h2>${l.length?l.map(x=>{const a=act(x.actId);
 return `<div class="item ih"><div><b>${a?esc(a.t):'(actividad eliminada)'}</b> ${a?`<span class="tag" style="--c:${col(a.s)}">${esc(a.s)}</span>`:''}
 <div class="mut">${new Date(x.start).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'})}</div></div>
 <div style="text-align:right"><b>${fmt(x.dur)}</b><div class="mut">descanso ${x.brk?fmt(x.brk):'—'}</div></div></div>`}).join(''):empty('🕘','Todavía no hay sesiones.<br>Inicia una en la pestaña Sesión.')}</div>`;
}

/* ---------- Estadísticas ---------- */
function vStats(){
 const n=S.ses.length,tot=S.ses.reduce((a,x)=>a+x.dur,0),br=S.ses.filter(x=>x.brk);
 const por={};S.ses.forEach(x=>{const a=act(x.actId);if(a)por[a.s]=(por[a.s]||0)+x.dur});
 const mx=Math.max(1,...Object.values(por));
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);return d});
 const dm=days.map(d=>S.ses.filter(x=>x.start>=d.getTime()&&x.start<d.getTime()+864e5).reduce((a,x)=>a+x.dur,0));
 const dx=Math.max(1,...dm);
 const st=(l,v)=>`<div class="card stat" style="margin:0"><b>${v}</b><span class="mut">${l}</span></div>`;
 $('#v').innerHTML=`<div class="grid" style="margin-bottom:14px">${st('Tiempo total',n?fmt(tot):'—')}${st('Promedio por sesión',n?fmt(tot/n):'—')}${st('Sesiones',n)}${st('Descansos',br.length)}</div>
 <div class="card"><h2>Últimos 7 días <span class="mut">(min)</span></h2><div class="week">${days.map((d,i)=>`<div class="col${i==6?' today':''}"><span class="mut">${mins(dm[i])||''}</span><div class="colbar"><i style="height:${dm[i]/dx*100}%"></i></div><span class="mut">${d.toLocaleDateString('es-CO',{weekday:'narrow'})}</span></div>`).join('')}</div></div>
 <div class="card"><h2>Tiempo por asignatura</h2>${Object.keys(por).length?Object.entries(por).map(([k,v])=>`<div style="margin:12px 0"><div style="display:flex;justify-content:space-between"><span>${esc(k)}</span><span class="mut">${fmt(v)}</span></div><div class="bar"><i style="width:${v/mx*100}%;background:${col(k)}"></i></div></div>`).join(''):empty('📊','Las estadísticas aparecen<br>después de tu primera sesión.')}</div>`;
}
render();
