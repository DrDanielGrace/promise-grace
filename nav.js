/* =========================================================================
   nav.js · four destinations, on every page, never hidden

   WHY THIS IS BUILT RATHER THAN WRITTEN INTO EACH PAGE

   There are seven pages and the bar has to be identical on all of them,
   including the two that are a different colour and the one that lives in a
   subdirectory. Seven copies of the same markup is seven places for it to
   drift, and it had already drifted once: the notebook's own bar and the
   planner's own bar listed different things and neither mentioned the
   simulations at all.

   So it is built here, once, from one list, and the relative paths are
   worked out from how deep the page is rather than hand written.

   THE CONTROLS

   The sound toggle and the levels button already existed and already
   worked, pinned to the bottom corners. They are moved into the bar rather
   than rebuilt, because a control that works is not improved by being
   written a second time. If either has not loaded, the bar simply has one
   fewer thing in it.
   ========================================================================= */

(function () {
  "use strict";

  /* Which destinations, in which order. Simulations first, because that is
     the argument the site is making about itself. */
  var WHERE = [
    { id: "simulations", label: "Simulations", href: "simulations.html" },
    { id: "planner",     label: "Mission planner", href: "mission-planner-website/index.html" },
    { id: "notebook",    label: "Notebook", href: "notebook.html" },
    { id: "guide",       label: "Guide", href: "guide.html" }
  ];

  /* A page in a subdirectory needs to climb out before any of those work.
     Worked out from the path rather than declared per page, so a page that
     moves does not need editing. */
  function depth() {
    var parts = location.pathname.split("/").filter(Boolean);
    /* the last part is the file itself unless the URL ends in a slash */
    var dirs = /\/$/.test(location.pathname) ? parts.length : parts.length - 1;
    /* the site may be served from a subpath, so only count what is below
       the directory holding the four destinations */
    return /mission-planner-website/.test(location.pathname) ? 1 : 0;
  }

  function up() {
    var n = depth(), s = "";
    while (n-- > 0) s += "../";
    return s;
  }

  /* Which of the four this page is. Declared by the page when it is not
     obvious, guessed from the filename when it is. */
  function here() {
    var declared = document.documentElement.getAttribute("data-where");
    if (declared) return declared;
    var p = location.pathname;
    if (/mission-planner-website/.test(p)) return "planner";
    if (/simulations\.html/.test(p)) return "simulations";
    if (/notebook\.html/.test(p)) return "notebook";
    if (/guide\.html/.test(p)) return "guide";
    if (/instrument\.html/.test(p)) return "simulations";
    if (/contents\.html/.test(p)) return "notebook";
    return "";
  }

  function build() {
    if (document.querySelector(".site-nav")) return;

    var base = up();
    var current = here();

    var bar = document.createElement("nav");
    bar.className = "site-nav";
    bar.setAttribute("aria-label", "Site");

    var where = document.createElement("div");
    where.className = "site-nav-where";

    WHERE.forEach(function (w) {
      var a = document.createElement("a");
      a.href = base + w.href;
      a.textContent = w.label;
      a.setAttribute("data-nav", w.id);
      if (w.id === current) a.setAttribute("aria-current", "page");
      where.appendChild(a);
    });

    var tools = document.createElement("div");
    tools.className = "site-nav-tools";
    tools.setAttribute("data-nav-tools", "");

    bar.appendChild(where);
    bar.appendChild(tools);
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-sitenav");

    adopt(tools);
  }

  /* ----------------------------------------------------------------------
     Move the controls in once whoever builds them has built them. They are
     created on DOMContentLoaded by two other files and the order between us
     is not guaranteed, so look again for a second rather than assume one.
     ---------------------------------------------------------------------- */
  function adopt(tools) {
    var tries = 0;

    function pull() {
      var moved = 0;
      var search = document.querySelector("[data-search-open]");
      var levels = document.querySelector(".aud-levels");
      var sound = document.querySelector("[data-sound-toggle]");

      /* search, then levels, then sound: least often used to most */
      [search, levels, sound].forEach(function (el) {
        if (el && el.parentNode !== tools) { tools.appendChild(el); moved++; }
      });

      if (moved && window.Aud && Aud.reflow) Aud.reflow();
      if (tries++ < 14 && !(levels && sound)) setTimeout(pull, 90);
    }

    pull();
    /* search is built later than the rest of it */
    document.addEventListener("search:ready", function () {
      var s = document.querySelector("[data-search-open]");
      if (s) tools.insertBefore(s, tools.firstChild);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
