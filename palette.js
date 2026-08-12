/* =========================================================================
   palette.js · the colours the drawing code draws with

   THE BUG THIS FIXES

   Eight simulations were written against the notebook, so each one carried
   the notebook's six colours as constants in its own file. Then the
   instrument frame was built, dark, and handed the crystal six custom
   properties instead. The crystal read them. The other seven did not, and
   nobody looked, because the notebook still rendered perfectly.

   At full screen those seven were drawing #332E5C on #0d0e11. That is a
   contrast ratio of about 1.7:1. The free energy curve in the nucleation
   simulation, which is the entire point of the nucleation simulation, was a
   dark blue line on a near black rectangle.

   The lesson is the same one the .physics files record: a simulation that
   looks right on the page it was written for has not been checked, it has
   been recognised.

   WHAT THIS DOES ABOUT IT

   One reader, used by all eight, that asks the host element for the six
   --lab-* custom properties. tokens.css sets them, so they follow the
   theme, and a lab that is inside a panel with its own overrides picks
   those up instead because custom properties inherit. The defaults below
   are only reached if no stylesheet loaded at all.

   THE SIX, AND WHAT EACH ONE MEANS

     paper   the surface being drawn on, for anything that has to knock out
     ink     the primary trace, the axis, the thing being measured
     sage    the second trace, where the physics genuinely has two states
     corr    the state that means something is wrong or has been lost
     rule    gridlines, ticks, hairlines
     soft    labels and units beside a number

   Named after the notebook's pens because that is what the drawing code
   already calls them, and renaming six variables across eight files to make
   a comment read better is not a change worth the risk.
   ========================================================================= */

window.Lab = (function () {
  "use strict";

  var FALLBACK = {
    paper: [252, 250, 247],
    ink:   [ 53,  87, 183],
    sage:  [ 42,  69, 143],
    corr:  [140,  47,  69],
    rule:  [201, 203, 222],
    soft:  [114, 105, 128]
  };

  var KEYS = ["paper", "ink", "sage", "corr", "rule", "soft"];

  function channels(host, k) {
    if (!window.getComputedStyle || !host) return FALLBACK[k];
    var v = getComputedStyle(host).getPropertyValue("--lab-" + k);
    var m = v && v.trim().match(/^(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)$/);
    return m ? [+m[1], +m[2], +m[3]] : FALLBACK[k];
  }

  /* ----------------------------------------------------------------------
     read(host)

     Returns the six as CSS colour strings, plus rgba(k, alpha) for the
     places that stack something at low opacity, plus the raw channels for
     anything doing its own arithmetic on them.
     ---------------------------------------------------------------------- */
  function read(host) {
    var raw = {};
    KEYS.forEach(function (k) { raw[k] = channels(host, k); });

    var out = {
      raw: raw,
      rgba: function (k, a) {
        return "rgba(" + (raw[k] || FALLBACK[k]).join(",") + "," + a + ")";
      }
    };
    KEYS.forEach(function (k) {
      out[k] = "rgb(" + raw[k].join(",") + ")";
    });

    /* Two the notebook has and the six do not cover. They are read from the
       same place so a theme moves them too, and they fall back to the
       notebook's own values. */
    out.aside = css(host, "--aside", "#8A5A2B");
    out.gold  = css(host, "--gold",  "#D9A94A");

    return out;
  }

  function css(host, prop, fallback) {
    if (!window.getComputedStyle || !host) return fallback;
    var v = getComputedStyle(host).getPropertyValue(prop);
    return (v && v.trim()) || fallback;
  }

  /* ----------------------------------------------------------------------
     bind(host, rebind)

     The usual arrangement: read once now, and read again whenever the theme
     moves. A canvas keeps the pixels it was given and will not restyle
     itself, so without the second half a theme change leaves every plot on
     the page in the old palette until something else happens to touch it.

     The second argument to rebind says whether a redraw is wanted. It is
     false on the first call and true on every later one, because the first
     call happens while the file is still setting itself up and the canvas
     handles it would draw into do not exist yet.
     ---------------------------------------------------------------------- */
  function bind(host, rebind) {
    rebind(read(host), false);
    document.addEventListener("theme:change", function () {
      /* one frame, so the new custom properties are in force before they
         are read back */
      requestAnimationFrame(function () { rebind(read(host), true); });
    });
  }

  return { read: read, bind: bind };
})();
