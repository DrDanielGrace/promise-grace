/* =========================================================================
   audio.js · four buses, three depths, one context

   WHY THIS EXISTS

   The old sound was one bus and one volume. That was survivable with five
   recordings and a mute button. It is not survivable with sixteen
   simulations, continuous beds under the running ones, and a reader who
   wants the room noise down but the instrument still audible.

   So: four buses that a person can actually set against each other.

     UI          navigation, buttons, panels, a control appearing
     SIMULATION  events inside a running simulation
     AMBIENT     the continuous bed underneath one
     MASTER      above all three

   Each is a real gain with its own fader, and each is silent at zero. Not
   quiet at zero. Silent. There is a measurement for that.

   THREE DEPTH PLANES

   One flat mix is what makes a set of sounds feel like a set of files. Each
   bus sits in its own room and at its own distance:

     UI          dry and close, a very short room, almost no send
     SIMULATION  mid, the bench room that the recordings already shared
     AMBIENT     back, a long send, most of what you hear is the room
                 rather than the source, and the top is rolled off because
                 distance takes the top off things

   Each bus owns its own convolver rather than sharing one, because a shared
   convolver would pour the ambient tail through the UI fader and a fader
   that moves something it does not name is worse than no fader.

   NOTHING REPEATS EXACTLY

   Every sample is declared with at least three variants: a different window
   into the recording, a slightly different rate, a slightly different level,
   a slightly different place in the room. They are played round robin rather
   than at random, so the same variant can never land twice running, which is
   the thing the ear actually catches.

   STATE

   Levels live in the address bar, never in storage, so a link carries the
   mix. Off on load. Nothing is fetched until it is switched on, and that is
   measurable as zero bytes in the network panel.
   ========================================================================= */

