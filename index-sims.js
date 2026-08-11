/* =========================================================================
   index-sims.js · the index, which is a list and not much else

   Three small jobs. The identifier at the top says what is actually in the
   list rather than being decoration. Moving between groups sounds like
   moving between groups. Opening a simulation sounds like leaving here for
   somewhere else, which is the same sound the instrument answers with when
   it comes up on the other side.

   Everything else on this page is markup and stylesheet, on purpose.
   ========================================================================= */

(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("inst-index")) return;

  function say(voice) {
    if (window.Aud && window.Snd && Snd.enabled()) Aud.play(voice);
  }

  /* ----------------------------------------------------------------------
     THE IDENTIFIER

     Counted off the page rather than typed, so it cannot drift away from
     the list underneath it the way the old "seventeen of these" did.
     ---------------------------------------------------------------------- */
  var run = document.querySelector("[data-run-id]");
  if (run) {
    var items = document.querySelectorAll(".ix-item").length;
    var chains = document.querySelectorAll(".ix-chain > li").length;
    var sends = document.querySelectorAll(".ix-out").length;
    run.textContent = items + " SIMULATIONS · " + chains + " CHAINS · " +
                      sends + " RESULTS HANDED ON";
  }

  /* ----------------------------------------------------------------------
     SOUND

     A jump between groups is navigation and gets the button. Opening a
     simulation gets the leaving sound, and then the wait is real, so it is
     given the same 220 ms the instrument frame gives it rather than being
     cut off by the navigation.
     ---------------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    if (!window.Snd || !Snd.enabled()) return;

    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") { say("button"); return; }
    if (href.indexOf("mailto:") === 0) return;

    /* Anything that opens a simulation, wherever it lives. */
    var opens = a.closest(".ix-name") || a.closest(".ix-chain-row");
    if (!opens) { say("button"); return; }

    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    e.preventDefault();
    say("leave");
    setTimeout(function () { location.href = a.href; }, 220);
  });
})();
