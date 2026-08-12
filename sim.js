/* =========================================================================
   sim.js · the shared engine every interactive on this site runs on

   Four jobs, and they exist because of a constraint rather than a preference.
   Some of the people this site is for will open it on a mid range Android
   phone in Lagos. Ten canvases animating at once would ruin it for exactly
   the audience it is written for.

   1. ONE LOOP. There is a single requestAnimationFrame in the whole page and
      it lives here. Simulations do not own loops, they hand over an update
      function and get driven. Only the one in view is driven. Everything else
      is not merely skipped, it is structurally incapable of running, because
      it never had a loop of its own to leave behind.

   2. RESOLUTION BEFORE FRAME RATE. When a device cannot hold the budget the
      backing store shrinks and the agent count drops. A slightly coarser
      field that moves smoothly beats a fine one that stutters. Frame rate is
      the last thing to give.

   3. THREE DEPTHS. Picture, mechanism, maths. One build, three audiences. The
      choice lives in memory and in the URL, never in storage, because the
      brief forbids storage and a shared link should still carry it.

   4. HANDOFF. A simulation can publish a result and another can pick it up,
      so a crystal grown in one place can be diffracted in another. Only used
      where the physics genuinely connects.

   No framework, no build step. Loads with defer and blocks nothing.
   ========================================================================= */

