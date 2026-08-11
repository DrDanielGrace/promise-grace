/* =========================================================================
   sound.js · the notebook's voice, now speaking through the four buses

   WHAT CHANGED, AND WHAT DELIBERATELY DID NOT

   Everything below is the same set of sounds it was: paper when a page
   turns, a drop landing when you add one, glass when something settles, a
   cork when a run starts, noise shaped into a texture where a recording
   will not do. Sixteen simulations call these by name and none of them were
   touched.

   What changed is underneath. There is no AudioContext here any more, no
   room, no loader and no master gain. `audio.js` owns all of that, and this
   file is now an adapter: it decides which bus and which depth plane each
   of the old sounds belongs on, and hands the rest over.

     UI          paper, page turns, scrolling, sliders
     SIMULATION  glass, drops, corks, swirls, thresholds, ticks, the ring

   One context, four faders, and fifteen simulations that did not have to
   know about any of it.

   PITCH IS STILL USED IN EXACTLY TWO PLACES

   The titration drop, which tightens as the endpoint approaches, and the
   diffraction ring, where sharpness genuinely is how long something rings.
   Everywhere else the information is texture, timing and volume.

   THE RULES THAT DID NOT CHANGE

   Off on load. Nothing on scroll unless it is the paper. Nothing fetched
   until it is switched on. Never two of the same sound stacked. Silent
   under reduced motion unless deliberately switched on. In memory for the
   session, never in storage.
   ========================================================================= */

