/* =========================================================================
   sound.js · sound tied to the physics, never to the interface

   The rule this whole file obeys is that a sound has to mean something. A
   drop lands, you hear a drop. A nucleus survives, you hear it settle. A
   nucleus dissolves and you hear nothing at all, and that silence is
   carrying information: most of them die.

   WHAT IS A RECORDING AND WHAT IS SYNTHESISED, because it matters

   Three real recordings, from Mixkit, whose free licence needs no account
   and no attribution. They are listed in CREDITS.md anyway.

     tap.mp3    a wine glass clink, for buttons and links
     page.mp3   a single page turn
     drop.mp3   a drop of liquid landing

   Everything else is synthesised here, and not because nothing suitable
   existed. It is synthesised because it has to carry a number:

     the endpoint tone, which has to go sour on an overshoot by exactly the
       amount of the overshoot
     the slider tick, which has to be almost nothing and vary
     the settle of a surviving nucleus, whose pitch comes from its size
     the diffraction sonification, where the width of a peak becomes the
       spread of the tone
     the nucleation crackle, whose rate is the computed nucleation rate

   A recording cannot do any of that. A file plays the same every time and
   these five have to change with the data or they are decoration.

   THE RULES

   Off on load, always, with no exception and no auto start. Nothing plays
   because you scrolled. Files are not fetched at all until sound is
   switched on, so a clean load pulls zero audio bytes. The same sound never
   stacks on itself, and repeats are pitched slightly differently so it does
   not sound mechanical. The choice lives in memory for the session, never
   in storage.
   ========================================================================= */