window.Aud = (function () {
  "use strict";

  /* ----------------------------------------------------------------------
     THE FILES

     The first five were sourced for the notebook and are unchanged. The
     seven below them were sourced for this, one per interaction type,
     because a button and a panel and a control appearing are three
     different physical events and one recording cannot be all three.
     ---------------------------------------------------------------------- */
  var FILES = {
    drop:    "assets/sound/drop.mp3",
    glass:   "assets/sound/glass.mp3",
    paper:   "assets/sound/paper.mp3",
    stopper: "assets/sound/stopper.mp3",
    swirl:   "assets/sound/swirl.mp3",

    "switch":  "assets/sound/switch.mp3",   /* a light switch giving */
    latch:     "assets/sound/latch.mp3",    /* a latch opening */
    cloth:     "assets/sound/cloth.mp3",    /* heavy cloth moving */
    swell:     "assets/sound/swell.mp3",    /* a timpani rolled with a soft mallet */
    shut:      "assets/sound/shut.mp3",     /* a cabinet drawer closing */
    dispatch:  "assets/sound/dispatch.mp3", /* a letter through a letterbox */
    done:      "assets/sound/done.mp3",     /* a crossbar relay releasing */
    settle:    "assets/sound/settle.mp3",   /* seed poured into a jar */
    water:     "assets/sound/water.mp3",    /* the convection bed */
    room:      "assets/sound/room.mp3"      /* the still bed */
  };

  var BUSES = ["ui", "sim", "ambient", "master"];

  var LABEL = {
    ui: "UI", sim: "SIMULATION", ambient: "AMBIENT", master: "MASTER"
  };

  var DEFAULT = { ui: 0.70, sim: 0.70, ambient: 0.55, master: 0.70 };

  /* dry, send, and how far back the plane sits */
  var PLANE = {
    ui:      { dry: 0.98, wet: 0.05, room: 0.10, tone: 0 },
    sim:     { dry: 0.84, wet: 0.20, room: 0.26, tone: 0 },
    ambient: { dry: 0.34, wet: 0.62, room: 1.35, tone: 3200 }
  };

  var level = { ui: DEFAULT.ui, sim: DEFAULT.sim,
                ambient: DEFAULT.ambient, master: DEFAULT.master };

  var on = false;
  var ctx = null;
  var master = null;
  var bus = {};
  var buffers = {};
  var asked = {};
  var lastAt = {};
  var rr = {};
  var beds = {};
  var base = "";
  var levelListeners = [];


  /* ----------------------------------------------------------------------
     ROOMS

     A decaying burst of noise, darkened, used as an impulse response. Three
     sizes: a cupboard, a room with a bench in it, and a hall you are stood
     at the back of.
     ---------------------------------------------------------------------- */
  function makeRoom(secs, dark) {
    var n = Math.max(64, Math.floor(ctx.sampleRate * secs));
    var buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      var last = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n;
        var white = Math.random() * 2 - 1;
        last = last * dark + white * (1 - dark);
        d[i] = last * Math.pow(1 - t, secs > 0.8 ? 2.1 : 3.2) *
               (i < 40 ? i / 40 : 1);
      }
    }
    return buf;
  }

  function makeBus(id) {
    var p = PLANE[id];
    var b = {};
    b.input = ctx.createGain();
    b.level = ctx.createGain();
    b.level.gain.value = level[id];

    b.dry = ctx.createGain();
    b.dry.gain.value = p.dry;
    b.input.connect(b.dry);

    if (p.tone) {
      /* Distance takes the top off a thing. This is the only reason the
         ambient bed reads as further away rather than merely quieter. */
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = p.tone;
      lp.Q.value = 0.5;
      b.dry.connect(lp); lp.connect(b.level);
    } else {
      b.dry.connect(b.level);
    }

    try {
      var conv = ctx.createConvolver();
      conv.buffer = makeRoom(p.room, p.room > 0.8 ? 0.80 : 0.72);
      b.send = ctx.createGain();
      b.send.gain.value = p.wet;
      b.input.connect(b.send);
      b.send.connect(conv);
      conv.connect(b.level);
    } catch (e) { b.send = null; }

    b.level.connect(master);
    return b;
  }

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = level.master;
    master.connect(ctx.destination);
    bus.ui = makeBus("ui");
    bus.sim = makeBus("sim");
    bus.ambient = makeBus("ambient");
    return ctx;
  }


  /* ----------------------------------------------------------------------
     LOADING. Nothing here runs until sound is switched on.
     ---------------------------------------------------------------------- */
  function fetchOne(name) {
    if (buffers[name] || asked[name] || !FILES[name] || !ctx) return;
    asked[name] = true;
    var req = new XMLHttpRequest();
    req.open("GET", base + FILES[name], true);
    req.responseType = "arraybuffer";
    req.onload = function () {
      if (req.status >= 400) return;
      ctx.decodeAudioData(req.response,
        function (b) { buffers[name] = b; pending(name); },
        function () {});
    };
    try { req.send(); } catch (e) {}
  }

  /* A bed asked for before its file arrived starts as soon as it does,
     rather than being silently dropped. */
  var waiting = {};
  function pending(name) {
    var w = waiting[name];
    if (!w) return;
    delete waiting[name];
    w.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function whenReady(name, fn) {
    if (buffers[name]) { fn(); return; }
    (waiting[name] || (waiting[name] = [])).push(fn);
    fetchOne(name);
  }

  /* The two beds are twelve seconds each and weigh more than everything else
     put together. Switching sound on does not fetch them; asking for a bed
     does. A page with no bed on it never pays for one. */
  var LAZY = { water: 1, room: 1 };

  function warm(names) {
    (names || Object.keys(FILES).filter(function (n) { return !LAZY[n]; }))
      .forEach(fetchOne);
  }


  /* ----------------------------------------------------------------------
     VARIANTS, ROUND ROBIN

     Never at random. A random pick of three lands the same one twice about
     a third of the time and the ear hears that as a repeat, which is the
     exact thing the variants exist to prevent.
     ---------------------------------------------------------------------- */
  function order(n, avoid) {
    var a = [], i;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    if (n > 1 && a[0] === avoid) { a[0] = a[1]; a[1] = avoid; }
    return a;
  }

  function nextVariant(key, n) {
    var s = rr[key];
    if (!s || s.i >= s.order.length) {
      s = rr[key] = { order: order(n, s ? s.order[s.order.length - 1] : -1), i: 0 };
    }
    return s.order[s.i++];
  }

  function clear(key, gapMs) {
    var t = Date.now();
    if (lastAt[key] && t - lastAt[key] < (gapMs === undefined ? 70 : gapMs)) return false;
    lastAt[key] = t;
    return true;
  }


  /* ----------------------------------------------------------------------
     PLAYING

     `from` and `len` take a window out of a longer recording. `dark` rolls
     the top off, which is how a thing sounds damped rather than lower.
     `pan` moves it a little way across the bench.
     ---------------------------------------------------------------------- */
  function fire(name, o) {
    if (!on || !ctx) return null;
    o = o || {};
    var b = bus[o.bus || "sim"];
    if (!b) return null;
    if (o.gap !== 0 && !clear(o.key || name, o.gap)) return null;

    var buf = buffers[name];
    if (!buf) { fetchOne(name); return null; }

    var rate = o.rate || 1;
    var from = Math.max(0, Math.min(o.from || 0, Math.max(0, buf.duration - 0.02)));
    var len = o.len || ((buf.duration - from) / rate);
    len = Math.max(0.01, Math.min(len, (buf.duration - from) / rate));

    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;

    var t0 = ctx.currentTime;
    var gain = o.gain === undefined ? 0.4 : o.gain;
    var fade = Math.min(o.fade || 0.05, len * 0.35);

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.008, len * 0.2));
    g.gain.setValueAtTime(gain, t0 + Math.max(0.01, len - fade));
    g.gain.linearRampToValueAtTime(0.0001, t0 + len);

    var node = src;
    if (o.dark) {
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.dark;
      lp.Q.value = 0.6;
      src.connect(lp); node = lp;
    }
    if (o.thin) {
      var hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = o.thin;
      hp.Q.value = 0.5;
      node.connect(hp); node = hp;
    }
    node.connect(g);

    var tail = g;
    if (o.pan && ctx.createStereoPanner) {
      var p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(o.pan, 1));
      g.connect(p); tail = p;
    }
    tail.connect(b.input);

    src.start(t0, from);
    src.stop(t0 + len + 0.04);
    return src;
  }

  /* A sample declared once, with its variants, and played by name. This is
     what stops a sound being reused for two different things: the thing is
     the declaration, not the file. */
  var VOICES = {};

  function define(voice, spec) { VOICES[voice] = spec; }

  function play(voice, extra) {
    var s = VOICES[voice];
    if (!s) return null;
    var v = s.variants[nextVariant(voice, s.variants.length)];
    var o = {}, k;
    for (k in s) if (k !== "variants") o[k] = s[k];
    for (k in v) o[k] = v[k];
    if (extra) for (k in extra) o[k] = extra[k];
    o.key = voice;
    if (o.gain !== undefined && extra && extra.scale) o.gain *= extra.scale;
    return fire(s.file, o);
  }


  /* ----------------------------------------------------------------------
     BEDS

     A loop on the ambient bus, faded rather than started and stopped, so a
     reader never hears it arrive. Two of them run against each other under
     the crystal: water when there is convection, room tone when there is
     not. Their levels are crossfaded by the physics.
     ---------------------------------------------------------------------- */
  function bed(name, o) {
    o = o || {};
    var h = beds[name];
    if (h) return h;
    h = beds[name] = { level: 0, target: 0, gain: null, src: null, dead: false };

    whenReady(name, function () {
      if (h.dead || !ctx || !bus.ambient) return;
      var buf = buffers[name];
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      if (o.loopIn !== undefined) src.loopStart = o.loopIn;
      if (o.loopOut !== undefined) src.loopEnd = Math.min(o.loopOut, buf.duration);
      src.playbackRate.value = o.rate || 1;

      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = o.dark || 5200;
      lp.Q.value = 0.4;

      var g = ctx.createGain();
      g.gain.value = 0.0001;

      src.connect(lp); lp.connect(g);
      g.connect(bus.ambient.input);
      src.start(0, o.from || 0);

      h.gain = g; h.src = src; h.cap = o.cap === undefined ? 0.5 : o.cap;
      h.set(h.target);
    });

    h.set = function (x) {
      h.target = Math.max(0, Math.min(x, 1));
      if (!h.gain || !ctx) return;
      var v = Math.max(0.00012, h.target * (h.cap || 0.5));
      h.gain.gain.cancelScheduledValues(ctx.currentTime);
      h.gain.gain.setTargetAtTime(v, ctx.currentTime, o.glide || 0.45);
    };
    h.stop = function () {
      h.dead = true;
      if (h.gain && ctx) h.gain.gain.setTargetAtTime(0.00012, ctx.currentTime, 0.3);
      if (h.src) { var s = h.src; setTimeout(function () { try { s.stop(); } catch (e) {} }, 1400); }
      delete beds[name];
    };
    return h;
  }

  function stopBeds() {
    Object.keys(beds).forEach(function (k) { beds[k].stop(); });
  }


  /* ----------------------------------------------------------------------
     A RAW NODE, for the synthesised textures that still live in sound.js
     ---------------------------------------------------------------------- */
  function input(which) {
    if (!ctx) return null;
    var b = bus[which || "sim"];
    return b ? b.input : null;
  }


  /* ----------------------------------------------------------------------
     LEVELS
     ---------------------------------------------------------------------- */
  function set(id, v) {
    if (BUSES.indexOf(id) < 0) return;
    v = Math.max(0, Math.min(v, 1));
    level[id] = v;
    if (ctx) {
      var node = id === "master" ? master : (bus[id] && bus[id].level);
      if (node) {
        node.gain.cancelScheduledValues(ctx.currentTime);
        /* Straight to zero when it is zero. A ramp towards a small number is
           how a fader ends up "basically silent" instead of silent. */
        if (v === 0) node.gain.setValueAtTime(0, ctx.currentTime);
        else node.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
      }
    }
    paint();
    writeState();
    levelListeners.forEach(function (fn) { try { fn(id, v); } catch (e) {} });
  }

  function get(id) { return level[id]; }

  /* Serialised as four percentages, so a shared link carries the mix and a
     default mix adds nothing to the address bar. */
  function serialize() {
    var same = BUSES.every(function (b) { return Math.abs(level[b] - DEFAULT[b]) < 0.005; });
    if (same) return "";
    return BUSES.map(function (b) { return Math.round(level[b] * 100); }).join(".");
  }

  function deserialize(s) {
    if (!s) return;
    var parts = String(s).split(".");
    if (parts.length !== 4) return;
    BUSES.forEach(function (b, i) {
      var v = parseFloat(parts[i]);
      if (isFinite(v)) level[b] = Math.max(0, Math.min(v / 100, 1));
    });
  }

  function writeState() {
    if (window.Sim && Sim.writeUrl) { Sim.writeUrl(); return; }
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams(location.search);
    var v = serialize();
    if (v) p.set("mix", v); else p.delete("mix");
    var q = p.toString();
    history.replaceState(null, "", q ? "?" + q + location.hash
                                     : location.pathname + location.hash);
  }


  /* ----------------------------------------------------------------------
     THE PANEL

     Four faders and nothing else. It carries its own styling so that no
     other stylesheet has to know it exists, which is what lets it appear on
     the notebook without touching the notebook.
     ---------------------------------------------------------------------- */
  var panel = null, fields = {};

  function css() {
    if (document.getElementById("aud-css")) return;
    var s = document.createElement("style");
    s.id = "aud-css";
    s.textContent = [
      ".aud{position:fixed;right:0.75rem;bottom:4.1rem;z-index:60;width:15.5rem;",
      "background:#16171b;color:#e7e4dd;border:1px solid #33353c;border-radius:2px;",
      "padding:0.85rem 0.9rem 0.95rem;font:400 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;",
      "box-shadow:0 8px 26px rgba(0,0,0,0.34);display:none}",
      ".aud[data-open=\"1\"]{display:block}",
      ".aud h2{margin:0 0 0.65rem;font:inherit;letter-spacing:0.09em;color:#8d8a83;text-transform:uppercase}",
      ".aud-row{display:grid;grid-template-columns:5.4rem 1fr 2.4rem;align-items:center;gap:0.5rem;margin:0 0 0.5rem}",
      ".aud-row:last-of-type{margin-bottom:0;padding-top:0.5rem;border-top:1px solid #2a2c32}",
      ".aud-row label{letter-spacing:0.07em;color:#b4b0a8;font-size:11px}",
      ".aud-row output{text-align:right;font-variant-numeric:tabular-nums;color:#e7e4dd}",
      ".aud-row input[type=range]{width:100%;min-height:44px;background:transparent;margin:0;",
      "accent-color:#c78f4a}",
      ".aud-note{margin:0.7rem 0 0;color:#77746e;font-size:11px;line-height:1.45}",
      ".aud-levels{position:fixed;right:0.75rem;bottom:0.75rem;z-index:60;",
      "min-height:44px;min-width:44px;padding:0.5rem 0.8rem;background:#16171b;color:#c8c4bc;",
      "border:1px solid #33353c;border-radius:2px;font:400 11px/1 ui-monospace,monospace;",
      "letter-spacing:0.08em;cursor:pointer}",
      ".aud-levels[aria-expanded=\"true\"]{color:#e7e4dd;border-color:#5a5d66}",
      "@media (max-width:480px){.aud{left:0.75rem;width:auto}}"
    ].join("");
    document.head.appendChild(s);
  }

  function paint() {
    BUSES.forEach(function (b) {
      var f = fields[b];
      if (!f) return;
      f.range.value = String(Math.round(level[b] * 100));
      f.out.textContent = Math.round(level[b] * 100) + "%";
    });
  }

  function buildPanel() {
    if (panel) return;
    css();

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "aud-levels";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("data-aud-open", "");
    btn.textContent = "Levels";

    panel = document.createElement("section");
    panel.className = "aud";
    panel.setAttribute("data-open", "0");
    panel.setAttribute("aria-label", "Sound levels");

    var h = document.createElement("h2");
    h.textContent = "Levels";
    panel.appendChild(h);

    BUSES.forEach(function (b) {
      var row = document.createElement("div");
      row.className = "aud-row";
      var id = "aud-" + b;
      var lab = document.createElement("label");
      lab.setAttribute("for", id);
      lab.textContent = LABEL[b];
      var r = document.createElement("input");
      r.type = "range"; r.id = id; r.min = "0"; r.max = "100"; r.step = "1";
      r.value = String(Math.round(level[b] * 100));
      var o = document.createElement("output");
      o.textContent = Math.round(level[b] * 100) + "%";
      r.addEventListener("input", function () {
        set(b, parseFloat(r.value) / 100);
        /* A fader is a slider, and the site already has a slider: a
           fingertip moving across paper, synthesised, no pitch. Giving the
           audio panel its own recording would have been one more sample
           doing a job that was already taken. */
        if (on && window.Snd) Snd.slide();
      });
      row.appendChild(lab); row.appendChild(r); row.appendChild(o);
      panel.appendChild(row);
      fields[b] = { range: r, out: o };
    });

    var note = document.createElement("p");
    note.className = "aud-note";
    note.textContent = "Four buses. Each one is silent at zero, and the mix travels in the link.";
    panel.appendChild(note);

    btn.addEventListener("click", function () {
      var open = panel.getAttribute("data-open") === "1";
      panel.setAttribute("data-open", open ? "0" : "1");
      btn.setAttribute("aria-expanded", String(!open));
      if (on) play(open ? "unlatch" : "latch");
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    paint();
    stack(btn);
  }

  /* That corner is already occupied, and by how many things depends on
     which page this is: the notebook has a sound toggle and a pages
     control, the instrument has only the toggle and keeps it on the left.
     Rather than have this file guess, or have any stylesheet learn about
     another, find whatever is already pinned to the bottom right and sit
     above the highest of them. */
  function stack(btn) {
    var tries = 0;

    function occupied() {
      var w = window.innerWidth, h = window.innerHeight, top = h;
      var found = false;
      Array.prototype.slice.call(document.body.children).forEach(function (el) {
        if (el === btn || el === panel || !el.getBoundingClientRect) return;
        var cs = window.getComputedStyle(el);
        if (cs.position !== "fixed" || cs.display === "none") return;
        var r = el.getBoundingClientRect();
        if (!r.height || !r.width) return;
        if (r.right < w * 0.55) return;          /* not this corner */
        if (h - r.bottom > 140) return;          /* not near the bottom */
        found = true;
        if (r.top < top) top = r.top;
      });
      return found ? top : null;
    }

    function place() {
      var top = occupied();
      if (top === null) {
        /* sound.js builds its toggle on the same DOMContentLoaded this file
           does, and this file goes first, so the first look finds nothing.
           Look again for a second rather than assuming an order. */
        if (tries++ < 12) setTimeout(place, 90);
        return;
      }
      var lift = Math.round(window.innerHeight - top + 8);
      btn.style.bottom = lift + "px";
      panel.style.bottom =
        (lift + Math.round(btn.getBoundingClientRect().height) + 8) + "px";
    }

    requestAnimationFrame(place);
    window.addEventListener("resize", function () { tries = 0; place(); });
  }


  /* ----------------------------------------------------------------------
     THE VOICE TABLE

     One entry per interaction type, so no two kinds of interaction can end
     up sharing a sample by accident. Three or more variants each.

     Every `from` below was set from a measured onset rather than guessed.
     Each recording was trimmed so that its transient sits a few tens of
     milliseconds in, and the windows start just before it, which is what
     keeps the delay between a press and a sound under fifty milliseconds
     without cutting the attack off.
     ---------------------------------------------------------------------- */
  function declare() {
    /* A button. Not a click. A light switch giving under a finger.
       Onset at 0.080, gone by 0.260. */
    define("button", {
      file: "switch", bus: "ui", gap: 45,
      variants: [
        { from: 0.072, len: 0.22, gain: 0.125, rate: 1.00, pan: -0.06, dark: 6400 },
        { from: 0.076, len: 0.21, gain: 0.110, rate: 1.05, pan:  0.05, dark: 5600 },
        { from: 0.070, len: 0.23, gain: 0.118, rate: 0.96, pan:  0.00, dark: 7000 },
        { from: 0.074, len: 0.20, gain: 0.104, rate: 1.02, pan:  0.09, dark: 6000 }
      ]
    });

    /* A panel opening. A latch, which is a thing coming free rather than a
       thing being pressed. Energy from the first sample. */
    define("latch", {
      file: "latch", bus: "ui", gap: 120,
      variants: [
        { from: 0.000, len: 0.58, gain: 0.088, rate: 0.98, pan: -0.10, dark: 5200 },
        { from: 0.010, len: 0.56, gain: 0.080, rate: 1.03, pan:  0.08, dark: 4600 },
        { from: 0.005, len: 0.60, gain: 0.084, rate: 1.00, pan:  0.02, dark: 5800 }
      ]
    });

    /* The same latch going the other way: a panel closing. Same object,
       opposite direction, which is one interaction type and not two. Darker
       and a shade slower, the way a latch dropping back actually sounds. */
    define("unlatch", {
      file: "latch", bus: "ui", gap: 120,
      variants: [
        { from: 0.000, len: 0.42, gain: 0.070, rate: 0.90, pan:  0.07, dark: 2400 },
        { from: 0.012, len: 0.40, gain: 0.064, rate: 0.94, pan: -0.06, dark: 2100 },
        { from: 0.006, len: 0.44, gain: 0.068, rate: 0.88, pan:  0.00, dark: 2700 }
      ]
    });

    /* A control appearing. Heavy cloth moving: the softest event here,
       because a control arriving must not feel like a notification. The
       recording has texture right across its two and a half seconds, so the
       four windows are genuinely four different bits of cloth. */
    define("appear", {
      file: "cloth", bus: "ui", gap: 90,
      variants: [
        { from: 0.06, len: 0.30, gain: 0.052, rate: 0.94, pan: -0.14, dark: 4200 },
        { from: 0.58, len: 0.28, gain: 0.046, rate: 1.02, pan:  0.12, dark: 3800 },
        { from: 1.14, len: 0.32, gain: 0.050, rate: 0.98, pan:  0.02, dark: 4600 },
        { from: 1.78, len: 0.26, gain: 0.044, rate: 1.06, pan: -0.05, dark: 4000 }
      ]
    });

    /* Arriving. A timpani rolled with a soft mallet, which is a real low
       room swell rather than a synthesised one. It rises to its peak around
       1.5 s, so the window has to be long enough to include the peak or it
       is a fade rather than an arrival. Layered under a latch by the frame,
       and the only pair of sounds allowed to be noticeable. Still soft. */
    define("arrive", {
      file: "swell", bus: "ui", gap: 400,
      variants: [
        { from: 0.00, len: 2.00, gain: 0.105, rate: 0.96, pan: -0.05, dark: 1500, fade: 0.55 },
        { from: 0.10, len: 1.95, gain: 0.098, rate: 1.00, pan:  0.05, dark: 1700, fade: 0.60 },
        { from: 0.05, len: 1.90, gain: 0.102, rate: 0.92, pan:  0.00, dark: 1400, fade: 0.50 }
      ]
    });

    /* Leaving. A cabinet drawer closing, and nothing else uses it. Onset at
       0.144, gone by 0.274. */
    define("leave", {
      file: "shut", bus: "ui", gap: 400,
      variants: [
        { from: 0.136, len: 0.30, gain: 0.100, rate: 0.88, pan: -0.04, dark: 2400 },
        { from: 0.140, len: 0.28, gain: 0.094, rate: 0.92, pan:  0.04, dark: 2100 },
        { from: 0.134, len: 0.32, gain: 0.098, rate: 0.85, pan:  0.00, dark: 2700 }
      ]
    });

    /* A run completing. A crossbar relay releasing, which is the sound a
       piece of switching equipment makes when it has finished with
       something. Onset at 0.142. */
    define("complete", {
      file: "done", bus: "sim", gap: 300,
      variants: [
        { from: 0.134, len: 0.22, gain: 0.115, rate: 0.96, pan: -0.07, dark: 3600 },
        { from: 0.138, len: 0.21, gain: 0.106, rate: 1.01, pan:  0.06, dark: 3200 },
        { from: 0.132, len: 0.23, gain: 0.110, rate: 0.93, pan:  0.00, dark: 4000 }
      ]
    });

    /* The handoff firing. A letter going through a letterbox: something
       leaving one place for another, which is exactly what a handoff is.
       Onset at 0.025. */
    define("handoff", {
      file: "dispatch", bus: "sim", gap: 300,
      variants: [
        { from: 0.016, len: 0.34, gain: 0.104, rate: 0.98, pan:  0.10, dark: 4200 },
        { from: 0.020, len: 0.32, gain: 0.096, rate: 1.03, pan: -0.08, dark: 3800 },
        { from: 0.013, len: 0.36, gain: 0.100, rate: 0.95, pan:  0.00, dark: 4600 }
      ]
    });

    /* The depleted shell forming. Seed poured into a jar, slowed and
       darkened: a granular settling, which is what a solute depleting around
       a face actually is. It borrows nothing, because the cloth is already
       the sound of a control arriving and one recording cannot be two
       different kinds of event. */
    define("shell", {
      file: "settle", bus: "sim", gap: 900,
      variants: [
        { from: 0.14, len: 0.62, gain: 0.115, rate: 0.72, pan: -0.12, dark: 1900, fade: 0.26 },
        { from: 1.06, len: 0.58, gain: 0.106, rate: 0.78, pan:  0.10, dark: 1750, fade: 0.24 },
        { from: 1.94, len: 0.66, gain: 0.110, rate: 0.68, pan:  0.00, dark: 2100, fade: 0.28 }
      ]
    });
  }


  /* ----------------------------------------------------------------------
     ON AND OFF
     ---------------------------------------------------------------------- */
  function enable(next) {
    if (next === on) return on;
    on = !!next;
    if (on) {
      if (!audio()) { on = false; return false; }
      if (ctx.state === "suspended") ctx.resume();
      warm();
    } else {
      stopBeds();
    }
    return on;
  }

  function suspend() { if (ctx && ctx.state === "running") ctx.suspend(); }
  function resume() { if (on && ctx && ctx.state === "suspended") ctx.resume(); }


  /* ----------------------------------------------------------------------
     BOOT
     ---------------------------------------------------------------------- */
  (function boot() {
    var p = new URLSearchParams(location.search);
    deserialize(p.get("mix"));
    declare();
    if (window.Sim && Sim.state) Sim.state("mix", serialize);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", buildPanel);
    } else {
      buildPanel();
    }
  })();

  return {
    enable: enable,
    enabled: function () { return on; },
    suspend: suspend,
    resume: resume,
    basePath: function (s) { base = s || ""; },
    files: FILES,
    buses: BUSES,

    define: define,
    play: play,
    fire: fire,
    bed: bed,
    stopBeds: stopBeds,
    input: input,
    context: function () { return ctx; },
    warm: warm,
    duration: function (name) { return buffers[name] ? buffers[name].duration : 0; },
    loaded: function (name) { return !!buffers[name]; },

    /* A place to hang a meter. "Each bus is silent at zero" is a claim, and
       a claim about sound should be measurable rather than asserted, so the
       last node before the speakers is reachable. */
    tap: function () { return master; },
    voices: function () {
      var m = {};
      Object.keys(VOICES).forEach(function (v) {
        m[v] = { file: VOICES[v].file, bus: VOICES[v].bus,
                 variants: VOICES[v].variants.length };
      });
      return m;
    },
    beds: function () {
      var m = {};
      Object.keys(beds).forEach(function (k) { m[k] = beds[k].target; });
      return m;
    },

    set: set,
    get: get,
    onLevel: function (fn) { levelListeners.push(fn); },
    serialize: serialize,
    deserialize: deserialize,
    panel: function () { return panel; }
  };
})();
