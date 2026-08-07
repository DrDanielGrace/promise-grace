/* ==========================================================
   Promise Grace · Mission Planner
   No storage APIs. State lives in memory, exported as JSON.
   ========================================================== */
(function(){
'use strict';

var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var NUCLEATED = new Date('2026-08-01T00:00:00');

/* ---------------- the plan ---------------- */
var PHASES = [
  { n:0, t:'Maths and physics you will actually use', w:'3 weeks', where:'Khan Academy',
    why:'None of this is abstract maths. Every piece of it is a bit of chemistry I already half knew, written differently.',
    items:[
      'Exponential and logarithmic functions, framed as pH, rate constants and absorbance from the first minute',
      'Reading graphs, including log axes, because almost every solar efficiency plot is drawn that way',
      'Electromagnetic spectrum: wavelength, frequency, photon energy',
      'The photoelectric effect',
      'Current, potential difference, simple circuits',
      'Basic differentiation, enough to know what a rate of change is'
    ],
    out:'Write one paragraph, in my own words, on why the pH scale is logarithmic.',
    added:false },

  { n:1, t:'Semiconductors', w:'2 weeks', where:'Professor Dave Explains',
    why:'Everything else rests on this. A solar cell is a semiconductor with a job.',
    items:[
      'Conductors, insulators, semiconductors',
      'Band gaps, and why gap size decides which colours a material can absorb',
      'Doping, n-type and p-type',
      'The p-n junction'
    ],
    out:'Explain a p-n junction to an imaginary SS2 student in under 150 words.',
    added:false },

  { n:2, t:'Thermodynamics and phase behaviour', w:'2 weeks', where:'Mixed sources',
    why:'I added this one. I had already done the ASU phase diagrams course and it was sitting there unconnected to anything. This is what connects it.',
    items:[
      'Gibbs free energy, enthalpy, entropy, at concept level',
      'Why phase stability decides whether a solar material survives sunlight and heat',
      'Perovskite degradation as the worked example'
    ],
    out:'A note linking one thing from my ASU phase diagram course to perovskite stability.',
    added:true },

  { n:3, t:'Electrochemistry', w:'3 weeks', wOld:'2 weeks', where:'Mixed sources',
    why:'I added this too, and it is the one I should have had from the start. Electrochemical materials are on my CV as a research interest. I cannot keep saying that without this.',
    items:[
      'Redox, half cells, standard electrode potentials',
      'The Nernst equation, and why it is logarithmic',
      'Charge transfer at an interface',
      'How this connects to dye-sensitised and perovskite cells'
    ],
    out:'An explainer on why the Nernst equation has a log in it.',
    added:true },

  { n:4, t:'How solar cells actually work', w:'5 weeks', where:'MIT OpenCourseWare 2.627',
    why:'The centre of the whole thing. Fifteen lectures and I am reading the notes alongside because they are clearer than the slides.',
    items:[
      'Lecture 1, introduction',
      'Lectures 2 to 5, light to electricity',
      'Lectures 6 to 10, efficiency limits including Shockley-Queisser',
      'Lectures 11 to 15, silicon, thin film, perovskite',
      'Read the lecture notes alongside each video'
    ],
    out:'Rebuild the Shockley-Queisser curve myself and explain it in my own words.',
    added:false },

  { n:5, t:'How materials are characterised', w:'4 weeks', where:'NPTEL, IIT Madras',
    why:'How you find out what you actually made. XRD is the one that matters and my first plan gave it no time at all, which was silly given it is the bridge to crystal growth.',
    items:[
      'Optical microscopy, weeks 1 to 3',
      'SEM, weeks 4 to 6',
      'XRD, weeks 7 to 9',
      'Bragg\u2019s law properly, and reading a real diffraction pattern',
      'Skip TEM for now'
    ],
    out:'An interactive Bragg\u2019s law visualisation.',
    added:false },

  { n:6, t:'Python for materials data', w:'4 weeks', where:'Free course, running alongside Phases 4 and 5',
    why:'Added. Every group expects you to handle data now and I have none of this. It is the cheapest gap I have to close.',
    items:[
      'Python basics',
      'NumPy and matplotlib, enough to plot a dataset',
      'Load a CSV, clean it, plot it, fit a line',
      'Plot one real published solar efficiency dataset'
    ],
    out:'One plot I made myself, published with the code visible.',
    added:true },

  { n:7, t:'Reading real research', w:'ongoing', where:'Google Scholar',
    why:'Starts once Phase 4 is done. The last one is the reason I care about any of this in the first place.',
    items:[
      'Perovskite solar cells, recent review',
      'MOFs in solar energy, review',
      'Thin film solar cells, review',
      'Microgravity crystal growth'
    ],
    out:'Four fields for every paper. No paper counts as read without the fourth.',
    added:false }
];

var DIFFS = [
  'Easier than it looked.',
  'Took a while but it went in.',
  'This one broke my brain for four days.',
  'I still do not fully get this and I am moving on anyway.'
];

/* state */
var S = {
  done:{}, diff:{}, hours:{}, sessions:[], days:[], letters:{},
  papers:[
    { title:'Perovskite solar cells: an emerging photovoltaic technology',
      doi:'placeholder, replace with the real one',
      q1:'Can a solution-processed perovskite reach the efficiency of silicon at a fraction of the manufacturing cost?',
      q2:'A review, pulling together device architectures and reported efficiencies across about a decade of work.',
      q3:'Efficiency climbed faster than any material before it. Stability did not follow. Moisture, heat and light all degrade it.',
      q4:'Every efficiency number in here is measured on a fresh cell. I would want the same table with a column for efficiency after a thousand hours, because that is the number that decides whether any of this leaves the laboratory. I also noticed almost nothing on what the degradation products actually are, which feels like the more useful question.' }
  ],
  writer:{}, predicts:{}
};

var $ = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
function el(t,cls,txt){ var e=document.createElement(t); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }

/* ---------------- render the plan ---------------- */
function renderPhases(){
  var wrap = $('#phases');
  wrap.innerHTML='';
  PHASES.forEach(function(p){
    var sec = el('div','phase');

    var head = el('button','phase-head');
    head.type='button';
    head.setAttribute('aria-expanded','false');
    var bodyId = 'ph-body-'+p.n;
    head.setAttribute('aria-controls',bodyId);

    head.appendChild(el('span','phase-n','PHASE '+p.n));
    head.appendChild(el('span','phase-t',p.t));

    var w = el('span','phase-w');
    if(p.wOld){
      var d=el('del',null,p.wOld); w.appendChild(d); w.appendChild(document.createTextNode(' '+p.w));
    } else { w.textContent=p.w; }
    head.appendChild(w);
    sec.appendChild(head);

    var body = el('div','phase-body'); body.id=bodyId; body.hidden=true;

    var why = el('p', p.added?'phase-why new':'phase-why', p.why);
    body.appendChild(why);

    p.items.forEach(function(txt,i){
      var key = p.n+'-'+i;
      var row = el('div','item');
      var cb = el('input'); cb.type='checkbox'; cb.id='it-'+key;
      cb.checked = !!S.done[key];
      if(cb.checked) row.classList.add('done');
      cb.addEventListener('change',function(){
        S.done[key]=cb.checked;
        if(cb.checked) markToday();
        row.classList.toggle('done',cb.checked);
        refresh();
      });
      var lab = el('label',null,txt); lab.htmlFor='it-'+key;
      row.appendChild(cb); row.appendChild(lab);
      body.appendChild(row);
    });

    var ob = el('div','output-box');
    var ol = el('span','output-lab','Before this phase counts');
    var op = el('p',null,p.out);
    ob.appendChild(ol); ob.appendChild(op);
    body.appendChild(ob);

    var dv = el('div','difficulty');
    dv.appendChild(el('span','diff-lab','How it actually felt'));
    var opts = el('div','diff-opts');
    DIFFS.forEach(function(d,di){
      var b=el('button',null,d); b.type='button';
      b.setAttribute('aria-pressed', S.diff[p.n]===di ? 'true':'false');
      b.addEventListener('click',function(){
        S.diff[p.n] = (S.diff[p.n]===di) ? null : di;
        $$('button',opts).forEach(function(x,xi){ x.setAttribute('aria-pressed', S.diff[p.n]===xi?'true':'false'); });
        refresh();
      });
      opts.appendChild(b);
    });
    dv.appendChild(opts);
    body.appendChild(dv);

    var hr = el('div','hours');
    var hl = el('label',null,'HOURS THIS SESSION'); hl.htmlFor='h-'+p.n;
    var hi = el('input'); hi.type='number'; hi.id='h-'+p.n; hi.min='0'; hi.step='0.25';
    hi.placeholder='0.5';
    var nl = el('label',null,'WHAT HAPPENED'); nl.htmlFor='n-'+p.n;
    var ni = el('input'); ni.type='text'; ni.id='n-'+p.n; ni.className='note-in';
    ni.placeholder='What went in, what did not';
    var lb = el('button','btn-quiet','Log it'); lb.type='button';
    lb.addEventListener('click',function(){
      var v=parseFloat(hi.value)||0;
      if(!v && !ni.value.trim()){ hi.focus(); return; }
      S.hours[p.n]=(S.hours[p.n]||0)+v;
      S.sessions.push({phase:p.n, date:dayKey(new Date()), hours:v, note:ni.value.trim()});
      markToday();
      hi.value=''; ni.value='';
      refresh();
    });
    hr.appendChild(hl); hr.appendChild(hi);
    hr.appendChild(nl); hr.appendChild(ni);
    hr.appendChild(lb);
    body.appendChild(hr);

    var tot = el('p','hours-total');
    tot.textContent = S.hours[p.n] ? (S.hours[p.n]+' hours logged on this phase so far') : 'Nothing logged on this phase yet.';
    body.appendChild(tot);

    var mine = S.sessions.filter(function(x){return x.phase===p.n && x.note;});
    if(mine.length){
      var log = el('div','sessions');
      mine.slice(-6).reverse().forEach(function(x){
        var r=el('p','session');
        r.appendChild(el('span','session-d',x.date));
        r.appendChild(el('span',null,x.note));
        log.appendChild(r);
      });
      body.appendChild(log);
    }

    sec.appendChild(body);
    head.addEventListener('click',function(){
      var open = body.hidden;
      body.hidden = !open;
      head.setAttribute('aria-expanded', open?'true':'false');
    });
    wrap.appendChild(sec);
  });
}

/* ---------------- counts ---------------- */
function totals(){
  /* Atoms are placed in completion order. Each atom remembers which phase it
     came from, so a defect can sit on the atoms it actually belongs to. */
  var seq=[], cur=0, anyDone=false, defects=0;
  PHASES.forEach(function(p){
    var d=0, hard = S.diff[p.n]!=null && S.diff[p.n]>=2;
    p.items.forEach(function(_,i){
      if(!S.done[p.n+'-'+i]) return;
      d++; anyDone=true;
      for(var a=0;a<4;a++) seq.push({phase:p.n, item:i, bad:(hard && a===0)});
    });
    if(d===p.items.length && p.items.length) cur=Math.max(cur,p.n+1);
    if(hard) defects += d;
  });
  return {atoms:seq.length, defects:defects, phase:cur, any:anyDone, seq:seq};
}

/* ---------------- crystal ---------------- */
var CR = {};
/* -------------------------------------------------------------------------
   VISIBILITY GATE

   Both three.js views used to render every frame forever, whether they were
   on screen or not. RM stopped the rotation but not the render, so two WebGL
   contexts drew continuously on a phone that could not afford one.

   drive() renders only while the host element is on screen and the tab is
   visible, and it stops the loop rather than skipping work inside it.
   ------------------------------------------------------------------------- */
function drive(host, render){
  var id=null, on=false;
  function frame(){ id=null; if(!on) return; render(); id=requestAnimationFrame(frame); }
  function go(){ if(on||document.hidden) return; on=true; if(id===null) id=requestAnimationFrame(frame); }
  function halt(){ on=false; if(id!==null){ cancelAnimationFrame(id); id=null; } }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? go() : halt(); });
    },{rootMargin:'80px 0px',threshold:0.01}).observe(host);
  } else { go(); }
  document.addEventListener('visibilitychange', function(){ document.hidden ? halt() : go(); });
  render();   // one still frame so it is never blank before it is reached
  return {stop:halt};
}

