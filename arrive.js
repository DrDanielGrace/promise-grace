/* =========================================================================
   arrive.js · the landing, and the links that used to point at it

   THREE JOBS.

   THE OLD LINKS. This address was the notebook for as long as the site has
   existed, and there are links to it in emails that have already been sent,
   with an anchor on the end naming an entry or a figure. The notebook has
   moved to notebook.html and those links must not break, so anything
   arriving here with a hash that the notebook recognises is sent straight
   on to it. A visitor who typed the address plainly gets the landing.

   THE COUNTS. Seventeen and fourteen are stated three times each across
   this site, and they used to be counted three different ways: this page
   fetched two other pages and counted elements in them, the index counted
   its own list, and the search index was built by a regular expression that
   missed one entry and reported thirteen. So all of them now read map.js,
   which declares the relationships and derives the counts from them. One
   place, and a number that goes stale is a number that goes stale
   everywhere at once, which is the failure you can actually see.

   RIGHT NOW. The dated status belongs to Mission Control, which is where
   she keeps it up to date. Copying it here would mean two places to change
   and one of them eventually forgotten, so it is read from that page at
   load and the sentence in the markup stands until it arrives, and stands
   for good if the fetch fails.
   ========================================================================= */

(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("arrival-body")) return;

  /* ----------------------------------------------------------------------
     THE OLD LINKS

     Every anchor the notebook answers to. Written out rather than fetched,
     because the redirect has to happen before anything renders and a fetch
     would put a blank screen in front of it.
     ---------------------------------------------------------------------- */
  var NOTEBOOK = [
    "question", "phase-diagrams", "titration", "the-study", "stalactite",
    "explaining", "projects", "bench", "long-way-round", "training",
    "interests", "currently", "notes", "contact", "cover",
    "fig-nucleation", "fig-crystal", "fig-diffraction", "fig-phase",
    "fig-solidify", "fig-titration", "fig-stal", "fig-thinfilm",
    "fig-mof", "fig-thermo"
  ];

  var hash = (location.hash || "").replace(/^#/, "");
  if (hash && NOTEBOOK.indexOf(hash) >= 0) {
    location.replace("notebook.html#" + hash);
    return;
  }

  /* ----------------------------------------------------------------------
     THE COUNTS
     ---------------------------------------------------------------------- */
  function counts() {
    var M = window.Map17;
    if (!M) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
      var what = el.getAttribute("data-count");
      var n = M.COUNTS[what];
      if (typeof n === "number") el.textContent = M.word(n);
    });
  }

  /* map.js is deferred and so are we, and defer keeps source order, so it
     has run. The guard is for the case where it did not load at all, where
     the words already in the markup are correct and stay. */
  counts();

  /* ----------------------------------------------------------------------
     RIGHT NOW

     Mission Control writes the current line into `.status-now`, with the
     superseded ones struck through above it. Only the current one is worth
     bringing over.

     WHY THE DAY IS COMPUTED HERE RATHER THAN COPIED

     This fetches that page and reads it with DOMParser, which builds a
     document and runs none of its scripts. So anything Mission Control's own
     JavaScript writes at load is invisible from here. The day count is
     exactly that: the markup used to carry "Phase 2, day 4." as a
     placeholder and app.js replaced the number on load. Mission Control
     showed day 13 and this page showed day 4, both presenting themselves as
     the same fact.

     The sentence in the markup carries no numbers now. The phase and the
     start date are attributes, which DOMParser does see, so the prefix is
     built here from the same two values Mission Control builds it from, with
     the same arithmetic. Neither page holds a day number of its own.
     ---------------------------------------------------------------------- */
  var now = document.querySelector("[data-now]");
  if (now && window.fetch) {
    fetch("mission-planner-website/index.html")
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var el = doc.querySelector(".status-now");
        if (!el) return;

        /* the label is a separate span and reads "RIGHT NOW", which this
           section already says above the sentence */
        var lab = el.querySelector(".status-label");
        if (lab) lab.remove();
        /* and so is the "I wrote this N days ago" note, which belongs on the
           page that carries the sentence rather than on a summary of it */
        var age = el.querySelector(".status-age");
        if (age) age.remove();

        var sentence = el.textContent.replace(/\s+/g, " ").trim();
        if (!sentence) return;

        /* The same arithmetic as daysRunning() in the planner's app.js:
           whole days since the start, counting the first day as day one. If
           either of these two ever changes, change it in both. The check in
           the scratchpad asserts all four surfaces agree. */
        var phase = el.getAttribute("data-phase");
        var start = el.getAttribute("data-start");
        var prefix = "";
        if (phase) {
          prefix = "Phase " + phase;
          var began = start ? new Date(start + "T00:00:00") : null;
          if (began && !isNaN(began.getTime())) {
            var day = Math.max(0, Math.floor((Date.now() - began.getTime()) / 86400000)) + 1;
            prefix += ", day " + day;
          }
          prefix += ". ";
        }
        now.textContent = prefix + sentence;
      })
      .catch(function () {});
  }

  /* ----------------------------------------------------------------------
     COMING UP, AND LEAVING

     The same rise the instrument uses, and the same leaving sound, so that
     going from here into a simulation and going from a simulation back out
     are the same gesture in two directions.
     ---------------------------------------------------------------------- */
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduced) {
    body.setAttribute("data-boot", "1");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.setAttribute("data-boot", "2"); });
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest
      ? e.target.closest(".arrival-ways a, .arrival-do a") : null;
    if (!a || !window.Snd || !Snd.enabled()) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (window.Aud) Aud.play("leave");
    setTimeout(function () { location.href = a.href; }, 220);
  });
})();
