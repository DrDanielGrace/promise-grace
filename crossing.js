/* =========================================================================
   crossing.js · the door between the laboratory and the room with the desk

   THE THING THIS IS FOR

   The site is two worlds on purpose. The simulations are a dark instrument
   and the notebook is paper, and the contrast between them is the argument.
   Crossing between them by having one page vanish and another appear throws
   that away: it reads as a broken stylesheet rather than as a move.

   So the crossing is drawn. Leaving the dark, the light comes up before the
   page goes, so the paper is already there when it arrives. Arriving on the
   paper from the dark, it settles rather than appears. Both halves are
   under four hundred milliseconds, both are opacity only, and neither
   happens at all under reduced motion, where the sound alone carries it.

   WHAT IT SOUNDS LIKE

   Leaving is the drawer closing, which is the same sound leaving an
   instrument has always been. Arriving on paper is a page turning, which is
   the notebook's own sound and belongs to it. Nothing new was invented for
   this and no sample does a second job.

   IT ONLY FIRES ON A REAL CROSSING. Dark to dark is not a crossing and
   neither is paper to paper. Going from the index to an instrument is
   staying in the laboratory, and that already has its own arrival.
   ========================================================================= */

(function () {
  "use strict";

  var PAPER = /(?:^|\/)(notebook|contents|guide)\.html/;
  var DARK = /(?:^|\/)(index|simulations|instrument)\.html|\/$/;

  var dark = document.body && document.body.classList.contains("inst");
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function css() {
    if (document.getElementById("crossing-css")) return;
    var s = document.createElement("style");
    s.id = "crossing-css";
    s.textContent = [
      ".xing{position:fixed;inset:0;z-index:90;pointer-events:none;opacity:0;",
      "background:#faf6ef}",
      ".xing[data-to=\"dark\"]{background:#0d0e11}",
      ".xing[data-on=\"1\"]{opacity:1;transition:opacity 300ms ease-in}",
      ".xing[data-on=\"out\"]{opacity:0;transition:opacity 420ms ease-out}"
    ].join("");
    document.head.appendChild(s);
  }

  function sheet(to) {
    css();
    var el = document.createElement("div");
    el.className = "xing";
    el.setAttribute("data-to", to);
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
  }

  function say(voice) {
    if (window.Aud && window.Snd && Snd.enabled()) Aud.play(voice);
  }


  /* ----------------------------------------------------------------------
     LEAVING
     ---------------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;

    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0) return;

    var goingToPaper = PAPER.test(href);
    var goingToDark = DARK.test(href) && !goingToPaper;
    var crossing = (dark && goingToPaper) || (!dark && goingToDark);
    if (!crossing) return;

    e.preventDefault();
    say(dark ? "leave" : "arrive");
    if (window.Aud) Aud.stopBeds();

    /* Where the reader is going, marked so the far side knows it was a
       crossing rather than a fresh arrival. */
    try { sessionStorage.setItem("xing", dark ? "from-dark" : "from-paper"); }
    catch (err) { /* private mode, and the transition simply does not chain */ }

    if (reduced) { location.href = a.href; return; }

    var el = sheet(goingToPaper ? "paper" : "dark");
    /* A timer rather than a frame callback, because a tab that is not
       compositing never gets the frame and the fade would be skipped while
       the navigation still happened. Twenty milliseconds is enough for the
       element to have been laid out with opacity nought first. */
    setTimeout(function () { el.setAttribute("data-on", "1"); }, 20);
    setTimeout(function () { location.href = a.href; }, 330);
  }, true);


  /* ----------------------------------------------------------------------
     ARRIVING

     Only when the reader actually came from the other side. A cold visit
     from a search result gets the page, not a curtain going up on it.
     ---------------------------------------------------------------------- */
  (function arrive() {
    var from = null;
    try { from = sessionStorage.getItem("xing"); sessionStorage.removeItem("xing"); }
    catch (err) { return; }
    if (!from) return;
    if (from === "from-dark" && dark) return;
    if (from === "from-paper" && !dark) return;

    /* The notebook's own sound for arriving at the notebook. The
       instrument's arrival is played by the frame itself. */
    if (!dark && window.Snd) {
      setTimeout(function () { if (Snd.enabled()) Snd.page(); }, 120);
    }

    if (reduced) return;

    var el = sheet(dark ? "dark" : "paper");
    el.setAttribute("data-on", "1");
    setTimeout(function () { el.setAttribute("data-on", "out"); }, 30);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  })();
})();