function initCrystal(){
  if(!window.THREE) return;
  var host=$('#crystal-canvas'); if(!host) return;
  var w=host.clientWidth||600, h=host.clientHeight||390;

  CR.scene=new THREE.Scene();
  CR.cam=new THREE.PerspectiveCamera(42,w/h,0.1,1000);
  CR.cam.position.set(9,7,11);
  CR.cam.lookAt(0,0,0);
  CR.ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  CR.ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
  CR.ren.setSize(w,h);
  host.appendChild(CR.ren.domElement);

  CR.scene.add(new THREE.AmbientLight(0xffffff,0.72));
  var d1=new THREE.DirectionalLight(0xffffff,0.62); d1.position.set(6,10,7); CR.scene.add(d1);
  var d2=new THREE.DirectionalLight(0xE9C978,0.28); d2.position.set(-7,-4,-6); CR.scene.add(d2);

  CR.group=new THREE.Group(); CR.scene.add(CR.group);

  CR.geo=new THREE.SphereGeometry(0.34,14,12);
  CR.matGood=new THREE.MeshLambertMaterial({color:0x33543B});
  CR.matBad=new THREE.MeshLambertMaterial({color:0x8C2F45});
  CR.matSeed=new THREE.MeshLambertMaterial({color:0xC5C7DC, transparent:true, opacity:0.35});

  CR.spin=true;
  var drag=false,px=0,py=0;
  function down(e){drag=true;px=(e.touches?e.touches[0].clientX:e.clientX);py=(e.touches?e.touches[0].clientY:e.clientY);}
  function move(e){
    if(!drag)return;
    var x=(e.touches?e.touches[0].clientX:e.clientX), y=(e.touches?e.touches[0].clientY:e.clientY);
    CR.group.rotation.y+=(x-px)*0.008; CR.group.rotation.x+=(y-py)*0.008; px=x; py=y;
    if(e.touches) e.preventDefault();
  }
  function up(){drag=false;}
  host.addEventListener('mousedown',down); window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  host.addEventListener('touchstart',down,{passive:true}); host.addEventListener('touchmove',move,{passive:false}); host.addEventListener('touchend',up);

  var tog=$('#spin-toggle');
  tog.addEventListener('click',function(){
    CR.spin=!CR.spin;
    tog.textContent = CR.spin?'Pause rotation':'Resume rotation';
  });

  window.addEventListener('resize',function(){
    var nw=host.clientWidth,nh=host.clientHeight;
    if(!nw||!nh)return;
    CR.cam.aspect=nw/nh; CR.cam.updateProjectionMatrix(); CR.ren.setSize(nw,nh);
  });

  buildCrystal();
  initDefectHover();
  drive(host, function(){
    if(CR.spin && !RM && !drag) CR.group.rotation.y += 0.0022;
    CR.ren.render(CR.scene,CR.cam);
  });
}

function buildCrystal(){
  if(!CR.group) return;
  while(CR.group.children.length) CR.group.remove(CR.group.children[0]);

  var t=totals();
  var seq=t.seq;
  var n=Math.max(seq.length,8);

  var pts=[], r=1;
  while(pts.length<n && r<9){
    for(var x=-r;x<=r;x++)for(var y=-r;y<=r;y++)for(var z=-r;z<=r;z++){
      if(Math.max(Math.abs(x),Math.abs(y),Math.abs(z))!==r) continue;
      pts.push([x,y,z]);
    }
    r++;
  }
  pts.sort(function(a,b){
    return (a[0]*a[0]+a[1]*a[1]+a[2]*a[2])-(b[0]*b[0]+b[1]*b[1]+b[2]*b[2]);
  });
  pts=pts.slice(0,n);

  CR.marks=[];
  pts.forEach(function(p,i){
    var info=seq[i];
    var bad=info?info.bad:false;
    var m=new THREE.Mesh(CR.geo, bad?CR.matBad:CR.matGood);
    m.position.set(p[0]*1.05,p[1]*1.05,p[2]*1.05);
    if(bad){
      m.position.x+=0.3; m.position.y-=0.22;
      m.scale.setScalar(0.62);
      m.userData.defect = info;
      CR.marks.push(m);
    }
    if(!info) m.material=CR.matSeed;
    CR.group.add(m);
  });
}

/* hovering a defect says what caused it */
function initDefectHover(){
  var host=$('#crystal-canvas'), tip=$('#defect-tip');
  if(!host||!tip||!CR.ren) return;
  var ray=new THREE.Raycaster(), v=new THREE.Vector2();
  function findLabel(d){
    var p=PHASES[d.phase];
    var diff=DIFFS[S.diff[d.phase]]||'';
    return 'Phase '+d.phase+' \u00B7 '+p.items[d.item].split(',')[0]+' \u00B7 '+diff;
  }
  host.addEventListener('mousemove',function(e){
    if(!CR.marks||!CR.marks.length){ tip.hidden=true; return; }
    var b=host.getBoundingClientRect();
    v.x=((e.clientX-b.left)/b.width)*2-1;
    v.y=-((e.clientY-b.top)/b.height)*2+1;
    ray.setFromCamera(v,CR.cam);
    var hit=ray.intersectObjects(CR.marks);
    if(hit.length){
      tip.textContent=findLabel(hit[0].object.userData.defect);
      tip.style.left=(e.clientX-b.left+12)+'px';
      tip.style.top=(e.clientY-b.top+12)+'px';
      tip.hidden=false;
    } else tip.hidden=true;
  });
  host.addEventListener('mouseleave',function(){ tip.hidden=true; });
}

