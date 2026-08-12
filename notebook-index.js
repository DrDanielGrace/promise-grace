/* =========================================================================
   notebook-index.js · the notebook has a front, and every page has a back

   TWO THINGS THE NOTEBOOK DID NOT HAVE.

   THE INDEX. Opening it dropped you at the cover and then into entry 01,
   and the only way to find out what was in entries two to fourteen was to
   go through them. There was a contents page, one click away, which is one
   click more than anybody spends. So the fourteen are laid out on the
   cover as page cards: number, what kind of thing the entry is, its title,
   and one line about it. Choosing one opens the notebook there.

   THE TURN AT THE END. The page turning engine has always had the keyboard,
   the drag, the edges down the side and the ribbon, and all of it is kept.
   What it did not have was the plainest control of the four: at the bottom
   of an entry, having finished reading it, there was nothing that said
   what was next. So each entry ends with the entry before it and the entry
   after it, named rather than numbered, which is what a reader who has just
   finished one actually wants.

   WHAT THIS DOES NOT DO

   It does not touch the scroll. Everything here is links and cards, and the
   turning is still pages.js's, called through its own public interface. A
   reader who switches page mode off keeps all of it.

   The kinds come from map.js. They are the artefact labels the brief asks
   for, and each one is a claim about what the entry mostly is: a question,
   a hypothesis, an observation, a calculation, a result, a reflection, a
   reference. An entry is never given a label it has not earned.
   ========================================================================= */

