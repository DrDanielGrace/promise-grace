/* =========================================================================
   sound.js · texture first, information second

   THE PRINCIPLE, AFTER GETTING IT WRONG ONCE

   The previous version put every sound on a pentatonic grid so that all of
   them could carry a number. It worked and it was horrible: the whole site
   became a bell being struck over and over. A laboratory is not music. It
   is glass, liquid, paper, and small mechanical things.

   So: a sound has to be pleasant to hear before it is allowed to mean
   anything. Where carrying a number makes it uglier, the number goes and
   the sound stays. Almost everything here is now a real recording rather
   than a tone, and where a recording will not do, what gets synthesised is
   noise shaped into a texture, never a clean note.

   PITCH IS USED IN EXACTLY TWO PLACES

   The titration drop rises as the endpoint approaches, because that one is
   both useful and lovely: a real drop landing in liquid, a little tighter
   each time as the cliff gets closer. And the diffraction ring, where
   sharpness genuinely is how long something rings.

   Everywhere else the information is carried by texture, timing and volume.
   A dense event is more of the same sound, not a higher one. A damped event
   is the same sound with the life taken out of it.

   THE RECORDINGS, all Creative Commons Zero from Freesound

     drop.mp3     a single droplet falling into water
     glass.mp3    one bottle touched against another, short and hollow
     paper.mp3    a hand turning a page of heavy paper
     stopper.mp3  a small cork easing out of a bottle
     swirl.mp3    liquid moved around inside a glass

   The paper recording is never played the same way twice. Each turn takes a
   short window from a different place in it, so the rustle is a bit
   different every time, the way turning a page actually is.

   EVERYTHING GOES THROUGH A SMALL ROOM

   A short synthetic impulse, about a quarter of a second, mixed in low. It
   is the size of a room with a bench in it, not a hall. It is what stops
   five separate recordings sounding like five separate recordings.

   THE RULES THAT DID NOT CHANGE

   Off on load. Nothing on scroll unless it is the paper, which is the one
   thing that should be there. Nothing fetched until it is switched on.
   Never two of the same sound stacked. Silent under reduced motion unless
   deliberately switched on. In memory for the session, never in storage.
   ========================================================================= */

