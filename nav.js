/* =========================================================================
   nav.js · the bar, the crumbs, and the way out of every page

   WHY THIS IS BUILT RATHER THAN WRITTEN INTO EACH PAGE

   There are now eleven pages and the bar has to be identical on all of
   them, including the one that lives in a subdirectory. Eleven copies of
   the same markup is eleven places for it to drift, and it had already
   drifted twice: the notebook carried its own hidden top bar listing five
   anchors, and the mission planner carried a third bar listing its own
   sections, and neither of them mentioned the simulations at all.

   So it is built here, once, from one list, and the relative paths are
   worked out from how deep the page is rather than hand written.

   SEVEN DESTINATIONS, IN TWO RANKS

   Research, Lab, Notebook and Mission are the argument the site is making
   and are visible at every width. Archive, About and CV are what somebody
   reaches for after they are convinced, and they fold behind one control on
   a phone. Guide is neither: it explains the interface, so it belongs with
   About rather than beside Research, which is where it used to sit.

   THE CONTROLS

   The sound toggle and the levels button already existed and already
   worked. The search and the theme switch build themselves. All four are
   moved into the bar rather than rebuilt, because a control that works is
   not improved by being written a second time. If one has not loaded, the
   bar simply has one fewer thing in it.
   ========================================================================= */

