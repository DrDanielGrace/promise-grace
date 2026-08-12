/* =========================================================================
   onward.js · nothing on this site is a dead end

   A reader who finishes a page has to be given somewhere to go that is not
   the top of the site. The old answer was a footer with four links on it,
   the same four on every page, which is a menu rather than a suggestion.

   What is built here is the same shape everywhere but never the same
   content: each page declares which four or five things follow from it, in
   an attribute, and each card says what kind of thing it is before it says
   its name, so a reader can tell a simulation from a notebook entry without
   pressing it.

   HOW A PAGE DECLARES IT

     <html data-onward="lab:crystal; notebook:question; research:reduced-gravity">

   Anything of the form kind:id is looked up in map.js and described from
   there, so the descriptions cannot drift from the things they describe.
   Anything of the form kind|label|href|say is written out by the page,
   which is how a destination that is not in the map gets in.

   The separator is a semicolon rather than a comma, and it is a semicolon
   because it was a comma first: a written-out description with a comma in
   it, which is most of them, split into two halves and the second half was
   silently dropped.
   ========================================================================= */

(function () {
  "use strict";

  var KIND = {
    research: "Research",
    lab:      "Simulation",
    notebook: "Notebook entry",
    mission:  "Mission Control",
    archive:  "Archive",
    about:    "About",
    cv:       "CV",
    guide:    "How to use this"
  };

  function base() {
    return /mission-planner-website/.test(location.pathname) ? "../" : "";
  }

  /* Resolve one declaration into { kind, name, href, say }. */
  function resolve(raw) {
    var spec = raw.trim();
    if (!spec) return null;

    /* the written-out form */
    if (spec.indexOf("|") >= 0) {
      var bits = spec.split("|");
      return {
        kind: bits[0].trim(),
        name: (bits[1] || "").trim(),
        href: (bits[2] || "").trim(),
        say:  (bits[3] || "").trim()
      };
    }

    var at = spec.indexOf(":");
    if (at < 0) return null;
    var kind = spec.slice(0, at).trim();
    var id = spec.slice(at + 1).trim();
    var M = window.Map17;
    if (!M) return null;

    if (kind === "lab") {
      var s = M.sim(id);
      if (!s) return null;
      return { kind: kind, name: s.name, href: s.href, say: s.q };
    }
    if (kind === "notebook") {
      var e = M.entry(id);
      if (!e) return null;
      return { kind: kind, name: "Entry " + e.n + " · " + e.name,
               href: "notebook.html#" + e.id, say: e.say };
    }
    if (kind === "research") {
      var t = M.topic(id);
      if (!t) return null;
      return { kind: kind, name: t.name, href: "research.html#" + t.id,
               say: t.question };
    }
    return null;
  }

  function build() {
    var trail = document.documentElement.getAttribute("data-onward");
    if (!trail) return;
    if (document.querySelector(".onward")) return;

    var items = trail.split(";").map(resolve).filter(Boolean);
    if (!items.length) return;

    var b = base();

    var sec = document.createElement("section");
    sec.className = "onward";
    sec.setAttribute("aria-labelledby", "onward-h");

    var inner = document.createElement("div");
    inner.className = "onward-in";

    var h = document.createElement("h2");
    h.id = "onward-h";
    h.textContent = "Keep exploring";
    inner.appendChild(h);

    var ul = document.createElement("ul");
    ul.className = "onward-list";

    items.forEach(function (it) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      /* a written-out href that is already relative to this page is left
         alone; a mapped one is always relative to the site root */
      a.href = /^(https?:|mailto:|#)/.test(it.href) ? it.href : b + it.href;
      a.setAttribute("data-kind", it.kind);

      var k = document.createElement("span");
      k.className = "onward-kind";
      k.textContent = KIND[it.kind] || it.kind;

      var n = document.createElement("span");
      n.className = "onward-name";
      n.textContent = it.name;

      a.appendChild(k);
      a.appendChild(n);

      if (it.say) {
        var s = document.createElement("span");
        s.className = "onward-say";
        s.textContent = it.say;
        a.appendChild(s);
      }

      li.appendChild(a);
      ul.appendChild(li);
    });

    inner.appendChild(ul);
    sec.appendChild(inner);

    /* Before the colophon if there is one, at the end of the body if not,
       because the last thing on a page should be who wrote it. */
    var foot = document.querySelector(
      "footer.closing, footer.ix-foot, footer.rsh-foot, footer.foot, .site-foot");
    if (foot && foot.parentNode) foot.parentNode.insertBefore(sec, foot);
    else document.body.appendChild(sec);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
