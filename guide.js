/* =========================================================================
   guide.js · showing one simulation at all three depths at once

   The brief asks the guide to show a single simulation at picture, then
   mechanism, then maths, within the first screen. The first version showed
   one simulation and a control to press, which is a different thing: it
   demonstrates that the control exists rather than what the three settings
   actually are.

   Only one instance of a lab can exist on a page, because each lab binds to
   the first element carrying its name. So rather than three simulations,
   this mirrors the ONE live readout into three columns and filters each to
   the rows that setting would show. Move the burette and all three move,
   because there is one titration behind all of them.

   The filtering rule is the same one the stylesheet uses, read off the same
   classes, so these columns cannot drift away from what the real control
   does.
   ========================================================================= */

(function () {
  "use strict";

  var panel = document.querySelector("[data-mirror]");
  if (!panel) return;

  var name = panel.getAttribute("data-mirror");
  var lab = document.querySelector('[data-lab="' + name + '"]');
  if (!lab) return;

  var source = lab.querySelector(".lab-readout");
  if (!source) return;

  var LEVELS = ["picture", "mechanism", "maths"];

  /* Which rows a given setting shows, by the same classes the stylesheet
     keys off. depth-not-picture is hidden at picture. depth-only-maths is
     shown only at maths. */
  function visibleAt(row, level) {
    if (row.classList.contains("depth-only-maths")) return level === "maths";
    if (row.classList.contains("depth-not-picture")) return level !== "picture";
    return true;
  }

  var columns = Array.prototype.slice.call(panel.querySelectorAll(".level-rows"));
  if (columns.length !== 3) return;

  /* Build each column once, then keep only the values in step. Rebuilding
     the whole thing on every drag would throw away focus and make a screen
     reader announce the lot. */
  var mirrors = [];

  LEVELS.forEach(function (level, i) {
    var col = columns[i];
    col.innerHTML = "";
    var pairs = [];
    Array.prototype.slice.call(source.querySelectorAll(".readout-line"))
      .forEach(function (row) {
        if (!visibleAt(row, level)) return;
        var copy = row.cloneNode(true);
        copy.classList.remove("depth-not-picture", "depth-only-maths");
        col.appendChild(copy);
        var from = row.querySelector("b");
        var to = copy.querySelector("b");
        if (from && to) pairs.push([from, to]);
      });
    if (!pairs.length) {
      var none = document.createElement("p");
      none.className = "mono level-none";
      none.textContent = "nothing at this level";
      col.appendChild(none);
    }
    mirrors.push(pairs);
  });

  function sync() {
    mirrors.forEach(function (pairs) {
      pairs.forEach(function (p) {
        if (p[1].innerHTML !== p[0].innerHTML) p[1].innerHTML = p[0].innerHTML;
      });
    });
  }

  sync();

  /* The readout is rewritten by the lab whenever anything moves, so watch it
     rather than polling. */
  if (window.MutationObserver) {
    new MutationObserver(sync).observe(source, {
      subtree: true, childList: true, characterData: true
    });
  } else {
    setInterval(sync, 400);
  }

  /* The three columns are a demonstration, not the control. The real control
     is still on the simulation itself, and pressing it should not make this
     panel lie, so the panel says what it is. */
  panel.setAttribute("aria-label",
    "The same titration readout shown at all three detail settings at once");
})();