(function () {
  "use strict";

  var M = window.Map17;
  if (!M) return;

  var cover = document.getElementById("cover");
  var sheet = document.querySelector("main.sheet");
  if (!cover || !sheet) return;

  var KIND = {
    question:    "QUESTION",
    hypothesis:  "HYPOTHESIS",
    observation: "OBSERVATION",
    calculation: "CALCULATION",
    result:      "RESULT",
    reflection:  "REFLECTION",
    reference:   "REFERENCE"
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ----------------------------------------------------------------------
     THE INDEX

     Fourteen cards. The number is set in the handwriting face, because that
     is how a page number is written in a real notebook and it is the one
     place on this site where handwriting is doing a job rather than being
     a texture.
     ---------------------------------------------------------------------- */
  function index() {
    var sec = el("section", "nbx");
    sec.id = "entries";
    sec.setAttribute("aria-labelledby", "nbx-h");

    var head = el("div", "nbx-head");
    var h = el("h2", "nbx-h", "What is in it");
    h.id = "nbx-h";
    head.appendChild(h);
    head.appendChild(el("p", "nbx-say",
      M.Word(M.COUNTS.entries) + " entries, written between 2018 and now. " +
      M.Word(M.COUNTS.simsInEntries) + " simulations run inside " +
      M.word(M.COUNTS.entriesLive) + " of them. Pick one, or open it at the " +
      "beginning and turn."));
    sec.appendChild(head);

    var grid = el("ol", "nbx-grid");

    M.ENTRIES.forEach(function (e) {
      var li = el("li", "nbx-cell");
      var a = el("a", "nbx-card");
      a.href = "#" + e.id;
      a.setAttribute("data-kind", e.kind);

      var top = el("span", "nbx-card-top");
      top.appendChild(el("span", "hand nbx-no", e.n));
      top.appendChild(el("span", "mono nbx-kind", KIND[e.kind] || ""));
      a.appendChild(top);

      a.appendChild(el("span", "nbx-name", e.name));
      a.appendChild(el("span", "nbx-say", e.say));

      /* what runs inside it, where anything does */
      if (e.sims && e.sims.length) {
        var runs = el("span", "mono nbx-runs");
        runs.textContent = e.sims.length === 1
          ? "1 simulation inside"
          : e.sims.length + " simulations inside";
        a.appendChild(runs);
      }

      li.appendChild(a);
      grid.appendChild(li);
    });

    sec.appendChild(grid);
    cover.parentNode.insertBefore(sec, cover.nextSibling);
  }

  /* ----------------------------------------------------------------------
     THE TURN AT THE END OF EACH ENTRY

     Named rather than numbered, because "next" tells a reader nothing and
     "Phase diagrams, properly explained" tells them whether to keep going.
     ---------------------------------------------------------------------- */
  function turns() {
    M.ENTRIES.forEach(function (e, i) {
      var article = document.getElementById(e.id);
      if (!article) return;

      var main = article.querySelector(".entry-main") || article;
      var nav = el("nav", "nb-turn");
      nav.setAttribute("aria-label", "Between entries");

      var prev = M.ENTRIES[i - 1], next = M.ENTRIES[i + 1];

      if (prev) {
        var pa = el("a", "nb-turn-a nb-turn-prev");
        pa.href = "#" + prev.id;
        pa.appendChild(el("span", "mono nb-turn-dir", "← Entry " + prev.n));
        pa.appendChild(el("span", "nb-turn-name", prev.name));
        nav.appendChild(pa);
      } else {
        /* the first entry turns back to the index rather than nowhere */
        var ia = el("a", "nb-turn-a nb-turn-prev");
        ia.href = "#entries";
        ia.appendChild(el("span", "mono nb-turn-dir", "← Contents"));
        ia.appendChild(el("span", "nb-turn-name", "All " +
          M.word(M.COUNTS.entries) + " entries"));
        nav.appendChild(ia);
      }

      if (next) {
        var na = el("a", "nb-turn-a nb-turn-next");
        na.href = "#" + next.id;
        na.appendChild(el("span", "mono nb-turn-dir", "Entry " + next.n + " →"));
        na.appendChild(el("span", "nb-turn-name", next.name));
        nav.appendChild(na);
      }

      /* before the handwritten page number, which is always last */
      var num = article.querySelector(".page-num");
      if (num && num.parentNode === main) main.insertBefore(nav, num);
      else main.appendChild(nav);
    });
  }

  /* ----------------------------------------------------------------------
     WHAT ELSE IS ABOUT THIS

     An entry that has a simulation in it should say where that simulation
     can be opened on its own, and an entry that belongs to a research area
     should say which. Both are in map.js already.
     ---------------------------------------------------------------------- */
  function links() {
    M.ENTRIES.forEach(function (e) {
      var article = document.getElementById(e.id);
      if (!article) return;
      if (!e.sims.length && !e.topic) return;

      var main = article.querySelector(".entry-main") || article;
      var box = el("aside", "nb-also");
      box.appendChild(el("p", "mono nb-also-h", "Elsewhere on this site"));

      var ul = el("ul", "nb-also-list");

      if (e.topic) {
        var t = M.topic(e.topic);
        if (t) {
          var li = el("li");
          var a = el("a", null, t.name);
          a.href = "research.html#" + t.id;
          li.appendChild(el("span", "mono nb-also-kind", "RESEARCH"));
          li.appendChild(a);
          ul.appendChild(li);
        }
      }

      e.sims.forEach(function (sid) {
        var s = M.sim(sid);
        if (!s) return;
        /* the two that live in this page are already on it */
        if (s.home === "notebook") return;
        var li = el("li");
        var a = el("a", null, s.name);
        a.href = s.href;
        li.appendChild(el("span", "mono nb-also-kind", "AT FULL SCREEN"));
        li.appendChild(a);
        ul.appendChild(li);
      });

      if (!ul.children.length) return;
      box.appendChild(ul);

      var nav = main.querySelector(".nb-turn");
      if (nav) main.insertBefore(box, nav);
      else main.appendChild(box);
    });
  }

  function go() {
    index();
    links();
    turns();
  }

  /* After pages.js, so the page numbers already exist and the turn control
     can be put in front of them. defer keeps source order and pages.js is
     listed first, but its build runs on DOMContentLoaded, so this waits for
     the same event and relies on listener order rather than assuming. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go);
  } else {
    go();
  }
})();
