/* =========================================================================
   pages.js · the notebook, opened one page at a time

   The site should feel like a notebook rather than one endless scroll. The
   danger in that idea is every implementation of it on the web: hijacked
   wheels, a dead scrollbar, a keyboard that stops working, a section you
   cannot reach because the turn animation swallowed it.

   So this never takes the scroll over. The document scrolls exactly as it
   always did. Everything here is a layer on top of native scrolling:

     SCROLLING turns pages because the container snaps by PROXIMITY, not by
       mandate. Proximity settles you onto a page when you are already near
       one and never pulls you anywhere. An entry taller than the screen is
       given no snap point at all, so it scrolls normally inside itself.

     DRAGGING and SWIPING work horizontally, because vertical belongs to the
       scrollbar and always will. The page follows the hand, lifts as it is
       pulled, and either falls open or drops back on release depending on
       how far it went. A drag that starts on a control, a canvas or a
       simulation is not a page turn and is left alone.

     THE KEYBOARD gets left and right for turning, always. Space turns only
       when the page you are on is fully on screen with nothing left to
       read; otherwise space does what space has always done. Up and down
       are never touched.

   And there is a switch that turns the whole thing off and leaves a plain
   long page, because some people just want to read.
   ========================================================================= */

window.Pages = (function () {
  "use strict";

  var reduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: function () {} };

  var root = document.documentElement;
  var sheet = document.querySelector("main.sheet");
  if (!sheet) return null;

  /* The notebook's pages are entries. The mission planner's are sections,
     and the contents, index and guide pages are entries again. Rather than
     hardcode one shape, each page says what counts as a page on its own
     main element, and the notebook's shape stays the default. */
  var selector = sheet.getAttribute("data-pages-of") || ".entry";
  var pages = Array.prototype.slice.call(sheet.querySelectorAll(selector));
  if (pages.length < 2) return null;

  var on = true;
  var current = 0;
  var furthest = 0;
  var edges = null, ribbon = null;

  function phone() { return window.innerWidth < 640; }

  /* ----------------------------------------------------------------------
     WHICH PAGE AM I ON

     Whichever page covers most of the screen. Not "the last one that
     crossed the top", which gets it wrong on a short entry.
     ---------------------------------------------------------------------- */
  function visibleShare(el) {
    var r = el.getBoundingClientRect();
    var top = Math.max(r.top, 0);
    var bot = Math.min(r.bottom, window.innerHeight);
    return Math.max(0, bot - top);
  }

  function recompute() {
    var best = 0, bestV = -1;
    for (var i = 0; i < pages.length; i++) {
      var v = visibleShare(pages[i]);
      if (v > bestV) { bestV = v; best = i; }
    }
    if (best !== current) {
      current = best;
      if (current > furthest) furthest = current;
      mark();
      /* Scrolling past a page boundary is the thing you hear most, so it is
         the quietest thing here: a short window of real paper, a bit
         different every time. It fires on the boundary, never continuously,
         so scrolling itself makes no sound. */
      if (on && window.Snd && Snd.enabled() && !reduced.matches) Snd.scroll();
    }
  }

  /* ----------------------------------------------------------------------
     SNAP POINTS

     Only pages that actually fit get one. A tall entry with a snap point at
     its top is the thing that makes paged sites feel like they are fighting
     you, because every small scroll inside it tries to go home.
     ---------------------------------------------------------------------- */
  function fitSnaps() {
    var h = window.innerHeight;
    pages.forEach(function (p) {
      var fits = p.getBoundingClientRect().height <= h * 0.98;
      p.classList.toggle("snaps", fits && on);
    });
  }

  /* ----------------------------------------------------------------------
     TURNING
     ---------------------------------------------------------------------- */
  function goTo(i, why) {
    i = Math.max(0, Math.min(i, pages.length - 1));
    if (i === current && why !== "click") return;
    var target = pages[i];
    target.scrollIntoView({
      behavior: reduced.matches ? "auto" : "smooth",
      block: "start"
    });
    current = i;
    if (current > furthest) furthest = current;
    mark();
    settle(target);
    if (window.Snd && Snd.enabled()) Snd.page();
  }

  /* The soft shadow that lifts along the leading edge as a page comes to
     rest. It is a class with an animation on it, removed when it finishes,
     so nothing is left running. */
  function settle(el) {
    if (reduced.matches || !on) return;
    el.classList.remove("is-settling");
    /* forcing a reflow is the only way to restart a CSS animation */
    void el.offsetWidth;
    el.classList.add("is-settling");
    setTimeout(function () { el.classList.remove("is-settling"); }, 520);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* ----------------------------------------------------------------------
     DRAG AND SWIPE

     Horizontal only. Vertical is the scrollbar's and is never intercepted.
     ---------------------------------------------------------------------- */
  var drag = null;
  var IGNORE = "input,button,a,select,textarea,canvas,summary,details,label," +
               ".lab,.stepper,.depth,[data-lab],[role=button]";

  function onDown(e) {
    if (!on || e.button > 0 || reduced.matches) return;
    if (e.target.closest && e.target.closest(IGNORE)) return;
    /* a text selection is not a page turn */
    if (window.getSelection && String(window.getSelection()).length > 0) return;
    drag = {
      x: e.clientX, y: e.clientY, dx: 0,
      id: e.pointerId, decided: false, live: false,
      el: pages[current]
    };
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;

    if (!drag.decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      /* Whichever way the hand committed first wins, and if it was vertical
         we let go entirely rather than half holding it. */
      drag.decided = true;
      drag.live = Math.abs(dx) > Math.abs(dy) * 1.3;
      if (!drag.live) { drag = null; return; }
      drag.el.classList.add("is-dragging");
      try { e.target.setPointerCapture && e.target.setPointerCapture(drag.id); } catch (err) {}
    }
    if (!drag.live) return;

    /* At the two ends there is nothing to turn to, so the page gets heavy
       rather than sliding off into nothing. */
    var atEnd = (dx < 0 && current === pages.length - 1) ||
                (dx > 0 && current === 0);
    drag.dx = dx * (atEnd ? 0.18 : 0.55);
    lift(drag.el, drag.dx);
    e.preventDefault();
  }

  function lift(el, dx) {
    var w = window.innerWidth;
    var f = Math.max(-1, Math.min(dx / (w * 0.5), 1));
    /* Gentler on a phone, where the whole page is the thing under the thumb
       and a big tilt reads as a glitch rather than as paper. */
    var tilt = phone() ? 1.2 : 3.0;
    el.style.transform = "translateX(" + dx.toFixed(1) + "px) rotate(" +
                         (f * tilt).toFixed(2) + "deg)";
    el.style.boxShadow = "0 " + (Math.abs(f) * 22).toFixed(0) + "px " +
                         (Math.abs(f) * 48).toFixed(0) + "px rgba(51,46,92," +
                         (Math.abs(f) * 0.22).toFixed(3) + ")";
  }

  function drop(el) {
    el.classList.remove("is-dragging");
    el.style.transform = "";
    el.style.boxShadow = "";
  }

  function onUp(e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.live) return;
    drop(d.el);
    /* Past a quarter of the screen it falls open. Short of that it drops
       back, which is the only honest way to make a drag feel like paper. */
    var threshold = window.innerWidth * (phone() ? 0.28 : 0.22);
    if (Math.abs(d.dx) > threshold * 0.55) {
      if (d.dx < 0) next(); else prev();
    }
  }

  function onCancel() {
    if (drag) { drop(drag.el); drag = null; }
  }

  /* ----------------------------------------------------------------------
     KEYBOARD
     ---------------------------------------------------------------------- */
  function typing(t) {
    if (!t) return false;
    if (t.isContentEditable) return true;
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A|OPTION)$/.test(t.tagName)) return true;
    /* Anything that took focus deliberately owns its own keys. The phase
       diagram is the case that caught this: its canvas moves the point with
       the arrow keys, and a page turn firing at the same time would have
       been exactly the broken keyboard this file promises not to be. */
    if (t.hasAttribute && t.hasAttribute("tabindex") &&
        t.getAttribute("tabindex") !== "-1") return true;
    return !!(t.closest && t.closest("[data-lab], .lab"));
  }

  function onKey(e) {
    if (!on || e.metaKey || e.ctrlKey || e.altKey) return;
    /* Somebody nearer the event already dealt with it. */
    if (e.defaultPrevented) return;
    if (typing(e.target)) return;
    /* A focused simulation owns the arrows and the space bar. A slider is
       already covered by typing(), but a canvas that takes arrow keys is
       not, and that conflict bit once: the phase diagram moved its point
       and the page turned underneath it at the same time. */
    if (e.target && e.target.closest && e.target.closest("[data-lab]")) return;

    if (e.key === "ArrowRight") { e.preventDefault(); next(); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); prev(); return; }

    /* Space turns only when there is nothing left to read on this page.
       Otherwise it does what space has always done, which is scroll. */
    if (e.key === " " || e.key === "Spacebar") {
      var r = pages[current].getBoundingClientRect();
      var whole = r.top >= -2 && r.bottom <= window.innerHeight + 2;
      if (!whole) return;
      e.preventDefault();
      if (e.shiftKey) prev(); else next();
    }
  }

  /* ----------------------------------------------------------------------
     THE EDGES, THE RIBBON AND THE PAGE NUMBERS
     ---------------------------------------------------------------------- */
  function title(p) {
    var id = p.getAttribute("aria-labelledby");
    var h = id ? document.getElementById(id) : p.querySelector("h2");
    return h ? h.textContent.replace(/\s+/g, " ").trim() : ("Entry " + (pages.indexOf(p) + 1));
  }

  function build() {
    /* The stylesheet targets .is-page rather than .entry, so that the
       planner's sections get the same treatment without the CSS having to
       know what shape each page uses. */
    pages.forEach(function (p) { p.classList.add("is-page"); });

    /* page numbers, in her handwriting, small, bottom of each page */
    pages.forEach(function (p, i) {
      if (p.querySelector(".page-num")) return;
      var n = document.createElement("p");
      n.className = "page-num hand";
      n.setAttribute("aria-hidden", "true");
      n.textContent = String(i + 1);
      p.appendChild(n);
    });

    /* the stacked edges down the side: depth you can see, and a jump */
    edges = document.createElement("nav");
    edges.className = "page-edges";
    edges.setAttribute("aria-label", "Jump to an entry");
    pages.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "page-edge";
      b.setAttribute("data-edge", String(i));
      b.innerHTML = '<span class="page-edge-line" aria-hidden="true"></span>' +
                    '<span class="page-edge-name">' + (i + 1) + ". " + title(p) + "</span>";
      b.addEventListener("click", function () { goTo(i, "click"); });
      edges.appendChild(b);
    });
    ribbon = document.createElement("span");
    ribbon.className = "page-ribbon";
    ribbon.setAttribute("aria-hidden", "true");
    edges.appendChild(ribbon);
    document.body.appendChild(edges);

    /* the switch */
    var t = document.createElement("button");
    t.type = "button";
    t.className = "pages-toggle";
    t.setAttribute("aria-pressed", "true");
    /* The word is in its own span so a phone can drop it and keep the mark,
       which takes the control from 110 pixels wide to a 44 square and off
       the top of whatever the page has in its own bottom right corner. The
       button's accessible name comes from this text either way. */
    t.innerHTML = '<span class="pages-mark" aria-hidden="true"></span>' +
                  '<span class="pages-word" data-pages-label>Pages on</span>';
    t.addEventListener("click", function () {
      set(!on);
      t.setAttribute("aria-pressed", String(on));
      t.querySelector("[data-pages-label]").textContent = on ? "Pages on" : "Pages off";
    });
    document.body.appendChild(t);
  }

  /* Fourteen edges, each needing 44px to be pressable, is 616px of strip.
     A phone does not have that between the top bar and the two controls at
     the bottom, and the first attempt had the last edge sitting directly on
     top of the pages switch. Two 44px targets in the same place is worse
     than one honest one.

     So on a narrow screen the strip stops being a control and becomes what
     it already was visually: depth, and a ribbon showing where you are. The
     jumping is done from the contents page instead. Disabled rather than
     hidden, because a disabled button is out of the tab order and out of the
     screen reader's way, which is the truth of it. */
  var narrow = window.matchMedia ? window.matchMedia("(max-width: 40rem)") : null;

  function fitEdges() {
    if (!edges) return;
    var off = !!(narrow && narrow.matches);
    edges.classList.toggle("is-decorative", off);
    Array.prototype.slice.call(edges.querySelectorAll(".page-edge"))
      .forEach(function (b) {
        b.disabled = off;
        b.setAttribute("aria-hidden", off ? "true" : "false");
      });
  }

  function mark() {
    if (!edges) return;
    Array.prototype.slice.call(edges.querySelectorAll(".page-edge"))
      .forEach(function (b, i) {
        b.classList.toggle("is-here", i === current);
        b.classList.toggle("is-read", i < furthest);
        b.setAttribute("aria-current", i === current ? "true" : "false");
      });
    /* The ribbon sits where the reader got to. */
    var h = 100 / pages.length;
    ribbon.style.top = (current * h) + "%";
    ribbon.style.height = h + "%";
  }

  function set(next) {
    on = next;
    root.setAttribute("data-pages", on ? "on" : "off");
    fitSnaps();
    if (!on) pages.forEach(drop);
  }

  /* ----------------------------------------------------------------------
     WIRING
     ---------------------------------------------------------------------- */
  build();
  set(true);
  fitEdges();
  recompute();
  mark();
  if (narrow && narrow.addEventListener) narrow.addEventListener("change", fitEdges);

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; recompute(); });
  }, { passive: true });

  var rt = null;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { fitSnaps(); recompute(); }, 150);
  });

  if (window.PointerEvent) {
    sheet.addEventListener("pointerdown", onDown);
    sheet.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }
  document.addEventListener("keydown", onKey);

  /* Reduced motion gets the numbers, the edges and the ribbon, and none of
     the movement. The turn still happens, it just arrives rather than
     travels. */
  if (reduced.addEventListener) {
    reduced.addEventListener("change", function () { onCancel(); });
  }

  return {
    next: next, prev: prev, goTo: goTo,
    at: function () { return current; },
    count: pages.length,
    enabled: function () { return on; },
    set: set
  };
})();