window.Snd = (function () {
  "use strict";

  var on = false;
  var listeners = [];

  function A() { return window.Aud; }

  function reduced() {
    return window.matchMedia &&
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ----------------------------------------------------------------------
     PLAYING A RECORDING

     Same signature it always had. `bus` is new and defaults to the
     simulation plane, which is where all of these used to sit relative to
     each other anyway.
     ---------------------------------------------------------------------- */
  function play(name, o) {
    if (!on || !A()) return null;
    o = o || {};
    if (!o.bus) o.bus = "sim";
    return A().fire(name, o);
  }

  /* ----------------------------------------------------------------------
     PAPER

     The one thing you hear most, so it has to be the least tiring. A short
     window from somewhere different in the recording each time, quiet, with
     the top rolled off a little so it is a rustle rather than a hiss. On
     the UI bus, because turning a page is navigation.
     ---------------------------------------------------------------------- */
  function paper(o) {
    if (!on || !A()) return;
    o = o || {};
    var len = o.len || 0.20;
    var dur = A().duration("paper");
    if (!dur) { A().warm(["paper"]); return; }
    var span = Math.max(0.05, dur - len - 0.05);
    play("paper", {
      bus: "ui",
      from: 0.02 + Math.random() * span,
      len: len,
      rate: 0.92 + Math.random() * 0.16,
      gain: o.gain === undefined ? 0.076 : o.gain,
      dark: o.dark || 7000,
      gap: o.gap === undefined ? 90 : o.gap,
      key: "paper"
    });
  }

  function page() { paper({ len: 0.42, gain: 0.105, gap: 260, dark: 8000 }); }

  function scroll() { paper({ len: 0.13, gain: 0.036, gap: 220, dark: 6000 }); }

  /* ----------------------------------------------------------------------
     THE REST OF THE ROOM
     ---------------------------------------------------------------------- */

  function glass(o) {
    o = o || {};
    play("glass", {
      bus: o.bus || "sim",
      gain: o.gain === undefined ? 0.36 : o.gain,
      rate: o.rate || (0.94 + Math.random() * 0.12),
      dark: o.dark || 0,
      pan: (Math.random() - 0.5) * 0.16,
      gap: o.gap === undefined ? 60 : o.gap
    });
  }

  function stopper() {
    play("stopper", { gain: 0.142, rate: 0.96 + Math.random() * 0.08,
                      pan: (Math.random() - 0.5) * 0.14, gap: 400 });
  }

  function swirl() {
    play("swirl", { gain: 0.20, rate: 0.97 + Math.random() * 0.06,
                    pan: (Math.random() - 0.5) * 0.18, gap: 400 });
  }

  function drop(tight) {
    var t = Math.max(0, Math.min(tight === undefined ? 0 : tight, 1));
    play("drop", { rate: 0.94 + t * 0.42, gain: 0.160 + t * 0.078,
                   pan: (Math.random() - 0.5) * 0.12, gap: 55 });
  }

  /* ----------------------------------------------------------------------
     SYNTHESISED, AND ALL OF IT NOISE RATHER THAN NOTES

     Nothing here has a fundamental, so nothing here can sound like a
     notification.
     ---------------------------------------------------------------------- */
  function grain(o) {
    if (!on || !A()) return;
    var ctx = A().context();
    var dest = A().input(o && o.bus ? o.bus : "sim");
    if (!ctx || !dest) return;
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

    var tail = g;
    if (ctx.createStereoPanner) {
      var p = ctx.createStereoPanner();
      p.pan.value = o.pan === undefined ? (Math.random() - 0.5) * 0.2 : o.pan;
      g.connect(p); tail = p;
    }
    tail.connect(dest);
    src.start(t0);
  }

  function gate(key, ms) {
    var t = Date.now();
    gate.at = gate.at || {};
    if (gate.at[key] && t - gate.at[key] < ms) return false;
    gate.at[key] = t;
    return true;
  }

  /* A slider. A fingertip moving over paper. No pitch, because a slider
     playing a scale was the single worst thing about an earlier version. */
  function slide() {
    if (!on || !A() || !gate("slide", 55)) return;
    grain({ bus: "ui", dur: 0.022, centre: 1500 + Math.random() * 900, q: 0.7,
            gain: 0.077, shape: 3.0, smooth: 0.45 });
  }

  /* Something crossed a threshold. A soft low knock, and the direction is
     carried by how dark it is rather than by pitch: going up is open and
     woody, coming back down is closed and dull. */
  function cross(up) {
    if (!on || !A() || !gate("cross", 300)) return;
    grain({ dur: up ? 0.085 : 0.07, centre: up ? 320 : 190, q: 1.4,
            gain: up ? 0.196 : 0.144, shape: 2.4, smooth: 0.82 });
  }

  /* A nucleus that survived. Real glass, quiet, and a bigger one is darker
     and fuller rather than lower. */
  function settle(sizeFrac) {
    var s = Math.max(0.4, Math.min(sizeFrac || 1, 5));
    glass({ gain: 0.166 + Math.min(s, 3) * 0.032, dark: 2600 + 2600 / s, gap: 70 });
  }

  /* Atoms arriving on a growing face. Almost nothing, and what changes with
     the growth rate is how often you hear it and how loud, not its pitch. */
  function shimmer(strength) {
    if (!on || !A() || !gate("shimmer", 110)) return;
    var s = Math.max(0, Math.min(strength === undefined ? 1 : strength, 1));
    grain({ dur: 0.03, centre: 2400 + Math.random() * 700, q: 0.8,
            gain: 0.034 + 0.060 * s, shape: 3.4, smooth: 0.3 });
  }

  /* The nucleation counter. A dry tick, and the barrier changes how dark
     and how loud it is. */
  function crackle(barrierFrac) {
    if (!on || !A()) return;
    var b = Math.max(0, Math.min(barrierFrac === undefined ? 0.5 : barrierFrac, 1));
    grain({ dur: 0.024, centre: 520 + (1 - b) * 1500, q: 1.1,
            gain: 0.089 + 0.089 * (1 - b), shape: 2.8, smooth: 0.55 });
  }

  /* The endpoint. A glass touched, and how wrong the reading is comes
     through as damping: a clean reading rings, a bad one is muffled. */
  function endpoint(errorFrac) {
    var e = Math.max(0, Math.min(errorFrac || 0, 1));
    glass({ gain: 0.324 - e * 0.094, dark: e > 0.02 ? (5200 - e * 4200) : 0, gap: 200 });
    if (e > 0.02) {
      setTimeout(function () {
        grain({ dur: 0.09, centre: 170, q: 1.6, gain: 0.079 * e + 0.032,
                shape: 2.2, smooth: 0.85 });
      }, 55);
    }
  }

  /* ----------------------------------------------------------------------
     THE DIFFRACTION RING

     The other place pitch is kept, because sharpness genuinely is ring time
     and the sweep across a pattern is the nicest thing the site does.
     ---------------------------------------------------------------------- */
  var scanning = null;

  function pattern(peaks, opts) {
    if (!on || !A() || !peaks || !peaks.length) return;
    var ctx = A().context();
    if (!ctx) return;
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
        voice(f * (1 + det), when, dur, (0.144 * amp) / Math.sqrt(voices),
              0.004 + spread * 0.14);
      }
    });
    scanning = setTimeout(function () { scanning = null; }, (span + 1) * 1000);
  }

  function voice(f, when, dur, gain, attack) {
    var ctx = A().context();
    var dest = A().input("sim");
    if (!ctx || !dest) return;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(dest);
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
    if (!A()) return;
    on = A().enable(next);
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
    basePath: function (p) { if (A()) A().basePath(p); },
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