/* keyboard and screen reader route to the same information */
function defectList(){
  var t=totals(), out=[];
  t.seq.forEach(function(a){
    if(!a.bad) return;
    out.push('Phase '+a.phase+', '+PHASES[a.phase].items[a.item].split(',')[0]+'. '+(DIFFS[S.diff[a.phase]]||''));
  });
  return out;
}

/* ---------------- the status line ----------------
   The day count is worked out from the nucleation date rather than typed,
   so it cannot go stale. Only the phase and the sentence are hand written,
   and the page says how old the sentence is rather than letting an old one
   pass as current. */
function daysRunning(){
  return Math.max(0,Math.floor((Date.now()-NUCLEATED.getTime())/86400000))+1;
}
function renderStatus(){
  var el0=$('.status-now'); if(!el0) return;
  var phase=el0.getAttribute('data-phase')||'?';
  var said=el0.getAttribute('data-said');
  var line=$('#status-line');
  if(line){
    var txt=line.textContent;
    var rest=txt.replace(/^Phase\s+\d+,\s*day\s+\d+\.\s*/,'');
    line.textContent='Phase '+phase+', day '+daysRunning()+'. '+rest;
  }
  var age=$('#status-age');
  if(age && said){
    var d=Math.floor((Date.now()-new Date(said+'T00:00:00').getTime())/86400000);
    age.textContent = d>14
      ? ' I wrote that sentence '+d+' days ago and have not updated it since, so treat it as out of date.'
      : '';
  }
}

/* ---------------- telemetry ----------------
   Two owners, kept apart. The top of the panel is my run. Everything under
   it is the reader's crystal, which starts empty because they have just
   arrived. Mixing the two is what made this panel read as a contradiction:
   zeros beside a status line saying phase two. */
function refresh(){
  var t=totals();
  var days=daysRunning();
  $('#t-atoms').textContent=t.atoms;
  $('#t-defects').textContent=t.defects;
  $('#t-phase').textContent=t.phase;
  $('#t-days').textContent=days;
  var mine=$('.status-now');
  if($('#t-myphase') && mine) $('#t-myphase').textContent=mine.getAttribute('data-phase')||'?';

  var hrs=0; for(var k in S.hours) hrs+=S.hours[k]||0;
  $('#t-growth').textContent = !t.any ? 'not started' : (hrs>20?'steady':(hrs>5?'slow':'just nucleated'));

  $('#crystal-alt').textContent =
    'Your crystal currently has '+t.atoms+' atoms and '+t.defects+
    ' defects, at phase '+t.phase+'. It starts empty and grows as you tick topics off. '+
    'Separately, my own run is on day '+days+'.'+
    (t.defects? ' The defects are: '+defectList().join(' ') : '');

  buildCrystal();
  renderAch(t,hrs);
  renderStreak();
  renderLetters(t);
  renderBaf();
}

/* ---------------- achievements ---------------- */
var ACH=[
  {id:'first',  t:'Ticked the first box',                     test:function(t){return t.atoms>0;}},
  {id:'log',    t:'Finally understood logarithms',            test:function(){return S.done['0-0'];}},
  {id:'pn',     t:'Explained a p-n junction to somebody',     test:function(){return S.done['1-3'];}},
  {id:'py',     t:'Wrote my first line of Python',            test:function(){return S.done['6-0'];}},
  {id:'plot',   t:'Made a graph that was actually correct',   test:function(){return S.done['6-3'];}},
  {id:'paper',  t:'Read a paper without crying',              test:function(){return S.papers.length>0;}},
  {id:'phase',  t:'Finished a whole phase',                   test:function(t){return t.phase>0;}},
  {id:'hard',   t:'Said out loud that something was hard',    honest:true, test:function(){for(var k in S.diff){if(S.diff[k]>=2)return true;}return false;}},
  {id:'moveon', t:'Moved on without fully understanding it',  honest:true, test:function(){for(var k in S.diff){if(S.diff[k]===3)return true;}return false;}},
  {id:'twelve', t:'Logged twelve minutes, because that was the day', honest:true, test:function(){return S.sessions.some(function(x){return x.hours>0 && x.hours<=0.25;});}},
  {id:'back',   t:'Came back after a gap',                    honest:true, test:function(){return streakStats().broken;}}
];

function renderAch(t){
  var wrap=$('#ach-list'); wrap.innerHTML='';
  ACH.forEach(function(a){
    var got=false; try{got=!!a.test(t);}catch(e){got=false;}
    var d=el('div','ach'+(got?'':' locked')+(a.honest?' honest':''));
    d.appendChild(el('span','ach-mark',got?'\u2713':'\u00B7'));
    d.appendChild(el('span',null,a.t));
    wrap.appendChild(d);
  });
}

/* ---------------- streak ---------------- */
/* Real dates. A gap of one or two days does not break the run. Three does. */
function dayKey(d){ return d.toISOString().slice(0,10); }
function markToday(){
  var k=dayKey(new Date());
  if(S.days.indexOf(k)===-1) S.days.push(k);
}
function streakStats(){
  if(!S.days.length) return {run:0, last30:0, broken:false};
  var ds=S.days.slice().sort();
  var toN=function(k){ return Math.floor(new Date(k+'T00:00:00').getTime()/86400000); };
  var nums=ds.map(toN);
  var today=Math.floor(Date.now()/86400000);

  var last30=nums.filter(function(n){ return today-n<30; }).length;

  /* walk backwards from today, allowing gaps of up to two days */
  var run=0, cursor=today, i=nums.length-1, broken=false;
  while(i>=0){
    var gap=cursor-nums[i];
    if(gap<0){ i--; continue; }
    if(gap<=2){ run++; cursor=nums[i]-1; i--; }
    else { broken = run>0; break; }
  }
  return {run:run, last30:last30, broken:broken};
}
function renderStreak(){
  var st=streakStats();
  $('#s-run').textContent=st.run;
  $('#s-30').textContent=st.last30;
  var note=$('#streak-note');
  if(!S.days.length) note.textContent='Nothing logged yet. That is a fine place to be.';
  else if(st.broken) note.textContent='Broken. It happens. The crystal is still there and none of the atoms fell off.';
  else note.textContent='One day off does not break anything. Neither does two. I built it that way on purpose.';
}

/* ---------------- letters ---------------- */
function renderLetters(t){
  var wrap=$('#letters'); wrap.innerHTML='';
  PHASES.forEach(function(p){
    var L=S.letters[p.n];
    var open = (p.n===0) ? (t.phase>=PHASES.length) : (t.phase>p.n);
    var d=el('div','letter'+(L&&!open?' sealed':''));

    if(!L){
      d.appendChild(el('p','letter-meta','PHASE '+p.n+' \u00B7 NOT WRITTEN'));
      var ta=el('textarea'); ta.rows=3;
      ta.setAttribute('aria-label','Letter to yourself before starting phase '+p.n);
      ta.placeholder='Write it now. You will not see it again until this phase is finished.';
      var b=el('button','btn-quiet','Seal it'); b.type='button';
      b.addEventListener('click',function(){
        if(!ta.value.trim()) { ta.focus(); return; }
        S.letters[p.n]={text:ta.value.trim(), date:dayKey(new Date())};
        markToday(); refresh();
      });
      d.appendChild(ta); d.appendChild(b);
    } else if(open){
      d.appendChild(el('p','letter-meta','WRITTEN '+L.date+' \u00B7 PHASE '+p.n+' \u00B7 OPEN'));
      d.appendChild(el('p','letter-body',L.text));
    } else {
      d.appendChild(el('p','letter-meta','WRITTEN '+L.date+' \u00B7 PHASE '+p.n+' \u00B7 SEALED'));
      var msg = p.n===0
        ? 'Shut until the whole thing is finished.'
        : 'Shut until Phase '+p.n+' is finished.';
      d.appendChild(el('p','letter-body',msg));
    }
    wrap.appendChild(d);
  });
}

