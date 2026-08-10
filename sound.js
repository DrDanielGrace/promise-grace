/* =========================================================================
   sound.js · one instrument, and every sound carrying a number

   THE RULE THIS FILE NOW OBEYS

   A sound tells you something the screen has not, or it does not exist.

   That rule deleted things. The glass tap that played on every button and
   link is gone: a click sound tells you that you clicked, which you already
   knew, and it was the loudest thing on the site. What is left either
   carries a quantity, marks a threshold being crossed, or is the physical
   event itself arriving.

   ONE INSTRUMENT, NOT A COLLECTION

   Everything pitched lands on one grid: a minor pentatonic on A, three
   octaves from 110 Hz. Nothing picks its own frequency any more, it asks
   for a position in a range and gets the nearest note. That is why the
   whole site now sounds like one room rather than seven separate widgets,
   and it is also why a slider sweeping upward sounds like a scale rather
   than a siren.

   THE THREE RECORDINGS

     drop.wav   a real water drop landing in liquid   Mixkit 3179
     glass.wav  glass struck against glass            Mixkit 2936
     page.wav   a page actually turning               Mixkit 1105

   All three replaced what was there before. The old drop was a bubble
   swelling rather than a drop landing, and the old page turn was a 32 kbps
   transient with no rustle in it. They ship as 22 kHz mono WAV rather than
   MP3 on purpose: at this length the file size is the same, and a WAV needs
   no decoder, which is the easiest fifty milliseconds of latency to lose.

   WHAT EACH RECORDING IS ASKED TO CARRY

   None of them plays at a fixed pitch. The drop's pitch rises with how
   steep the titration curve is where you are, so you can hear the
   equivalence point coming before the curve shows it. The glass is struck
   at a pitch set by the size of the cluster that survived. The page is the
   only one that plays flat, because a page turn is a page turn.

   THE RULES THAT DID NOT CHANGE

   Off on load. Nothing on scroll. Nothing fetched until it is switched on.
   Never two of the same sound stacked. Silent under reduced motion unless
   deliberately switched on. The choice lives in memory for the session and
   never in storage.
   ========================================================================= */

