/* =========================================================================
   orbit.js · the research map

   WHAT IT IS AND WHY IT IS NOT DECORATION

   The site's problem was never that there was too little on it. It was that
   nothing on it said how any of it was connected. The crystal growth
   simulation and entry 01 of the notebook are the same question asked
   twice, and there was no way to find that out except by reading both.

   So this is the connection, drawn. It is a causal chain and every arrow in
   it is a claim: take gravity away and you lose buoyancy, lose buoyancy and
   you lose convection, lose convection and transport has to happen by
   diffusion, and everything downstream of transport changes. That is the
   argument the whole site is making, and it is worth one picture.

   Selecting a node does not open a tooltip. It opens the actual work: a
   simulation, a notebook entry, or the part of the research page that
   explains the idea. Nothing here is a node with nothing behind it.

   HOW IT IS BUILT, AND WHY NOT CANVAS

   SVG, with a real <a> around every node. That is the whole accessibility
   story: they are links, so they tab, they announce, they open in a new
   tab on the middle button, and they work with JavaScript switched off if
   the markup is there. A canvas would have needed all of that rebuilding
   and would have got it wrong.

   Nothing moves on its own. The only animation is the path that lights up
   when a node is hovered or focused, which is 160 ms and is off entirely
   under reduced motion, where the highlight is a thicker line instead.

   NARROW SCREENS

   Below about 640 the same nodes are rendered as a list of steps rather
   than a diagram, because a graph squeezed onto a phone is a graph nobody
   can read. Same links, same order, same claims, laid out down the screen.
   ========================================================================= */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     THE CHAIN

     x and y are percentages of the viewBox. `kind` decides the colour, and
     it is the site's hierarchy rather than five colours picked to look
     busy: a question is brand, a mechanism is lavender, an instrument is
     brand, an outcome is gold.
     ---------------------------------------------------------------------- */
  var NODES = [
    { id: "gravity", label: "Reduced gravity", kind: "question",
      x: 50, y: 7, w: 26,
      say: "The question everything else is downstream of.",
      href: "research.html#reduced-gravity" },

    { id: "convection", label: "Convection", kind: "concept",
      x: 26, y: 26, w: 21,
      say: "No buoyancy, so no rising warm solution.",
      href: "research.html#reduced-gravity" },

    { id: "transport", label: "Transport", kind: "concept",
      x: 74, y: 26, w: 21,
      say: "What is left is diffusion, and diffusion is slow.",
      href: "research.html#reduced-gravity" },

    { id: "nucleation", label: "Nucleation", kind: "instrument",
      x: 22, y: 47, w: 22,
      say: "Can a cluster survive long enough to become a crystal?",
      href: "instrument.html?sim=nucleation" },

    { id: "growth", label: "Crystal growth", kind: "instrument",
      x: 50, y: 47, w: 24,
      say: "Turn gravity down and watch growth slow itself.",
      href: "instrument.html?sim=crystal" },

    { id: "solidify", label: "Solidification", kind: "instrument",
      x: 78, y: 47, w: 24,
      say: "What a composition does to a microstructure.",
      href: "instrument.html?sim=solidify" },

    { id: "structure", label: "Structure", kind: "concept",
      x: 36, y: 68, w: 21,
      say: "What the atoms actually did.",
      href: "research.html#structure" },

    { id: "diffraction", label: "Diffraction", kind: "instrument",
      x: 66, y: 68, w: 22,
      say: "How you find out, without being able to see it.",
      href: "instrument.html?sim=diffraction" },

    { id: "quality", label: "Material quality", kind: "result",
      x: 50, y: 89, w: 28,
      say: "The point of all of it, and what the notebook opens on.",
      href: "notebook.html#question" }
  ];

  var EDGES = [
    ["gravity", "convection"], ["gravity", "transport"],
    ["convection", "nucleation"], ["convection", "growth"],
    ["transport", "growth"], ["transport", "solidify"],
    ["nucleation", "growth"],
    ["growth", "structure"], ["solidify", "structure"],
    ["growth", "diffraction"], ["solidify", "diffraction"],
    ["structure", "quality"], ["diffraction", "quality"]
  ];

  var byId = {};
  NODES.forEach(function (n) { byId[n.id] = n; });

  function base() {
    return /mission-planner-website/.test(location.pathname) ? "../" : "";
  }

  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* One long description, written out, because a screen reader given a
     diagram of thirteen edges needs the argument rather than the geometry. */
  var DESC =
    "A map of how one question leads to the work on this site. Reduced " +
    "gravity removes convection and leaves transport to diffusion. Those " +
    "two change nucleation, crystal growth and solidification, which " +
    "between them decide the structure, which is measured by diffraction, " +
    "and structure and measurement together are what material quality " +
    "means. Every node is a link into the simulation, notebook entry or " +
    "research topic behind it.";

  function draw(host) {
    var b = base();
    var W = 1000, H = 560;

    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      class: "rmap",
      role: "group",
      "aria-labelledby": "rmap-t rmap-d"
    });

    var t = el("title", { id: "rmap-t" });
    t.textContent = "The research map";
    var d = el("desc", { id: "rmap-d" });
    d.textContent = DESC;
    svg.appendChild(t);
    svg.appendChild(d);

    var NW = 0.01 * W, NH = 46;
    function box(n) {
      var w = n.w * NW;
      return { w: w, h: NH, cx: n.x / 100 * W, cy: n.y / 100 * H,
               x: n.x / 100 * W - w / 2, y: n.y / 100 * H - NH / 2 };
    }

    /* the edges first, so nodes sit on top of them */
    var gEdges = el("g", { class: "rmap-edges", "aria-hidden": "true" });
    EDGES.forEach(function (pair) {
      var a = box(byId[pair[0]]), z = box(byId[pair[1]]);
      var x1 = a.cx, y1 = a.y + a.h / 2, x2 = z.cx, y2 = z.y - z.h / 2;
      var mid = (y1 + y2) / 2;
      var p = el("path", {
        class: "rmap-edge",
        "data-from": pair[0],
        "data-to": pair[1],
        d: "M" + x1 + " " + y1 +
           " C" + x1 + " " + mid + " " + x2 + " " + mid + " " + x2 + " " + y2
      });
      gEdges.appendChild(p);
    });
    svg.appendChild(gEdges);

    var gNodes = el("g", { class: "rmap-nodes" });
    NODES.forEach(function (n) {
      var r = box(n);
      var a = el("a", { class: "rmap-node", "data-kind": n.kind, "data-id": n.id });
      a.setAttributeNS("http://www.w3.org/1999/xlink", "href", b + n.href);
      a.setAttribute("href", b + n.href);

      a.appendChild(el("rect", {
        class: "rmap-box", x: r.x, y: r.y, width: r.w, height: r.h, rx: 4
      }));

      var label = el("text", {
        class: "rmap-label", x: r.cx, y: r.cy + 5,
        "text-anchor": "middle"
      });
      label.textContent = n.label;
      a.appendChild(label);

      /* what the link is, for anything reading the accessibility tree */
      var lab = el("title");
      lab.textContent = n.label + ". " + n.say;
      a.appendChild(lab);

      a.addEventListener("mouseenter", function () { lift(svg, n.id, true); });
      a.addEventListener("mouseleave", function () { lift(svg, n.id, false); });
      a.addEventListener("focus", function () { lift(svg, n.id, true); say(host, n); });
      a.addEventListener("blur", function () { lift(svg, n.id, false); });
      a.addEventListener("mouseenter", function () { say(host, n); });

      gNodes.appendChild(a);
    });
    svg.appendChild(gNodes);

    host.appendChild(svg);

    /* the line under the map that says what is currently under the pointer,
       so a node's meaning is readable without hovering long enough for a
       tooltip and without one appearing over the diagram */
    var out = document.createElement("p");
    out.className = "rmap-say";
    out.setAttribute("role", "status");
    out.setAttribute("aria-live", "polite");
    out.textContent = "Reduced gravity changes how a material forms. This is how.";
    host.appendChild(out);
    host._say = out;
  }

  function say(host, n) {
    if (host._say) host._say.textContent = n.label + ". " + n.say;
  }

  /* Light the paths into and out of a node. Everything the node depends on
     and everything that depends on it, one step each way, because two steps
     lights the whole graph and says nothing. */
  function lift(svg, id, on) {
    Array.prototype.forEach.call(svg.querySelectorAll(".rmap-edge"), function (p) {
      var hit = p.getAttribute("data-from") === id || p.getAttribute("data-to") === id;
      if (hit) p.classList.toggle("is-lit", on);
    });
    Array.prototype.forEach.call(svg.querySelectorAll(".rmap-node"), function (a) {
      var me = a.getAttribute("data-id");
      if (me === id) { a.classList.toggle("is-lit", on); return; }
      var near = EDGES.some(function (e) {
        return (e[0] === id && e[1] === me) || (e[1] === id && e[0] === me);
      });
      a.classList.toggle("is-near", on && near);
    });
  }

  /* ----------------------------------------------------------------------
     THE NARROW VERSION

     Not a shrunken diagram. The same nodes as a list of steps, in causal
     order, each one still a link and each one still carrying its claim.
     ---------------------------------------------------------------------- */
  function list(host) {
    var b = base();
    var ol = document.createElement("ol");
    ol.className = "rmap-list";
    NODES.forEach(function (n) {
      var li = document.createElement("li");
      li.setAttribute("data-kind", n.kind);
      var a = document.createElement("a");
      a.href = b + n.href;
      a.innerHTML = '<span class="rmap-list-name"></span>' +
                    '<span class="rmap-list-say"></span>';
      a.querySelector(".rmap-list-name").textContent = n.label;
      a.querySelector(".rmap-list-say").textContent = n.say;
      li.appendChild(a);
      ol.appendChild(li);
    });
    host.appendChild(ol);
  }

  function build() {
    var hosts = document.querySelectorAll("[data-research-orbit]");
    if (!hosts.length) return;

    /* Which of the two, decided once at load. A resize past the boundary is
       rare enough, and rebuilding a diagram under somebody's pointer while
       they are using it is worse than leaving it. */
    var narrow = window.matchMedia && window.matchMedia("(max-width: 639px)").matches;

    Array.prototype.forEach.call(hosts, function (host) {
      host.classList.add("rmap-host");
      if (narrow) list(host); else draw(host);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