/* ---------------- before after later ---------------- */
var BAF=[
  { topic:'Band gaps',
    before:'I think it is a gap. Like a space between two things in a metal? Not sure why light cares about it.',
    after:'It is the energy step an electron has to jump to become free and carry current. A photon can only push it across if the photon carries at least that much energy. Below the gap, the light just passes through, which is why silicon looks opaque and glass does not.',
    later:'The jump an electron has to make. Photon needs enough energy or nothing happens. Size of the gap decides what colours the material can use. I have lost the detail about why a bigger gap gives more voltage and I need to go back to that.' },
  { topic:'Why the pH scale is logarithmic',
    before:'Because the numbers get very small and nobody wants to write 0.0000001.',
    after:'That, and something better. Hydrogen ion concentration in ordinary things spans fourteen powers of ten. No linear axis holds that. Taking the log turns a multiplying scale into an adding one, so a change of one unit always means exactly ten times, everywhere on the scale.',
    later:'' }
];
function renderBaf(){
  var wrap=$('#baf-list'); wrap.innerHTML='';
  BAF.forEach(function(b){
    var s=el('div','baf');
    s.appendChild(el('h3',null,b.topic));
    var cols=el('div','baf-cols');
    [['before','What I thought',b.before],['after','What I learned',b.after],['later','What stuck, six weeks on',b.later]].forEach(function(c){
      var col=el('div','baf-col '+c[0]);
      col.appendChild(el('h4',null,c[1]));
      if(c[2]) col.appendChild(el('p',null,c[2]));
      else col.appendChild(el('p','baf-empty','Not due yet. I will write this from memory, without looking.'));
      cols.appendChild(col);
    });
    s.appendChild(cols);
    wrap.appendChild(s);
  });
}

/* ---------------- papers ---------------- */
function renderPapers(){
  var wrap=$('#papers-list'); wrap.innerHTML='';
  S.papers.forEach(function(p){
    var d=el('div','paper');
    d.appendChild(el('h3',null,p.title));
    d.appendChild(el('p','paper-doi','DOI '+p.doi));
    [['What question were they asking',p.q1,false],
     ['What did they do',p.q2,false],
     ['What did they find',p.q3,false],
     ['What I would do differently',p.q4,true]].forEach(function(f){
      var b=el('div','pf'+(f[2]?' key':''));
      b.appendChild(el('span','pf-q',f[0]));
      b.appendChild(el('span',null,f[1]));
      d.appendChild(b);
    });
    wrap.appendChild(d);
  });
}
$('#p-save').addEventListener('click',function(){
  var t=$('#p-title').value.trim(), q4=$('#p-q4').value.trim();
  if(!t){ $('#p-title').focus(); return; }
  if(!q4){ $('#p-q4').focus(); return; }
  S.papers.push({title:t,doi:$('#p-doi').value.trim()||'no DOI given',
    q1:$('#p-q1').value.trim(),q2:$('#p-q2').value.trim(),
    q3:$('#p-q3').value.trim(),q4:q4});
  ['p-title','p-doi','p-q1','p-q2','p-q3','p-q4'].forEach(function(i){$('#'+i).value='';});
  renderPapers();
});

/* ---------------- writing tool ---------------- */
var WB=[
  {id:'w1',t:'What this is about, and why it matters',p:'One or two sentences. Say it the way you would say it to somebody at a bus stop.'},
  {id:'w2',t:'What is already known',p:'What does the field agree on? Keep it short.'},
  {id:'w3',t:'What I read, and what I took from it',p:'Name the papers. Say what each one gave you.'},
  {id:'w4',t:'Where the field disagrees with itself',p:'This is usually the interesting part.'},
  {id:'w5',t:'What I still do not understand',p:'Be honest here. Nobody has ever lost respect for this section.'},
  {id:'w6',t:'What I would want to work on',p:'The specific thing. Not the field, the question.'}
];
var BANNED=['delve','leverage','showcase','seamlessly','robust','elevate','unlock','cutting edge','innovative','passionate about','dive into','unpack','at the end of the day','it is worth noting','in conclusion','moreover','straightforward'];

function renderWriter(){
  var wrap=$('#writer'); wrap.innerHTML='';
  WB.forEach(function(b){
    var d=el('div','wblock');
    d.appendChild(el('h3',null,b.t));
    d.appendChild(el('p','wprompt',b.p));
    var ta=el('textarea'); ta.rows=4; ta.id=b.id;
    ta.value=S.writer[b.id]||'';
    ta.setAttribute('aria-label',b.t);
    ta.addEventListener('input',function(){ S.writer[b.id]=ta.value; });
    d.appendChild(ta);
    var q=el('div','wq'); q.id='q-'+b.id; q.hidden=true;
    d.appendChild(q);
    wrap.appendChild(d);
  });
}

function interrogate(){
  var asked=0;
  WB.forEach(function(b){
    var txt=(S.writer[b.id]||'').trim();
    var box=$('#q-'+b.id); box.innerHTML=''; box.hidden=true;
    if(!txt) return;
    var qs=[];

    if(txt.indexOf('\u2014')>-1) qs.push('There is an em dash in here. Take it out, it is banned everywhere on this site.');

    BANNED.forEach(function(w){
      if(txt.toLowerCase().indexOf(w)>-1) qs.push('You used "'+w+'". Would you say that out loud? Say it the way you would say it.');
    });

    txt.replace(/([.!?])\s+/g,'$1\u0001').split('\u0001').forEach(function(s){
      if(s.split(/\s+/).length>30) qs.push('One of these sentences runs past thirty words. Where would you put the full stop?');
    });

    if(/\b(degrade|degrades|unstable|fails|breaks down)\b/i.test(txt) && !/\binto\b/i.test(txt))
      qs.push('You said something degrades. Degrades into what?');

    if(/\b(better|worse|more efficient|higher|improved)\b/i.test(txt) && !/\d/.test(txt))
      qs.push('This is a comparison with no number in it. Better than what, and by how much?');

    if(/\b(studies show|research shows|it is known|scientists say)\b/i.test(txt))
      qs.push('Which study? Name it or cut the claim.');

    if(/\b(is|are|was|were)\s+\w+ed\s+by\b/i.test(txt))
      qs.push('There is a passive construction here. The active version is usually shorter and says who did it.');

    if(b.id==='w6' && txt.split(/\s+/).length<25)
      qs.push('This is the section a supervisor reads twice. Twenty five words is not enough. What is the actual question?');

    if(b.id==='w5' && /^(nothing|none|n\/a)/i.test(txt))
      qs.push('There is always something. What is the bit you skipped past hoping nobody would ask?');

    if(qs.length){
      qs.slice(0,4).forEach(function(q){ box.appendChild(el('p',null,q)); });
      box.hidden=false; asked+=qs.length;
    }
  });

  var out=$('#w-out'); out.hidden=false;
  var filled=WB.filter(function(b){return (S.writer[b.id]||'').trim();}).length;
  if(!filled) out.textContent='Nothing written yet. Fill a box and I will start asking.';
  else if(!asked) out.textContent='No questions from me this time. Read it aloud once before you publish it. That catches what I cannot.';
  else out.textContent='I have put '+asked+' question'+(asked===1?'':'s')+' next to what you wrote. None of them are rewrites. Answer them in your own words and the piece gets better on its own.';
}
$('#w-check').addEventListener('click',interrogate);

$('#w-export').addEventListener('click',function(){
  var md='# Draft\n\nPromise Oluwatosin Grace\nORCID 0009-0003-6045-432X\n\n';
  WB.forEach(function(b){
    var t=(S.writer[b.id]||'').trim();
    if(t) md+='## '+b.t+'\n\n'+t+'\n\n';
  });
  download('draft.md',md,'text/markdown');
  $('#w-out').hidden=false;
  $('#w-out').textContent='Exported. Your words, exactly as you wrote them.';
});

/* ---------------- predictions ---------------- */
var PREDICT={
  ph:{right:'a',yes:'Right. It collapses to nothing and you cannot read it, which is the whole problem the log solves.',no:'Not quite. It shrinks until you cannot see it at all. Fourteen powers of ten do not fit on a linear axis, and that is exactly why the log exists.'},
  arr:{right:'b',yes:'Right, roughly double for many reactions. That is the rule of thumb, and the exponential is why.',no:'It roughly doubles for many reactions. Ten degrees sounds small, but the relationship is exponential, so small changes in temperature do a lot.'},
  bg:{right:'a',yes:'Right, just about. Red at 700nm carries about 1.77 eV, comfortably over silicon at 1.1.',no:'It does, just about. Red at 700nm carries about 1.77 eV, and silicon needs 1.1. It is the infrared past roughly 1100nm that silicon cannot use.'},
  bud:{right:'b',yes:'Right, and it is worse than most people guess. 19.2 percent never gets absorbed and 31.7 percent is thrown away as heat the instant it does. Half the sunlight, before a single electron has gone anywhere.',no:'About half. 19.2 percent of the light is too weak for silicon to use at all, and 31.7 percent is the excess energy of photons that were strong enough, dumped as heat straight away. That leaves 49.1 percent still on the table.'},
  sq:{right:'b',yes:'Right. Both extremes lose, so the answer sits in the middle, near 1.34 eV.',no:'It is in the middle, near 1.34 eV. Small gaps catch everything but each photon gives little voltage. Large gaps give voltage but miss most of the light.'},
  bragg:{right:'b',yes:'Right, a bright peak. In step means they add together.',no:'A bright peak. In step means they reinforce each other, and that is the peak the detector records.'}
};
$$('.predict').forEach(function(p){
  var key=p.getAttribute('data-viz');
  var art=p.closest('.viz');
  $$('button',p).forEach(function(b){
    b.addEventListener('click',function(){
      var pick=b.getAttribute('data-a');
      var d=PREDICT[key]; if(!d) return;
      var ok = pick===d.right;
      var r=$('.predict-result',p);
      r.textContent = ok?d.yes:d.no;
      r.className='predict-result '+(ok?'right':'wrong');
      r.hidden=false;
      $$('button',p).forEach(function(x){x.disabled=true;});
      var body=$('.viz-body',art); if(body) body.hidden=false;
      var ann=$('.annotation',art); if(ann) ann.hidden=false;
      S.predicts[key]=pick;
      if(key==='arr') drawArr();
      if(key==='bud') drawBudget();
      if(key==='sq') drawSQ();
      if(key==='bragg') drawBragg();
    });
  });
});

