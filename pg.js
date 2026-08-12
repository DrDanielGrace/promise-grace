/* =========================================================================
   pg.js · the small amount of work the written pages need

   Two jobs, both of them the same job: stop a page stating a number or a
   list that something else on the site is the authority for.

   THE INTERESTS. About and the CV both list the research interests. Typed
   out, that is two more places for an interest to appear that has nothing
   behind it, which is exactly the failure the brief warns against. They are
   read from map.js and each one says how many instruments are under it, so
   an interest with nothing under it would be visibly empty rather than
   quietly overstated.

   THE COUNTS. Same rule as everywhere else. The words in the markup are
   correct and stay if this never runs.
   ========================================================================= */

(function () {
  "use strict";

  var M = window.Map17;
  if (!M) return;

  /* ---- counts ---------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var n = M.COUNTS[el.getAttribute("data-count")];
    if (typeof n !== "number") return;
    var w = M.word(n);
    /* keep the capital where the markup had one, because these sit at the
       start of sentences on one page and mid sentence on the other */
    el.textContent = /^[A-Z]/.test(el.textContent.trim()) ? M.Word(n) : w;
  });

  /* ---- the interests --------------------------------------------------- */
  var hosts = document.querySelectorAll("[data-about-topics], [data-cv-topics]");
  if (!hosts.length) return;

  Array.prototype.forEach.call(hosts, function (host) {
    var wrap = document.createElement("div");
    wrap.className = "pg-topic-list";

    M.TOPICS.forEach(function (t) {
      var a = document.createElement("a");
      a.className = "pg-topic";
      a.href = "research.html#" + t.id;
      a.setAttribute("data-accent", t.accent);

      var n = document.createElement("span");
      n.className = "pg-topic-name";
      n.textContent = t.name;

      var q = document.createElement("span");
      q.className = "pg-topic-q";
      q.textContent = t.question;

      var c = document.createElement("span");
      c.className = "pg-topic-n";
      var sims = M.simsOf(t.id).length;
      var entries = M.entriesOf(t.id).length;
      var bits = [];
      bits.push(sims + (sims === 1 ? " instrument" : " instruments"));
      if (entries) bits.push(entries + (entries === 1 ? " entry" : " entries"));
      c.textContent = bits.join("  ·  ");

      a.appendChild(n);
      a.appendChild(q);
      a.appendChild(c);
      wrap.appendChild(a);
    });

    host.innerHTML = "";
    host.appendChild(wrap);
  });
})();
