/* =========================================================================
   lab-diffraction.js · Entry 01, measuring the crystal you just grew

   This is where her argument closes. Grow a crystal under gravity and it
   comes out small and disordered. Grow one without gravity and it comes out
   large and clean. Those are claims until you diffract them, and then they
   are numbers.

   WHAT IS COMPUTED, ALL OF IT STANDARD

     Bragg           n lambda = 2 d sin(theta)
     cubic spacing   d = a / sqrt(h^2 + k^2 + l^2)
     Scherrer        beta_size   = K lambda / (D cos theta)      K = 0.9
     strain          beta_strain = 4 epsilon tan theta
     instrument      beta_inst   = a fixed width, here 0.08 deg in 2 theta
     added in        beta^2 = beta_size^2 + beta_strain^2 + beta_inst^2

   THE POINT, AND WHY THE BRIEF NEEDED CORRECTING

   Size and strain do NOT broaden a pattern the same way. Size goes as
   1/cos(theta) and strain goes as tan(theta), so they separate as you move
   out in angle. That is exactly what a Williamson-Hall plot is for: plot
   beta cos(theta) against sin(theta) and the intercept gives you the size
   while the slope gives you the strain.

   Saying a crystal is "broad because it is small and full of defects" folds
   two separable things into one and throws away the measurement. Keeping
   them apart is more convincing, not less, and it is what anyone in a lab
   would actually do.

   Instrumental broadening is drawn as a floor, because it is the reason you
   cannot read a size straight off a peak. Below it, everything looks the same.

   WHAT ARRIVES FROM THE GROWTH SIMULATION

   The crystallite size is computed there. The strain is a declared proxy
   there, and it is still a declared proxy here. It is marked in the readout,
   in the maths view and in the assumptions, and it never loses that label by
   crossing between simulations.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="diffraction"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  var LAMBDA = 0.15406;      // nm, Cu K-alpha
  var K_SCHERRER = 0.9;
  var BETA_INST = 0.08;      // degrees in 2 theta

  var lattice = "F";         // P simple, I body centred, F face centred
  var a = 0.405;             // nm, close to aluminium
  var D = 45;                // nm, crystallite size
  var eps = 0.004;           // microstrain, dimensionless
  var strainIsProxy = false; // true once it arrives from the growth run
  var fromGrowth = null;

  var tier = { agents: 1, extras: true, res: null };
  var quiz = { answer: null, asked: false, correct: null };

  /* ---- reflections ------------------------------------------------------ */
  function allowed(h, k, l) {
    if (lattice === "P") return true;
    if (lattice === "I") return (h + k + l) % 2 === 0;
    return (h % 2 === 0 && k % 2 === 0 && l % 2 === 0) ||
           (Math.abs(h % 2) === 1 && Math.abs(k % 2) === 1 && Math.abs(l % 2) === 1);
  }

  function peaks() {
    var out = [], seen = {};
    for (var h = 0; h <= 4; h++) for (var k = 0; k <= 4; k++) for (var l = 0; l <= 4; l++) {
      var s = h * h + k * k + l * l;
      if (!s) continue;
      if (!allowed(h, k, l)) continue;
      if (seen[s]) continue;
      var d = a / Math.sqrt(s);
      var sinT = LAMBDA / (2 * d);
      if (sinT >= 1) continue;
      var th = Math.asin(sinT);
      seen[s] = true;
      out.push({ hkl: [h, k, l].sort(function (x, y) { return y - x; }).join(""),
                 s: s, d: d, theta: th, twoTheta: 2 * th * 180 / Math.PI });
    }
    return out.sort(function (p, q) { return p.twoTheta - q.twoTheta; });
  }

  /* ---- widths ----------------------------------------------------------- */
  function betaSize(th)   { return (K_SCHERRER * LAMBDA / (D * Math.cos(th))) * 180 / Math.PI; }
  function betaStrain(th) { return 4 * eps * Math.tan(th) * 180 / Math.PI; }
  function betaTotal(th)  {
    var bs = betaSize(th), be = betaStrain(th);
    return Math.sqrt(bs * bs + be * be + BETA_INST * BETA_INST);
  }

  /* ---- DOM -------------------------------------------------------------- */
  var cvPattern = host.querySelector('[data-view="pattern"]');
  var cvWH = host.querySelector('[data-view="wh"]');
  var out = {
    lattice: host.querySelector('[data-out="lattice"]'),
    size: host.querySelector('[data-out="size"]'),
    strain: host.querySelector('[data-out="strain"]'),
    peaks: host.querySelector('[data-out="peaks"]'),
    absent: host.querySelector('[data-out="absent"]'),
    whSize: host.querySelector('[data-out="whsize"]'),
    whStrain: host.querySelector('[data-out="whstrain"]'),
    origin: host.querySelector('[data-out="origin"]'),
    quiz: host.querySelector('[data-out="quiz"]')
  };

  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

  var INK = "#332E5C", SAGE = "#33543B", CORR = "#8C2F45",
      RULE = "#C5C7DC", SOFT = "#615A6E", ASIDE = "#8A5A2B";

  function readout() {
    var ps = peaks();
    var names = { P: "simple cubic", I: "body centred", F: "face centred" };
    if (out.lattice) out.lattice.textContent = names[lattice];
    if (out.size) out.size.textContent = fmt(D, 1);
    if (out.strain) {
      out.strain.textContent = fmt(eps * 100, 3) + "%";
      out.strain.classList.toggle("is-proxy", strainIsProxy);
    }
    if (out.peaks) out.peaks.textContent = ps.map(function (p) { return p.hkl; }).join("  ");
    if (out.absent) {
      out.absent.textContent = lattice === "P" ? "none, every reflection is allowed"
        : lattice === "I" ? "h+k+l odd is absent, so 100 and 111 never appear"
        : "mixed odd and even is absent, so 100 and 110 never appear";
    }
    if (out.origin) {
      out.origin.textContent = fromGrowth
        ? ("this crystal came from the growth run at " +
           (fromGrowth.gravity < 0.001 ? "near zero g" : fmt(fromGrowth.gravity, 3) + " g"))
        : "set by hand, no crystal received yet";
    }
    var wh = fitWH();
    if (out.whSize) out.whSize.textContent = wh ? fmt(wh.D, 1) : "n/a";
    if (out.whStrain) out.whStrain.textContent = wh ? fmt(wh.eps * 100, 3) + "%" : "n/a";
  }

  /* Williamson-Hall, Gaussian form.

     The widths above add in quadrature, so the matching W-H relation is the
     squared one:

        (beta_sample cos theta)^2 = (K lambda / D)^2 + (4 eps sin theta)^2

     Fitting the linear form against quadrature-combined widths mixes two
     conventions and over-reports the size by a factor of two or three, which
     is exactly what it did before this was corrected.

     The instrument is removed first, beta_sample^2 = beta_obs^2 - beta_inst^2.
     That subtraction is the practical meaning of "you cannot read a size
     straight off a peak": below the instrument's own width there is nothing
     of the sample left to measure. */
  function fitWH() {
    var ps = peaks();
    if (ps.length < 2) return null;
    var n = 0, sx = 0, sy = 0, sxy = 0, sxx = 0, pts = [];
    ps.forEach(function (p) {
      var bObs = betaTotal(p.theta) * Math.PI / 180;
      var bInst = BETA_INST * Math.PI / 180;
      var bSample2 = bObs * bObs - bInst * bInst;
      if (bSample2 <= 0) return;                 /* lost under the instrument */
      var y = bSample2 * Math.cos(p.theta) * Math.cos(p.theta);
      var x = Math.sin(p.theta) * Math.sin(p.theta);
      n++; sx += x; sy += y; sxy += x * y; sxx += x * x;
      pts.push({ p: p, x: x, y: y });
    });
    if (n < 2) return null;
    var denom = n * sxx - sx * sx;
    if (!denom) return null;
    var slope = (n * sxy - sx * sy) / denom;
    var intercept = (sy - slope * sx) / n;
    if (intercept <= 0) return null;
    return {
      D: K_SCHERRER * LAMBDA / Math.sqrt(intercept),
      eps: slope > 0 ? Math.sqrt(slope) / 4 : 0,
      slope: slope, intercept: intercept, pts: pts
    };
  }

  /* ---- the pattern ------------------------------------------------------ */
  function drawPattern() {
    var f = Sim.fitCanvas(cvPattern, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 26, padB = 24, x0 = 20, x1 = 145;   // 2 theta range in degrees

    function X(tt) { return padL + ((tt - x0) / (x1 - x0)) * (w - padL - 8); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, h - padB); ctx.lineTo(w - 6, h - padB); ctx.stroke();
    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    for (var tt = 20; tt <= 140; tt += 20) {
      ctx.fillText(String(tt), X(tt) - 6, h - padB + 12);
    }
    ctx.fillText("2θ", w - 20, h - 6);
    ctx.fillText("I", 6, 14);

    var ps = peaks();
    var steps = Math.max(120, Math.round(w * (tier.agents || 1)));
    var prof = new Float32Array(steps);
    var i, j;
    for (i = 0; i < steps; i++) {
      var tt2 = x0 + (i / (steps - 1)) * (x1 - x0);
      var v = 0;
      for (j = 0; j < ps.length; j++) {
        var p = ps[j];
        var b = betaTotal(p.theta);
        var sigma = b / 2.355;
        var dx = (tt2 - p.twoTheta) / sigma;
        /* Intensity falls off with angle, roughly. Multiplicity is folded in
           through how many equivalent planes share this spacing. */
        var amp = (1 / (1 + p.s * 0.16)) * (b > 0 ? 1 / b : 0);
        v += amp * Math.exp(-0.5 * dx * dx);
      }
      prof[i] = v;
    }
    var max = 0;
    for (i = 0; i < steps; i++) if (prof[i] > max) max = prof[i];
    if (max <= 0) return;

    ctx.beginPath();
    for (i = 0; i < steps; i++) {
      var xx = padL + (i / (steps - 1)) * (w - padL - 8);
      var yy = (h - padB) - (prof[i] / max) * (h - padB - 16);
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();

    if (tier.extras) {
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillStyle = SAGE;
      ps.forEach(function (p) {
        if (p.twoTheta < x0 || p.twoTheta > x1) return;
        ctx.fillText(p.hkl, X(p.twoTheta) - 6, 12);
      });
    }
  }

  /* ---- Williamson-Hall -------------------------------------------------- */
  function drawWH() {
    var f = Sim.fitCanvas(cvWH, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var wh = fitWH();
    var padL = 34, padB = 26;
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, 8); ctx.lineTo(padL, h - padB); ctx.lineTo(w - 6, h - padB);
    ctx.stroke();
    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("(β cosθ)²", 2, 12);
    ctx.fillText("sin²θ", w - 34, h - 8);
    if (!wh) return;

    var yMax = Math.max.apply(null, wh.pts.map(function (q) { return q.y; })) * 1.25 || 1;
    function X(s) { return padL + s * (w - padL - 10); }
    function Y(y) { return (h - padB) - (y / yMax) * (h - padB - 14); }

    ctx.beginPath();
    ctx.moveTo(X(0), Y(wh.intercept));
    ctx.lineTo(X(1), Y(wh.intercept + wh.slope));
    ctx.strokeStyle = SAGE; ctx.lineWidth = 1.6; ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(X(0), Y(wh.intercept)); ctx.lineTo(X(1), Y(wh.intercept));
    ctx.strokeStyle = CORR; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([]);

    wh.pts.forEach(function (q) {
      ctx.beginPath();
      ctx.arc(X(q.x), Y(q.y), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = INK; ctx.fill();
    });

    ctx.fillStyle = CORR; ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("intercept = size", X(0) + 6, Y(wh.intercept) - 6);
    ctx.fillStyle = SAGE;
    ctx.fillText("slope = strain", X(0.45), Y(wh.intercept + wh.slope * 0.45) - 8);
  }

  function draw() { if (cvPattern) drawPattern(); if (cvWH) drawWH(); }

  var api = {
    start: function () { readout(); draw(); },
    update: function () { draw(); },     /* static content, redrawn cheaply */
    quality: function (t) { tier = t; draw(); },
    still: function () { readout(); draw(); },
    serialize: function () {
      return (lattice === "F" && Math.abs(D - 45) < 0.01) ? "" : lattice + "," + fmt(D, 1);
    }
  };

  /* ---- receiving a crystal --------------------------------------------- */
  Sim.subscribe("crystal:grown", function (d) {
    if (!d) return;
    fromGrowth = d;
    /* Scherrer measures the COHERENT DOMAIN, not the grain. A 260 micron
       crystal is far outside Scherrer range as a grain, but a defective one
       does not scatter coherently across its whole width: dislocations chop
       it into domains, and the domain size falls roughly as one over the
       square root of the dislocation density.

       This is also why both gravities finish at the same radius. One crystal
       drawing on a fixed amount of solute ends up the same size whatever
       gravity does. Gravity changes the RATE, the uniformity, and how much
       disorder gets trapped. Size differences between real samples come
       through the number of nuclei instead, which is the other handoff.

       The domain size below is therefore bounded by the declared strain
       proxy, so it inherits that label and does not become a measurement. */
    var grain_nm = d.radius_um * 2 * 1000;
    var domain_nm = 20 / Math.sqrt(Math.max(d.strain, 1e-4));
    D = Math.max(4, Math.min(grain_nm, domain_nm, 400));
    /* Strain arrived as a declared proxy and it stays one. */
    eps = 0.0008 + d.strain * 0.012;
    strainIsProxy = !!d.strainIsProxy;
    readout(); draw();
  });

  /* ---- controls --------------------------------------------------------- */
  host.querySelectorAll("[data-lattice]").forEach(function (b) {
    b.addEventListener("click", function () {
      lattice = b.getAttribute("data-lattice");
      host.querySelectorAll("[data-lattice]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      if (quiz.asked && quiz.correct === null) {
        quiz.correct = (lattice === quiz.answer);
        if (out.quiz) {
          out.quiz.textContent = quiz.correct
            ? "That is the one. The absences gave it away."
            : "Not that one. Look at which reflections are missing rather than where the peaks are.";
          out.quiz.classList.toggle("is-diffusive", quiz.correct);
        }
      }
      readout(); draw(); Sim.writeUrl();
    });
  });

  /* ---- the pattern, played -----------------------------------------------
     Position becomes pitch, and the computed width becomes how far the tone
     is smeared. The loudness is the integrated intensity, amp times beta,
     which is what a peak actually contributes however wide it is. Nothing
     here is invented for the sound: it is the same three numbers the picture
     is drawn from. */
  var listenBtn = host.querySelector('[data-listen="diffraction"]');
  if (listenBtn) {
    listenBtn.addEventListener("click", function () {
      if (!window.Snd) return;
      if (!Snd.enabled()) Snd.set(true);
      var ps = peaks().map(function (p) {
        var b = betaTotal(p.theta);
        return { twoTheta: p.twoTheta, width: b, integrated: 1 / (1 + p.s * 0.16) };
      });
      var top = ps.reduce(function (m, p) { return Math.max(m, p.integrated); }, 0.0001);
      Snd.pattern(ps, { lo: 20, hi: 145, span: 2.6,
                        amp: function (p) { return p.integrated / top; } });
    });
  }

  var sizeInput = host.querySelector("[data-size]");
  if (sizeInput) {
    sizeInput.addEventListener("input", function () {
      D = parseFloat(sizeInput.value); fromGrowth = null; readout(); draw(); Sim.writeUrl();
      /* Pitch is the crystallite size, so dragging toward four nanometres
         falls, which is the same direction the peaks are going. */
      if (window.Snd) Snd.slide((D - 4) / (200 - 4));
    });
    Sim.stepper(sizeInput, { label: "crystallite size" });
  }

  var quizBtn = host.querySelector('[data-act="quiz"]');
  if (quizBtn) {
    quizBtn.addEventListener("click", function () {
      var opts = ["P", "I", "F"];
      quiz.answer = opts[Math.floor(Math.random() * 3)];
      quiz.asked = true; quiz.correct = null;
      lattice = quiz.answer;
      readout(); draw();
      lattice = "P";                       /* show the pattern, hide the label */
      if (out.quiz) {
        out.quiz.textContent = "Which lattice produced that pattern? Pick one above.";
        out.quiz.classList.remove("is-diffusive");
      }
      lattice = quiz.answer; draw();
      if (out.lattice) out.lattice.textContent = "hidden while you decide";
    });
  }

  Sim.onDepth(function (d) { host.setAttribute("data-depth-view", d); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "diffraction",
    "// Where the peaks are.\n" +
    "d      = a / Math.sqrt(h*h + k*k + l*l);      // cubic\n" +
    "theta  = Math.asin(lambda / (2*d));           // Bragg\n" +
    "\n" +
    "// How wide they are. These two do NOT scale the same way,\n" +
    "// which is the whole reason you can tell them apart.\n" +
    "betaSize   = K*lambda / (D * Math.cos(theta));  // goes as 1/cos\n" +
    "betaStrain = 4 * eps * Math.tan(theta);         // goes as tan\n" +
    "beta       = Math.sqrt(bSize**2 + bStrain**2 + bInst**2);\n" +
    "\n" +
    "// Williamson-Hall separates them:\n" +
    "//   beta*cos(theta) = K*lambda/D + 4*eps*sin(theta)\n" +
    "// intercept gives the size, slope gives the strain.",
    [
      "Cubic lattices only, so the spacing is a over root of h squared plus k squared plus l squared. Anything lower symmetry needs the full quadratic form.",
      "Peak shapes are Gaussian and the widths are added in quadrature. Real peaks are closer to a Voigt and the correct deconvolution is not this.",
      "Intensities fall off with angle as a rough stand in. Structure factors, Lorentz polarisation, temperature and absorption are all left out, so peak HEIGHTS are indicative and peak POSITIONS and WIDTHS are the parts to read.",
      "Instrumental broadening is a fixed 0.08 degrees. On a real instrument you measure it from a standard, and it is the reason you cannot read a size straight off a peak.",
      "The crystallite size shown here is the coherent domain, not the grain. It is bounded by the declared strain proxy, so it carries that label too. The grain radius arriving from the growth simulation is computed there. The strain arriving with it is a declared proxy there and stays a declared proxy here. It is marked in the readout and it never quietly becomes a measurement by crossing between simulations."
    ]
  );

  var p = new URLSearchParams(location.search);
  if (p.has("diffraction")) {
    var parts = String(p.get("diffraction")).split(",");
    if (["P", "I", "F"].indexOf(parts[0]) >= 0) lattice = parts[0];
    var dv = parseFloat(parts[1]);
    if (isFinite(dv) && dv > 0) { D = dv; if (sizeInput) sizeInput.value = String(D); }
  }

  Sim.register("diffraction", host, api);
})();
