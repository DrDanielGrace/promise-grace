/* =========================================================================
   atlas.js · where should I go

   The contents page used to answer "what is on this site", which is a
   question nobody has. The question people actually have is which of it is
   worth their time, and the answer depends entirely on who they are: a
   professor deciding whether to reply to an email wants something different
   from a teacher looking for a demonstration to use on Tuesday.

   So the page names four readers and gives each of them a route. Not four
   lists. A route, in order, with the reason each step is on it.

   Everything else here is rendered from map.js, which is the one place the
   relationships and the counts are declared, so this page cannot come to
   disagree with the pages it is describing.
   ========================================================================= */

(function () {
  "use strict";

  var M = window.Map17;
  if (!M) return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ----------------------------------------------------------------------
     THE COUNTS
     ---------------------------------------------------------------------- */
  (function counts() {
    var host = document.querySelector("[data-atlas-counts]");
    if (!host) return;
    var C = M.COUNTS;
    var rows = [
      [C.sims, "instruments", "simulations.html"],
      [C.entries, "notebook entries", "notebook.html"],
      [C.topics, "research areas", "research.html"],
      [C.scans, "handwritten pages", "archive.html"]
    ];
    host.innerHTML = "";
    rows.forEach(function (r) {
      var li = el("li");
      var a = el("a", null);
      a.href = r[2];
      a.appendChild(el("b", null, String(r[0])));
      a.appendChild(el("span", null, r[1]));
      li.appendChild(a);
      host.appendChild(li);
    });
  })();

  /* ----------------------------------------------------------------------
     THE FOUR ROUTES

     Written out rather than derived, because a route is a judgement about
     what is worth somebody's time and no data file contains that.
     ---------------------------------------------------------------------- */
  var ROUTES = [
    {
      who: "You are a supervisor, and you have four minutes",
      say: "The shortest path to whether she can do research, in the order " +
           "that answers it fastest.",
      steps: [
        { n: "The question",  h: "notebook.html#question",
          w: "What she is asking, and the three simulations that take it apart." },
        { n: "The study she ran", h: "notebook.html#the-study",
          w: "Her undergraduate project walked through, including what she now thinks was wrong with it. This is the one to read if you read one." },
        { n: "The stalactite question", h: "notebook.html#stalactite",
          w: "A dated prediction with an empty box beside it. It is the entry that shows she knows the difference between a guess and a result." },
        { n: "Research CV", h: "cv.html",
          w: "Education, the publication, and every certificate as a live verification link." }
      ]
    },
    {
      who: "You want to see whether the science is real",
      say: "Every instrument shows the function running it and a list of " +
           "what it assumes. Start with the one that is hardest to fake.",
      steps: [
        { n: "Crystal growth", h: "instrument.html?sim=crystal",
          w: "Turn gravity down and watch growth slow rather than speed up, which is the counterintuitive result and the reason the question exists." },
        { n: "Powder diffraction", h: "instrument.html?sim=diffraction",
          w: "Take the crystal you just grew and identify it. Williamson-Hall separates size from strain, and the strain is declared a proxy at both ends." },
        { n: "What is claimed, and what is not", h: "research.html#topics",
          w: "The four honesty labels, and which of the seventeen carries which." },
        { n: "Archive", h: "archive.html",
          w: "The reference spectrum the measured simulations are integrated off, and the measurement records." }
      ]
    },
    {
      who: "You teach, and you want something for Tuesday",
      say: "All of it runs in a browser with nothing to install, and every " +
           "setting is in the address bar, so the link you copy carries the " +
           "configuration you set up.",
      steps: [
        { n: "The Lab", h: "simulations.html",
          w: "Seventeen, grouped, with what each one computes." },
        { n: "A titration you can get wrong", h: "instrument.html?sim=titration",
          w: "Put methyl orange against a weak acid and read the endpoint ninety one percent early. The mistake is the lesson." },
        { n: "The three depths", h: "guide.html",
          w: "Picture, mechanism, maths. Same simulation, three amounts of information, one control." },
        { n: "Explaining things", h: "notebook.html#explaining",
          w: "Seven misconceptions and what to say instead, from two years of finding out which explanations work." }
      ]
    },
    {
      who: "You are curious and have no particular reason to be here",
      say: "Start with the thing that is most obviously moving, and follow " +
           "whatever you want from there.",
      steps: [
        { n: "The research map", h: "research.html",
          w: "One question with the whole site arranged under it. Every node opens something." },
        { n: "Nucleation", h: "instrument.html?sim=nucleation",
          w: "Watch clusters appear and vanish, and find out how rare a crystal actually is." },
        { n: "The notebook", h: "notebook.html#entries",
          w: "Fourteen entries with the working shown and the mistakes left in." },
        { n: "Mission Control", h: "mission-planner-website/index.html",
          w: "Somebody teaching themselves something hard in public, badly at first." }
      ]
    }
  ];

  (function routes() {
    var host = document.querySelector("[data-atlas-routes]");
    if (!host) return;

    ROUTES.forEach(function (r) {
      var sec = el("section", "atlas-route");
      sec.appendChild(el("h3", "atlas-route-who", r.who));
      sec.appendChild(el("p", "atlas-route-say", r.say));

      var ol = el("ol", "atlas-steps");
      r.steps.forEach(function (s) {
        var li = el("li");
        var a = el("a", "atlas-step");
        a.href = s.h;
        a.appendChild(el("span", "atlas-step-n", s.n));
        a.appendChild(el("span", "atlas-step-w", s.w));
        li.appendChild(a);
        ol.appendChild(li);
      });
      sec.appendChild(ol);
      host.appendChild(sec);
    });
  })();

  /* ----------------------------------------------------------------------
     THE FIVE AREAS, AND WHAT IS UNDER EACH
     ---------------------------------------------------------------------- */
  (function areas() {
    var host = document.querySelector("[data-atlas-areas]");
    if (!host) return;

    var table = el("div", "atlas-areas");
    M.TOPICS.forEach(function (t) {
      var row = el("section", "atlas-area");
      row.setAttribute("data-accent", t.accent);

      var head = el("div", "atlas-area-head");
      var h = el("h3", "atlas-area-name");
      var ha = el("a", null, t.name);
      ha.href = "research.html#" + t.id;
      h.appendChild(ha);
      head.appendChild(h);
      head.appendChild(el("p", "atlas-area-q", t.question));
      row.appendChild(head);

      var lists = el("div", "atlas-area-lists");

      var sims = M.simsOf(t.id);
      if (sims.length) {
        var d1 = el("div", "atlas-col");
        d1.appendChild(el("p", "mono atlas-col-h",
          sims.length + (sims.length === 1 ? " instrument" : " instruments")));
        var u1 = el("ul", "atlas-col-list");
        sims.forEach(function (s) {
          var li = el("li");
          var a = el("a", null, s.name);
          a.href = s.href;
          li.appendChild(a);
          u1.appendChild(li);
        });
        d1.appendChild(u1);
        lists.appendChild(d1);
      }

      var entries = M.entriesOf(t.id);
      if (entries.length) {
        var d2 = el("div", "atlas-col");
        d2.appendChild(el("p", "mono atlas-col-h",
          entries.length + (entries.length === 1 ? " entry" : " entries")));
        var u2 = el("ul", "atlas-col-list");
        entries.forEach(function (e) {
          var li = el("li");
          var a = el("a", null, "Entry " + e.n + ", " + e.name);
          a.href = "notebook.html#" + e.id;
          li.appendChild(a);
          u2.appendChild(li);
        });
        d2.appendChild(u2);
        lists.appendChild(d2);
      }

      if (t.mission && t.mission.length) {
        var d3 = el("div", "atlas-col");
        d3.appendChild(el("p", "mono atlas-col-h", "on Mission Control"));
        var u3 = el("ul", "atlas-col-list");
        t.mission.forEach(function (m) {
          var s = M.SIMS.filter(function (x) {
            return x.href.indexOf("#" + m) >= 0;
          })[0];
          var li = el("li");
          var a = el("a", null, s ? s.name : m.replace("viz-", ""));
          a.href = "mission-planner-website/index.html#" + m;
          li.appendChild(a);
          u3.appendChild(li);
        });
        d3.appendChild(u3);
        lists.appendChild(d3);
      }

      row.appendChild(lists);
      table.appendChild(row);
    });
    host.appendChild(table);
  })();

  /* ----------------------------------------------------------------------
     THE SEVENTEEN, BY WHERE THEY LIVE
     ---------------------------------------------------------------------- */
  (function sims() {
    var host = document.querySelector("[data-atlas-sims]");
    if (!host) return;

    var HOMES = [
      ["frame",    "At full screen",
       "Their own frame, one control at a time, with the code and the assumptions on the page."],
      ["mission",  "Inside Mission Control",
       "Part of the learning plan they belong to, on its own scheduler."],
      ["notebook", "Inside the notebook",
       "In the entry that is about them. These two have never had a frame of their own."]
    ];

    HOMES.forEach(function (h) {
      var list = M.simsIn(h[0]);
      if (!list.length) return;

      var sec = el("section", "atlas-home");
      sec.appendChild(el("p", "mono atlas-home-h",
        h[1] + "  ·  " + M.word(list.length)));
      sec.appendChild(el("p", "atlas-home-say", h[2]));

      var ul = el("ul", "atlas-home-list");
      list.forEach(function (s) {
        var li = el("li");
        var a = el("a", "atlas-sim", null);
        a.href = s.href;
        a.setAttribute("data-status", s.status);
        a.appendChild(el("span", "atlas-sim-name", s.name));
        a.appendChild(el("span", "atlas-sim-q", s.q));
        li.appendChild(a);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      host.appendChild(sec);
    });
  })();
})();
