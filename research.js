/* =========================================================================
   research.js · the five areas, rendered from what actually exists

   Each area is a panel, and every panel answers the same five questions in
   the same order, because a reader who has read one should be able to skim
   the next four:

     THE QUESTION          what she is actually asking
     WHAT SHE HAS BUILT    the instruments, with where each one lives
     WHAT SHE LEARNED      the notebook entries
     WHAT SHE IS LEARNING  the Mission Control modules, where there are any
     RELATED               the other areas this one touches

   None of that is typed here. It is read out of map.js, which is the one
   place the relationships are declared, so an area cannot list a simulation
   that does not exist and a simulation cannot go missing from the area it
   belongs to.

   The panels are open. They were nearly built as a set of disclosures, and
   that would have been wrong: a professor scanning this page wants to see
   all five at once and decide which is worth their time, and a page that
   hides four fifths of itself behind clicks is a page that gets read a
   fifth as much. Progressive disclosure belongs inside a simulation, where
   the thing being deferred is depth. It does not belong over a list.
   ========================================================================= */

(function () {
  "use strict";

  var host = document.querySelector("[data-topics]");
  if (!host || !window.Map17) return;

  var M = window.Map17;

  var WHERE = {
    frame:    "full screen",
    notebook: "in the notebook",
    mission:  "on Mission Control"
  };

  var STATUS = {
    computed:    ["COMPUTED", "tag-computed"],
    measured:    ["MEASURED", "tag-measured"],
    speculative: ["SPECULATIVE", "tag-spec"]
  };

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function block(label) {
    var d = h("div", "rsh-block");
    d.appendChild(h("p", "mono rsh-block-h", label));
    return d;
  }

  function simRow(s) {
    var li = h("li", "rsh-sim");
    var a = h("a", null);
    a.href = s.href;

    a.appendChild(h("span", "rsh-sim-name", s.name));
    a.appendChild(h("span", "rsh-sim-q", s.q));

    var meta = h("span", "mono rsh-sim-meta");
    var st = STATUS[s.status];
    var tag = h("span", "tag " + st[1], st[0]);
    meta.appendChild(tag);
    meta.appendChild(h("span", "rsh-sim-where", WHERE[s.home] || ""));
    a.appendChild(meta);

    li.appendChild(a);
    return li;
  }

  function entryRow(e) {
    var li = h("li", "rsh-entry");
    var a = h("a", null);
    a.href = "notebook.html#" + e.id;
    a.appendChild(h("span", "mono rsh-entry-no", "ENTRY " + e.n));
    a.appendChild(h("span", "rsh-entry-name", e.name));
    a.appendChild(h("span", "rsh-entry-say", e.say));
    li.appendChild(a);
    return li;
  }

  function panel(t) {
    var sec = h("section", "rsh-topic");
    sec.id = t.id;
    sec.setAttribute("data-accent", t.accent);
    sec.setAttribute("aria-labelledby", t.id + "-h");

    var head = h("header", "rsh-topic-head");
    head.appendChild(h("h3", "rsh-topic-name", t.name));
    head.appendChild(h("p", "rsh-topic-q", t.question));
    head.appendChild(h("p", "rsh-topic-say", t.say));

    var cons = h("ul", "rsh-concepts");
    t.concepts.forEach(function (c) {
      cons.appendChild(h("li", "mono", c));
    });
    head.appendChild(cons);
    sec.appendChild(head);

    var body = h("div", "rsh-topic-body");

    /* what she has built */
    var sims = M.simsOf(t.id);
    if (sims.length) {
      var b1 = block("What she has built");
      var ul = h("ul", "rsh-sims");
      sims.forEach(function (s) { ul.appendChild(simRow(s)); });
      b1.appendChild(ul);
      body.appendChild(b1);
    }

    /* what she learned */
    var entries = M.entriesOf(t.id);
    if (entries.length) {
      var b2 = block("What she learned");
      var ul2 = h("ul", "rsh-entries");
      entries.forEach(function (e) { ul2.appendChild(entryRow(e)); });
      b2.appendChild(ul2);
      body.appendChild(b2);
    }

    /* what she is learning now */
    if (t.mission && t.mission.length) {
      var b3 = block("What she is learning now");
      var p = h("p", "rsh-mission-say");
      p.appendChild(document.createTextNode(
        t.id === "solar"
          ? "This is the live one. She is working through it on Mission Control, in public, "
          : "There is a module for this on Mission Control, "));
      var a = h("a", null, "open it");
      a.href = "mission-planner-website/index.html#" + t.mission[0];
      p.appendChild(a);
      p.appendChild(document.createTextNode("."));
      b3.appendChild(p);
      body.appendChild(b3);
    }

    /* related */
    if (t.related && t.related.length) {
      var b4 = block("Related");
      var rel = h("p", "rsh-related");
      t.related.forEach(function (r, i) {
        var other = M.topic(r);
        if (!other) return;
        if (i) rel.appendChild(document.createTextNode(" · "));
        var ra = h("a", null, other.name);
        ra.href = "#" + other.id;
        rel.appendChild(ra);
      });
      b4.appendChild(rel);
      body.appendChild(b4);
    }

    sec.appendChild(body);
    return sec;
  }

  /* Replace the noscript fallback with the real thing. */
  var wrap = h("div", "rsh-topic-list");
  M.TOPICS.forEach(function (t) { wrap.appendChild(panel(t)); });
  host.innerHTML = "";
  host.appendChild(wrap);

  /* A jump list, so the five are reachable without scrolling past four of
     them. Built after the panels so it cannot list one that failed. */
  var jump = h("nav", "rsh-jump");
  jump.setAttribute("aria-label", "The five areas");
  M.TOPICS.forEach(function (t) {
    var a = h("a", null, t.name);
    a.href = "#" + t.id;
    jump.appendChild(a);
  });
  host.insertBefore(jump, wrap);

  /* Arriving with an area in the address bar should say which one, because
     five panels that look alike and one of them being the one you asked for
     is information the page has and the reader does not. */
  function markHash() {
    var id = (location.hash || "").replace(/^#/, "");
    Array.prototype.forEach.call(document.querySelectorAll(".rsh-topic"), function (s) {
      s.classList.toggle("is-here", s.id === id);
    });
  }
  markHash();
  window.addEventListener("hashchange", markHash);
})();