/* ---------------- pH visualisation ---------------- */
function phUpdate(){
  var v=+$('#ph-conc').value;          /* 0..140 maps pH 14..0 */
  var pH=(140-v)/10;
  var conc=Math.pow(10,-pH);
  var mant=(conc/Math.pow(10,Math.floor(Math.log10(conc)))).toFixed(1);
  var expo=Math.floor(Math.log10(conc));
  $('#ph-conc-val').innerHTML=mant+' &times; 10<sup>'+expo+'</sup>';
  $('#ph-val').textContent=pH.toFixed(2);
  $('#ph-fill').style.height=(v/140*100)+'%';

  var pct=Math.min(100,conc/1*100);
  $('#ph-linear').style.width=Math.max(pct,0.02)+'%';
  $('#ph-linear-cap').textContent = pct<0.5
    ? 'The bar is now thinner than the line around it. This is where a linear scale gives up.'
    : (pct<8 ? 'Getting hard to read.' : 'Readable.');

  $('#ph-marker').style.left=((14-pH)/14*100)+'%';
}
if($('#ph-conc')){ $('#ph-conc').addEventListener('input',phUpdate); phUpdate(); }

/* ---------------- Arrhenius ----------------
   The second graph is captioned "ln k against 1/T" and the first version of
   it plotted ln k against T with the axis reversed. That is not a straight
   line and it is not what the label says. Measured: it bowed away from
   straight by 10.1 per cent of the plot height at 343 K, which is enough to
   see and little enough to get away with, so it read as "roughly linear" and
   nobody would have questioned it.

   The whole lesson of that figure is that the line IS straight and its slope
   hands you the activation energy. So the x axis is 1/T now, and the slope
   and the recovered Ea are both on screen, because a claim you can check is
   worth more than a claim you have to accept. */
var ARR_EA = 50000;                  // J per mol
var ARR_R  = 8.314;                  // J per mol per K
function arrK(T){ return Math.exp(-ARR_EA/(ARR_R*T)) / Math.exp(-ARR_EA/(ARR_R*300)); }

function drawArr(){
  var c1=$('#arr-c1'), c2=$('#arr-c2'); if(!c1) return;
  var T=+$('#arr-t').value;
  $('#arr-t-val').textContent=T;
  $('#arr-k-val').textContent=arrK(T).toFixed(2);
  $('#arr-fill').style.height=((T-280)/140*100)+'%';
  if($('#arr-inv-val')) $('#arr-inv-val').textContent=(1000/T).toFixed(3)+'e-3';

  var g1=c1.getContext('2d'), g2=c2.getContext('2d');
  [g1,g2].forEach(function(g){ g.clearRect(0,0,300,200); g.strokeStyle='#C5C7DC'; g.lineWidth=1;
    g.beginPath(); g.moveTo(34,10); g.lineTo(34,175); g.lineTo(290,175); g.stroke(); });

  /* left, the curve: k against T, linear in T */
  g1.strokeStyle='#332E5C'; g1.lineWidth=2; g1.beginPath();
  for(var i=0;i<=256;i++){
    var t=280+(i/256)*140, k=arrK(t);
    var x=34+i, y=175-Math.min(k/arrK(420),1)*160;
    i?g1.lineTo(x,y):g1.moveTo(x,y);
  }
  g1.stroke();
  g1.fillStyle='#8C2F45';
  var kx=34+((T-280)/140)*256, ky=175-Math.min(arrK(T)/arrK(420),1)*160;
  g1.beginPath(); g1.arc(kx,ky,4,0,7); g1.fill();
  g1.fillStyle='#615A6E'; g1.font='10px "IBM Plex Mono",monospace';
  g1.fillText('280 K',34,190); g1.fillText('420 K',258,190);

  /* right, the line: ln k against 1/T, linear in 1/T. Hot on the left,
     cold on the right, which is the way an Arrhenius plot is always drawn,
     and it is why the line runs downhill. */
  var iLo=1/420, iHi=1/280;                      // left edge, right edge
  function X(invT){ return 34 + ((invT-iLo)/(iHi-iLo))*256; }
  var yLo=Math.log(arrK(280)), yHi=Math.log(arrK(420));   // lowest, highest ln k
  function Y(lk){ return 175 - ((lk-yLo)/(yHi-yLo))*160; }

  g2.strokeStyle='#332E5C'; g2.lineWidth=2; g2.beginPath();
  for(var j=0;j<=256;j++){
    var inv=iLo+(j/256)*(iHi-iLo);
    var lk=Math.log(arrK(1/inv));
    j?g2.lineTo(X(inv),Y(lk)):g2.moveTo(X(inv),Y(lk));
  }
  g2.stroke();
  g2.fillStyle='#8C2F45';
  g2.beginPath(); g2.arc(X(1/T),Y(Math.log(arrK(T))),4,0,7); g2.fill();
  g2.fillStyle='#615A6E'; g2.font='10px "IBM Plex Mono",monospace';
  g2.fillText('hot',34,190); g2.fillText('cold',268,190);

  /* The slope is read off the plotted line, not printed from the constant
     that produced it, so the number is a recovery rather than an echo. */
  var slope=(Math.log(arrK(280))-Math.log(arrK(420)))/((1/280)-(1/420));
  if($('#arr-slope')) $('#arr-slope').textContent=Math.round(slope);
  if($('#arr-ea')) $('#arr-ea').textContent=(-slope*ARR_R/1000).toFixed(1);
}
if($('#arr-t')) $('#arr-t').addEventListener('input',drawArr);

/* ---------------- band gap ---------------- */
var MATS=[{n:'Germanium',g:0.67},{n:'Silicon',g:1.12},{n:'Perovskite',g:1.55},{n:'CdTe',g:1.45},{n:'GaAs',g:1.42},{n:'a-Si',g:1.70}];
function bgUpdate(){
  var wl=+$('#bg-wl').value;
  var E=1239.8/wl;
  $('#bg-wl-val').textContent=wl+' nm';
  $('#bg-e-val').textContent=E.toFixed(2)+' eV';
  $('#bg-region').textContent = wl<380?'Ultraviolet':(wl>750?'Infrared':'Visible');
  $('#bg-arrow').style.height=Math.min(E/3.2*78,78)+'px';
  $('#bg-gap-txt').textContent=E.toFixed(2)+' eV of push';

  var list=$('#bg-mats'); list.innerHTML='';
  MATS.forEach(function(m){
    var on=E>=m.g;
    var c=el('span','mat-chip'+(on?' on':''),m.n+' '+m.g.toFixed(2)+' eV'+(on?' \u2713':''));
    list.appendChild(c);
  });
}
if($('#bg-wl')){ $('#bg-wl').addEventListener('input',bgUpdate); bgUpdate(); }

/* ---------------- where the sunlight goes ----------------
   The measured AM1.5G spectrum with the two losses shaded. Every number is
   integrated from the published table in solar.js. Nothing here is a shape
   chosen to look right. */
function budGap(){ return $('#bud-gap') ? +$('#bud-gap').value/100 : 1.12; }

