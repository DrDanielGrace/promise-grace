/* =========================================================================
   fullscreen.js · the way out of the notebook and into the instrument

   The brief asks every simulation to carry a control to enter and leave
   full screen. The leaving half lives in the frame. This is the entering
   half, and it goes on the notebook.

   It is built rather than written into the markup, and it is built only for
   the simulations that actually have a frame to open, so a link can never
   point at one that does not. styles.css is not touched: the control reuses
   the depth control's own class, which is the row it sits in.
   ========================================================================= */

(function () {
  "use strict";

  var FRAMED = ["nucleation", "crystal", "diffraction", "solidify",
                "titration", "thinfilm", "mof", "thermo"];

  function build() {
    FRAMED.forEach(function (name) {
      var host = document.querySelector('[data-lab="' + name + '"]');
      if (!host) return;
      var fig = host.closest("figure");
      var chrome = fig ? fig.querySelector("[data-chrome]") : null;
      if (!chrome || chrome.querySelector("[data-fullscreen]")) return;

      var a = document.createElement("a");
      a.className = "depth-btn";
      a.setAttribute("data-fullscreen", "");
      a.href = "instrument.html?sim=" + name;
      a.textContent = "Open full screen";

      /* Sound is the frame's business, not the notebook's, except for this
         one link, which is a door out of the room. */
      a.addEventListener("click", function (e) {
        if (!window.Snd || !Snd.enabled()) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        if (window.Aud) Aud.play("leave");
        setTimeout(function () { location.href = a.href; }, 220);
      });

      var depth = chrome.querySelector(".depth");
      if (depth) {
        depth.appendChild(a);
        /* Three buttons fitted on one line at 320 and four do not. The wrap
           is set here rather than in styles.css, because this link is the
           only reason the row is now too long for the screen. */
        depth.style.flexWrap = "wrap";
      } else {
        chrome.insertBefore(a, chrome.firstChild);
      }
    });
  }

  /* sim.js builds the depth control on its own schedule, so look again for
     a second rather than assuming an order. */
  var tries = 0;
  (function wait() {
    build();
    if (tries++ < 16 && !document.querySelector("[data-fullscreen]")) setTimeout(wait, 120);
  })();
})();
