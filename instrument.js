/* =========================================================================
   instrument.js · the frame, and only the frame

   The physics is in lab-crystal.js and nothing here touches it. This file
   does four things and no others.

   1. BRINGS IT UP. A real timestamped run identifier, and a short sequence
      on load so the thing arrives rather than appears. Under reduced motion
      it simply is there, which is the correct behaviour and also the honest
      one.

   2. DISCLOSES. Four steps. The question first, then the crystal and one
      control, then the readout once gravity has actually moved, then the
      rest. Nothing is locked: `Everything` is on the first screen and jumps
      straight to the end. It is never the default, because a panel of
      twelve controls is exactly what made these feel like widgets.

   3. LISTENS FOR MARKS. lab-crystal.js announces four moments and stays
      silent about all of them. Here each one gets a sound, a line in the
      marks list, and the readout line it belongs to lit at the same
      instant. If it is heard it is also seen, in the same frame.

   4. RUNS THE BED. Two loops on the ambient bus, crossfaded by gravity.
      Under gravity there is water moving. Near zero g that movement thins
      out and what is left is the room. The bed follows the slider, not a
      timer, so it is telling you something rather than decorating.
   ========================================================================= */

(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("inst")) return;

  var host = document.querySelector('[data-lab="crystal"]');
  var slider = document.querySelector("[data-g]");
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel) { return document.querySelector(sel); }


  /* ----------------------------------------------------------------------
     THE RUN IDENTIFIER

     An actual UTC timestamp of the moment this instrument came up. It goes
     in the marks alongside every event, so a screenshot of the readout is
     dateable, which is the only reason a run identifier is worth having.
     ---------------------------------------------------------------------- */
  var started = new Date();

  function stamp(d) {
    function p(n, w) { return String(n).padStart(w || 2, "0"); }
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) +
           "-" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + "Z";
  }

  function clock(d) {
    function p(n) { return String(n).padStart(2, "0"); }
    return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) +
           "." + String(Math.floor(d.getUTCMilliseconds() / 100));
  }

  var runId = $("[data-run-id]");
  if (runId) runId.textContent = "CRYSTAL-01 · RUN " + stamp(started);


  /* ----------------------------------------------------------------------
     SOUND, ROUTED THROUGH THE FOUR BUSES

     Every voice here is declared in audio.js against its own recording, so
     no two kinds of interaction can end up sharing a sample. The frame just
     names them.
     ---------------------------------------------------------------------- */
  function say(voice, extra) {
    if (window.Aud && window.Snd && Snd.enabled()) Aud.play(voice, extra);
  }


  /* ----------------------------------------------------------------------
     DISCLOSURE
     ---------------------------------------------------------------------- */
  var stage = 0;
  var gravityMoved = 0;

  function reveal(part) {
    var el = document.querySelector('[data-part="' + part + '"]');
    if (!el || reduced) return;
    el.classList.remove("is-arriving");
    /* forcing layout is what lets the same class be added twice running */
    void el.offsetWidth;
    el.classList.add("is-arriving");
  }

  function setStage(next, quiet) {
    next = Math.max(0, Math.min(next, 3));
    if (next <= stage) return;
    var was = stage;
    stage = next;
    body.setAttribute("data-stage", String(stage));

    if (was < 1 && stage >= 1) {
      /* Arriving. A low room swell and a latch, layered, and the only pair
         allowed to be noticeable. */
      if (!quiet) { say("arrive"); setTimeout(function () { say("latch"); }, 90); }
      reveal("control");
      startBed();
    }
    if (was < 2 && stage >= 2) {
      if (!quiet) say("appear");
      reveal("readout");
    }
    if (was < 3 && stage >= 3) {
      if (!quiet) { say("appear"); setTimeout(function () { say("latch"); }, 110); }
      ["marks", "handoff", "chrome", "prose", "late-control"].forEach(reveal);
    }

    var ev = $("[data-everything]");
    if (ev) ev.setAttribute("aria-pressed", String(stage >= 3));
    /* A canvas that was display:none has no size, so the ones that just
       appeared need a frame to measure themselves in. */
    requestAnimationFrame(function () { window.dispatchEvent(new Event("resize")); });
  }

  var begin = $("[data-begin]");
  if (begin) begin.addEventListener("click", function () {
    say("button");
    setStage(1);
    if (slider) slider.focus();
  });

  /* Committing to a prediction brings it up too, because having answered
     the question is the point at which the question stops being the thing
     on screen. */
  Array.prototype.slice.call(document.querySelectorAll(".predict button[data-a]"))
    .forEach(function (b) {
      b.addEventListener("click", function () {
        setTimeout(function () { setStage(1); }, 520);
      });
    });

  var everything = $("[data-everything]");
  if (everything) everything.addEventListener("click", function () {
    say("button");
    if (stage >= 3) return;
    setStage(3);
  });

  if (slider) {
    slider.addEventListener("input", function () {
      gravityMoved++;
      if (stage === 1) setStage(2);
      else if (stage === 2 && gravityMoved > 6) setStage(3);
      bedFromGravity();
    });
  }


  /* ----------------------------------------------------------------------
     THE BED

     water     movement in the solution, which is what convection is
     room      what is left when nothing is moving

     Crossfaded by gravity rather than by a timer. Under gravity you hear
     the solution being stirred past the face. Take it away and the movement
     thins out and settles into room tone, which is the sound you only
     notice when it stops.
     ---------------------------------------------------------------------- */
  var water = null, roomtone = null;

  /* Asking for a bed twice returns the one that is already running, so this
     is safe to call on every stage change and it repairs itself if the beds
     were ever torn down underneath it. Guarding on a local handle instead
     was how this ended up holding a dead one. */
  function startBed() {
    if (!window.Aud) return;
    water = Aud.bed("water", { cap: 0.34, dark: 3400, glide: 0.7, from: 1.0 });
    roomtone = Aud.bed("room", { cap: 0.26, dark: 2600, glide: 0.9, from: 0.5 });
    bedFromGravity();
  }

  function bedFromGravity() {
    if (!water || !roomtone) return;
    var g = slider ? parseFloat(slider.value) : 1;
    if (!isFinite(g)) g = 1;
    /* Buoyancy velocity is proportional to g, so movement should follow the
       square root of it rather than g itself: the last tenth of gravity is
       where most of the audible stirring actually goes. */
    var move = Math.sqrt(Math.max(0, Math.min(g, 1)));
    water.set(move);
    roomtone.set(0.35 + 0.65 * (1 - move));
  }

  if (window.Snd) {
    Snd.onChange(function (on) {
      if (on && stage >= 1) startBed();
      if (!on && window.Aud) { Aud.stopBeds(); water = roomtone = null; }
    });
  }


  /* ----------------------------------------------------------------------
     MARKS

     Four moments, each with its own sound and its own line. The readout row
     the mark belongs to lights at the same instant, so nothing is audible
     without also being visible.
     ---------------------------------------------------------------------- */
  var list = $("[data-marks]");
  var marksBox = $('[data-part="marks"]');
  var seen = 0;

  var KIND = {
    shell: {
      voice: "shell", line: "shell", cool: true,
      title: "SHELL 24.0 µm",
      note: "The depleted region has reached twice the seed radius."
    },
    peclet: {
      voice: null, line: "pe", cool: false,
      title: "PÉCLET 1",
      note: "Transport has changed hands."
    },
    complete: {
      voice: "complete", line: "r", cool: true,
      title: "RUN COMPLETE",
      note: "The crystal reached the end of the sweep."
    },
    handoff: {
      voice: "handoff", line: null, cool: false,
      title: "HANDOFF SENT",
      note: "Radius computed, strain a declared proxy, both to diffraction."
    }
  };

  /* If it is heard it is also seen, in the same frame. The handoff has no
     readout row of its own, so the thing it lights is the line that says
     where the result went. */
  function light(which) {
    var row = which
      ? document.querySelector('[data-line="' + which + '"]')
      : document.querySelector("[data-handoff-state]");
    if (!row) return;
    row.classList.add("is-marked");
    setTimeout(function () { row.classList.remove("is-marked"); }, 1600);
  }

  function addMark(kind, d) {
    var k = KIND[kind];
    if (!k || !list) return;

    var when = new Date(d && d.at ? d.at : Date.now());
    var li = document.createElement("li");
    li.className = "is-new" + (k.cool ? " is-cool" : "");

    var t = document.createElement("time");
    t.dateTime = when.toISOString();
    t.textContent = clock(when);

    var wrap = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = kind === "peclet"
      ? (d && d.up ? "PÉCLET 1 ↑" : "PÉCLET 1 ↓")
      : k.title;
    var s = document.createElement("span");
    s.textContent = kind === "peclet"
      ? (d && d.up ? "Flow has taken over from diffusion." : "Diffusion has taken over from flow.")
      : k.note;
    wrap.appendChild(b); wrap.appendChild(s);

    li.appendChild(t); li.appendChild(wrap);
    list.appendChild(li);

    /* A marks list that grows without limit is a memory leak with a nice
       name on it. The last dozen is what anybody reads. */
    while (list.children.length > 12) list.removeChild(list.firstChild);

    seen++;
    if (marksBox) marksBox.setAttribute("data-any", "1");
  }

  if (window.Sim && Sim.subscribe) {
    Sim.subscribe("crystal:mark", function (d) {
      if (!d || !d.kind) return;
      var k = KIND[d.kind];
      if (!k) return;
      /* Peclet already has a voice, in lab-crystal, and it is the same
         threshold knock the notebook plays. It does not get a second one. */
      if (k.voice) say(k.voice);
      light(k.line);
      addMark(d.kind, d);
      if (d.kind === "handoff") sent(d);
      /* The first mark of a run is the moment the rest of the panel has
         earned its place. */
      if (stage === 2) setStage(3);
    });
  }


  /* ----------------------------------------------------------------------
     THE HANDOFF, MADE VISIBLE

     The automatic publish when a run finishes is untouched. This is a
     control that does the same thing on purpose, because a result that only
     travels when a run happens to finish is a result nobody knows they can
     send.
     ---------------------------------------------------------------------- */
  var state = $("[data-handoff-state]");
  var resend = $("[data-resend]");

  function sent(d) {
    if (!state) return;
    var r = d && isFinite(d.radius_um) ? d.radius_um.toFixed(1) : "";
    state.textContent = "SENT " + clock(new Date()) +
                        (r ? "  ·  R " + r + " µm" : "");
    state.setAttribute("data-sent", "1");
  }

  if (resend) resend.addEventListener("click", function () {
    say("button");
    var api = window.Sim && Sim.api ? Sim.api("crystal") : null;
    if (api && api.resend) api.resend();
    else if (state) state.textContent = "Nothing to send yet.";
  });


  /* ----------------------------------------------------------------------
     BUTTONS, PANELS, AND LEAVING

     Five interaction types, five different recordings, and none of them
     shared with another:

       a button          a switch giving under a finger
       a panel opening   a latch coming free
       a control arriving cloth settling
       arriving here     a low room swell
       leaving           something closing
     ---------------------------------------------------------------------- */
  Array.prototype.slice.call(document.querySelectorAll("button"))
    .forEach(function (b) {
      if (b.hasAttribute("data-begin") || b.hasAttribute("data-everything") ||
          b.hasAttribute("data-resend") || b.closest(".predict") ||
          b.closest(".aud") || b.hasAttribute("data-sound-toggle") ||
          b.hasAttribute("data-aud-open")) return;
      b.addEventListener("click", function () { say("button"); });
    });

  /* The depth control and the stepper are built by sim.js after this file
     has already run, so they are caught on the way up instead. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".depth-btn") || t.closest(".stepper button") ||
        t.closest("[data-act]")) say("button");
  }, true);

  Array.prototype.slice.call(document.querySelectorAll("details"))
    .forEach(function (d) {
      d.addEventListener("toggle", function () {
        say(d.open ? "latch" : "unlatch");
      });
    });

  var leave = $("[data-leave]");
  if (leave) leave.addEventListener("click", function (e) {
    if (!window.Snd || !Snd.enabled()) return;
    e.preventDefault();
    say("leave");
    if (window.Aud) Aud.stopBeds();
    setTimeout(function () { location.href = leave.getAttribute("href"); }, 220);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    /* Arrows and space belong to whatever has focus. Only Escape is the
       frame's, and only when nothing is expanded under it. */
    var open = document.querySelector("details[open]");
    if (open) { open.open = false; return; }
    if (leave) leave.click();
  });


  /* ----------------------------------------------------------------------
     COMING UP
     ---------------------------------------------------------------------- */
  if (host && window.Sim && Sim.api) {
    var api = Sim.api("crystal");
    if (api && api.repalette) api.repalette();
  }

  if (!reduced) {
    body.setAttribute("data-boot", "1");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.setAttribute("data-boot", "2"); });
    });
  }

  /* A link can carry a stage as well as a mix and a gravity, so a colleague
     can be sent the panel already open. */
  var params = new URLSearchParams(location.search);
  var s = parseInt(params.get("stage"), 10);
  if (isFinite(s) && s > 0) setStage(s, true);
})();