function drawBudget(){
  var c=$('#bud-canvas'); if(!c||!window.Solar) return;
  var g=c.getContext('2d'), W=640, H=300;
  var L=54, R=W-16, T=18, B=H-44;
  var eg=budGap();
  var E_LO=0.4, E_HI=3.6;
  function X(e){ return L+((e-E_LO)/(E_HI-E_LO))*(R-L); }
  var peak=0, i, e;
  for(e=E_LO;e<=E_HI;e+=0.01) peak=Math.max(peak,Solar.spectral(e));
  peak*=1.08;
  function Y(v){ return B-(v/peak)*(B-T); }

  g.clearRect(0,0,W,H);

  /* the two loss areas, filled under the real curve */
  function area(from,to,fill){
    g.beginPath(); g.moveTo(X(from),B);
    for(e=from;e<=to+1e-9;e+=0.01) g.lineTo(X(e),Y(Solar.spectral(e)));
    g.lineTo(X(to),B); g.closePath(); g.fillStyle=fill; g.fill();
  }
  /* below the gap: none of it is usable at all */
  area(E_LO,Math.min(eg,E_HI),'rgba(216,154,127,0.30)');
  /* above the gap: only the gap's worth is kept, the rest goes to heat.
     The kept part is a rectangle of height Eg under each photon, which in
     these axes is the curve scaled by Eg/E at every energy. */
  if(eg<E_HI){
    g.beginPath(); g.moveTo(X(eg),B);
    for(e=eg;e<=E_HI+1e-9;e+=0.01) g.lineTo(X(e),Y(Solar.spectral(e)));
    for(e=E_HI;e>=eg-1e-9;e-=0.01) g.lineTo(X(e),Y(Solar.spectral(e)*eg/e));
    g.closePath(); g.fillStyle='rgba(233,201,120,0.26)'; g.fill();

    g.beginPath(); g.moveTo(X(eg),B);
    for(e=eg;e<=E_HI+1e-9;e+=0.01) g.lineTo(X(e),Y(Solar.spectral(e)*eg/e));
    g.lineTo(X(E_HI),B); g.closePath();
    g.fillStyle='rgba(127,168,216,0.30)'; g.fill();
  }

  /* the spectrum itself */
  g.strokeStyle='#F1EFF5'; g.lineWidth=1.6; g.beginPath();
  for(e=E_LO,i=0;e<=E_HI+1e-9;e+=0.01,i++){ var xx=X(e), yy=Y(Solar.spectral(e)); i?g.lineTo(xx,yy):g.moveTo(xx,yy); }
  g.stroke();

  /* axes last, over the fills */
  g.strokeStyle='#4A4757'; g.lineWidth=1;
  g.beginPath(); g.moveTo(L,T); g.lineTo(L,B); g.lineTo(R,B); g.stroke();
  g.fillStyle='#B9B4C4'; g.font='10px "IBM Plex Mono",monospace';
  for(var ee=0.5;ee<=3.5;ee+=0.5){ g.fillText(ee.toFixed(1),X(ee)-8,B+15); }
  g.fillText('photon energy, eV',L,H-8);
  g.save(); g.translate(14,B); g.rotate(-Math.PI/2);
  g.fillText('W m-2 eV-1',0,0); g.restore();

  /* the gap line */
  g.strokeStyle='#8C2F45'; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(X(eg),T); g.lineTo(X(eg),B); g.stroke();
  g.fillStyle='#8C2F45'; g.font='500 11px "IBM Plex Mono",monospace';
  g.fillText('the gap', X(eg)+5, T+11);

  /* every region named as well as coloured, because colour alone is not
     allowed to be the thing carrying the meaning */
  var L2=Solar.losses(eg);
  g.font='10px "IBM Plex Mono",monospace';
  g.fillStyle='#D89A7F';
  if(eg>0.62) g.fillText('passes through', X(E_LO)+8, B-10);
  g.fillStyle='#E9C978'; g.fillText('lost as heat', X(Math.min(eg+0.12,E_HI-0.9)), Y(peak*0.55));
  g.fillStyle='#7FA8D8'; g.fillText('kept', X(Math.min(eg+0.28,E_HI-0.5)), B-12);

  $('#bud-gap-val').textContent=eg.toFixed(2)+' eV';
  $('#bud-below').textContent=L2.below.toFixed(1)+'%';
  $('#bud-therm').textContent=L2.thermal.toFixed(1)+'%';
  $('#bud-ult').textContent=L2.ultimate.toFixed(1)+'%';
  $('#bud-flux').innerHTML=(Solar.fluxAbove(eg)*1.602176634e-19/10).toFixed(1)+' mA cm<sup>-2</sup> worth';
  var msg=$('#bud-msg');
  if(msg){
    /* They add to a hundred by construction. The three figures shown above
       are each rounded to one decimal, so the visible ones can land a tenth
       out, and saying so is cheaper than pretending they do not. */
    var shown=(+L2.below.toFixed(1))+(+L2.thermal.toFixed(1))+(+L2.ultimate.toFixed(1));
    msg.textContent='Those three are the whole of the sunlight, cut into the part that never gets absorbed, the part that gets absorbed and immediately wasted, and the part still worth arguing about. They add to exactly one hundred at every gap.'+
      (Math.abs(shown-100)>0.049 ? ' The three figures above are each rounded to one decimal, which is why they read '+shown.toFixed(1)+' rather than 100.0.' : '');
  }
}
if($('#bud-gap')) $('#bud-gap').addEventListener('input',drawBudget);

/* ---------------- Shockley-Queisser ----------------
   Detailed balance, run here, on the measured spectrum. */
var sqTandem=false;
var sqCurve=null;                 /* cached, the single junction line never moves */

function sqGap(){ return +$('#sq-gap').value/100; }
function sqGap2(){ return +$('#sq-gap2').value/100; }

function sqSingleCurve(){
  if(sqCurve) return sqCurve;
  sqCurve=[];
  for(var i=0;i<=200;i++){
    var gv=0.4+(i/200)*2.6;
    var s=Solar.single(gv), l=Solar.losses(gv);
    sqCurve.push({g:gv,eta:s.eta,ult:l.ultimate,below:l.below});
  }
  return sqCurve;
}

/* The same four way split as the single junction, for a series pair. The
   bottom cell only gets what the top one let past. */
function sqTandemSplit(top,bot){
  var q=1.602176634e-19;
  var t=Solar.tandem(top,bot);
  var harvest=(top*q*Solar.fluxAbove(top)+bot*q*(Solar.fluxAbove(bot)-Solar.fluxAbove(top)))/Solar.PIN*100;
  var below=(Solar.PIN-Solar.powerAbove(bot))/Solar.PIN*100;
  return {eta:t.eta, ult:harvest, below:below, t:t};
}

function drawSQ(){
  var c=$('#sq-canvas'); if(!c||!window.Solar) return;
  var g=c.getContext('2d'), W=640, H=400;
  var L=54, R=W-16, T=16, B=H-44;
  var G_LO=0.4, G_HI=3.0;
  function X(v){ return L+((v-G_LO)/(G_HI-G_LO))*(R-L); }
  function Y(p){ return B-(p/100)*(B-T); }

  g.clearRect(0,0,W,H);

  var bot=sqTandem?sqGap2():null;
  var pts=[];
  var i,row;
  if(sqTandem){
    for(i=0;i<=200;i++){
      var gv=G_LO+(i/200)*(G_HI-G_LO);
      if(gv<=bot+0.02){ pts.push(null); continue; }
      var s=sqTandemSplit(gv,bot);
      pts.push({g:gv,eta:s.eta,ult:s.ult,below:s.below});
    }
  }else{
    sqSingleCurve().forEach(function(p){ pts.push(p); });
  }

  /* stacked bands, bottom up: what you get, what the voltage costs you,
     what heat takes, what never came in. They add to a hundred everywhere. */
  function band(lo,hi,fill){
    g.beginPath();
    var started=false, k;
    for(k=0;k<pts.length;k++){ row=pts[k]; if(!row) continue;
      var x=X(row.g), y=Y(lo(row)); started?g.lineTo(x,y):(g.moveTo(x,y),started=true); }
    for(k=pts.length-1;k>=0;k--){ row=pts[k]; if(!row) continue; g.lineTo(X(row.g),Y(hi(row))); }
    if(!started) return;
    g.closePath(); g.fillStyle=fill; g.fill();
  }
  band(function(r){return 0;},        function(r){return r.eta;},               'rgba(127,168,216,0.34)');
  band(function(r){return r.eta;},    function(r){return r.ult;},               'rgba(140,47,69,0.30)');
  band(function(r){return r.ult;},    function(r){return 100-r.below;},         'rgba(233,201,120,0.24)');
  band(function(r){return 100-r.below;}, function(r){return 100;},              'rgba(216,154,127,0.18)');

  /* grid and axes over the bands */
  g.fillStyle='#8A8496'; g.font='10px "IBM Plex Mono",monospace';
  for(var p=0;p<=100;p+=20){
    var yy=Y(p);
    g.strokeStyle='rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(L,yy); g.lineTo(R,yy); g.stroke();
    g.fillText(p+'%',22,yy+4);
  }
  g.strokeStyle='#4A4757'; g.lineWidth=1;
  g.beginPath(); g.moveTo(L,T); g.lineTo(L,B); g.lineTo(R,B); g.stroke();
  for(var gg=0.5;gg<=3.0;gg+=0.5) g.fillText(gg.toFixed(1),X(gg)-8,B+15);
  g.fillText(sqTandem?'top cell band gap, eV':'band gap, eV',L,H-8);

  /* the limit line itself, drawn heavy because it is the point */
  g.strokeStyle='#E9C978'; g.lineWidth=2.5; g.beginPath();
  var open=false;
  pts.forEach(function(r){ if(!r){ open=false; return; }
    var x=X(r.g), y=Y(r.eta); open?g.lineTo(x,y):(g.moveTo(x,y),open=true); });
  g.stroke();

  /* the single junction ceiling stays visible while the tandem is on, so the
     climb past it is something you watch rather than something I claim */
  if(sqTandem){
    g.strokeStyle='rgba(233,201,120,0.42)'; g.lineWidth=1.2; g.setLineDash([4,4]);
    g.beginPath();
    sqSingleCurve().forEach(function(r,k){ var x=X(r.g), y=Y(r.eta); k?g.lineTo(x,y):g.moveTo(x,y); });
    g.stroke(); g.setLineDash([]);
    g.fillStyle='rgba(233,201,120,0.75)';
    g.fillText('one junction alone', X(2.35), Y(Solar.single(2.35).eta)-8);
  }

  /* labels inside the bands, so the reading does not depend on colour */
  g.font='10px "IBM Plex Mono",monospace';
  function at(gv,lo,hi,txt,col){
    var r=null;
    pts.forEach(function(p){ if(p&&(!r||Math.abs(p.g-gv)<Math.abs(r.g-gv))) r=p; });
    if(!r) return;
    var y=(Y(lo(r))+Y(hi(r)))/2;
    g.fillStyle=col; g.fillText(txt,X(gv),y+3);
  }
  at(2.10,function(r){return 0;},function(r){return r.eta;},'the limit','#9CC0E8');
  at(2.10,function(r){return r.eta;},function(r){return r.ult;},'voltage and fill factor','#C77E90');
  at(0.95,function(r){return r.ult;},function(r){return 100-r.below;},'lost as heat','#E9C978');
  at(2.10,function(r){return 100-r.below;},function(r){return 100;},'passes through','#D89A7F');

  var sel=sqGap();
  var cur=sqTandem?sqTandemSplit(sel,bot):null;
  var eta=sqTandem?cur.eta:Solar.single(sel).eta;
  var sx=X(sel), sy=Y(eta);
  g.strokeStyle='#8C2F45'; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(sx,T); g.lineTo(sx,B); g.stroke();
  g.fillStyle='#8C2F45'; g.beginPath(); g.arc(sx,sy,5,0,7); g.fill();

  if(!sqTandem){
    /* Four of these sit within 0.15 eV of each other and the labels piled up
       on top of one another. Stack them by gap order instead. */
    var sorted=MATS.slice().filter(function(m){return m.g>=G_LO&&m.g<=G_HI;})
                          .sort(function(a,b){return a.g-b.g;});
    sorted.forEach(function(m,k){
      var x=X(m.g), y=Y(Solar.single(m.g).eta);
      g.fillStyle='#F1EFF5'; g.beginPath(); g.arc(x,y,3,0,7); g.fill();
      g.strokeStyle='rgba(241,239,245,0.35)'; g.lineWidth=1;
      var ly=y-11-(k%3)*13;
      g.beginPath(); g.moveTo(x,y-4); g.lineTo(x,ly+3); g.stroke();
      g.fillStyle='#D8D4E2'; g.font='10px "IBM Plex Mono",monospace';
      g.fillText(m.n,x-g.measureText(m.n).width/2,ly);
    });
  }

  sqReadout(sel,bot,cur);
}

