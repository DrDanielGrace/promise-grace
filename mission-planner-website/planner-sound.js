/* =========================================================================
   planner-sound.js · the planner joins the same room

   The planner is built on its own engine and none of its seven simulations
   is registered with sim.js, so it cannot use the instrument frame. It can
   use the sound, and it should, because the laboratory bed is supposed to
   be under every page and this is a page.

   Two jobs and no more. Point the loader at the assets, which are a
   directory up from here. Then give the interface the same three voices it
   has everywhere else: a switch for a button, a latch for a panel opening,
   cloth for a control arriving. Nothing here invents a sound.
   ========================================================================= */

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    if (window.Aud) Aud.basePath("../");
    if (window.Snd) Snd.basePath("../");

    function say(voice) {
      if (window.Aud && window.Snd && Snd.enabled()) Aud.play(voice);
    }

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest(".site-nav") || t.closest(".aud") ||
          t.closest("[data-sound-toggle]") || t.closest("[data-aud-open]")) return;
      if (t.closest("button")) say("button");
    }, true);

    /* Answering a prediction is what reveals the simulation under it, which
       is this page's own progressive disclosure and predates the frame. It
       gets the same sound the frame gives a panel coming open. */
    Array.prototype.slice.call(document.querySelectorAll(".predict button"))
      .forEach(function (b) {
        b.addEventListener("click", function () {
          setTimeout(function () { say("latch"); }, 120);
        });
      });

    Array.prototype.slice.call(document.querySelectorAll("details"))
      .forEach(function (d) {
        d.addEventListener("toggle", function () { say(d.open ? "latch" : "unlatch"); });
      });
  });
})();
