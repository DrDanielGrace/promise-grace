/* =========================================================================
   arrive.js · the landing, and the links that used to point at it

   TWO JOBS.

   THE OLD LINKS. This address was the notebook for as long as the site has
   existed, and there are links to it in emails that have already been sent,
   with an anchor on the end naming an entry or a figure. The notebook has
   moved to notebook.html and those links must not break, so anything
   arriving here with a hash that the notebook recognises is sent straight
   on to it. A visitor who typed the address plainly gets the landing.

   THE COUNTS. The number of simulations and the number of entries are read
   off the pages they describe rather than typed here, for the same reason
   the index counts its own list: a number in prose is a number that goes
   stale the first time anything is added.
   ========================================================================= */

(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("inst-arrival")) return;

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
  function words(n) {
    var w = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
             "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN",
             "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN",
             "NINETEEN", "TWENTY"];
    return w[n] || String(n);
  }

  function count(url, selector, into, suffix) {
    var el = document.querySelector(into);
    if (!el || !window.fetch) return;
    fetch(url).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var n = doc.querySelectorAll(selector).length;
      if (n > 0) el.textContent = words(n) + (suffix || "");
    }).catch(function () {});
  }

  count("simulations.html", ".ix-item", "[data-count-sims]", "");
  count("notebook.html", "main .entry", "[data-count-entries]", " ENTRIES");

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
    var a = e.target && e.target.closest ? e.target.closest(".arrival-ways a") : null;
    if (!a || !window.Snd || !Snd.enabled()) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (window.Aud) Aud.play("leave");
    setTimeout(function () { location.href = a.href; }, 220);
  });
})();