function sqReadout(sel,bot,cur){
  var q=1.602176634e-19;
  $('#sq-gap-val').textContent=sel.toFixed(2)+' eV';
  if(sqTandem){
    var t=cur.t;
    $('#sq-gap2-val').textContent=bot.toFixed(2)+' eV';
    $('#sq-eff-val').textContent=cur.eta.toFixed(1)+'%';
    $('#sq-j').innerHTML=(t.j/10).toFixed(1)+' mA cm<sup>-2</sup> matched';
    $('#sq-v').textContent=t.v.toFixed(3)+' V total';
    var mismatch=Math.abs(t.jtop-t.jbot)/Math.max(t.jtop,t.jbot)*100;
    $('#sq-mat').textContent = t.limited+', by '+mismatch.toFixed(0)+' percent';
    var best=Solar.tandem(1.60,0.94).eta;
    $('#sq-msg').textContent='A single junction cannot pass 33.7 percent. Two can reach '+best.toFixed(1)+
      ' percent, at 1.60 eV over 0.94 eV. The heat band is what shrank: the photons the top cell would have wasted are now being caught lower down, at a voltage that suits them. '+
      (Math.abs(t.jtop-t.jbot)/Math.max(t.jtop,t.jbot)<0.03
        ? 'These two are close to current matched, which is where a series pair wants to be.'
        : 'These two are badly current matched. In series the weaker one sets the current for both, so the stronger one is being throttled.');
  }else{
    var s=Solar.single(sel);
    $('#sq-eff-val').textContent=s.eta.toFixed(1)+'%';
    $('#sq-j').innerHTML=(s.jsc/10).toFixed(1)+' mA cm<sup>-2</sup>';
    $('#sq-v').textContent=s.voc.toFixed(3)+' V';
    var near=MATS.slice().sort(function(a,b){return Math.abs(a.g-sel)-Math.abs(b.g-sel);})[0];
    $('#sq-mat').textContent=near.n;
    $('#sq-msg').textContent='The peak is 33.7 percent at 1.34 eV. The red band above the line is everything the diode itself costs you: the open circuit voltage comes out at '+
      s.voc.toFixed(2)+' V rather than '+sel.toFixed(2)+
      ' V, because a warm cell glows and that glow is a current flowing the wrong way.';
  }
}

if($('#sq-gap')) $('#sq-gap').addEventListener('input',drawSQ);
if($('#sq-gap2')) $('#sq-gap2').addEventListener('input',drawSQ);
if($('#sq-add')) $('#sq-add').addEventListener('click',function(){
  sqTandem=!sqTandem;
  this.setAttribute('aria-pressed',String(sqTandem));
  this.textContent=sqTandem?'Back to one junction':'Add a second junction underneath';
  $('#sq-second').hidden=!sqTandem;
  $('#sq-row2').hidden=!sqTandem;
  $('#sq-lab1').textContent=sqTandem?'Band gap, top cell':'Band gap';
  $('#sq-lab-gap').textContent=sqTandem?'TOP GAP':'BAND GAP';
  $('#sq-lab-j').textContent=sqTandem?'CURRENT THROUGH BOTH':'SHORT CIRCUIT CURRENT';
  $('#sq-lab-v').textContent=sqTandem?'VOLTAGE, THE TWO ADDED':'OPEN CIRCUIT VOLTAGE';
  $('#sq-lab-m').textContent=sqTandem?'WHICH CELL HOLDS THE PAIR BACK':'NEAREST MATERIAL';
  /* Start at the pair that actually wins, 1.60 over 0.94, because landing on
     a badly matched pair would show the limit falling and teach the opposite
     of the thing. Dragging away from it afterwards is the lesson. */
  if(sqTandem){ $('#sq-gap').value='160'; $('#sq-gap2').value='94'; }
  else { $('#sq-gap').value='134'; }
  drawSQ();
});

/* ---------------- the handoff ----------------
   The gap chosen on the spectrum is the same gap the limit is evaluated at.
   It is a real number travelling, not a mood, and it is named at both ends. */
if($('#bud-send')) $('#bud-send').addEventListener('click',function(){
  var eg=budGap();
  $('#sq-gap').value=String(Math.round(eg*100));
  var from=$('#sq-from');
  if(from){
    var l=Solar.losses(eg);
    from.textContent='Arrived from the spectrum above: a gap of '+eg.toFixed(2)+' eV, where '+
      l.below.toFixed(1)+' percent passes straight through and '+l.thermal.toFixed(1)+
      ' percent goes to heat, leaving '+l.ultimate.toFixed(1)+' percent. That '+l.ultimate.toFixed(1)+
      ' percent is the top of the blue and red bands below, at this gap. The limit is what survives underneath it.';
    from.hidden=false;
  }
  drawSQ();
  var art=$('#sq-canvas').closest('.viz');
  if(art) art.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
});