(function () {
  "use strict";

  /* The first rank. Research first, because the site's argument is that
     there is a question here and everything else is downstream of it. */
  var WHERE = [
    { id: "research", label: "Research", href: "research.html" },
    { id: "lab",      label: "Lab",      href: "simulations.html" },
    { id: "notebook", label: "Notebook", href: "notebook.html" },
    { id: "mission",  label: "Mission",  href: "mission-planner-website/index.html" }
  ];

  /* The second rank. */
  var MORE = [
    { id: "archive", label: "Archive", href: "archive.html" },
    { id: "about",   label: "About",   href: "about.html" },
    { id: "cv",      label: "CV",      href: "cv.html" }
  ];

  /* A unit cell: eight corners and one atom in the middle of the body. The
     only mark on the site, and it is the thing the specialisation opens
     with rather than an atom drawn because chemistry. */
  var MARK =
    '<svg class="site-nav-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="currentColor" stroke-width="1.3">' +
    '<path d="M4 7.5 12 3.5 20 7.5 12 11.5Z"/>' +
    '<path d="M4 7.5v9l8 4 8-4v-9"/>' +
    '<path d="M12 11.5v9"/>' +
    '</g>' +
    '<circle cx="12" cy="12" r="2.1" fill="currentColor"/>' +
    '</svg>';

  /* A page in a subdirectory needs to climb out before any of these work.
     Worked out from the path rather than declared per page, so a page that
     moves does not need editing. */
  function up() {
    return /mission-planner-website/.test(location.pathname) ? "../" : "";
  }

  /* Which of the seven this page is. Declared by the page when it is not
     obvious, guessed from the filename when it is. */
  function here() {
    var declared = document.documentElement.getAttribute("data-where");
    if (declared !== null && declared !== "") return declared;
    if (document.documentElement.hasAttribute("data-where")) return "";
    var p = location.pathname;
    if (/mission-planner-website/.test(p)) return "mission";
    if (/research\.html/.test(p))          return "research";
    if (/simulations\.html/.test(p))       return "lab";
    if (/instrument\.html/.test(p))        return "lab";
    if (/notebook\.html/.test(p))          return "notebook";
    if (/contents\.html/.test(p))          return "notebook";
    if (/archive\.html/.test(p))           return "archive";
    if (/about\.html/.test(p))             return "about";
    if (/guide\.html/.test(p))             return "about";
    if (/cv\.html/.test(p))                return "cv";
    return "";
  }

  function link(w, base, current) {
    var a = document.createElement("a");
    a.href = base + w.href;
    a.textContent = w.label;
    a.setAttribute("data-nav", w.id);
    if (w.id === current) a.setAttribute("aria-current", "page");
    return a;
  }

  function build() {
    if (document.querySelector(".site-nav")) return;

    var base = up();
    var current = here();

    var bar = document.createElement("nav");
    bar.className = "site-nav";
    bar.setAttribute("aria-label", "Site");
    bar.setAttribute("data-more", "closed");

    /* the home control, which the site did not have */
    var home = document.createElement("a");
    home.className = "site-nav-home";
    home.href = base + "index.html";
    home.innerHTML = MARK + "<span>Promise Grace</span>";
    home.setAttribute("aria-label", "Promise Grace, home");
    bar.appendChild(home);

    var where = document.createElement("div");
    where.className = "site-nav-where";
    WHERE.forEach(function (w) { where.appendChild(link(w, base, current)); });
    bar.appendChild(where);

    var more = document.createElement("div");
    more.className = "site-nav-more";
    more.id = "site-nav-more";
    MORE.forEach(function (w) { more.appendChild(link(w, base, current)); });

    var moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "site-nav-more-btn";
    moreBtn.setAttribute("aria-expanded", "false");
    moreBtn.setAttribute("aria-controls", "site-nav-more");
    moreBtn.innerHTML = '<span class="nav-tool-mark" aria-hidden="true">+</span>' +
                        '<span class="nav-tool-word">More</span>';
    moreBtn.addEventListener("click", function () {
      var open = bar.getAttribute("data-more") === "open";
      bar.setAttribute("data-more", open ? "closed" : "open");
      moreBtn.setAttribute("aria-expanded", String(!open));
      moreBtn.querySelector(".nav-tool-mark").textContent = open ? "+" : "−";
      if (window.Aud && window.Snd && Snd.enabled()) Aud.play("button");
    });
    where.appendChild(moreBtn);

    var tools = document.createElement("div");
    tools.className = "site-nav-tools";
    tools.setAttribute("data-nav-tools", "");

    bar.appendChild(tools);
    bar.appendChild(more);

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("has-sitenav");

    crumbs(bar, base, current);
    adopt(tools);
  }

  /* ----------------------------------------------------------------------
     BREADCRUMBS

     Declared by the page as a data attribute rather than worked out,
     because only the page knows which branch it was reached down. A page
     that declares nothing gets none, which is right for the four top level
     destinations: a crumb reading "Lab" on the Lab page is noise.
     ---------------------------------------------------------------------- */
  var CRUMB = {
    research: { label: "Research", href: "research.html" },
    lab:      { label: "Lab",      href: "simulations.html" },
    notebook: { label: "Notebook", href: "notebook.html" },
    mission:  { label: "Mission Control", href: "mission-planner-website/index.html" },
    archive:  { label: "Archive",  href: "archive.html" },
    about:    { label: "About",    href: "about.html" },
    home:     { label: "Promise Grace", href: "index.html" }
  };

  function crumbs(bar, base, current) {
    var trail = document.documentElement.getAttribute("data-crumbs");
    if (!trail) return;

    var ol = document.createElement("ol");
    ol.className = "crumbs";
    ol.setAttribute("aria-label", "Breadcrumb");

    trail.split(">").forEach(function (raw, i, all) {
      var key = raw.trim();
      var li = document.createElement("li");
      var last = i === all.length - 1;
      var known = CRUMB[key];

      if (last || !known) {
        /* the last one is where you are, and anything the map does not know
           is a label the page wrote itself */
        var span = document.createElement("span");
        span.textContent = known ? known.label : key;
        if (last) span.setAttribute("aria-current", "page");
        li.appendChild(span);
      } else {
        var a = document.createElement("a");
        a.href = base + known.href;
        a.textContent = known.label;
        li.appendChild(a);
      }
      ol.appendChild(li);
    });

    bar.parentNode.insertBefore(ol, bar.nextSibling);
  }

  /* ----------------------------------------------------------------------
     Move the controls in once whoever builds them has built them. They are
     created on DOMContentLoaded by three other files and the order between
     us is not guaranteed, so look again for a second rather than assume one.
     ---------------------------------------------------------------------- */
  function adopt(tools) {
    var tries = 0;

    function pull() {
      var moved = 0;
      var search = document.querySelector("[data-search-open]");
      var theme = document.querySelector("[data-theme-toggle]");
      var levels = document.querySelector(".aud-levels");
      var sound = document.querySelector("[data-sound-toggle]");

      /* search, theme, levels, sound: least often used to most */
      [search, theme, levels, sound].forEach(function (el) {
        if (el && el.parentNode !== tools) { tools.appendChild(el); moved++; }
      });

      if (moved && window.Aud && Aud.reflow) Aud.reflow();
      if (tries++ < 14 && !(levels && sound && theme)) setTimeout(pull, 90);
    }

    pull();
    /* search is built later than the rest of it */
    document.addEventListener("search:ready", function () {
      var s = document.querySelector("[data-search-open]");
      if (s) tools.insertBefore(s, tools.firstChild);
    });
    document.addEventListener("theme:ready", function () {
      var t = document.querySelector("[data-theme-toggle]");
      if (t && t.parentNode !== tools) tools.appendChild(t);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
