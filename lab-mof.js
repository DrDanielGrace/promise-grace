/* =========================================================================
   lab-mof.js · Entry 11, the hole is the point

   A metal organic framework is a coordination compound that somebody
   persuaded to keep going in three dimensions. Metal nodes at the corners,
   organic linkers as the struts, and the useful part is the empty space in
   the middle. Swap the linker for a longer one and the pore grows.

   WHAT IS COMPUTED

     Geometry, and only geometry. For a primitive cubic net the cell edge is
     the node radius at each end plus the linker length,

       a = 2 r_node + L

     and the clear aperture you could actually push a molecule through is
     that edge minus the van der Waals radii of the atoms lining it,

       aperture = a - 2 r_vdW

     Both are honest, both are arithmetic you could do on paper, and the
     aperture is what decides whether a given gas fits.

   WHAT IS NOT COMPUTED, DELIBERATELY

     Surface area. It is tempting to put a number in square metres per gram
     on the end of that slider and it would be invented. Real surface areas
     come from measured nitrogen adsorption fitted with BET, and they depend
     on the framework's mass, its topology, whether the pores actually opened
     on activation, and whether the crystal survived being emptied. A slider
     cannot know any of that.

     So the measured values for real frameworks sit beside the geometry
     instead, attributed, and the slider does not pretend to produce one.
     That is also the honest version of the football pitch fact: NU-110 was
     reported near 7000 m2/g, which is about one and a half football pitches
     in a single gram, and that number was measured rather than modelled.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="mof"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  var R_NODE = 1.6;      // angstrom, effective radius of a metal cluster node
  var R_VDW = 1.7;       // angstrom, carbon van der Waals radius lining the pore
  var L = 6.9;           // angstrom, linker length. 6.9 is about terephthalate

  /* Kinetic diameters, angstrom. Standard values, used to say plainly what
     fits through the aperture and what does not. */
  var GASES = [
    { n: "H2", d: 2.89 }, { n: "CO2", d: 3.30 }, { n: "N2", d: 3.64 },
    { n: "CH4", d: 3.80 }, { n: "SF6", d: 5.50 }
  ];

  /* Measured, not modelled. BET surface areas as reported in the literature,
     kept as a range because different groups get different numbers from the
     same framework depending on activation. */
  var REAL = [
    { n: "HKUST-1", a: "~1500", linker: 6.9 },
    { n: "MOF-5", a: "~3000", linker: 6.9 },
    { n: "UiO-66", a: "~1200", linker: 6.9 },
    { n: "MOF-177", a: "~4700", linker: 9.5 },
    { n: "NU-110", a: "~7000", linker: 14.0 }
  ];

  var tier = { agents: 1, extras: true, res: null };

  function cellEdge() { return 2 * R_NODE + L; }
  function aperture() { return Math.max(0, cellEdge() - 2 * R_VDW); }

  var cvCell = host.querySelector('[data-view="cell"]');
  var cvFit = host.querySelector('[data-view="fit"]');
  var out = {
    l: host.querySelector('[data-out="linker"]'),
    edge: host.querySelector('[data-out="edge"]'),
    ap: host.querySelector('[data-out="aperture"]'),
    fits: host.querySelector('[data-out="fits"]'),
    msg: host.querySelector('[data-out="mofmsg"]')
  };
  function fmt(x, n) { return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n); }

  var INK = "#332E5C", SAGE = "#33543B", CORR = "#8C2F45", RULE = "#C5C7DC", SOFT = "#615A6E";

  function readout() {
    var ap = aperture();
    if (out.l) out.l.textContent = fmt(L, 1);
    if (out.edge) out.edge.textContent = fmt(cellEdge(), 2);
    if (out.ap) out.ap.textContent = fmt(ap, 2);
    var pass = GASES.filter(function (g) { return g.d <= ap; }).map(function (g) { return g.n; });
    if (out.fits) out.fits.textContent = pass.length ? pass.join(", ") : "nothing on this list";
    if (out.msg) {
      var blocked = GASES.filter(function (g) { return g.d > ap; });
      out.msg.textContent = blocked.length === 0
        ? "Everything on the list goes through. A pore this wide separates nothing, which is its own kind of useless."
        : ("The aperture is " + fmt(ap, 2) + " angstrom, so " + blocked.map(function (g) { return g.n; }).join(" and ") +
           " will not fit through it. That is the whole trick: a framework separates gases by being exactly the wrong size for one of them.");
      out.msg.classList.toggle("is-diffusive", blocked.length > 0 && blocked.length < GASES.length);
    }
  }

  function drawCell() {
    var f = Sim.fitCanvas(cvCell, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    /* One face of a primitive cubic net, drawn to scale against the cell
       edge so the pore visibly grows with the linker. */
    var maxEdge = 2 * R_NODE + 16;
    var s = (Math.min(w, h) * 0.62) / maxEdge;
    var a = cellEdge() * s;
    var cx = w / 2, cy = h / 2;
    var pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (var i = 0; i < 4; i++) {
      var p = pts[i], q = pts[(i + 1) % 4];
      ctx.beginPath();
      ctx.moveTo(cx + p[0] * a / 2, cy + p[1] * a / 2);
      ctx.lineTo(cx + q[0] * a / 2, cy + q[1] * a / 2);
      ctx.stroke();
    }
    /* the pore */
    var ap = aperture() * s;
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, ap / 2), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(51,84,59,0.16)"; ctx.fill();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = SAGE; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = CORR;
    for (var k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(cx + pts[k][0] * a / 2, cy + pts[k][1] * a / 2, Math.max(3, R_NODE * s), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("nodes at the corners, linkers between", 8, h - 8);
  }

  function drawFit() {
    var f = Sim.fitCanvas(cvFit, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var ap = aperture(), maxD = 6.5;
    var rowH = (h - 20) / GASES.length;
    ctx.font = "11px ui-monospace, monospace";
    var apX = 30 + (ap / maxD) * (w - 60);
    ctx.strokeStyle = SAGE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(apX, 6); ctx.lineTo(apX, h - 8); ctx.stroke();
    ctx.fillStyle = SAGE; ctx.fillText("aperture", Math.min(apX + 4, w - 60), 14);

    GASES.forEach(function (g, i) {
      var y = 22 + i * rowH;
      var x = 30 + (g.d / maxD) * (w - 60);
      var through = g.d <= ap;
      ctx.fillStyle = through ? "rgba(51,84,59,0.75)" : "rgba(140,47,69,0.7)";
      ctx.beginPath(); ctx.arc(x, y, Math.max(3, (g.d / maxD) * 14), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = SOFT;
      ctx.fillText(g.n, 4, y + 4);
    });
  }

  function draw() { if (cvCell) drawCell(); if (cvFit) drawFit(); }

  var api = {
    start: function () { readout(); draw(); },
    update: function () { draw(); },
    quality: function (t) { tier = t; draw(); },
    still: function () { readout(); draw(); },
    serialize: function () { return Math.abs(L - 6.9) < 0.05 ? "" : fmt(L, 1); }
  };

  var lIn = host.querySelector("[data-l]");
  if (lIn) {
    lIn.addEventListener("input", function () { L = parseFloat(lIn.value); readout(); draw(); Sim.writeUrl(); });
    Sim.stepper(lIn, { label: "linker length" });
  }
  var p = new URLSearchParams(location.search);
  if (p.has("mof")) {
    var v = parseFloat(p.get("mof"));
    if (isFinite(v) && v >= 3 && v <= 16) { L = v; if (lIn) lIn.value = String(L); }
  }

  /* The measured values, printed rather than computed. */
  var tbl = host.querySelector("[data-real]");
  if (tbl) {
    tbl.innerHTML = "";
    REAL.forEach(function (r) {
      var li = document.createElement("li");
      li.textContent = r.n + " · " + r.a + " m²/g measured";
      tbl.appendChild(li);
    });
  }

  Sim.onDepth(function (dd) { host.setAttribute("data-depth-view", dd); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "framework geometry",
    "// Primitive cubic net. A node at each corner, a linker between.\n" +
    "cellEdge = 2 * rNode + linkerLength;\n" +
    "\n" +
    "// What you could actually push a molecule through, once the\n" +
    "// van der Waals radii of the lining atoms are taken off.\n" +
    "aperture = cellEdge - 2 * rVdW;\n" +
    "\n" +
    "// A gas gets through if its kinetic diameter fits.\n" +
    "passes = kineticDiameter <= aperture;\n" +
    "\n" +
    "// There is deliberately no surfaceArea() here. See the notes.",
    [
      "A primitive cubic net with rigid linear linkers. Most real frameworks are not this: they interpenetrate, they tilt, they breathe, and several of them collapse when you empty them.",
      "Node radius is a single effective number standing in for a whole metal cluster, and the van der Waals radius is carbon's.",
      "Kinetic diameters are standard tabulated values and they are a hard sphere idealisation. A real molecule is not a sphere and CO2 in particular gets through pores narrower than its quoted diameter.",
      "There is no surface area computed anywhere in this simulation, on purpose. Real values come from measured nitrogen adsorption fitted with BET and depend on mass, topology, whether the pores opened on activation and whether the crystal survived it. A slider cannot know any of that, so the measured values for real frameworks are printed beside the geometry instead.",
      "The framework drawn is one face, in two dimensions. The pore is a three dimensional channel and its real shape depends on the topology."
    ]
  );

  Sim.register("mof", host, api);
})();