/* Steppers, so a value can be set exactly with a thumb rather than aimed at */
$$('.stepper').forEach(function(sp){
  var input=$('#'+sp.getAttribute('data-step-for'));
  if(!input) return;
  [['−',-1],['+',1]].forEach(function(pair){
    var b=el('button','',pair[0]);
    b.type='button';
    b.setAttribute('aria-label',(pair[1]<0?'Decrease ':'Increase ')+(input.previousElementSibling?'value':'value'));
    b.addEventListener('click',function(){
      var step=parseFloat(input.step)||1;
      var v=parseFloat(input.value)+pair[1]*step;
      input.value=String(Math.min(parseFloat(input.max),Math.max(parseFloat(input.min),v)));
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    sp.appendChild(b);
  });
});

/* ---------------- Bragg ---------------- */
function drawBragg(){
  var c=$('#bragg-canvas'); if(!c) return;
  var g=c.getContext('2d'), W=520,H=300;
  var th=+$('#bragg-theta').value, d=+$('#bragg-d').value/10;
  g.clearRect(0,0,W,H);
  g.fillStyle='#F1EBE0'; g.fillRect(0,0,W,H);

  var rows=3, y0=140, gapPx=d*22;
  g.fillStyle='#33543B';
  for(var r=0;r<rows;r++){
    var yy=y0+r*gapPx;
    for(var x=40;x<W-20;x+=30){ g.beginPath(); g.arc(x,yy,5,0,7); g.fill(); }
    g.strokeStyle='#C5C7DC'; g.beginPath(); g.moveTo(30,yy); g.lineTo(W-15,yy); g.stroke();
  }

  var rad=th*Math.PI/180;
  function beam(yy,col){
    var dx=110/Math.tan(rad);
    g.strokeStyle=col; g.lineWidth=1.8;
    g.beginPath(); g.moveTo(60-dx,yy-110); g.lineTo(260,yy); g.lineTo(260+dx,yy-110); g.stroke();
  }
  beam(y0,'#332E5C');
  beam(y0+gapPx,'#8A5A2B');

  var path=2*d*Math.sin(rad);
  var lam=1.54, n=path/lam;
  var order=Math.round(n);
  var near=Math.abs(n-order);

  /* The first version called anything within 0.06 of a whole number "IN STEP
     \u00B7 BRIGHT PEAK". Measured across the whole slider, that meant it claimed a
     bright peak up to 4.15 degrees away from the true angle, which in a real
     diffractometer is nowhere near it. A wide window is needed to find peaks
     with a slider, so the window stays and the claim gets graded instead, and
     the exact angle is shown so you can go to it. */
  var exact = null;
  if(order>=1){
    var s=order*lam/(2*d);
    if(s<=1) exact=Math.asin(s)*180/Math.PI;
  }
  var state = near<0.01 ? 'in' : (near<0.06 ? 'near' : 'off');

  $('#bg-theta').textContent=th.toFixed(1)+'\u00B0';
  $('#bg-d').textContent=d.toFixed(2)+' \u212B';
  $('#bg-path').textContent=path.toFixed(2)+' \u212B';
  if($('#bg-nwave')) $('#bg-nwave').textContent=n.toFixed(3);
  $('#bg-cond').textContent =
    state==='in'   ? ('peak, n = '+order) :
    state==='near' ? ('almost, n = '+order) : 'off peak';
  if($('#bg-exact')){
    $('#bg-exact').textContent = exact===null ? 'none at this spacing'
      : (exact.toFixed(1)+'\u00B0, ' + Math.abs(th-exact).toFixed(1)+'\u00B0 away');
  }

  g.fillStyle = state==='in' ? '#33543B' : (state==='near' ? '#8A5A2B' : '#615A6E');
  g.font='500 13px "IBM Plex Mono",monospace';
  g.fillText(
    state==='in'   ? 'IN STEP \u00B7 BRIGHT PEAK' :
    state==='near' ? 'ALMOST \u00B7 NOT QUITE A PEAK' :
                     'OUT OF STEP \u00B7 NOTHING', 40, 34);
  g.font='11px "IBM Plex Mono",monospace';
  g.fillStyle='#615A6E';
  g.fillText('n\u03BB = 2d sin\u03B8', 40, 54);

  /* The detector mark. Full height and solid on a real peak, short and
     faint when you are only close, so the picture grades the same way the
     words do rather than being on or off. */
  if(state!=='off'){
    g.strokeStyle = state==='in' ? '#33543B' : '#8A5A2B';
    g.lineWidth = state==='in' ? 3 : 1.5;
    g.beginPath();
    g.moveTo(W-60,40);
    g.lineTo(W-60, state==='in' ? 90 : 62);
    g.stroke();
  }
}
if($('#bragg-theta')){ $('#bragg-theta').addEventListener('input',drawBragg); $('#bragg-d').addEventListener('input',drawBragg); }

/* ---------------- unit cell ---------------- */
var UC={};
function initCell(){
  if(!window.THREE) return;
  var host=$('#cell-canvas'); if(!host) return;
  var w=host.clientWidth||440,h=host.clientHeight||260;
  UC.scene=new THREE.Scene();
  UC.cam=new THREE.PerspectiveCamera(40,w/h,0.1,100);
  UC.cam.position.set(3.4,2.7,3.9); UC.cam.lookAt(0,0,0);
  UC.ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  UC.ren.setPixelRatio(Math.min(window.devicePixelRatio,2));
  UC.ren.setSize(w,h); host.appendChild(UC.ren.domElement);
  UC.scene.add(new THREE.AmbientLight(0xffffff,0.8));
  var L=new THREE.DirectionalLight(0xffffff,0.6); L.position.set(4,6,5); UC.scene.add(L);
  UC.g=new THREE.Group(); UC.scene.add(UC.g);
  setCell('sc');

  var drag=false,px=0,py=0;
  host.addEventListener('mousedown',function(e){drag=true;px=e.clientX;py=e.clientY;});
  window.addEventListener('mousemove',function(e){ if(!drag)return;
    UC.g.rotation.y+=(e.clientX-px)*0.01; UC.g.rotation.x+=(e.clientY-py)*0.01; px=e.clientX;py=e.clientY; });
  window.addEventListener('mouseup',function(){drag=false;});
  host.tabIndex=0;
  host.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){UC.g.rotation.y-=0.15;e.preventDefault();}
    if(e.key==='ArrowRight'){UC.g.rotation.y+=0.15;e.preventDefault();}
    if(e.key==='ArrowUp'){UC.g.rotation.x-=0.15;e.preventDefault();}
    if(e.key==='ArrowDown'){UC.g.rotation.x+=0.15;e.preventDefault();}
  });

  drive(host, function(){
    if(!RM && !drag) UC.g.rotation.y+=0.004;
    UC.ren.render(UC.scene,UC.cam);
  });
}
function setCell(kind){
  if(!UC.g) return;
  while(UC.g.children.length) UC.g.remove(UC.g.children[0]);
  var geo=new THREE.SphereGeometry(0.26,16,14);
  var mat=new THREE.MeshLambertMaterial({color:0x33543B});
  var mid=new THREE.MeshLambertMaterial({color:0x8A5A2B});
  var pts=[];
  for(var x=-1;x<=1;x+=2)for(var y=-1;y<=1;y+=2)for(var z=-1;z<=1;z+=2) pts.push([x,y,z,0]);
  if(kind==='bcc') pts.push([0,0,0,1]);
  if(kind==='fcc'){
    pts.push([0,0,1,1],[0,0,-1,1],[0,1,0,1],[0,-1,0,1],[1,0,0,1],[-1,0,0,1]);
  }
  pts.forEach(function(p){
    var m=new THREE.Mesh(geo,p[3]?mid:mat);
    m.position.set(p[0],p[1],p[2]); UC.g.add(m);
  });
  var edges=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2,2,2)),
    new THREE.LineBasicMaterial({color:0x615A6E}));
  UC.g.add(edges);

  var info={sc:['Simple cubic','1','52%'],bcc:['Body centred','2','68%'],fcc:['Face centred','4','74%']}[kind];
  $('#cell-type').textContent=info[0];
  $('#cell-count').textContent=info[1];
  $('#cell-pack').textContent=info[2];
}
$$('[data-cell]').forEach(function(b){
  b.addEventListener('click',function(){ setCell(b.getAttribute('data-cell')); });
});

/* ---------------- data ---------------- */
function download(name,text,type){
  var b=new Blob([text],{type:type||'application/json'});
  var u=URL.createObjectURL(b);
  var a=document.createElement('a'); a.href=u; a.download=name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(u);},1000);
}
$('#d-export').addEventListener('click',function(){
  download('my-progress.json',JSON.stringify(S,null,2));
  $('#d-msg').textContent='Downloaded. Keep it somewhere you will find it again.';
});
$('#d-import').addEventListener('change',function(e){
  var f=e.target.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var o=JSON.parse(r.result);
      ['done','diff','hours','papers','writer','predicts','days','sessions','letters'].forEach(function(k){ if(o[k]) S[k]=o[k]; });
      renderPhases(); renderPapers(); renderWriter(); refresh();
      $('#d-msg').textContent='Loaded. Picking up where you left off.';
    }catch(err){
      $('#d-msg').textContent='That file would not open. It needs to be one this page made. Nothing has changed.';
    }
  };
  r.onerror=function(){ $('#d-msg').textContent='Could not read that file. Nothing has changed.'; };
  r.readAsText(f);
});

$('#start-phase0').addEventListener('click',function(){
  var h=$$('.phase-head')[0];
  if(h && $('#ph-body-0').hidden) h.click();
  $('#plan').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
});

/* ---------------- go ---------------- */
renderStatus();
renderPhases();
renderPapers();
renderWriter();
refresh();
initCrystal();
initCell();

})();