window.Snd = (function () {
  "use strict";

  var FILES = {
    drop:    "assets/sound/drop.mp3",
    glass:   "assets/sound/glass.mp3",
    paper:   "assets/sound/paper.mp3",
    stopper: "assets/sound/stopper.mp3",
    swirl:   "assets/sound/swirl.mp3"
  };

  var on = false;
  var ctx = null;
  var master = null, dry = null, wet = null;
  var buffers = {};
  var asked = {};
  var lastAt = {};
  var listeners = [];
  var base = "";

  function reduced() {
    return window.matchMedia &&
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ----------------------------------------------------------------------
     THE ROOM

     A decaying burst of noise, filtered dark, used as an impulse response.
     Quarter of a second is a small room with hard surfaces and a bench in
     it. Long enough to put the recordings in the same place as each other,
     short enough that nothing smears.
     ---------------------------------------------------------------------- */
  function makeRoom() {
    var secs = 0.26, n = Math.floor(ctx.sampleRate * secs);
    var buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      var last = 0;
      for (var i = 0; i < n; i++) {
        var t = i / n;
        /* a gentle early cluster, then a fast exponential tail */
        var white = Math.random() * 2 - 1;
        last = last * 0.72 + white * 0.28;          /* darken it */
        d[i] = last * Math.pow(1 - t, 3.2) * (i < 40 ? i / 40 : 1);
      }
    }
    return buf;
  }

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    master = ctx.createGain();
    /* Deliberately well under what it was. This should sit beneath the page
       rather than announce itself. */
    master.gain.value = 0.30;
    master.connect(ctx.destination);

    dry = ctx.createGain(); dry.gain.value = 0.86; dry.connect(master);
    try {
      var conv = ctx.createConvolver();
      conv.buffer = makeRoom();
      wet = ctx.createGain(); wet.gain.value = 0.16;
      wet.connect(conv); conv.connect(master);
    } catch (e) { wet = null; }
    return ctx;
  }

  /* Everything routes through here so one room applies to all of it. */
  function out(node) {
    node.connect(dry);
    if (wet) node.connect(wet);
  }

  function fetchOne(name) {
    if (buffers[name] || asked[name] || !FILES[name] || !ctx) return;
    asked[name] = true;
    var req = new XMLHttpRequest();
    req.open("GET", base + FILES[name], true);
    req.responseType = "arraybuffer";
    req.onload = function () {
      if (req.status >= 400) return;
      ctx.decodeAudioData(req.response, function (b) { buffers[name] = b; },
                          function () {});
    };
    try { req.send(); } catch (e) {}
  }

  function warm() { Object.keys(FILES).forEach(fetchOne); }

  function clear(name, gapMs) {
    var t = Date.now();
    if (lastAt[name] && t - lastAt[name] < (gapMs || 70)) return false;
    lastAt[name] = t;
    return true;
  }

  /* ----------------------------------------------------------------------
     PLAYING A RECORDING

     `from` and `len` take a window out of the middle of a longer recording,
     which is how the paper is never the same twice. `dark` rolls the top
     off, which is how a thing sounds damped rather than lower.
     ---------------------------------------------------------------------- */
  function play(name, o) {
    if (!on || !ctx) return null;
    o = o || {};
    if (o.gap !== 0 && !clear(name, o.gap)) return null;
    var buf = buffers[name];
    if (!buf) { fetchOne(name); return null; }

    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = o.rate || 1;

    var g = ctx.createGain();
    var t0 = ctx.currentTime;
    var gain = o.gain === undefined ? 0.4 : o.gain;
    var len = o.len || (buf.duration / (o.rate || 1));
    var fade = Math.min(0.05, len * 0.25);

    /* fade both ends, so taking a window out of a recording never clicks */
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
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
    node.connect(g);
    out(g);

    src.start(t0, o.from || 0);
    src.stop(t0 + len + 0.03);
    return src;
  }

  /* ----------------------------------------------------------------------
     PAPER

     The one thing you hear most, so it has to be the least tiring. A short
     window from somewhere different in the recording each time, quiet, with
     the top rolled off a little so it is a rustle rather than a hiss.
     ---------------------------------------------------------------------- */
  function paper(o) {
    if (!on || !ctx) return;
    o = o || {};
    var buf = buffers.paper;
    if (!buf) { fetchOne("paper"); return; }
    var len = o.len || 0.20;
    var span = Math.max(0.05, buf.duration - len - 0.05);
    play("paper", {
      from: 0.02 + Math.random() * span,
      len: len,
      /* a little slower or faster each time, well under the range where it
         would read as a pitch change */
      rate: 0.92 + Math.random() * 0.16,
      gain: o.gain === undefined ? 0.16 : o.gain,
      dark: o.dark || 7000,
      gap: o.gap === undefined ? 90 : o.gap
    });
  }

  /* A page turning. Longer window, a touch louder, still soft. */
  function page() { paper({ len: 0.42, gain: 0.22, gap: 260, dark: 8000 }); }

  /* Scrolling. Much shorter and much quieter, and it only ever happens once
     a page boundary has actually gone by, never continuously. */
  function scroll() { paper({ len: 0.13, gain: 0.075, gap: 220, dark: 6000 }); }

  /* ----------------------------------------------------------------------
     THE REST OF THE ROOM
     ---------------------------------------------------------------------- */

  /* Two pieces of glass touching. Used where something has arrived or
     settled. Softer and darker when it is a lesser event, never higher. */
  function glass(o) {
    o = o || {};
    play("glass", {
      gain: o.gain === undefined ? 0.22 : o.gain,
      rate: o.rate || (0.94 + Math.random() * 0.12),
      dark: o.dark || 0,
      gap: o.gap === undefined ? 60 : o.gap
    });
  }

  /* A cork easing out. Rare on purpose: starting a run, and nothing else. */
  function stopper() { play("stopper", { gain: 0.20, rate: 0.96 + Math.random() * 0.08, gap: 400 }); }

  /* Liquid moved around in a glass. Used when a flask is emptied and reset. */
  function swirl() { play("swirl", { gain: 0.16, rate: 0.97 + Math.random() * 0.06, gap: 400 }); }

  /* A single drop landing in liquid. `tight` from 0 to 1 pulls it a little
     higher and tighter, which is the one pitch mapping worth keeping: the
     closer to the endpoint, the more it sounds like it matters. */
  function drop(tight) {
    var t = Math.max(0, Math.min(tight === undefined ? 0 : tight, 1));
    play("drop", { rate: 0.94 + t * 0.42, gain: 0.20 + t * 0.10, gap: 55 });
  }

  /* ----------------------------------------------------------------------
     SYNTHESISED, AND ALL OF IT NOISE RATHER THAN NOTES
     ---------------------------------------------------------------------- */

  /* A short burst of filtered noise. This is the raw material for everything
     that is not a recording: a tick, a click, a soft thud. Nothing here has
     a fundamental, so nothing here can sound like a notification. */
  function grain(o) {
    if (!on || !ctx) return;
    o = o || {};
    var dur = o.dur || 0.03;
    var t0 = ctx.currentTime;
    var n = Math.max(8, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var last = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      last = last * (o.smooth === undefined ? 0.6 : o.smooth) + w * 0.4;
      d[i] = last * Math.pow(1 - i / n, o.shape || 2.2);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;

    var bp = ctx.createBiquadFilter();
    bp.type = o.type || "bandpass";
    bp.frequency.value = o.centre || 900;
    bp.Q.value = o.q === undefined ? 0.9 : o.q;

    var g = ctx.createGain();
    g.gain.value = o.gain === undefined ? 0.06 : o.gain;

    src.connect(bp); bp.connect(g);
    out(g);
    src.start(t0);
  }

  /* A slider. A fingertip moving over paper, essentially: a very short dry
     grain, quiet, slightly different every time. No pitch, because a slider
     playing a scale was the single worst thing about the last version. */
  function slide() {
    if (!on || !ctx || !clear("slide", 55)) return;
    grain({ dur: 0.022, centre: 1500 + Math.random() * 900, q: 0.7,
            gain: 0.028, shape: 3.0, smooth: 0.45 });
  }

  /* Something crossed a threshold. A soft low knock, and the direction is
     carried by how dark it is rather than by pitch: going up is open and
     woody, coming back down is closed and dull. */
  function cross(up) {
    if (!on || !ctx || !clear("cross", 300)) return;
    grain({ dur: up ? 0.085 : 0.07, centre: up ? 320 : 190, q: 1.4,
            gain: up ? 0.075 : 0.055, shape: 2.4, smooth: 0.82 });
  }

  /* A nucleus that survived. Real glass, quiet, and a bigger one is darker
     and fuller rather than lower. */
  function settle(sizeFrac) {
    var s = Math.max(0.4, Math.min(sizeFrac || 1, 5));
    glass({ gain: 0.10 + Math.min(s, 3) * 0.02, dark: 2600 + 2600 / s, gap: 70 });
  }

  /* Atoms arriving on a growing face. Almost nothing, and what changes with
     the growth rate is how often you hear it and how loud, not its pitch. */
  function shimmer(strength) {
    if (!on || !ctx || !clear("shimmer", 110)) return;
    var s = Math.max(0, Math.min(strength === undefined ? 1 : strength, 1));
    grain({ dur: 0.03, centre: 2400 + Math.random() * 700, q: 0.8,
            gain: 0.012 + 0.022 * s, shape: 3.4, smooth: 0.3 });
  }

  /* The nucleation counter. A dry tick, and the barrier changes how dark and
     how loud it is. High barrier, few and dull. Low barrier, many and
     present. The rate of them is the measurement, as before. */
  function crackle(barrierFrac) {
    if (!on || !ctx) return;
    var b = Math.max(0, Math.min(barrierFrac === undefined ? 0.5 : barrierFrac, 1));
    grain({ dur: 0.024, centre: 520 + (1 - b) * 1500, q: 1.1,
            gain: 0.030 + 0.030 * (1 - b), shape: 2.8, smooth: 0.55 });
  }

  /* The endpoint. A glass touched, and how wrong the reading is comes
     through as damping: a clean reading rings, a bad one is muffled and
     dead. No detuning, no beating, no interval. */
  function endpoint(errorFrac) {
    var e = Math.max(0, Math.min(errorFrac || 0, 1));
    glass({ gain: 0.20 - e * 0.06, dark: e > 0.02 ? (5200 - e * 4200) : 0, gap: 200 });
    if (e > 0.02) {
      /* and a dull knock underneath it, so a bad reading has a thud in it */
      setTimeout(function () {
        grain({ dur: 0.09, centre: 170, q: 1.6, gain: 0.05 * e + 0.02, shape: 2.2, smooth: 0.85 });
      }, 55);
    }
  }

  /* ----------------------------------------------------------------------
     THE DIFFRACTION RING

     The other place pitch is kept, because sharpness genuinely is ring time
     and the sweep across a pattern is the nicest thing the site does. Even
     here the voice is not a bare sine: a little noise is mixed into the
     attack so each peak has an edge on it rather than appearing from
     nothing.
     ---------------------------------------------------------------------- */
  var scanning = null;

  function pattern(peaks, opts) {
    if (!on || !ctx || !peaks || !peaks.length) return;
    stopPattern();
    var o = opts || {};
    var span = o.span || 2.8;
    var t0 = ctx.currentTime + 0.05;
    var lo = o.lo === undefined ? 20 : o.lo;
    var hi = o.hi === undefined ? 120 : o.hi;

    peaks.forEach(function (p) {
      var pos = Math.max(0, Math.min((p.twoTheta - lo) / (hi - lo), 1));
      var when = t0 + pos * span;
      var f = 180 * Math.pow(2, pos * 1.9);
      var amp = (o.amp ? o.amp(p) : 1) * 0.5;
      var w = Math.max(0, p.width || 0);
      var spread = Math.min(w / 2.2, 1);
      var voices = spread < 0.05 ? 1 : (spread < 0.18 ? 2 : (spread < 0.45 ? 4 : 6));
      var dur = 0.85 - spread * 0.6;
      for (var i = 0; i < voices; i++) {
        var det = voices === 1 ? 0 : ((i / (voices - 1)) - 0.5) * spread * 0.2;
        voice(f * (1 + det), when, dur, (0.09 * amp) / Math.sqrt(voices),
              0.004 + spread * 0.14);
      }
    });
    scanning = setTimeout(function () { scanning = null; }, (span + 1) * 1000);
  }

  function voice(f, when, dur, gain, attack) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    out(g);
    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(g);
    osc.start(when); osc.stop(when + dur + 0.02);
  }

  function stopPattern() {
    if (scanning) { clearTimeout(scanning); scanning = null; }
  }

  /* ----------------------------------------------------------------------
     THE CONTROL
     ---------------------------------------------------------------------- */
  function setOn(next) {
    if (next === on) return;
    on = next;
    if (on) { if (audio()) { if (ctx.state === "suspended") ctx.resume(); warm(); } }
    document.documentElement.setAttribute("data-sound", on ? "on" : "off");
    Array.prototype.slice.call(document.querySelectorAll("[data-sound-toggle]"))
      .forEach(function (b) {
        b.setAttribute("aria-pressed", String(on));
        var lab = b.querySelector("[data-sound-label]");
        if (lab) lab.textContent = on ? "Sound on" : "Sound off";
      });
    listeners.forEach(function (fn) { try { fn(on); } catch (e) {} });
    if (!on) stopPattern();
  }

  function build() {
    if (document.querySelector("[data-sound-toggle]")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "sound-toggle";
    b.setAttribute("data-sound-toggle", "");
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span class="sound-mark" aria-hidden="true"></span>' +
                  '<span data-sound-label>Sound off</span>';
    b.addEventListener("click", function () { setOn(!on); dismiss(); });
    document.body.appendChild(b);

    var inv = document.createElement("aside");
    inv.className = "sound-invite";
    inv.setAttribute("role", "note");
    inv.innerHTML =
      '<p>There is sound here if you want it, and it is quiet. Paper when a ' +
      'page turns, a drop landing when you add one, glass when something ' +
      'settles. It is a small room with a bench in it rather than music, and ' +
      'nothing plays because you pressed a button.</p>' +
      '<p class="sound-invite-do">' +
      '<button type="button" class="btn-quiet" data-invite-yes>Turn it on</button>' +
      '<button type="button" class="btn-quiet" data-invite-no>No thanks</button></p>';
    var entries = document.querySelectorAll("main .entry, main section");
    var anchor = entries[Math.min(2, entries.length - 1)];
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(inv, anchor.nextSibling);
    else document.body.appendChild(inv);

    inv.querySelector("[data-invite-yes]").addEventListener("click", function () {
      setOn(true); dismiss();
    });
    inv.querySelector("[data-invite-no]").addEventListener("click", dismiss);

    dismiss = function () { if (inv.parentNode) inv.parentNode.removeChild(inv); };
  }

  var dismiss = function () {};

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  document.documentElement.setAttribute("data-sound", "off");

  return {
    enabled: function () { return on; },
    set: setOn,
    onChange: function (fn) { listeners.push(fn); fn(on); },
    basePath: function (p) { base = p || ""; },
    play: play,
    paper: paper,
    page: page,
    scroll: scroll,
    glass: glass,
    stopper: stopper,
    swirl: swirl,
    drop: drop,
    grain: grain,
    slide: slide,
    cross: cross,
    settle: settle,
    shimmer: shimmer,
    crackle: crackle,
    endpoint: endpoint,
    pattern: pattern,
    stopPattern: stopPattern,
    reduced: reduced
  };
})();
