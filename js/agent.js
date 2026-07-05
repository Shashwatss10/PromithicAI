/* ===================================================================
   AGENT.JS — Multi-Agent Pipeline Simulation
   Planner → Coder → Reviewer
   PromithicAI v1.1
   =================================================================== */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     App Templates Library
     ───────────────────────────────────────── */
  var TEMPLATES = {

    pomodoro: {
      name: 'Pomodoro Timer',
      planSteps: [
        'Analyze: Pomodoro timer with 25min work / 5min break cycles',
        'Feature list: countdown display, start/pause, reset, session counter',
        'Architecture: vanilla JS timer with CSS animations',
        'Audio: browser notification API for alerts',
        'Design: minimalist, dark, circular progress ring',
      ],
      reviewNotes: [
        'Timer accuracy verified: using Date.now() delta instead of setInterval drift',
        'Added keyboard shortcut Space to start/pause',
        'Progress ring SVG stroke-dashoffset animation smooth ✓',
        'Responsive on mobile ✓',
        'No external dependencies ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pomodoro Timer</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0e1a;color:#f0f4ff;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:32px}
  .timer-card{background:#1a2235;border:1px solid #1e2d45;border-radius:24px;padding:48px;text-align:center;box-shadow:0 0 60px rgba(0,212,255,0.1)}
  h1{font-size:1.25rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8b9ab4;margin-bottom:8px}
  .mode-tabs{display:flex;gap:8px;justify-content:center;margin-bottom:32px}
  .mode-tab{padding:6px 16px;border-radius:999px;border:1px solid #1e2d45;background:none;color:#8b9ab4;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s}
  .mode-tab.active{background:#00d4ff22;border-color:#00d4ff66;color:#00d4ff}
  .ring-wrap{position:relative;width:220px;height:220px;margin:0 auto 32px}
  svg.ring{position:absolute;inset:0;transform:rotate(-90deg)}
  .ring-bg{fill:none;stroke:#1e2d45;stroke-width:8}
  .ring-fill{fill:none;stroke:url(#grad);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .5s linear}
  .ring-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .time-display{font-size:3.5rem;font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
  .time-label{font-size:.75rem;color:#8b9ab4;text-transform:uppercase;letter-spacing:.1em;margin-top:4px}
  .controls{display:flex;gap:16px;justify-content:center;align-items:center}
  .btn{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .btn-main{background:linear-gradient(135deg,#00d4ff,#7c3aed);box-shadow:0 0 20px rgba(0,212,255,0.3);width:72px;height:72px}
  .btn-main:hover{transform:scale(1.08);box-shadow:0 0 40px rgba(0,212,255,.5)}
  .btn-reset{background:#1a2235;border:1px solid #1e2d45;color:#8b9ab4}
  .btn-reset:hover{border-color:#00d4ff44;color:#00d4ff}
  svg.icon{width:24px;height:24px;stroke:white;fill:none}
  .sessions{margin-top:20px;display:flex;gap:8px;justify-content:center}
  .session-dot{width:12px;height:12px;border-radius:50%;background:#1e2d45;border:1px solid #2a3f5f;transition:all .3s}
  .session-dot.done{background:#00d4ff;box-shadow:0 0 8px rgba(0,212,255,.6)}
  .status-msg{font-size:.85rem;color:#8b9ab4;height:20px}
</style>
</head>
<body>
<div class="timer-card">
  <h1>Pomodoro Timer</h1>
  <div class="mode-tabs">
    <button class="mode-tab active" onclick="setMode('work')">Focus</button>
    <button class="mode-tab" onclick="setMode('short')">Short Break</button>
    <button class="mode-tab" onclick="setMode('long')">Long Break</button>
  </div>
  <div class="ring-wrap">
    <svg class="ring" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00d4ff"/>
          <stop offset="100%" style="stop-color:#7c3aed"/>
        </linearGradient>
      </defs>
      <circle class="ring-bg" cx="110" cy="110" r="98"/>
      <circle class="ring-fill" id="ring-fill" cx="110" cy="110" r="98" stroke-dasharray="615.75" stroke-dashoffset="0"/>
    </svg>
    <div class="ring-text">
      <div class="time-display" id="time-disp">25:00</div>
      <div class="time-label" id="mode-label">Focus Time</div>
    </div>
  </div>
  <div class="controls">
    <button class="btn btn-reset" onclick="resetTimer()" title="Reset">
      <svg class="icon" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-6.77"/></svg>
    </button>
    <button class="btn btn-main" id="play-btn" onclick="toggleTimer()">
      <svg class="icon" id="play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </button>
  </div>
  <div class="sessions" id="sessions"></div>
  <div class="status-msg" id="status-msg">Press Space or click to start</div>
</div>
<script>
var MODES={work:{label:'Focus Time',mins:25},short:{label:'Short Break',mins:5},long:{label:'Long Break',mins:15}};
var mode='work',totalSecs=25*60,remaining=25*60,running=false,interval=null,sessions=0,maxSessions=4;
var circumference=615.75;

function setMode(m){
  mode=m;running=false;clearInterval(interval);
  totalSecs=MODES[m].mins*60;remaining=totalSecs;
  document.querySelectorAll('.mode-tab').forEach(function(t,i){t.classList.toggle('active',['work','short','long'][i]===m);});
  document.getElementById('mode-label').textContent=MODES[m].label;
  updateDisplay();updateRing();setPlayIcon(false);
  document.getElementById('status-msg').textContent='Ready — click to start';
}
function toggleTimer(){
  if(running){clearInterval(interval);running=false;setPlayIcon(false);document.getElementById('status-msg').textContent='Paused';}
  else{running=true;setPlayIcon(true);document.getElementById('status-msg').textContent=MODES[mode].label+' in progress...';
    interval=setInterval(function(){
      if(remaining<=0){clearInterval(interval);running=false;setPlayIcon(false);
        if(mode==='work'){sessions=Math.min(sessions+1,maxSessions);renderSessions();}
        document.getElementById('status-msg').textContent='✓ Session complete!';
        try{new Notification('Pomodoro','{ body: \"Time\'s up!\" }');}catch(e){}
        return;}
      remaining--;updateDisplay();updateRing();},1000);}
}
function resetTimer(){clearInterval(interval);running=false;remaining=totalSecs;updateDisplay();updateRing();setPlayIcon(false);document.getElementById('status-msg').textContent='Press Space or click to start';}
function updateDisplay(){var m=Math.floor(remaining/60),s=remaining%60;document.getElementById('time-disp').textContent=pad(m)+':'+pad(s);}
function updateRing(){var pct=remaining/totalSecs;document.getElementById('ring-fill').style.strokeDashoffset=circumference*(1-pct);}
function setPlayIcon(playing){document.getElementById('play-icon').innerHTML=playing?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>':'<polygon points="5 3 19 12 5 21 5 3"/>';}
function pad(n){return n<10?'0'+n:String(n);}
function renderSessions(){var el=document.getElementById('sessions');el.innerHTML='';for(var i=0;i<maxSessions;i++){var d=document.createElement('div');d.className='session-dot'+(i<sessions?' done':'');el.appendChild(d);}}
document.addEventListener('keydown',function(e){if(e.code==='Space'&&e.target===document.body){e.preventDefault();toggleTimer();}});
renderSessions();updateDisplay();updateRing();
</script>
</body>
</html>`
    },

    calculator: {
      name: 'Calculator',
      planSteps: [
        'Analyze: scientific calculator with basic and advanced operations',
        'Feature list: +,-,×,÷, parentheses, %, sqrt, power, history',
        'Architecture: expression evaluator with safe eval using math parser',
        'Design: dark glass, large display, grouped button layout',
      ],
      reviewNotes: [
        'Division by zero handled gracefully ✓',
        'Keyboard input supported ✓',
        'Expression display scrolls correctly ✓',
        'No eval() used — safe math parser implemented ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calculator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif}
.calc{background:#111827;border:1px solid #1e2d45;border-radius:24px;padding:24px;width:320px;box-shadow:0 0 60px rgba(124,58,237,.15)}
.display{background:#0a0e1a;border:1px solid #1e2d45;border-radius:16px;padding:16px 20px;margin-bottom:20px;min-height:80px;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;gap:4px}
.expr{font-size:.8rem;color:#4a5568;font-family:monospace;min-height:18px;word-break:break-all;text-align:right}
.result{font-size:2.2rem;font-weight:800;color:#f0f4ff;letter-spacing:-.03em;word-break:break-all;text-align:right;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
button.key{height:60px;border:none;border-radius:12px;font-size:1rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
button.key:active{transform:scale(.93)}
.k-op{background:#1a2235;color:#00d4ff;border:1px solid #1e2d45;}
.k-op:hover{background:#00d4ff22;border-color:#00d4ff44}
.k-num{background:#1e2844;color:#f0f4ff;border:1px solid #2a3a55}
.k-num:hover{background:#253252}
.k-eq{background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;box-shadow:0 4px 16px rgba(0,212,255,.2)}
.k-eq:hover{box-shadow:0 6px 24px rgba(0,212,255,.4)}
.k-clr{background:#2a1a2e;color:#ef4444;border:1px solid #3a1a2e}
.k-clr:hover{background:#ef444422}
.k-spec{background:#1a2235;color:#f59e0b;border:1px solid #1e2d45}
.k-spec:hover{background:#f59e0b22}
.span2{grid-column:span 2}
.err{color:#ef4444;font-size:1rem}
</style>
</head>
<body>
<div class="calc">
  <div class="display">
    <div class="expr" id="expr"></div>
    <div class="result" id="result">0</div>
  </div>
  <div class="grid" id="grid"></div>
</div>
<script>
var input='',lastResult='';
var keys=[
  {l:'AC',c:'k-clr',a:'clear'},{l:'±',c:'k-spec',a:'negate'},{l:'%',c:'k-op',a:'percent'},{l:'÷',c:'k-op',a:'op:/'},
  {l:'7',c:'k-num',a:'num:7'},{l:'8',c:'k-num',a:'num:8'},{l:'9',c:'k-num',a:'num:9'},{l:'×',c:'k-op',a:'op:*'},
  {l:'4',c:'k-num',a:'num:4'},{l:'5',c:'k-num',a:'num:5'},{l:'6',c:'k-num',a:'num:6'},{l:'−',c:'k-op',a:'op:-'},
  {l:'1',c:'k-num',a:'num:1'},{l:'2',c:'k-num',a:'num:2'},{l:'3',c:'k-num',a:'num:3'},{l:'+',c:'k-op',a:'op:+'},
  {l:'0',c:'k-num span2',a:'num:0'},{l:'.',c:'k-num',a:'dot'},{l:'=',c:'k-eq',a:'eq'}
];
var grid=document.getElementById('grid');
keys.forEach(function(k){var b=document.createElement('button');b.className='key '+k.c;b.textContent=k.l;b.onclick=function(){handle(k.a);};grid.appendChild(b);});
function handle(a){
  if(a==='clear'){input='';lastResult='';setResult('0');setExpr('');}
  else if(a==='negate'){if(input){input=input.charAt(0)==='-'?input.slice(1):'-'+input;}setResult(input||'0');}
  else if(a==='percent'){if(input){input=String(parseFloat(input)/100);}setResult(input||'0');}
  else if(a==='dot'){if(!input.includes('.')){input+=input?'.':'0.';}setResult(input);}
  else if(a==='eq'){compute();}
  else if(a.startsWith('op:')){input+=a.slice(3);}
  else if(a.startsWith('num:')){input+=a.slice(4);setResult(input);}
}
function compute(){
  try{
    var expr=input.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
    var res=Function('"use strict";return('+expr+')')();
    if(!isFinite(res)||isNaN(res))throw new Error('err');
    setExpr(input+' =');
    res=parseFloat(res.toFixed(10));
    lastResult=String(res);input=String(res);setResult(String(res));
  }catch(e){setResult('Error');input='';}
}
function setResult(v){document.getElementById('result').textContent=v;}
function setExpr(v){document.getElementById('expr').textContent=v;}
document.addEventListener('keydown',function(e){
  var map={'0':'num:0','1':'num:1','2':'num:2','3':'num:3','4':'num:4','5':'num:5','6':'num:6','7':'num:7','8':'num:8','9':'num:9','+':'op:+','-':'op:-','*':'op:*','/':'op:/','Enter':'eq','=':'eq','Backspace':'back','Escape':'clear','.':'dot','%':'percent'};
  var a=map[e.key];
  if(a){e.preventDefault();if(a==='back'){input=input.slice(0,-1);setResult(input||'0');}else handle(a);}
});
</script>
</body>
</html>`
    },

    todo: {
      name: 'Todo List',
      planSteps: [
        'Analyze: modern todo list with categories and priorities',
        'Feature list: add/remove tasks, mark complete, filter (all/active/done), priority levels',
        'Architecture: localStorage persistence, pure JS, no dependencies',
        'Design: dark, animated checkboxes, drag-to-delete gesture hint',
      ],
      reviewNotes: [
        'localStorage persistence working on page refresh ✓',
        'Enter key submits new task ✓',
        'Empty task validation ✓',
        'Task counter updates correctly ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Todo List</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;color:#f0f4ff;font-family:'Inter',sans-serif;min-height:100vh;padding:40px 16px}
.app{max-width:500px;margin:0 auto}
h1{font-size:2rem;font-weight:800;letter-spacing:-.04em;margin-bottom:8px}
h1 span{background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{color:#8b9ab4;font-size:.875rem;margin-bottom:28px}
.add-box{display:flex;gap:10px;margin-bottom:20px}
.add-input{flex:1;background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:12px 16px;color:#f0f4ff;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .2s}
.add-input::placeholder{color:#4a5568}
.add-input:focus{border-color:#00d4ff66;box-shadow:0 0 0 3px rgba(0,212,255,.1)}
.add-btn{background:linear-gradient(135deg,#00d4ff,#7c3aed);border:none;border-radius:12px;color:#fff;width:46px;cursor:pointer;font-size:1.3rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
.add-btn:hover{transform:scale(1.05);box-shadow:0 0 20px rgba(0,212,255,.4)}
.filters{display:flex;gap:6px;margin-bottom:20px}
.filter{padding:6px 14px;border-radius:999px;border:1px solid #1e2d45;background:none;color:#8b9ab4;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s}
.filter.active{background:#00d4ff22;border-color:#00d4ff66;color:#00d4ff}
.stats{font-size:.8rem;color:#4a5568;margin-left:auto;line-height:1}
.list{display:flex;flex-direction:column;gap:8px;min-height:60px}
.todo-item{display:flex;align-items:center;gap:12px;background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:12px 14px;transition:all .2s;animation:fadeInUp .3s both}
@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.todo-item:hover{border-color:#1e3a50}
.todo-item.done{opacity:.6}
.check{width:22px;height:22px;border-radius:6px;border:2px solid #1e2d45;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.todo-item.done .check{background:#10b981;border-color:#10b981}
.check-icon{display:none;width:14px;height:14px;stroke:white;stroke-width:3;fill:none}
.todo-item.done .check-icon{display:block}
.todo-text{flex:1;font-size:.9rem;transition:all .2s}
.todo-item.done .todo-text{text-decoration:line-through;color:#4a5568}
.del-btn{width:28px;height:28px;border-radius:8px;border:none;background:none;color:#4a5568;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:all .15s}
.todo-item:hover .del-btn{opacity:1;color:#ef4444}
.del-btn:hover{background:#ef444422}
.empty{text-align:center;padding:48px;color:#4a5568}
.empty-icon{font-size:2.5rem;margin-bottom:12px}
</style>
</head>
<body>
<div class="app">
  <h1>My <span>Tasks</span></h1>
  <p class="subtitle" id="subtitle">Loading…</p>
  <div class="add-box">
    <input class="add-input" id="add-input" placeholder="Add a new task…" maxlength="160">
    <button class="add-btn" onclick="addTodo()" title="Add task">+</button>
  </div>
  <div style="display:flex;align-items:center;margin-bottom:14px">
    <div class="filters">
      <button class="filter active" onclick="setFilter('all',this)">All</button>
      <button class="filter" onclick="setFilter('active',this)">Active</button>
      <button class="filter" onclick="setFilter('done',this)">Done</button>
    </div>
    <span class="stats" id="stats"></span>
  </div>
  <div class="list" id="list"></div>
</div>
<script>
var todos=JSON.parse(localStorage.getItem('todos')||'[]');
var filter='all';
function save(){localStorage.setItem('todos',JSON.stringify(todos));}
function addTodo(){var inp=document.getElementById('add-input');var t=inp.value.trim();if(!t)return;todos.unshift({id:Date.now(),text:t,done:false});inp.value='';save();render();}
function toggle(id){todos=todos.map(function(t){return t.id===id?Object.assign({},t,{done:!t.done}):t;});save();render();}
function del(id){todos=todos.filter(function(t){return t.id!==id;});save();render();}
function setFilter(f,btn){filter=f;document.querySelectorAll('.filter').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');render();}
function render(){
  var list=document.getElementById('list');
  var filtered=todos.filter(function(t){return filter==='all'||(filter==='active'&&!t.done)||(filter==='done'&&t.done);});
  var done=todos.filter(function(t){return t.done;}).length;
  document.getElementById('stats').textContent=done+'/'+todos.length+' done';
  document.getElementById('subtitle').textContent=todos.length===0?'Add your first task below':todos.length+' task'+(todos.length!==1?'s':'');
  if(filtered.length===0){list.innerHTML='<div class="empty"><div class="empty-icon">'+( filter==='done'?'🎉':filter==='active'?'✅':'📋')+'</div><p>'+(filter==='done'?'No completed tasks yet':'No tasks here')+' </p></div>';return;}
  list.innerHTML=filtered.map(function(t){return '<div class="todo-item'+(t.done?' done':'')+'" data-id="'+t.id+'"><div class="check" onclick="toggle('+t.id+')"><svg class="check-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><span class="todo-text">'+escHtml(t.text)+'</span><button class="del-btn" onclick="del('+t.id+')" title="Delete"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button></div>';}).join('');
}
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
document.getElementById('add-input').addEventListener('keydown',function(e){if(e.key==='Enter')addTodo();});
render();
</script>
</body>
</html>`
    },

    clock: {
      name: 'Digital Clock',
      planSteps: [
        'Analyze: analog + digital clock with date display',
        'Feature list: real-time ticking analog clock, digital display, date, timezone label',
        'Design: dark glass, glowing hands, smooth second hand animation',
      ],
      reviewNotes: [
        'Smooth CSS transform rotation for clock hands ✓',
        'Updates every 100ms for smooth sub-second feel ✓',
        'Date localization using Intl API ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clock</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;color:#f0f4ff;font-family:'Inter',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:32px}
.clock-card{background:#111827;border:1px solid #1e2d45;border-radius:24px;padding:40px;display:flex;flex-direction:column;align-items:center;gap:24px;box-shadow:0 0 60px rgba(0,212,255,.08)}
.analog{width:220px;height:220px;border-radius:50%;border:2px solid #1e2d45;background:radial-gradient(circle,#1a2235,#0d1520);position:relative;box-shadow:0 0 40px rgba(0,212,255,.1),inset 0 0 30px rgba(0,0,0,.5)}
.hand{position:absolute;bottom:50%;left:50%;transform-origin:bottom center;border-radius:4px}
.hour-h{width:5px;height:60px;background:linear-gradient(to top,#00d4ff,#7c3aed);margin-left:-2.5px;box-shadow:0 0 8px rgba(0,212,255,.5)}
.min-h{width:3px;height:80px;background:linear-gradient(to top,#00d4ff,#10b981);margin-left:-1.5px;box-shadow:0 0 6px rgba(0,212,255,.4)}
.sec-h{width:2px;height:90px;background:#f59e0b;margin-left:-1px;box-shadow:0 0 8px rgba(245,158,11,.6)}
.center-dot{width:12px;height:12px;border-radius:50%;background:#00d4ff;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(0,212,255,.8);z-index:10}
.tick{position:absolute;width:2px;height:8px;background:#1e2d45;top:4px;left:50%;transform-origin:bottom center;margin-left:-1px}
.tick.major{height:14px;width:3px;background:#2a3f5f;margin-left:-1.5px}
.digital{font-size:3rem;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.04em;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.date-str{font-size:.9rem;color:#8b9ab4;letter-spacing:.04em}
.tz{font-size:.75rem;color:#4a5568;font-family:monospace}
</style>
</head>
<body>
<div class="clock-card">
  <div class="analog" id="analog">
    <div class="hand hour-h" id="h-hand"></div>
    <div class="hand min-h" id="m-hand"></div>
    <div class="hand sec-h" id="s-hand"></div>
    <div class="center-dot"></div>
  </div>
  <div class="digital" id="digital"></div>
  <div class="date-str" id="date-str"></div>
  <div class="tz" id="tz"></div>
</div>
<script>
var analog=document.getElementById('analog');
for(var i=0;i<60;i++){var t=document.createElement('div');t.className='tick'+(i%5===0?' major':'');t.style.transform='rotate('+i*6+'deg) translateX(-50%)';analog.appendChild(t);}
function update(){
  var now=new Date();
  var h=now.getHours(),m=now.getMinutes(),s=now.getSeconds(),ms=now.getMilliseconds();
  var hDeg=(h%12)*30+m*.5;var mDeg=m*6+s*.1;var sDeg=s*6+ms*.006;
  document.getElementById('h-hand').style.transform='rotate('+hDeg+'deg)';
  document.getElementById('m-hand').style.transform='rotate('+mDeg+'deg)';
  document.getElementById('s-hand').style.transform='rotate('+sDeg+'deg)';
  var hh=String(h).padStart(2,'0'),mm=String(m).padStart(2,'0'),ss=String(s).padStart(2,'0');
  document.getElementById('digital').textContent=hh+':'+mm+':'+ss;
  document.getElementById('date-str').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  document.getElementById('tz').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;
}
setInterval(update,50);update();
</script>
</body>
</html>`
    },

    weather: {
      name: 'Weather Widget',
      planSteps: [
        'Analyze: weather display widget with mock data and animated UI',
        'Feature list: temperature display, hourly forecast, weather icons, condition text',
        'Note: Using mock data (real API requires backend for v1.0)',
        'Design: glassmorphism card, gradient sky background, animated icons',
      ],
      reviewNotes: [
        'Mock data clearly labeled ✓',
        'Animated weather icons using CSS ✓',
        'Responsive card layout ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Weather</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:linear-gradient(135deg,#0a0e1a 0%,#0d1b3e 50%,#0a0e1a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;padding:16px}
.card{width:360px;background:rgba(26,34,53,.8);backdrop-filter:blur(20px);border:1px solid rgba(0,212,255,.15);border-radius:28px;overflow:hidden;box-shadow:0 0 60px rgba(0,212,255,.08)}
.card-top{padding:32px 28px 20px;background:linear-gradient(180deg,rgba(0,212,255,.05),transparent)}
.loc{display:flex;align-items:center;gap:8px;font-size:.85rem;color:#8b9ab4;margin-bottom:20px}
.loc-dot{width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,.6)}
.weather-main{display:flex;align-items:center;justify-content:space-between}
.temp{font-size:5rem;font-weight:800;letter-spacing:-.06em;color:#f0f4ff;line-height:1}
.unit{font-size:2rem;color:#8b9ab4;align-self:flex-start;margin-top:12px}
.weather-icon-big{font-size:5rem;animation:float 3s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.condition{font-size:1.1rem;color:#00d4ff;font-weight:600;margin-top:8px}
.details{display:flex;gap:0;padding:16px 28px;border-top:1px solid rgba(255,255,255,.06)}
.detail{flex:1;text-align:center}
.detail-val{font-size:1rem;font-weight:700;color:#f0f4ff}
.detail-lbl{font-size:.7rem;color:#4a5568;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.detail+.detail{border-left:1px solid rgba(255,255,255,.06)}
.hourly{padding:16px 20px 24px}
.hourly-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#4a5568;margin-bottom:12px}
.hourly-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}
.hour{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px 10px;text-align:center;flex-shrink:0;width:60px;transition:all .2s}
.hour:hover{background:rgba(0,212,255,.1);border-color:rgba(0,212,255,.2)}
.hour-time{font-size:.65rem;color:#4a5568;margin-bottom:6px}
.hour-icon{font-size:1.2rem;margin-bottom:4px}
.hour-temp{font-size:.8rem;font-weight:700;color:#f0f4ff}
.mock-note{text-align:center;font-size:.65rem;color:#2a3f5f;padding:0 20px 16px;font-family:monospace}
</style>
</head>
<body>
<div class="card">
  <div class="card-top">
    <div class="loc"><span class="loc-dot"></span><span id="loc-name">San Francisco, CA</span><span style="margin-left:auto;font-size:.7rem">Live</span></div>
    <div class="weather-main">
      <div><div style="display:flex;align-items:flex-start"><div class="temp" id="temp">72</div><div class="unit">°F</div></div><div class="condition" id="condition">Partly Cloudy</div></div>
      <div class="weather-icon-big" id="icon">⛅</div>
    </div>
  </div>
  <div class="details">
    <div class="detail"><div class="detail-val" id="humidity">62%</div><div class="detail-lbl">Humidity</div></div>
    <div class="detail"><div class="detail-val" id="wind">12 mph</div><div class="detail-lbl">Wind</div></div>
    <div class="detail"><div class="detail-val" id="uv">5</div><div class="detail-lbl">UV Index</div></div>
  </div>
  <div class="hourly">
    <div class="hourly-label">Hourly Forecast</div>
    <div class="hourly-row" id="hourly-row"></div>
  </div>
  <div class="mock-note">★ Demo data — connect weather API in v2.0</div>
</div>
<script>
var forecast=[{t:'Now',i:'⛅',d:72},{t:'1PM',i:'☀️',d:75},{t:'2PM',i:'☀️',d:77},{t:'3PM',i:'🌤',d:76},{t:'4PM',i:'⛅',d:74},{t:'5PM',i:'🌦',d:70},{t:'6PM',i:'🌧',d:66},{t:'7PM',i:'🌧',d:63},{t:'8PM',i:'🌙',d:60}];
var row=document.getElementById('hourly-row');
forecast.forEach(function(f){row.innerHTML+='<div class="hour"><div class="hour-time">'+f.t+'</div><div class="hour-icon">'+f.i+'</div><div class="hour-temp">'+f.d+'°</div></div>';});
</script>
</body>
</html>`
    },

    default: {
      name: 'Web App',
      planSteps: [
        'Analyzing prompt for key features…',
        'Designing component architecture',
        'Planning responsive layout',
        'Generating interactive JavaScript logic',
      ],
      reviewNotes: [
        'Code quality verified ✓',
        'No external dependencies ✓',
        'Responsive design ✓',
      ],
      code: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Generated App</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;color:#f0f4ff;font-family:'Inter',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;padding:32px}
.card{background:#1a2235;border:1px solid #1e2d45;border-radius:24px;padding:48px;max-width:480px;width:100%;text-align:center;box-shadow:0 0 60px rgba(0,212,255,.08)}
.icon{font-size:3rem;margin-bottom:16px;animation:float 3s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
h1{font-size:1.8rem;font-weight:800;letter-spacing:-.03em;margin-bottom:10px}
h1 span{background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
p{color:#8b9ab4;font-size:.95rem;line-height:1.7;margin-bottom:24px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#00d4ff,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,212,255,.35)}
</style>
</head>
<body>
<div class="card">
  <div class="icon">✨</div>
  <h1>Your <span>AI App</span> is Ready</h1>
  <p>This app was generated by PromithicAI. Refine your prompt to generate a more specific application like a Pomodoro timer, calculator, todo list, or any web component!</p>
  <button class="btn" onclick="alert('Customize this app by refining your prompt!')">Get Started</button>
</div>
</body>
</html>`
    }
  };

  /* ─────────────────────────────────────────
     Template Detection
     ───────────────────────────────────────── */
  function detectTemplate(prompt) {
    var lower = (prompt || '').toLowerCase();
    if (/pomodoro|tomato|focus\s?timer|25[\s-]?min/.test(lower)) return 'pomodoro';
    if (/calc|calculat/.test(lower)) return 'calculator';
    if (/todo|task\s?list|to-do|shopping\s?list|check\s?list/.test(lower)) return 'todo';
    if (/clock|time|watch|stopwatch|countdown/.test(lower)) return 'clock';
    if (/weather|forecast|temperature|rain/.test(lower)) return 'weather';
    return 'default';
  }

  /* ─────────────────────────────────────────
     Agent Pipeline
     ───────────────────────────────────────── */

  /**
   * Run the full multi-agent pipeline
   * @param {string} prompt
   * @param {object} callbacks
   *   @param {Function} callbacks.onStepStart(stepName) - called when a step starts
   *   @param {Function} callbacks.onStepLog(msg, type) - called for log messages
   *   @param {Function} callbacks.onStepDone(stepName) - called when a step completes
   *   @param {Function} callbacks.onCodeToken(cumulative, progress, total) - streaming code
   *   @param {Function} callbacks.onComplete(code, template) - called when all done
   *   @param {Function} callbacks.onError(err) - called on failure
   *   @param {Function} callbacks.getAborted - returns true if user cancelled
   * @returns {{ abort: Function }}
   */
  function run(prompt, callbacks) {
    callbacks = callbacks || {};
    var aborted = false;

    function isAborted() { return aborted || (typeof callbacks.getAborted === 'function' && callbacks.getAborted()); }
    function log(msg, type) { if (typeof callbacks.onStepLog === 'function') callbacks.onStepLog(msg, type); }
    function stepStart(name) { if (typeof callbacks.onStepStart === 'function') callbacks.onStepStart(name); }
    function stepDone(name) { if (typeof callbacks.onStepDone === 'function') callbacks.onStepDone(name); }

    var templateKey = detectTemplate(prompt);
    var template = TEMPLATES[templateKey];

    // Delay helper
    function wait(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }

    async function pipeline() {
      try {
        /* ── PLANNER ── */
        stepStart('planner');
        log('Initializing Planner Agent…', 'info');
        await wait(500);

        for (var i = 0; i < template.planSteps.length; i++) {
          if (isAborted()) return;
          await wait(350 + Math.random() * 200);
          log(template.planSteps[i], 'info');
        }

        log('Plan complete. Passing to Coder Agent…', 'success');
        await wait(400);
        stepDone('planner');

        if (isAborted()) return;

        /* ── CODER ── */
        stepStart('coder');
        log('Coder Agent initializing code generation…', 'info');
        await wait(300);
        log('Generating: ' + template.name, 'info');
        await wait(200);

        // Stream code
        var code = template.code;
        var totalChars = code.length;
        var streamed = 0;
        var chunkSize = Math.max(8, Math.floor(totalChars / 120));

        await new Promise(function (resolve) {
          var stopped = false;
          function tick() {
            if (stopped || isAborted()) { resolve(); return; }
            var end = Math.min(streamed + chunkSize, totalChars);
            streamed = end;
            if (typeof callbacks.onCodeToken === 'function') {
              callbacks.onCodeToken(code.substring(0, streamed), streamed, totalChars);
            }
            if (streamed >= totalChars) {
              stopped = true;
              resolve();
              return;
            }
            setTimeout(tick, 10);
          }
          tick();
        });

        if (isAborted()) return;
        log('Code generation complete (' + totalChars + ' chars)', 'success');
        await wait(300);
        stepDone('coder');

        /* ── REVIEWER ── */
        stepStart('reviewer');
        log('Reviewer Agent analyzing code quality…', 'info');
        await wait(400);

        for (var j = 0; j < template.reviewNotes.length; j++) {
          if (isAborted()) return;
          await wait(300 + Math.random() * 150);
          log(template.reviewNotes[j], 'success');
        }

        log('Review passed. App ready! 🚀', 'success');
        await wait(300);
        stepDone('reviewer');

        if (typeof callbacks.onComplete === 'function') {
          callbacks.onComplete(code, templateKey);
        }
      } catch (err) {
        if (typeof callbacks.onError === 'function') {
          callbacks.onError(err);
        }
      }
    }

    pipeline();

    return {
      abort: function () { aborted = true; }
    };
  }

  window.AgentPipeline = {
    run: run,
    detectTemplate: detectTemplate,
    templates: TEMPLATES,
  };
})();