window.Sim = (function () {
  "use strict";

  /* ----------------------------------------------------------------------
     BUDGET

     16ms is one frame at 60Hz. The target is to stay under it on a CPU four
     times slower than a desktop, which means roughly 4ms of real work here.
     STRESS lets us emulate a slower machine by burning a fixed slice of every
     frame. It is an emulation and it is reported as one, never as a measured
     throttle.
     ---------------------------------------------------------------------- */
  var BUDGET_MS = 16;
  var WINDOW = 30;          // frames per decision window
  var OVER_LIMIT = 2;       // consecutive bad windows before dropping a tier
  var UNDER_LIMIT = 4;      // consecutive easy windows before climbing back
  var EASY = 0.6;           // "easy" means under 60% of budget

  var TIERS = [
    { res: null, agents: 1.00, extras: true },   // 0, native, capped at 2x
    { res: 0.75, agents: 0.70, extras: true },   // 1
    { res: 0.50, agents: 0.45, extras: false }   // 2, secondary fields dropped
  ];
  var STATIC_TIER = TIERS.length;                // 3, the floor: no animation

  var reduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: function () {} };

  var sims = [];
  var active = null;
  var rafId = null;
  var lastT = 0;
  var stressMs = 0;         // emulated extra CPU load, 0 in normal operation

  /* Telemetry, read by the report at the end of a build rather than shown. */
  var telemetry = {};


  /* ----------------------------------------------------------------------
     CANVAS

     The CSS size never changes, only the backing store, so dropping a tier
     cannot move the layout or reflow the page around it.
     ---------------------------------------------------------------------- */
  function fitCanvas(cv, resScale) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var scale = dpr * (resScale || 1);
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * scale));
    var h = Math.max(1, Math.round(r.height * scale));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    var ctx = cv.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height, scale: scale };
  }


  /* ----------------------------------------------------------------------
     DEPTH

     picture   what happens, no numbers
     mechanism why it happens, quantities named. the default
     maths     the governing equation, the assumptions, the numbers live
     ---------------------------------------------------------------------- */
  var DEPTHS = ["picture", "mechanism", "maths"];
  var depth = "mechanism";
  var depthListeners = [];

  function setDepth(next, quiet) {
    if (DEPTHS.indexOf(next) < 0 || next === depth) return;
    depth = next;
    document.documentElement.setAttribute("data-depth", depth);
    depthListeners.forEach(function (fn) { try { fn(depth); } catch (e) {} });
    $$("[data-depth-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-depth-set") === depth));
    });
    var says = {
      picture:   "What happens, with no numbers on it.",
      mechanism: "The quantities, named.",
      maths:     "The governing equation, with the values live."
    };
    $$("[data-depth-say]").forEach(function (p) { p.textContent = says[depth]; });
    if (!quiet) writeUrl();
  }

  function onDepth(fn) { depthListeners.push(fn); fn(depth); }


  /* ----------------------------------------------------------------------
     URL STATE

     Everything a visitor changed is in the address bar, so a supervisor can
     send a colleague one exact configuration instead of telling them to go
     and play with it. Nothing is written to storage.
     ---------------------------------------------------------------------- */
  var urlPending = null;

  function writeUrl() {
    if (!window.history || !history.replaceState) return;
    if (urlPending) return;                  // coalesce, dragging fires a lot
    urlPending = setTimeout(function () {
      urlPending = null;
      var p = new URLSearchParams();
      if (depth !== "mechanism") p.set("d", depth);
      sims.forEach(function (s) {
        if (!s.api.serialize) return;
        var v = s.api.serialize();
        if (v === null || v === undefined || v === "") return;
        p.set(s.name, String(v));
      });
      var q = p.toString();
      history.replaceState(null, "", q ? "?" + q + location.hash : location.pathname + location.hash);
    }, 250);
  }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    var d = p.get("d");
    if (d && DEPTHS.indexOf(d) >= 0) setDepth(d, true);
    return p;
  }


  /* ----------------------------------------------------------------------
     HANDOFF

     One simulation publishes a result, another picks it up. Used only where
     the physics genuinely connects, never to make two toys look related.
     ---------------------------------------------------------------------- */
  var channels = {};
  var lastValue = {};

  function publish(channel, value) {
    lastValue[channel] = value;
    (channels[channel] || []).forEach(function (fn) {
      try { fn(value); } catch (e) { if (window.console) console.error(channel, e); }
    });
  }

  function subscribe(channel, fn) {
    (channels[channel] || (channels[channel] = [])).push(fn);
    if (channel in lastValue) { try { fn(lastValue[channel]); } catch (e) {} }
  }

  function latest(channel) { return lastValue[channel]; }


  /* ----------------------------------------------------------------------
     THE LOOP
     ---------------------------------------------------------------------- */
  function frame(now) {
    rafId = null;
    if (!active) return;

    var t0 = performance.now();
    var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0.016;
    lastT = now;

    try {
      active.api.update(dt, active.tier < STATIC_TIER ? TIERS[active.tier] : TIERS[TIERS.length - 1]);
    } catch (e) {
      if (window.console) console.error(active.name, e);
      stop(active);
      fallback(active);
      return;
    }

    if (stressMs > 0) {                       // emulated slower CPU
      var until = performance.now() + stressMs;
      while (performance.now() < until) { /* burn */ }
    }

    var cost = performance.now() - t0;
    record(active, cost);
    schedule();
  }

  function schedule() {
    if (rafId === null && active) rafId = requestAnimationFrame(frame);
  }

  function record(s, cost) {
    s.frames.push(cost);
    var t = telemetry[s.name] || (telemetry[s.name] = { all: [], tiers: {} });
    t.all.push(cost);
    if (t.all.length > 600) t.all.shift();
    t.tiers[s.tier] = (t.tiers[s.tier] || 0) + 1;

    if (s.frames.length < WINDOW) return;
    var med = median(s.frames);
    s.frames.length = 0;

    if (med > BUDGET_MS) {
      s.over++; s.under = 0;
      if (s.over >= OVER_LIMIT) { s.over = 0; stepDown(s); }
    } else if (med < BUDGET_MS * EASY) {
      s.under++; s.over = 0;
      if (s.under >= UNDER_LIMIT) { s.under = 0; stepUp(s); }
    } else {
      s.over = 0; s.under = 0;
    }
  }

  function median(a) {
    var b = a.slice().sort(function (x, y) { return x - y; });
    var m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }

  function stepDown(s) {
    if (s.tier >= STATIC_TIER) return;
    s.tier++;
    if (s.tier >= STATIC_TIER) {
      /* The floor. Same still frame the reduced motion and noscript readers
         get, so there is one fallback and it cannot rot unnoticed. */
      stop(s);
      still(s);
      note(s, "This is running as a still image, because animating it was costing this device too much.");
    } else {
      applyTier(s);
    }
  }

  function stepUp(s) {
    if (s.tier === 0) return;
    s.tier--;
    applyTier(s);
  }

  function applyTier(s) {
    if (s.api.quality) { try { s.api.quality(TIERS[s.tier], s.tier); } catch (e) {} }
  }

  function still(s) {
    if (s.api.still) { try { s.api.still(); } catch (e) {} }
  }

  function note(s, text) {
    if (!s.el || s.el.querySelector(".sim-note")) return;
    var p = document.createElement("p");
    p.className = "sim-note hand";
    p.textContent = text;
    s.el.appendChild(p);
  }

  function fallback(s) {
    still(s);
    note(s, "This one stopped working. The description underneath says what it would have shown.");
  }

  function start(s) {
    if (active === s) return;
    if (active) stop(active);
    active = s;
    lastT = 0;
    if (!s.started) {
      s.started = true;
      if (s.api.start) { try { s.api.start(); } catch (e) { fallback(s); return; } }
    }
    if (s.tier >= STATIC_TIER || reduced.matches) { still(s); active = null; return; }
    schedule();
  }

  function stop(s) {
    if (active === s) {
      active = null;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }


  /* ----------------------------------------------------------------------
     REGISTRATION
     ---------------------------------------------------------------------- */
  function register(name, el, api) {
    if (!el) return null;
    var s = {
      name: name, el: el, api: api,
      tier: 0, frames: [], over: 0, under: 0, started: false
    };
    sims.push(s);

    /* Reduced motion never animates. It gets the still frame and the caption,
       which is the same thing the noscript reader already sees in prose. */
    if (reduced.matches) {
      if (api.start) { try { api.start(); } catch (e) {} }
      s.started = true;
      still(s);
      return s;
    }

    if (!("IntersectionObserver" in window)) { start(s); return s; }

    /* Two labs can sit in one entry, so "whichever fired last" is the wrong
       rule and it left the second one frozen. Track how much of each is on
       screen and drive the one the reader is actually looking at. */
    s.ratio = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { s.ratio = e.isIntersecting ? e.intersectionRatio : 0; });
      pickMostVisible();
    }, { rootMargin: "80px 0px", threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] });
    io.observe(el);
    return s;
  }

  /* Some simulations draw themselves, because they were built before this
     engine existed and they redraw on input rather than every frame. They
     still deserve a share of the address bar. This registers a name and a
     serialiser and nothing else: the entry sits at the static tier so the
     scheduler never tries to drive it. */
  function state(name, serialize) {
    sims.push({
      name: name, el: null, api: { serialize: serialize },
      tier: STATIC_TIER, frames: [], over: 0, under: 0, started: true, ratio: 0
    });
  }

  function pickMostVisible() {
    var best = null;
    sims.forEach(function (s) {
      if (s.tier >= STATIC_TIER) return;
      if (!best || (s.ratio || 0) > (best.ratio || 0)) best = s;
    });
    if (!best || !(best.ratio > 0)) { if (active) stop(active); return; }
    if (best !== active) start(best);
  }

  /* A page hidden in a background tab does no work at all. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (active) { var a = active; stop(a); active = a; } }
    else { lastT = 0; schedule(); }
  });


  /* ----------------------------------------------------------------------
     DEPTH AND CODE CONTROLS, built rather than hand written per simulation
     ---------------------------------------------------------------------- */
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* The three depths are the strongest educational idea on this site and
     the control for them used to be three unlabelled buttons that a reader
     had to press one of to find out what they did. It now says what it is
     asking, and each button carries a filled or open mark, so which one is
     in force is never carried by colour alone. */
  function buildDepthControl(host) {
    if (!host || host.querySelector(".depth")) return;

    var wrap = document.createElement("div");
    wrap.className = "depth";

    var q = document.createElement("p");
    q.className = "depth-q";
    q.id = "depth-q-" + Math.random().toString(36).slice(2, 7);
    q.textContent = "How deep?";
    wrap.appendChild(q);

    var group = document.createElement("div");
    group.className = "depth-set";
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", q.id);

    var labels = { picture: "Picture", mechanism: "Mechanism", maths: "Maths" };
    var says = {
      picture:   "What happens, with no numbers on it.",
      mechanism: "The quantities, named.",
      maths:     "The governing equation, with the values live."
    };

    DEPTHS.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "depth-btn";
      b.setAttribute("data-depth-set", d);
      b.setAttribute("aria-pressed", String(d === depth));
      b.title = says[d];
      b.innerHTML = '<span class="depth-mark" aria-hidden="true"></span>' +
                    '<span class="depth-word"></span>';
      b.querySelector(".depth-word").textContent = labels[d];
      b.addEventListener("click", function () { setDepth(d); });
      group.appendChild(b);
    });

    wrap.appendChild(group);

    var say = document.createElement("p");
    say.className = "depth-say";
    say.setAttribute("data-depth-say", "");
    say.textContent = says[depth];
    wrap.appendChild(say);

    host.appendChild(wrap);
  }

  /* "Show the code" reveals the function that actually governs the thing,
     with its assumptions. Scientists show their working. */
  function buildCodeControl(host, title, source, assumptions) {
    if (!host || host.querySelector(".showcode")) return;
    var d = document.createElement("details");
    d.className = "showcode";
    var s = document.createElement("summary");
    s.textContent = "Show the code";
    d.appendChild(s);
    if (assumptions && assumptions.length) {
      var ul = document.createElement("ul");
      ul.className = "assumptions";
      assumptions.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent = a;
        ul.appendChild(li);
      });
      var h = document.createElement("p");
      h.className = "assumptions-title mono";
      h.textContent = "WHAT THIS ASSUMES";
      d.appendChild(h);
      d.appendChild(ul);
    }
    var pre = document.createElement("pre");
    pre.className = "code";
    var code = document.createElement("code");
    code.textContent = source;
    pre.appendChild(code);
    d.appendChild(pre);
    host.appendChild(d);
  }


  /* ----------------------------------------------------------------------
     TOUCH

     A thumb covers whatever it is dragging, so the handle is offset above
     the finger and every slider gets a stepper beside it for exact values.
     ---------------------------------------------------------------------- */
  var TOUCH_OFFSET = 34;   // px, lifts the grabbed point clear of the finger

  /* This existed for a long while and nothing called it, so every drag on
     the site still put the thing being dragged directly under the thumb.
     It also only recognised TouchEvent, and everything here uses pointer
     events, so wiring it up without this second test would have changed
     nothing on a phone. A pointer knows what kind it is; ask it. */
  function isTouch(ev) {
    if (ev.touches && ev.touches[0]) return true;
    return ev.pointerType === "touch" || ev.pointerType === "pen";
  }

  function pointer(ev, el) {
    var r = el.getBoundingClientRect();
    var src = (ev.touches && ev.touches[0]) || ev;
    var touch = isTouch(ev);
    var lift = touch ? TOUCH_OFFSET : 0;
    return { x: src.clientX - r.left, y: src.clientY - r.top - lift, touch: touch };
  }

  function stepper(input, opts) {
    if (!input || input.parentNode.querySelector(".stepper")) return;
    var o = opts || {};
    var wrap = document.createElement("span");
    wrap.className = "stepper";
    [["−", -1], ["+", 1]].forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = pair[0];
      b.setAttribute("aria-label", (pair[1] < 0 ? "Decrease " : "Increase ") + (o.label || "value"));
      b.addEventListener("click", function () {
        var step = parseFloat(input.step) || 1;
        var v = parseFloat(input.value) + pair[1] * step;
        v = Math.min(parseFloat(input.max), Math.max(parseFloat(input.min), v));
        input.value = String(v);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      wrap.appendChild(b);
    });
    input.parentNode.insertBefore(wrap, input.nextSibling);
  }


  /* ----------------------------------------------------------------------
     "Scripting is on" belongs here rather than in app.js, because app.js is
     the notebook's own script and the guide page does not load it. It did
     not, and the guide showed every simulation with its no JavaScript prose
     sitting underneath it saying what it would have shown. Anything that
     runs a simulation loads this file, so this is where the class lives.
     Adding it twice is harmless.
     ---------------------------------------------------------------------- */
  document.documentElement.classList.add("js");

  document.documentElement.setAttribute("data-depth", depth);

  /* A frame that wraps a simulation sometimes needs to ask it for something
     the reader asked for: send your result again, take these colours. The
     alternative was reaching into the module through a global, which is how
     two files end up quietly depending on each other's load order. */
  function api(name) {
    for (var i = 0; i < sims.length; i++) if (sims[i].name === name) return sims[i].api;
    return null;
  }

  return {
    register: register,
    api: api,
    state: state,
    fitCanvas: fitCanvas,
    onDepth: onDepth,
    setDepth: setDepth,
    depth: function () { return depth; },
    publish: publish,
    subscribe: subscribe,
    latest: latest,
    readUrl: readUrl,
    writeUrl: writeUrl,
    buildDepthControl: buildDepthControl,
    buildCodeControl: buildCodeControl,
    pointer: pointer,
    stepper: stepper,
    reduced: function () { return reduced.matches; },

    /* Used by the build to emulate a slower CPU. Reported as an emulation. */
    stress: function (ms) { stressMs = ms || 0; },
    telemetry: function () {
      var out = {};
      Object.keys(telemetry).forEach(function (k) {
        var a = telemetry[k].all;
        if (!a.length) return;
        var b = a.slice().sort(function (x, y) { return x - y; });
        /* Copied, not referenced. Handing back the live object meant two
           snapshots aliased each other and a comparison between them read as
           "nothing changed" when plenty had. A measurement you can misread
           is not a measurement. */
        var tiers = {};
        Object.keys(telemetry[k].tiers).forEach(function (t) { tiers[t] = telemetry[k].tiers[t]; });
        out[k] = {
          n: b.length,
          median: +median(b).toFixed(2),
          p95: +b[Math.min(b.length - 1, Math.floor(b.length * 0.95))].toFixed(2),
          worst: +b[b.length - 1].toFixed(2),
          tierFrames: tiers
        };
      });
      return out;
    },
    budget: BUDGET_MS
  };
})();
