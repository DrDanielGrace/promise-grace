/* =========================================================================
   lab-thermo.js · Entry 11, the argument thermoelectrics are having

   Heat one end of a material and the carriers pile up at the cold end, which
   is a voltage. Useful: waste heat straight into electricity, no moving
   parts. The reason it is not everywhere is a genuine conflict, and it is
   the conflict rather than the effect that is worth showing.

   You want three things at once and two of them fight:

     a big Seebeck coefficient S     falls as you add carriers
     a high electrical conductivity  rises as you add carriers
     a low thermal conductivity      rises as you add carriers, because
                                     the carriers carry heat as well

   That last one is Wiedemann-Franz and it is not a coincidence you can
   engineer away: the same electrons that carry charge carry heat.

   WHAT IS COMPUTED

     Pisarenko          S = (8 pi^2 k^2 T / (3 e h^2)) m* (pi / 3n)^(2/3)
     conductivity       sigma = n e mu
     Wiedemann-Franz    kappa_e = L sigma T,  L = 2.44e-8 W ohm / K^2
     total thermal      kappa = kappa_lattice + kappa_e
     figure of merit    ZT = S^2 sigma T / kappa

   All five are standard. Sweep the carrier concentration and ZT rises, peaks
   and falls, and the peak lands where every real thermoelectric sits, which
   is around 10^19 to 10^20 per cubic centimetre. Nobody put that peak there.
   It falls out of the three relations disagreeing.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="thermo"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  var KB = 1.381e-23, QE = 1.602e-19, HP = 6.626e-34, ME = 9.109e-31;
  var LORENZ = 2.44e-8;

  var logN = 19.5;        // log10 of carriers per cm3
  var T = 600;            // K
  var mStar = 1.5;        // effective mass, in units of the electron mass
  var mu = 0.02;          // carrier mobility, m2 per volt second
  var kLat = 1.5;         // lattice thermal conductivity, W per m K
  var tier = { agents: 1, extras: true, res: null };

  function nSI(ln) { return Math.pow(10, ln) * 1e6; }        // cm-3 to m-3

  /* Effective density of states. This is the line either side of which a
     different expression for the Seebeck coefficient applies, and for these
     numbers it lands near 10^20 per cm3, which is where real thermoelectrics
     sit. That is not a coincidence, it is the same physics. */
  function Nc() {
    return 2 * Math.pow(2 * Math.PI * mStar * ME * KB * T / (HP * HP), 1.5);
  }

  /* Pisarenko is the DEGENERATE limit and only holds above Nc. Used below it
     as well it sends S to infinity as carriers vanish, which made ZT climb
     without limit towards zero doping and put the peak at 10^16. Below Nc the
     material is non degenerate and S grows only as a logarithm, so S squared
     times sigma collapses and ZT peaks where it should. Taking the smaller of
     the two is the standard way to join them. */
  function seebeck(ln) {
    var n = nSI(ln);
    var pre = (8 * Math.PI * Math.PI * KB * KB * T) / (3 * QE * HP * HP);
    var degenerate = pre * (mStar * ME) * Math.pow(Math.PI / (3 * n), 2 / 3);
    var nonDegenerate = (KB / QE) * (2 + Math.log(Math.max(Nc() / n, 1.0001)));
    return Math.min(degenerate, nonDegenerate);
  }
  function sigma(ln) { return nSI(ln) * QE * mu; }
  function kappaE(ln) { return LORENZ * sigma(ln) * T; }
  function kappa(ln) { return kLat + kappaE(ln); }
  function ZT(ln) {
    var S = seebeck(ln);
    return (S * S * sigma(ln) * T) / kappa(ln);
  }
  function bestLogN() {
    var best = 17, bz = -1;
    for (var l = 16; l <= 22; l += 0.02) { var z = ZT(l); if (z > bz) { bz = z; best = l; } }
    return best;
  }

  var cvCurve = host.querySelector('[data-view="zt"]');
  var cvBar = host.querySelector('[data-view="bars"]');
  var out = {
    n: host.querySelector('[data-out="n"]'),
    s: host.querySelector('[data-out="seebeck"]'),
    sig: host.querySelector('[data-out="sigma"]'),
    ke: host.querySelector('[data-out="kappae"]'),
    zt: host.querySelector('[data-out="zt"]'),
    peak: host.querySelector('[data-out="ztpeak"]'),
    msg: host.querySelector('[data-out="thmsg"]')
  };
  function fmt(x, n) { return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n); }

  /* The six come from the host rather than from here. See palette.js. */
  var INK, SAGE, CORR, RULE, SOFT, RGBA;
  Lab.bind(host, function (p, redraw) {
    INK = p.ink; SAGE = p.sage; CORR = p.corr;
    RULE = p.rule; SOFT = p.soft; RGBA = p.rgba;
    if (redraw && typeof draw === "function") draw();
  });

  function readout() {
    var bl = bestLogN();
    if (out.n) out.n.textContent = "10^" + fmt(logN, 2);
    if (out.s) out.s.textContent = fmt(seebeck(logN) * 1e6, 1);
    if (out.sig) out.sig.textContent = fmt(sigma(logN) / 100, 1);
    if (out.ke) out.ke.textContent = fmt(kappaE(logN), 2);
    if (out.zt) out.zt.textContent = fmt(ZT(logN), 3);
    if (out.peak) out.peak.textContent = "10^" + fmt(bl, 2);
    if (out.msg) {
      var near = Math.abs(logN - bl) < 0.3;
      out.msg.textContent = near
        ? ("This is about as good as this material gets. Add carriers and the Seebeck voltage falls faster than the conductivity rises, take them away and there is not enough conduction to use. Every real thermoelectric sits near here, around 10^19 to 10^20 per cubic centimetre.")
        : (logN < bl
          ? "Too few carriers. The Seebeck coefficient is large but there is almost no conduction, so there is nothing to draw out."
          : "Too many carriers. Conduction is high but the Seebeck voltage has collapsed, and the electrons are now carrying heat as well, which is the part you cannot switch off.");
      out.msg.classList.toggle("is-diffusive", near);
    }
  }

  function drawCurve() {
    var f = Sim.fitCanvas(cvCurve, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 30, padB = 24, lo = 16, hi = 22;
    function X(l) { return padL + ((l - lo) / (hi - lo)) * (w - padL - 8); }
    var maxZ = 0, l;
    for (l = lo; l <= hi; l += 0.05) maxZ = Math.max(maxZ, ZT(l));
    maxZ = maxZ || 1;
    function Y(z) { return (h - padB) - (z / (maxZ * 1.15)) * (h - padB - 12); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, 8); ctx.lineTo(padL, h - padB); ctx.lineTo(w - 6, h - padB); ctx.stroke();

    var step = Math.max(0.04, 0.08 / (tier.agents || 1));
    ctx.beginPath();
    for (l = lo; l <= hi; l += step) {
      var xx = X(l), yy = Y(ZT(l));
      l === lo ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();

    if (tier.extras) {
      var bl = bestLogN();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = SAGE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(bl), 8); ctx.lineTo(X(bl), h - padB); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath(); ctx.arc(X(logN), Y(ZT(logN)), 4, 0, Math.PI * 2);
    ctx.fillStyle = CORR; ctx.fill();

    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("ZT", 4, 14);
    ctx.fillText("10^16", padL - 6, h - 8);
    ctx.fillText("10^22", w - 44, h - 8);
    ctx.fillText("carriers per cm3", padL + 4, h - 8);
  }

  /* The three quantities side by side, normalised, so the disagreement is
     visible rather than described. */
  function drawBars() {
    var f = Sim.fitCanvas(cvBar, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var items = [
      { k: "Seebeck S", v: seebeck(logN) / seebeck(16), c: RGBA("ink", 0.75) },
      { k: "conductivity", v: sigma(logN) / sigma(22), c: RGBA("sage", 0.75) },
      { k: "heat carried by carriers", v: kappaE(logN) / (kappaE(22)), c: RGBA("corr", 0.75) }
    ];
    var bh = (h - 30) / items.length;
    ctx.font = "11px ui-monospace, monospace";
    items.forEach(function (it, i) {
      var y = 14 + i * bh;
      var len = Math.max(2, Math.min(it.v, 1) * (w - 24));
      ctx.fillStyle = it.c;
      ctx.fillRect(12, y + bh * 0.28, len, bh * 0.3);
      ctx.fillStyle = SOFT;
      ctx.fillText(it.k, 12, y + bh * 0.2);
    });
  }

  function draw() { if (cvCurve) drawCurve(); if (cvBar) drawBars(); }

  var api = {
    start: function () { readout(); draw(); },
    update: function () { draw(); },
    quality: function (t) { tier = t; draw(); },
    still: function () { readout(); draw(); },
    serialize: function () { return Math.abs(logN - 19.5) < 0.01 ? "" : fmt(logN, 2); }
  };

  var nIn = host.querySelector("[data-n]");
  if (nIn) {
    nIn.addEventListener("input", function () { logN = parseFloat(nIn.value); readout(); draw(); Sim.writeUrl(); });
    Sim.stepper(nIn, { label: "carrier concentration" });
  }
  var tIn = host.querySelector("[data-t]");
  if (tIn) {
    tIn.addEventListener("input", function () { T = parseFloat(tIn.value); readout(); draw(); });
    Sim.stepper(tIn, { label: "temperature" });
  }

  var p = new URLSearchParams(location.search);
  if (p.has("thermo")) {
    var v = parseFloat(p.get("thermo"));
    if (isFinite(v) && v >= 16 && v <= 22) { logN = v; if (nIn) nIn.value = String(logN); }
  }

  Sim.onDepth(function (dd) { host.setAttribute("data-depth-view", dd); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "thermoelectric",
    "// Seebeck falls as you add carriers. Pisarenko.\n" +
    "S = (8*PI**2 * k**2 * T / (3*e*h**2)) * mStar * (PI/(3*n))**(2/3);\n" +
    "\n" +
    "// Conductivity rises with them.\n" +
    "sigma = n * e * mu;\n" +
    "\n" +
    "// And so does the heat they carry. This is the trap:\n" +
    "// Wiedemann-Franz ties kappa_e directly to sigma.\n" +
    "kappaE = L * sigma * T;      // L = 2.44e-8\n" +
    "kappa  = kappaLattice + kappaE;\n" +
    "\n" +
    "ZT = S*S * sigma * T / kappa;",
    [
      "Two expressions for the Seebeck coefficient are joined at the effective density of states: Pisarenko above it, where the material is degenerate, and the logarithmic non degenerate form below it. Both assume parabolic bands and scattering that does not depend on energy. Real band structures bend this, and band engineering is precisely how the field pushes ZT up.",
      "Mobility is held constant as carriers are added. In a real material it falls as they scatter off each other, so the true peak is slightly lower and broader than this.",
      "The Lorenz number is fixed at the degenerate limit. It drifts by tens of percent in real materials and assuming it fixed is a known source of error in reported ZT.",
      "One carrier type only. A real narrow gap material at high temperature gets minority carriers too, which drags the Seebeck coefficient back down.",
      "Lattice thermal conductivity is a constant here. Reducing it by alloying and nanostructuring, without wrecking conductivity, is most of what the field actually does."
    ]
  );

  Sim.register("thermo", host, api);
})();