window.Snd = (function () {
  "use strict";

  var FILES = {
    drop:  "assets/sound/drop.wav",
    glass: "assets/sound/glass.wav",
    page:  "assets/sound/page.wav"
  };

  var on = false;
  var ctx = null;
  var master = null;
  var buffers = {};
  var asked = {};
  var lastAt = {};
  var listeners = [];
  var base = "";              /* set by pages that sit in a subfolder */

  function reduced() {
    return window.matchMedia &&
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ----------------------------------------------------------------------
     THE INSTRUMENT

     A minor pentatonic on A. Every pitched sound on the site quantises to
     this, so two simulations playing at once are still in the same key and
     a sweep sounds like an instrument rather than a theremin.
     ---------------------------------------------------------------------- */
  var ROOT = 110;                                  /* A2 */
  var STEPS = [0, 3, 5, 7, 10];                    /* minor pentatonic */
  var GRID = (function () {
    var out = [];
    for (var oct = 0; oct < 4; oct++) {
      for (var i = 0; i < STEPS.length; i++) {
        out.push(ROOT * Math.pow(2, (oct * 12 + STEPS[i]) / 12));
      }
    }
    return out;                                    /* 20 notes, 110 to 1568 Hz */
  })();

  /* position 0..1 through the range, returned as a note on the grid */
  function note(pos, lo, hi) {
    var a = lo === undefined ? 0 : lo;
    var b = hi === undefined ? GRID.length - 1 : hi;
    var i = Math.round(a + Math.max(0, Math.min(pos, 1)) * (b - a));
    return GRID[Math.max(0, Math.min(i, GRID.length - 1))];
  }

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return ctx;
  }

  function fetchOne(name) {
    if (buffers[name] || asked[name] || !FILES[name] || !ctx) return;
    asked[name] = true;
    var req = new XMLHttpRequest();
    req.open("GET", base + FILES[name], true);
    req.responseType = "arraybuffer";
    req.onload = function () {
      if (req.status >= 400) return;
      ctx.decodeAudioData(req.response, function (buf) { buffers[name] = buf; },
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

  /* A recording, played at a pitch that means something. `rate` is the
     playback rate, so 2 is an octave up, and it is always a quantity rather
     than a decoration. */
  function sample(name, opts) {
    if (!on || !ctx) return;
    var o = opts || {};
    if (!clear(name, o.gap)) return;
    var buf = buffers[name];
    if (!buf) { fetchOne(name); return; }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = o.rate || 1;
    var g = ctx.createGain();
    g.gain.value = o.gain === undefined ? 0.5 : o.gain;
    src.connect(g); g.connect(master);
    src.start();
  }

  /* ----------------------------------------------------------------------
     SYNTHESIS
     ---------------------------------------------------------------------- */

  function tone(opts) {
    if (!on || !ctx) return;
    var o = opts || {};
    var t0 = ctx.currentTime;
    var dur = o.dur || 0.5;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.25, t0 + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(master);

    var a = ctx.createOscillator();
    a.type = o.type || "sine";
    a.frequency.value = o.f || 440;
    a.connect(g); a.start(t0); a.stop(t0 + dur + 0.02);

    /* Two voices a fraction apart beat against each other. The beat rate IS
       the error, so an overshoot is heard rather than announced. */
    if (o.sour) {
      var b = ctx.createOscillator();
      b.type = o.type || "sine";
      b.frequency.value = (o.f || 440) * (1 + o.sour);
      var gb = ctx.createGain();
      gb.gain.value = 0.8;
      b.connect(gb); gb.connect(g);
      b.start(t0); b.stop(t0 + dur + 0.02);
    }
    return t0 + dur;
  }

  /* ----------------------------------------------------------------------
     A SLIDER IS A SCALE

     The old tick was a random pitch between 1500 and 1760 Hz. It marked
     that you had moved something, which you could already see, and it told
     you nothing about where you were. Now the pitch IS the position in the
     range, quantised to the grid, so sweeping a slider up plays a rising
     scale and you can hear whether you are near an end without looking.
     ---------------------------------------------------------------------- */
  function slide(pos) {
    if (!on || !ctx || !clear("slide", 40)) return;
    tone({ f: note(pos, 4, 17), dur: 0.05, gain: 0.05, attack: 0.003, type: "sine" });
  }

  /* ----------------------------------------------------------------------
     A THRESHOLD SOUNDS DIFFERENT ON EACH SIDE

     Peclet passing one, a cluster passing the critical radius, an indicator
     reaching its range. Crossing upward is a fifth up, crossing downward is
     the same interval down, so which way you went is audible without being
     told, and it cannot be confused with anything else on the site because
     nothing else plays two notes in sequence.
     ---------------------------------------------------------------------- */
  function cross(up, weight) {
    if (!on || !ctx || !clear("cross", 220)) return;
    var w = Math.max(0, Math.min(weight === undefined ? 1 : weight, 1));
    var lo = note(0.42, 4, 17), hi = note(0.62, 4, 17);
    var g = 0.07 + 0.06 * w;
    tone({ f: up ? lo : hi, dur: 0.11, gain: g, attack: 0.004, type: "triangle" });
    var t = ctx.currentTime;
    setTimeout(function () {
      tone({ f: up ? hi : lo, dur: 0.22, gain: g * 0.9, attack: 0.004, type: "triangle" });
    }, 90);
    return t;
  }

  /* ----------------------------------------------------------------------
     A NUCLEUS THAT SURVIVED

     Real glass, struck at a pitch set by how big the surviving cluster is.
     A big one rings low, a small one rings high, which is what a struck
     object actually does.
     ---------------------------------------------------------------------- */
  function settle(sizeFrac) {
    if (!on || !ctx || !clear("settle", 60)) return;
    var s = Math.max(0.5, Math.min(sizeFrac || 1, 5));
    /* bigger cluster, lower pitch: rate below one is a lower playback pitch */
    sample("glass", { rate: 1.5 / s, gain: 0.28, gap: 0 });
  }

  /* ----------------------------------------------------------------------
     ATOMS ARRIVING ON A GROWING FACE

     The old one picked a random pitch and only the rate of repetition meant
     anything. Now the pitch is the growth rate, so as a crystal in low
     gravity slows down you hear it fall as well as thin out.
     ---------------------------------------------------------------------- */
  function shimmer(strength) {
    if (!on || !ctx || !clear("shimmer", 90)) return;
    var s = Math.max(0, Math.min(strength === undefined ? 1 : strength, 1));
    tone({ f: note(0.45 + s * 0.5, 8, 19), dur: 0.06,
           gain: 0.018 + 0.03 * s, attack: 0.004 });
  }

  /* ----------------------------------------------------------------------
     SONIFICATION ONE · the diffraction pattern

     Position becomes pitch and the computed peak width becomes how far the
     tone is smeared. A sharp peak is one clean note that rings. A broad one
     is the same note across several detuned voices with a slow attack and
     no edge, so a four nanometre crystal sounds like mush before you have
     read anything.

     The pitches land on the instrument's grid like everything else, so a
     pattern is a chord rather than an arbitrary set of frequencies.
     ---------------------------------------------------------------------- */
  var scanning = null;

  function pattern(peaks, opts) {
    if (!on || !ctx || !peaks || !peaks.length) return;
    stopPattern();
    var o = opts || {};
    var span = o.span || 2.6;
    var t0 = ctx.currentTime + 0.05;
    var lo = o.lo === undefined ? 20 : o.lo;
    var hi = o.hi === undefined ? 120 : o.hi;

    peaks.forEach(function (p) {
      var pos = Math.max(0, Math.min((p.twoTheta - lo) / (hi - lo), 1));
      var when = t0 + pos * span;
      var f = note(pos, 5, 18);
      var amp = (o.amp ? o.amp(p) : 1);
      var w = Math.max(0, p.width || 0);
      var spread = Math.min(w / 2.2, 1);
      /* sharp rings, broad smears: fewer voices and a longer ring when it is
         sharp, more voices and a slurred attack when it is broad */
      /* How long it rings is the primary carrier, because that is what
         "sharp" means to an ear. A narrow peak sustains for most of a
         second on one clean voice. A wide one is over in a quarter of that,
         spread across eight detuned voices with a slurred attack, so it
         arrives as a smear rather than a note. Measured across the size
         slider, that is a three and a half to one difference in ring time
         and eight to one in voice count. */
      var voices = spread < 0.05 ? 1 : (spread < 0.18 ? 3 : (spread < 0.45 ? 5 : 8));
      var dur = 0.92 - spread * 0.68;
      for (var i = 0; i < voices; i++) {
        var det = voices === 1 ? 0 : ((i / (voices - 1)) - 0.5) * spread * 0.22;
        voice(f * (1 + det), when, dur, (0.17 * amp) / Math.sqrt(voices),
              0.003 + spread * 0.16);
      }
    });
    scanning = setTimeout(function () { scanning = null; }, (span + 1) * 1000);
  }

  function voice(f, when, dur, gain, attack) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(master);
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
     SONIFICATION TWO · nucleation as a counter

     A click per cluster that gets across the barrier, and its brightness is
     the computed barrier height. A high barrier gives rare, dull clicks. A
     low one gives a dense bright crackle. Nothing at all for the ones that
     dissolve, which is most of them, and that silence is the measurement:
     the gaps between clicks ARE the barrier.
     ---------------------------------------------------------------------- */
  function crackle(barrierFrac) {
    if (!on || !ctx) return;
    var b = Math.max(0, Math.min(barrierFrac === undefined ? 0.5 : barrierFrac, 1));
    var t0 = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.05 + 0.09 * (1 - b), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
    g.connect(master);
    var n = Math.floor(ctx.sampleRate * 0.03);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    /* a low barrier is bright and easy, a high one is dull and rare */
    bp.frequency.value = 700 + (1 - b) * 2200;
    bp.Q.value = 1.2;
    src.connect(bp); bp.connect(g);
    src.start(t0);
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
      '<p>There is sound here if you want it. Nothing plays by itself, and ' +
      'nothing plays just because you pressed something. Every sound on this ' +
      'site is telling you a number: how steep the curve is under the drop, ' +
      'how big the crystal that survived was, how wide a diffraction peak is. ' +
      'The ones that dissolve stay silent, and that silence is the part I ' +
      'wanted you to notice.</p>' +
      '<p class="sound-invite-do">' +
      '<button type="button" class="btn-quiet" data-invite-yes>Turn it on</button>' +
      '<button type="button" class="btn-quiet" data-invite-no>No thanks</button></p>';
    var entries = document.querySelectorAll("main .entry, main section");
    var anchor = entries[Math.min(2, entries.length - 1)];
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(inv, anchor.nextSibling);
    } else {
      document.body.appendChild(inv);
    }

    inv.querySelector("[data-invite-yes]").addEventListener("click", function () {
      setOn(true); dismiss();
    });
    inv.querySelector("[data-invite-no]").addEventListener("click", dismiss);

    dismiss = function () {
      if (inv.parentNode) inv.parentNode.removeChild(inv);
    };
  }

  var dismiss = function () {};

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  /* There is deliberately no sound on buttons and links any more. It told
     you that you had clicked something, which you knew, and it was the
     loudest and most frequent thing on the site. */

  document.documentElement.setAttribute("data-sound", "off");

  return {
    enabled: function () { return on; },
    set: setOn,
    onChange: function (fn) { listeners.push(fn); fn(on); },
    basePath: function (p) { base = p || ""; },
    note: note,
    sample: sample,
    tone: tone,
    slide: slide,
    cross: cross,
    settle: settle,
    shimmer: shimmer,
    crackle: crackle,
    pattern: pattern,
    stopPattern: stopPattern,
    reduced: reduced,
    /* for measurement: how many notes the grid has and where it spans */
    grid: function () { return GRID.slice(); }
  };
})();
