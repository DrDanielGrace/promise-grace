/* =========================================================================
   beds.js · the per simulation ambient beds, on the notebook

   WHY THIS FILE EXISTS

   The laboratory bed plays on the notebook, because audio.js starts it the
   moment sound is switched on and it belongs to the site rather than to any
   simulation. The per simulation beds did not, and the reason turned out to
   be simpler than a missing registration: every simulation on the notebook
   is registered with the engine and always was, but the code that raises a
   bed lives in instrument.js, and the notebook does not load instrument.js.
   Nothing was telling the ambient bus which bed to raise, so it raised none.

   So this is the smallest thing that fixes that: the bed half of the frame,
   and nothing else from the frame. No markup is added, no styling is
   touched, and no working code is moved out of app.js. The two beds, the
   square root, the crossfade between water and room tone and the levels are
   the same numbers instrument.js uses, so a simulation sounds the same in
   the notebook as it does at full screen.

   WHICH SIMULATION IS PLAYING

   The engine already drives whichever simulation is most on screen. This
   watches the same elements with the same kind of observer and follows the
   most visible one, rather than reaching into the engine for its private
   choice. When no simulation is on screen at all both beds go to nought and
   the laboratory comes back up on its own, which is what a reader walking
   from a simulation into a page of prose should hear.

   WHAT MOVES THEM

   Eight of the ten already declare that in frames.js, and those
   declarations are read from there rather than copied, so there is one
   description of what is flowing in each simulation and both pages use it.
   The phase diagram and the stalactite are the notebook's own and are
   declared here, because frames.js is a table of what the instrument frame
   knows and neither of them is framed.

   DUCKING is not implemented here and must not be: audio.js drops the
   laboratory under whichever bed is raised, from inside bed.set, so it
   happens on the notebook for the same reason and by the same code path it
   happens at full screen.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim || !window.Aud) return;

  /* The two the notebook owns. Everything else is read from frames.js. */
  var OWN = {
    /* A binary phase diagram with a beaker beside it. What can move is
       whatever is still liquid, and the region readout already says: all of
       it, some of it, or none of it. */
    phase: {
      motion: { fn: function (el) {
        var b = el.querySelector('[data-out="region"]');
        var s = b ? String(b.textContent) : "";
        if (s.indexOf("Liquid") < 0) return 0;
        return s.indexOf("+") >= 0 ? 0.5 : 1;
      } }
    },

    /* A cave, and water arriving at a ceiling drop by drop. It runs the same
       way whatever else is on the page, so it is held rather than pretended
       to track something. Lower than the titration flask because a cave is
       further away than a bench. */
    stalactite: { motion: { fixed: 0.3 } }
  };

  function declared(name) {
    if (OWN[name]) return OWN[name];
    var f = window.Frames && window.Frames[name];
    return f && f.bed ? f.bed : null;
  }

  function primarySelector(name) {
    var f = window.Frames && window.Frames[name];
    return f && f.primary ? f.primary : null;
  }

  function clamp(v) { return Math.max(0, Math.min(v, 1)); }


  /* ----------------------------------------------------------------------
     HOW MUCH IS MOVING, between nought and one

     The same four ways of knowing the frame uses, in the same order, so a
     simulation cannot report one number here and a different one there. The
     readout is read out of the element rather than off the page, because
     ten simulations share this page and three of them have a row called
     something the others also call it.
     ---------------------------------------------------------------------- */
  function motion(name, el) {
    var b = declared(name);
    if (!b) return 0;
    if (b.still) return 0;
    var m = b.motion || {};

    if (m.fn) {
      var f = m.fn(el);
      return isFinite(f) ? clamp(f) : 0;
    }
    if (m.api) {
      var api = Sim.api ? Sim.api(name) : null;
      var v = api && api.motion ? api.motion() : null;
      return isFinite(v) ? clamp(v) : 0;
    }
    if (m.fixed !== undefined) return clamp(m.fixed);
    if (m.line) {
      var out = el.querySelector('[data-out="' + m.line + '"]');
      if (!out) return 0;
      var n = parseFloat(String(out.textContent).replace(/[^0-9eE.+-]/g, ""));
      if (!isFinite(n)) return 0;
      return clamp((n - m.lo) / (m.hi - m.lo));
    }
    if (m.control) {
      var sel = primarySelector(name);
      var input = sel ? el.querySelector(sel) : null;
      if (!input || input.type !== "range") return 0;
      var lo = parseFloat(input.min), hi = parseFloat(input.max);
      var at = parseFloat(input.value);
      if (!isFinite(lo) || !isFinite(hi) || hi === lo || !isFinite(at)) return 0;
      return clamp((at - lo) / (hi - lo));
    }
    return 0;
  }


  /* ----------------------------------------------------------------------
     THE TWO BEDS

     Water where there is convection, room tone where there is not, and the
     crossfade between them is the physics. Both are lazy: a reader who never
     switches sound on, or never reaches a simulation, never fetches the two
     twelve second files.
     ---------------------------------------------------------------------- */
  var water = null, roomtone = null;

  function ensure() {
    if (water || !window.Snd || !Snd.enabled()) return;
    water = Aud.bed("water", { cap: 0.34, dark: 3400, glide: 0.7, from: 1.0 });
    roomtone = Aud.bed("room", { cap: 0.26, dark: 2600, glide: 0.9, from: 0.5 });
  }

  function apply() {
    if (!window.Snd || !Snd.enabled()) return;
    if (!current) {
      /* Nothing running. Both down, and audio.js lifts the laboratory back
         to where it was without being asked. */
      if (water) { water.set(0); roomtone.set(0); }
      return;
    }
    ensure();
    if (!water || !roomtone) return;
    /* The square root, for the same reason the frame uses one: movement in a
       fluid follows the square root of what drives it far more often than it
       follows the driver, and the last tenth is where the audible change is. */
    var move = Math.sqrt(clamp(motion(current.name, current.el)));
    water.set(move);
    roomtone.set(0.35 + 0.65 * (1 - move));
  }


  /* ----------------------------------------------------------------------
     WHICH ONE THE READER IS LOOKING AT
     ---------------------------------------------------------------------- */
  var watched = [];
  var current = null;

  function pick() {
    var best = null;
    watched.forEach(function (s) {
      if (!best || s.ratio > best.ratio) best = s;
    });
    var next = best && best.ratio > 0 ? best : null;
    if (next === current) return;
    current = next;
    apply();
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-lab]"))
    .forEach(function (el) {
      var name = el.getAttribute("data-lab");
      if (!declared(name)) return;
      var s = { name: name, el: el, ratio: 0 };
      watched.push(s);

      if (!("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          s.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        });
        pick();
      }, { rootMargin: "80px 0px", threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] });
      io.observe(el);
    });


  /* A control moving is heard straight away. The rest is read on the same
     slow cadence the frame reads it on, because a bed that chases every
     frame of a physics loop is a bed you can hear thinking. */
  document.addEventListener("input", function (e) {
    if (!current || !e.target || !current.el.contains(e.target)) return;
    apply();
  }, true);

  setInterval(apply, 900);

  if (window.Snd) {
    Snd.onChange(function (on) {
      if (on) { apply(); return; }
      Aud.stopBeds();
      water = roomtone = null;
    });
  }
})();
