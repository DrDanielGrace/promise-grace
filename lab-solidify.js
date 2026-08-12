/* =========================================================================
   lab-solidify.js · Entry 02, what a phase diagram is actually for

   The diagram above this one tells you what you are holding at a point. It
   never tells you what the metal looks like afterwards, which is the reason
   anyone reads one. So: pick a composition, cool it, and watch the structure
   arrive.

   WHAT IS COMPUTED

     liquidus       straight lines from each pure melting point to the eutectic
     lever rule     f_primary = (Ce - C) / (Ce - C_alpha)   at the eutectic line
     Jackson-Hunt   lambda^2 * v = constant, so faster cooling gives finer
                    lamellae and the spacing goes as one over root v

   All three are standard. The lever rule fraction and the lamellar spacing
   are real numbers you could check by hand.

   WHAT IS DRAWN RATHER THAN SOLVED

   The shapes. Real dendrite arms come out of a moving-boundary problem with
   surface tension and latent heat, and real lamellae come from coupled
   diffusion ahead of the front. Neither is solved here. The dendrites are
   drawn with the arm count and the lamellae with the spacing that the
   computed numbers call for, so the TRENDS are honest and the picture is an
   illustration. It says so on the panel and in the assumptions.

   This is the structure she mentions reading about in Entry 12, which is
   directional solidification: pull the heat out one way and the same physics
   lines the lamellae up.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="solidify"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  /* A generic binary eutectic. Numbers chosen to read cleanly, not to be
     any particular alloy, and the panel says so. */
  var TA = 660, TB = 780, TE = 420;    // deg C: melting points and eutectic
  var CE = 0.42;                        // eutectic composition, fraction B
  var CALPHA = 0.08, CBETA = 0.92;      // solubility limits at the eutectic

  var C = 0.20;        // chosen composition
  var vRate = 1.0;     // cooling rate, arbitrary units
  var T = 900;         // current temperature while cooling
  var cooling = false;
  var tier = { agents: 1, extras: true, res: null };

  function liquidus(c) {
    return c <= CE ? TA + (TE - TA) * (c / CE)
                   : TE + (TB - TE) * ((c - CE) / (1 - CE));
  }
  /* Outside the solubility limits there is no eutectic to reach: the whole
     thing freezes as one phase. The lever rule only applies between them,
     and reading it outside that range returns fractions over 100 percent,
     which is how this was caught. */
  function singlePhase() { return C <= CALPHA || C >= CBETA; }
  function primaryFraction() {
    if (singlePhase()) return 1;
    if (Math.abs(C - CE) < 1e-6) return 0;
    var f = C < CE ? (CE - C) / (CE - CALPHA) : (C - CE) / (CBETA - CE);
    return Math.max(0, Math.min(f, 1));
  }
  /* Jackson-Hunt. Only the proportionality matters here, so the constant is
     chosen to put the spacing in a readable range of microns. */
  function spacing_um() { return 6.0 / Math.sqrt(Math.max(vRate, 0.05)); }

  var cvDiagram = host.querySelector('[data-view="diagram"]');
  var cvMicro = host.querySelector('[data-view="micro"]');
  var out = {
    c: host.querySelector('[data-out="c"]'),
    tliq: host.querySelector('[data-out="tliq"]'),
    primary: host.querySelector('[data-out="primary"]'),
    eutectic: host.querySelector('[data-out="eutectic"]'),
    spacing: host.querySelector('[data-out="spacing"]'),
    kind: host.querySelector('[data-out="kind"]'),
    temp: host.querySelector('[data-out="temp"]')
  };

  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

  /* The six come from the host rather than from here. See palette.js. */
  var INK, SAGE, CORR, RULE, SOFT, ASIDE, PAPER_DEEP, RGBA;
  Lab.bind(host, function (p, redraw) {
    INK = p.ink; SAGE = p.sage; CORR = p.corr;
    RULE = p.rule; SOFT = p.soft; ASIDE = p.aside; RGBA = p.rgba;
    PAPER_DEEP = p.rgba("paper", 1);
    if (redraw && typeof draw === "function") draw();
  });

  function readout() {
    var fp = primaryFraction();
    if (out.c) out.c.textContent = fmt(C * 100, 0);
    if (out.tliq) out.tliq.textContent = fmt(liquidus(C), 0);
    if (out.primary) out.primary.textContent = fmt(fp * 100, 1);
    if (out.eutectic) out.eutectic.textContent = fmt((1 - fp) * 100, 1);
    if (out.spacing) out.spacing.textContent = fmt(spacing_um(), 2);
    if (out.temp) out.temp.textContent = fmt(T, 0);
    if (out.kind) {
      out.kind.textContent = singlePhase()
        ? "This much dissolves completely in the other, so it never reaches the eutectic. The whole thing freezes as one phase and there are no lamellae at all."
        : (Math.abs(C - CE) < 0.015
          ? "Right at the eutectic, so there is no primary phase at all. It goes from liquid straight to lamellae, all at one temperature."
          : (C < CE
            ? "Below the eutectic, so alpha dendrites grow first and the liquid left between them finishes as lamellae."
            : "Above the eutectic, so beta dendrites grow first and the liquid left between them finishes as lamellae."));
      out.kind.classList.toggle("is-diffusive", Math.abs(C - CE) < 0.015 || singlePhase());
    }
  }

  function drawDiagram() {
    var f = Sim.fitCanvas(cvDiagram, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 30, padB = 24, top = 10;
    var tMin = 300, tMax = 820;
    function X(c) { return padL + c * (w - padL - 8); }
    function Y(t) { return top + (1 - (t - tMin) / (tMax - tMin)) * (h - padB - top); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, top); ctx.lineTo(padL, h - padB); ctx.lineTo(w - 6, h - padB); ctx.stroke();

    /* liquidus, both branches */
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(TA)); ctx.lineTo(X(CE), Y(TE)); ctx.lineTo(X(1), Y(TB));
    ctx.stroke();

    /* the eutectic line */
    ctx.strokeStyle = CORR; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(CALPHA), Y(TE)); ctx.lineTo(X(CBETA), Y(TE)); ctx.stroke();

    /* the cooling path, straight down at fixed composition */
    ctx.setLineDash([4, 3]); ctx.strokeStyle = SAGE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X(C), Y(tMax)); ctx.lineTo(X(C), Y(Math.max(T, tMin))); ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath(); ctx.arc(X(C), Y(Math.max(T, tMin)), 4, 0, Math.PI * 2);
    ctx.fillStyle = SAGE; ctx.fill();

    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("A", padL - 2, h - padB + 12);
    ctx.fillText("B", w - 14, h - padB + 12);
    ctx.fillText("T", 6, top + 8);
    if (tier.extras) {
      ctx.fillStyle = CORR;
      ctx.fillText("eutectic " + TE + "C", X(CE) - 22, Y(TE) - 5);
    }
  }

  /* The microstructure. Shapes are drawn, the counts and spacings come from
     the computed numbers above. */
  function drawMicro() {
    var f = Sim.fitCanvas(cvMicro, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PAPER_DEEP; ctx.fillRect(0, 0, w, h);

    var progress = T > liquidus(C) ? 0
      : T <= TE ? 1
      : (liquidus(C) - T) / Math.max(liquidus(C) - TE, 1);

    var fp = primaryFraction();
    var lam = Math.max(3, spacing_um() * (w / 120));

    /* eutectic background, lamellae, only once the eutectic line is reached */
    if (T <= TE && !singlePhase()) {
      for (var x = 0; x < w; x += lam) {
        ctx.fillStyle = ((x / lam) | 0) % 2 ? RGBA("sage", 0.30) : RGBA("ink", 0.14);
        ctx.fillRect(x, 0, lam * 0.55, h);
      }
    }

    /* primary dendrites, grown in proportion to how far down we are */
    if (fp > 0.005 && progress > 0) {
      var n = Math.max(1, Math.round(fp * 9 * (tier.agents || 1)));
      var grown = Math.min(progress, 1);
      ctx.strokeStyle = C < CE ? RGBA("ink", 0.75) : RGBA("corr", 0.7);
      ctx.lineWidth = 2;
      for (var i = 0; i < n; i++) {
        var cx = ((i + 0.5) / n) * w, cy = h * (0.2 + 0.6 * ((i * 37 % 10) / 10));
        var len = grown * h * 0.3 * (0.6 + fp);
        ctx.beginPath(); ctx.moveTo(cx, cy - len); ctx.lineTo(cx, cy + len); ctx.stroke();
        for (var a = -3; a <= 3; a++) {
          if (!a) continue;
          var yy = cy + (a / 3.5) * len, armLen = len * 0.42 * (1 - Math.abs(a) / 4.2);
          ctx.beginPath(); ctx.moveTo(cx - armLen, yy); ctx.lineTo(cx + armLen, yy); ctx.stroke();
        }
      }
    }

    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(T > liquidus(C) ? "all liquid" : (T > TE ? "dendrites growing" : "solid"), 8, h - 8);
  }

  function draw() { if (cvDiagram) drawDiagram(); if (cvMicro) drawMicro(); }

  var api = {
    start: function () { T = 900; cooling = false; readout(); draw(); },
    update: function (dt) {
      if (cooling) {
        T -= dt * 120 * vRate;
        if (T <= 330) { T = 330; cooling = false; }
        readout();
      }
      draw();
    },
    quality: function (t) { tier = t; draw(); },
    still: function () { T = 330; cooling = false; readout(); draw(); },
    serialize: function () { return Math.abs(C - 0.20) < 0.005 ? "" : fmt(C, 2); }
  };

  var cIn = host.querySelector("[data-c]");
  if (cIn) {
    cIn.addEventListener("input", function () {
      C = parseFloat(cIn.value); T = 900; cooling = false; readout(); draw(); Sim.writeUrl();
    });
    Sim.stepper(cIn, { label: "composition" });
  }
  var vIn = host.querySelector("[data-v]");
  if (vIn) {
    vIn.addEventListener("input", function () { vRate = parseFloat(vIn.value); readout(); draw(); });
    Sim.stepper(vIn, { label: "cooling rate" });
  }
  var coolBtn = host.querySelector('[data-act="cool"]');
  if (coolBtn) coolBtn.addEventListener("click", function () { T = 900; cooling = true; });

  var p = new URLSearchParams(location.search);
  if (p.has("solidify")) {
    var v = parseFloat(p.get("solidify"));
    if (isFinite(v) && v >= 0 && v <= 1) { C = v; if (cIn) cIn.value = String(C); }
  }

  Sim.onDepth(function (d) { host.setAttribute("data-depth-view", d); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "solidification",
    "// Where freezing starts, for this composition.\n" +
    "liquidus = c <= Ce ? Ta + (Te - Ta) * (c / Ce)\n" +
    "                   : Te + (Tb - Te) * ((c - Ce) / (1 - Ce));\n" +
    "\n" +
    "// How much of it froze as primary phase before the eutectic.\n" +
    "// This is the lever rule, read along the eutectic line.\n" +
    "fPrimary = c < Ce ? (Ce - c) / (Ce - cAlpha)\n" +
    "                  : (c - Ce) / (cBeta - Ce);\n" +
    "\n" +
    "// Jackson-Hall: lambda^2 * v is constant, so pulling the heat\n" +
    "// out faster gives you finer lamellae.\n" +
    "spacing = K / Math.sqrt(v);",
    [
      "A generic binary eutectic with straight liquidus lines. Real liquidus lines curve, and this is not any particular alloy.",
      "The lever rule fraction and the lamellar spacing are computed. Both are numbers you could check by hand from the diagram. Outside the solubility limits the lever rule does not apply, because the alloy never reaches the eutectic and freezes as a single phase.",
      "The shapes are drawn, not solved. Real dendrites come from a moving boundary problem with surface tension and latent heat, and real lamellae from coupled diffusion ahead of the front. The arm counts and the spacings follow the computed numbers, so the trends are honest and the picture is an illustration.",
      "Only the proportionality in Jackson-Hunt is used. The constant is chosen to put the spacing in a readable range of microns rather than measured for a system.",
      "Cooling is treated as slow enough for equilibrium at every step. A real quench traps the liquid composition and gives you cored dendrites, which this does not show."
    ]
  );

  Sim.register("solidify", host, api);
})();
