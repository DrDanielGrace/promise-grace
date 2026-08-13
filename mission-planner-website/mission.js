/* =========================================================================
   mission.js · connecting the learning plan to the rest of the site

   THE PROBLEM THIS FIXES

   Mission Control was a good page with no doors in it. Somebody could work
   through band gaps here and never find out that there is a full screen
   instrument for thin film interference two clicks away, or that the
   diffraction pattern the Bragg's law visualisation is building towards has
   an instrument of its own. The seven visualisations on this page and the
   ten elsewhere are the same subject and nothing said so.

   So each of the seven gets the same four questions answered underneath it:

     YOU ARE LEARNING THIS   what the module is about
     TRY IT                  the related instrument, wherever it lives
     SEE IT IN CONTEXT       the module before or after it in the argument
     GO DEEPER               the research area, and the notebook where there
                             is one

   All of it is read from map.js, so a link here cannot point at something
   that is not there.

   THE FIRST SCREEN

   The phase and the current question are stated at the top now, and both
   are read out of the status block rather than typed a second time. There
   is one place the status is written down and it is the same place it
   always was.
   ========================================================================= */

(function () {
  "use strict";

  var M = window.Map17;

  /* ----------------------------------------------------------------------
     THE FIRST SCREEN

     The three facts at the top of the page come from the status block below
     it, which is the one place any of this is written down.

     This used to read them back out of the rendered sentence, splitting
     "Phase 2, day 13. Reading about..." on its full stop. That worked only
     because app.js had already built that string, and it would have taken
     the whole sentence as the phase the moment the prefix was not there. The
     phase and the start date are attributes, so they are read as attributes,
     and the sentence is read as the sentence.
     ---------------------------------------------------------------------- */
  (function first() {
    var status = document.querySelector(".status-now");
    var line = document.getElementById("status-line");
    var now = document.querySelector("[data-mission-now]");
    if (!status || !line || !now) return;

    var phaseEl = now.querySelector("[data-mission-phase]");
    var qEl = now.querySelector("[data-mission-q]");

    var phase = status.getAttribute("data-phase");
    var start = status.getAttribute("data-start");

    if (phase && phaseEl) {
      var said = "Phase " + phase;
      var began = start ? new Date(start + "T00:00:00") : null;
      if (began && !isNaN(began.getTime())) {
        /* the same arithmetic as daysRunning() in app.js and arrive.js */
        var day = Math.max(0, Math.floor((Date.now() - began.getTime()) / 86400000)) + 1;
        said += ", day " + day;
      }
      phaseEl.textContent = said;
    }

    /* The sentence, with any prefix app.js has already put on the front of
       it taken back off, because this panel states the phase in its own
       right one row above. */
    var text = (line.textContent || "").replace(/\s+/g, " ").trim();
    text = text.replace(/^Phase\s+\d+(,\s*day\s+\d+)?\.\s*/i, "");
    if (text && qEl) qEl.textContent = text.replace(/\.$/, "");
  })();

  /* ----------------------------------------------------------------------
     THE CROSS LINKS

     Which visualisation is about what. The instrument named under TRY IT is
     never the visualisation itself: it is the thing on the rest of the site
     that takes the same idea further, and each one carries the reason it is
     the one, because a related link with no reason attached is a guess the
     reader has to check.
     ---------------------------------------------------------------------- */
  var LINKS = {
    "viz-ph": {
      learning: "Why a logarithmic scale exists at all",
      tryIt: "titration",
      why: "A pH curve drawn one drop at a time, which is this scale doing a job.",
      context: { id: "viz-arrhenius", say: "Arrhenius, which is the other place a log axis rescues a curve you cannot read" },
      topic: "functional",
      entry: "titration"
    },
    "viz-arrhenius": {
      learning: "What linearising a curve buys you",
      tryIt: "titration",
      why: "Rate against volume, and a curve whose shape is the whole result.",
      context: { id: "viz-ph", say: "The pH scale, the same trick on a different quantity" },
      topic: "functional",
      entry: null
    },
    "viz-bandgap": {
      learning: "Band gaps, and which light a material can use",
      tryIt: "thinfilm",
      why: "The other way a material decides what happens to a wavelength, and this one has no gap in it at all.",
      context: { id: "viz-spectrum", say: "Where the sunlight goes, which is this idea applied to the real spectrum" },
      topic: "solar",
      entry: null
    },
    "viz-spectrum": {
      learning: "How much of the sun a solar cell throws away",
      tryIt: "thermo",
      why: "The heat this budget throws away is what a thermoelectric is for. Same loss, the other side of it.",
      context: { id: "viz-limit", say: "The Shockley-Queisser limit, which takes the band gap you pick here" },
      topic: "solar",
      entry: null
    },
    "viz-limit": {
      learning: "Why one junction cannot beat about a third",
      tryIt: "thermo",
      why: "What you could do with the third of the spectrum this limit gives up as heat.",
      context: { id: "viz-spectrum", say: "The spectrum this is integrated off" },
      topic: "solar",
      entry: null
    },
    "viz-bragg": {
      learning: "What a diffraction peak is, before there is a pattern of them",
      tryIt: "diffraction",
      why: "One reflection becomes a whole pattern, and the absences start doing the identifying.",
      context: { id: "viz-cells", say: "Unit cells, which is what the spacing you are moving here belongs to" },
      topic: "structure",
      entry: "question"
    },
    "viz-cells": {
      learning: "What the packing of a lattice actually means",
      tryIt: "mof",
      why: "A cell built on purpose around the size of the hole in the middle of it.",
      context: { id: "viz-bragg", say: "Bragg's law, which is how a cell like this is measured" },
      topic: "structure",
      entry: "question"
    }
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function row(kind, name, href, say) {
    var a = el("a", "mx-row");
    a.href = href;
    a.appendChild(el("span", "mono mx-kind", kind));
    a.appendChild(el("span", "mx-name", name));
    if (say) a.appendChild(el("span", "mx-say", say));
    return a;
  }

  (function cross() {
    if (!M) return;

    Object.keys(LINKS).forEach(function (id) {
      var viz = document.getElementById(id);
      if (!viz) return;
      var L = LINKS[id];

      var box = el("aside", "mx");
      box.setAttribute("aria-label", "Where this goes next");

      var head = el("p", "mono mx-h", "You are learning this");
      box.appendChild(head);
      box.appendChild(el("p", "mx-learning", L.learning));

      var list = el("div", "mx-list");

      var s = M.sim(L.tryIt);
      if (s) {
        list.appendChild(row("TRY IT", s.name, "../" + s.href, L.why || s.q));
      }

      if (L.context) {
        var other = M.SIMS.filter(function (x) {
          return x.href.indexOf("#" + L.context.id) >= 0;
        })[0];
        list.appendChild(row("SEE IT IN CONTEXT",
          other ? other.name : "The next module",
          "#" + L.context.id, L.context.say));
      }

      if (L.entry) {
        var e = M.entry(L.entry);
        if (e) {
          list.appendChild(row("READ ABOUT IT",
            "Entry " + e.n + ", " + e.name,
            "../notebook.html#" + e.id, e.say));
        }
      }

      var t = M.topic(L.topic);
      if (t) {
        list.appendChild(row("GO DEEPER", t.name,
          "../research.html#" + t.id, t.question));
      }

      box.appendChild(list);
      viz.appendChild(box);
    });
  })();
})();
