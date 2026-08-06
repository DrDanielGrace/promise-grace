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

/* ---------------- telemetry ---------------- */
function refresh(){
  var t=totals();
  var days=Math.max(0,Math.floor((Date.now()-NUCLEATED.getTime())/86400000));
  $('#t-atoms').textContent=t.atoms;
  $('#t-defects').textContent=t.defects;
  $('#t-phase').textContent=t.phase;
  $('#t-days').textContent=days;

  var hrs=0; for(var k in S.hours) hrs+=S.hours[k]||0;
  $('#t-growth').textContent = !t.any ? 'not started' : (hrs>20?'steady':(hrs>5?'slow':'just nucleated'));

  $('#crystal-alt').textContent =
    'The crystal currently has '+t.atoms+' atoms and '+t.defects+
    ' defects, at phase '+t.phase+', '+days+' days since it started growing.'+
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

/* ---------------- Arrhenius ---------------- */
function arrK(T){ return Math.exp(-50000/(8.314*T)) / Math.exp(-50000/(8.314*300)); }
function drawArr(){
  var c1=$('#arr-c1'), c2=$('#arr-c2'); if(!c1) return;
  var T=+$('#arr-t').value;
  $('#arr-t-val').textContent=T;
  $('#arr-k-val').textContent=arrK(T).toFixed(2);
  $('#arr-fill').style.height=((T-280)/140*100)+'%';

  var g1=c1.getContext('2d'), g2=c2.getContext('2d');
  [g1,g2].forEach(function(g){ g.clearRect(0,0,300,200); g.strokeStyle='#C5C7DC'; g.lineWidth=1;
    g.beginPath(); g.moveTo(34,10); g.lineTo(34,175); g.lineTo(290,175); g.stroke(); });

  /* curve */
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

  /* straight line */
  g2.strokeStyle='#332E5C'; g2.lineWidth=2; g2.beginPath();
  var lo=Math.log(arrK(280)), hi=Math.log(arrK(420));
  for(var j=0;j<=256;j++){
    var tt=280+(j/256)*140, lk=Math.log(arrK(tt));
    var xx=34+256-j, yy=175-((lk-lo)/(hi-lo))*160;
    j?g2.lineTo(xx,yy):g2.moveTo(xx,yy);
  }
  g2.stroke();
  g2.fillStyle='#8C2F45';
  var lx=34+256-((T-280)/140)*256, ly=175-((Math.log(arrK(T))-lo)/(hi-lo))*160;
  g2.beginPath(); g2.arc(lx,ly,4,0,7); g2.fill();
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

/* ---------------- Shockley-Queisser ---------------- */
function sqEff(g){
  /* illustrative shape, peak 33.7 at 1.34 */
  var d=g-1.34;
  var e=33.7-(d>0?15.5:29)*d*d;
  return Math.max(0,e);
}
function drawSQ(){
  var c=$('#sq-canvas'); if(!c) return;
  var g=c.getContext('2d'), W=640,H=380;
  g.clearRect(0,0,W,H);
  g.strokeStyle='#33303F'; g.lineWidth=1;
  g.beginPath(); g.moveTo(56,18); g.lineTo(56,H-42); g.lineTo(W-18,H-42); g.stroke();

  g.fillStyle='#615A6E'; g.font='11px "IBM Plex Mono",monospace';
  for(var e=0;e<=35;e+=10){ var yy=(H-42)-(e/38)*(H-70); g.fillText(e+'%',22,yy+4);
    g.strokeStyle='#2A2836'; g.beginPath(); g.moveTo(56,yy); g.lineTo(W-18,yy); g.stroke(); }
  for(var gg=0.5;gg<=3.0;gg+=0.5){ var xx=56+((gg-0.5)/2.5)*(W-80); g.fillText(gg.toFixed(1),xx-8,H-24); }

  g.strokeStyle='#E9C978'; g.lineWidth=2.5; g.beginPath();
  for(var i=0;i<=250;i++){
    var gv=0.5+(i/250)*2.5, ev=sqEff(gv);
    var x=56+(i/250)*(W-80), y=(H-42)-(ev/38)*(H-70);
    i?g.lineTo(x,y):g.moveTo(x,y);
  }
  g.stroke();

  MATS.forEach(function(m){
    if(m.g<0.5||m.g>3)return;
    var x=56+((m.g-0.5)/2.5)*(W-80), y=(H-42)-(sqEff(m.g)/38)*(H-70);
    g.fillStyle='#7FA8D8'; g.beginPath(); g.arc(x,y,3.5,0,7); g.fill();
    g.fillStyle='#B9B4C4'; g.font='10px "IBM Plex Mono",monospace';
    g.fillText(m.n,x-14,y-9);
  });

  var sel=+$('#sq-gap').value/100;
  var sx=56+((sel-0.5)/2.5)*(W-80), sy=(H-42)-(sqEff(sel)/38)*(H-70);
  g.strokeStyle='#8C2F45'; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(sx,18); g.lineTo(sx,H-42); g.stroke();
  g.fillStyle='#8C2F45'; g.beginPath(); g.arc(sx,sy,5,0,7); g.fill();

  $('#sq-gap-val').textContent=sel.toFixed(2)+' eV';
  $('#sq-eff-val').textContent=sqEff(sel).toFixed(1)+'%';
  var near=MATS.slice().sort(function(a,b){return Math.abs(a.g-sel)-Math.abs(b.g-sel);})[0];
  $('#sq-mat').textContent=near.n;
}
if($('#sq-gap')) $('#sq-gap').addEventListener('input',drawSQ);

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
  var near=Math.abs(n-Math.round(n));
  var hit=near<0.06 && Math.round(n)>=1;

  $('#bg-theta').textContent=th.toFixed(1)+'\u00B0';
  $('#bg-d').textContent=d.toFixed(2)+' \u212B';
  $('#bg-path').textContent=path.toFixed(2)+' \u212B';
  $('#bg-cond').textContent=hit?('peak, n = '+Math.round(n)):'off peak';

  g.fillStyle=hit?'#33543B':'#615A6E';
  g.font='500 13px "IBM Plex Mono",monospace';
  g.fillText(hit?'IN STEP \u00B7 BRIGHT PEAK':'OUT OF STEP \u00B7 NOTHING', 40, 34);
  g.font='11px "IBM Plex Mono",monospace';
  g.fillStyle='#615A6E';
  g.fillText('n\u03BB = 2d sin\u03B8', 40, 54);

  if(hit){
    g.strokeStyle='#33543B'; g.lineWidth=3;
    g.beginPath(); g.moveTo(W-60,40); g.lineTo(W-60,90); g.stroke();
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
renderPhases();
renderPapers();
renderWriter();
refresh();
initCrystal();
initCell();

})();