window.Snd = (function () {
  "use strict";

  var FILES = {
    tap:  "assets/sound/tap.mp3",
    page: "assets/sound/page.mp3",
    drop: "assets/sound/drop.mp3"
  };

  var on = false;
  var ctx = null;
  var master = null;
  var buffers = {};
  var asked = {};
  var lastAt = {};
  var listeners = [];

  function reduced() {
    return window.matchMedia &&
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* The context is not created until someone switches sound on, because
     creating one on load is what gets a page a browser warning. */
  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    return ctx;
  }

  function fetchOne(name) {
    if (buffers[name] || asked[name] || !FILES[name] || !ctx) return;
    asked[name] = true;
    var req = new XMLHttpRequest();
    req.open("GET", FILES[name], true);
    req.responseType = "arraybuffer";
    req.onload = function () {
      if (req.status >= 400) return;
      ctx.decodeAudioData(req.response, function (buf) { buffers[name] = buf; },
                          function () {});
    };
    try { req.send(); } catch (e) {}
  }

  function warm() { Object.keys(FILES).forEach(fetchOne); }

  /* Never two of the same thing on top of each other. */
  function clear(name, gapMs) {
    var t = Date.now();
    if (lastAt[name] && t - lastAt[name] < (gapMs || 70)) return false;
    lastAt[name] = t;
    return true;
  }

  function sample(name, opts) {
    if (!on || !ctx) return;
    var o = opts || {};
    if (!clear(name, o.gap)) return;
    var buf = buffers[name];
    if (!buf) { fetchOne(name); return; }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    /* A small pitch wobble on every repeat, so twenty taps in a row do not
       sound like one tap copied twenty times. */
    src.playbackRate.value = (o.rate || 1) * (0.94 + Math.random() * 0.12);
    var g = ctx.createGain();
    g.gain.value = o.gain === undefined ? 0.5 : o.gain;
    src.connect(g); g.connect(master);
    src.start();
  }

  /* ----------------------------------------------------------------------
     SYNTHESIS
     ---------------------------------------------------------------------- */

  /* One tone. `sour` detunes a second voice against the first, so an
     overshoot is heard as a beat rather than told as a message. */
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

  /* Almost nothing. A slider should feel like an instrument, not a toy. */
  function tick() {
    if (!on || !ctx || !clear("tick", 45)) return;
    tone({ f: 1500 + Math.random() * 260, dur: 0.035, gain: 0.045, attack: 0.003 });
  }

  /* A nucleus that got across the barrier. Bigger clusters ring lower,
     which is the same way a real thing does. */
  function settle(sizeFrac) {
    if (!on || !ctx || !clear("settle", 55)) return;
    var f = 900 / Math.max(0.6, Math.min(sizeFrac || 1, 4));
    tone({ f: f, dur: 0.20, gain: 0.13, type: "triangle", attack: 0.004 });
    tone({ f: f * 2.01, dur: 0.11, gain: 0.05, attack: 0.004 });
  }

  /* Atoms landing on a growing face. Quiet, and the faster it grows the
     more often you hear it. */
  function shimmer(strength) {
    if (!on || !ctx || !clear("shimmer", 110)) return;
    var s = Math.max(0, Math.min(strength === undefined ? 1 : strength, 1));
    tone({ f: 2100 + Math.random() * 900, dur: 0.07, gain: 0.02 + 0.03 * s, attack: 0.005 });
  }

  /* ----------------------------------------------------------------------
     SONIFICATION ONE · a diffraction pattern played as tones

     Position becomes pitch and width becomes spread. A sharp peak is a
     single clean tone. A broad peak is the same centre note smeared across
     several detuned voices, spread in proportion to the measured width, so
     a small crystal sounds blurred in the same way it looks blurred.

     Someone who cannot see the screen learns the same thing from this that
     a sighted reader learns from the picture.
     ---------------------------------------------------------------------- */
  var scanning = null;

  function pattern(peaks, opts) {
    if (!on || !ctx || !peaks || !peaks.length) return;
    stopPattern();
    var o = opts || {};
    var span = o.span || 2.6;                    /* seconds for the whole scan */
    var t0 = ctx.currentTime + 0.05;
    var lo = o.lo === undefined ? 20 : o.lo;
    var hi = o.hi === undefined ? 120 : o.hi;

    peaks.forEach(function (p) {
      var pos = Math.max(0, Math.min((p.twoTheta - lo) / (hi - lo), 1));
      var when = t0 + pos * span;
      /* two octaves of pitch across the pattern */
      var f = 196 * Math.pow(2, pos * 2);
      var amp = (o.amp ? o.amp(p) : 1);
      /* The width in degrees, turned into how far the voices are detuned.
         A tenth of a degree is instrument limited and rings clean. Two
         degrees is a nanocrystal and is meant to sound like mush. */
      var w = Math.max(0, p.width || 0);
      var spread = Math.min(w / 2.2, 1);
      var voices = spread < 0.06 ? 1 : (spread < 0.3 ? 3 : 6);
      var dur = 0.28 + spread * 0.5;
      for (var i = 0; i < voices; i++) {
        var det = voices === 1 ? 0 : ((i / (voices - 1)) - 0.5) * spread * 0.16;
        voice(f * (1 + det), when, dur, (0.16 * amp) / voices,
              /* a broad peak also comes in slowly, because it has no edge */
              0.004 + spread * 0.09);
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
     SONIFICATION TWO · nucleation as a Geiger counter

     One click per nucleus that actually gets across the barrier. Nothing at
     all for the ones that dissolve, which is most of them, and that silence
     is the point. Crank the supersaturation and the counter runs away.
     ---------------------------------------------------------------------- */
  function crackle(pitchHint) {
    if (!on || !ctx) return;
    var t0 = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.11, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
    g.connect(master);
    /* A click is a very short burst of noise, not a note. */
    var n = Math.floor(ctx.sampleRate * 0.035);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400 + (pitchHint || 0) * 900;
    bp.Q.value = 1.4;
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

    /* One invitation, in her voice, low down, easy to ignore, and it does
       not come back once it has been waved away. */
    var inv = document.createElement("div");
    inv.className = "sound-invite";
    inv.setAttribute("role", "note");
    /* Two sentences. On a 320px screen anything longer is a panel sitting on
       top of a paragraph somebody is trying to read. */
    inv.innerHTML =
      '<p>There is sound here if you want it. Nothing plays by itself. A drop ' +
      'lands and you hear a drop, and the crystals that dissolve are silent, ' +
      'which is the part I wanted you to notice.</p>' +
      '<p class="sound-invite-do">' +
      '<button type="button" class="btn-quiet" data-invite-yes>Turn it on</button>' +
      '<button type="button" class="btn-quiet" data-invite-no>No thanks</button></p>';
    document.body.appendChild(inv);
    inv.querySelector("[data-invite-yes]").addEventListener("click", function () {
      setOn(true); dismiss();
    });
    inv.querySelector("[data-invite-no]").addEventListener("click", dismiss);

    /* It appears once, after the reader is well into the page, and never on
       load. If they never get that far they never see it. */
    var shown = false, gone = false;
    function maybe() {
      if (shown || gone) return;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && y / h > 0.18) { shown = true; inv.classList.add("is-up"); }
    }
    dismiss = function () { gone = true; inv.classList.remove("is-up"); inv.hidden = true; };
    window.addEventListener("scroll", maybe, { passive: true });
    maybe();
  }

  /* Replaced by build() once the invitation exists. */
  var dismiss = function () {};

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  /* Buttons and links get the glass tap, and only after a real press. This
     is the one interface sound on the site and it earns its place by being
     the thing that tells you the press registered. */
  document.addEventListener("click", function (e) {
    if (!on) return;
    var t = e.target.closest ? e.target.closest("button, a, summary") : null;
    if (!t) return;
    if (t.hasAttribute("data-sound-toggle")) return;
    sample("tap", { gain: 0.30, gap: 55 });
  }, true);

  document.documentElement.setAttribute("data-sound", "off");

  return {
    enabled: function () { return on; },
    set: setOn,
    onChange: function (fn) { listeners.push(fn); fn(on); },
    sample: sample,
    tone: tone,
    tick: tick,
    settle: settle,
    shimmer: shimmer,
    crackle: crackle,
    pattern: pattern,
    stopPattern: stopPattern,
    reduced: reduced
  };
})();
