/* =========================================================================
   lab-thinfilm.js · Entry 11, why a soap bubble has colours

   One of the five interests on her list is thin films, and it is the one
   that is easiest to see. A soap bubble is a film a few hundred nanometres
   thick, and the colours are not pigment. They are the same wave arriving
   twice, once off the front surface and once off the back, and either
   agreeing or cancelling depending on the wavelength.

   WHAT IS COMPUTED, exactly

     Fresnel, normal incidence   r = (n1 - n2) / (n1 + n2)
     phase across the film       delta = 4 pi n_film d / lambda
     two interface reflectance   the Airy formula,
       R = (r1^2 + r2^2 + 2 r1 r2 cos d) / (1 + r1^2 r2^2 + 2 r1 r2 cos d)

   That is the exact two-beam result, not an approximation of one, and it is
   evaluated at every wavelength across the visible.

   THE ANTI-REFLECTION CONDITION FALLS OUT OF IT

   R goes to zero when the two reflections have equal size and opposite sign,
   which needs n_film = sqrt(n_air n_substrate) and a quarter wave of optical
   thickness, d = lambda / (4 n_film). For glass that puts the ideal index at
   about 1.23, which is why real coatings use magnesium fluoride at 1.38 and
   settle for nearly zero rather than zero. You can find that yourself here.

   WHAT IS APPROXIMATED

   Turning a reflectance spectrum into a colour on screen. Doing it properly
   means the CIE colour matching functions and a chromatic adaptation. Here
   the spectrum is collapsed onto three overlapping Gaussian sensitivities
   standing in for the eye's cones. Hue behaves correctly and moves the right
   way as the film thickens. The exact shade is not colorimetric and says so.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="thinfilm"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  var d = 320;        // film thickness, nm
  var nFilm = 1.33;   // soap film, close to water
  var nSub = 1.00;    // what is behind it: air for a bubble, 1.52 for glass
  var tier = { agents: 1, extras: true, res: null };

  function r1() { return (1.0 - nFilm) / (1.0 + nFilm); }
  function r2() { return (nFilm - nSub) / (nFilm + nSub); }

  function R(lambda) {
    var a = r1(), b = r2();
    var delta = 4 * Math.PI * nFilm * d / lambda;
    var c = Math.cos(delta);
    var num = a * a + b * b + 2 * a * b * c;
    var den = 1 + a * a * b * b + 2 * a * b * c;
    return den > 0 ? Math.max(0, Math.min(num / den, 1)) : 0;
  }

  /* The wavelength that comes back strongest, found by scanning rather than
     by inverting, so it stays right when the substrate flips the sign. */
  function peakLambda() {
    var best = 380, bestR = -1;
    for (var l = 380; l <= 700; l += 1) { var v = R(l); if (v > bestR) { bestR = v; best = l; } }
    return best;
  }
  function idealIndex() { return Math.sqrt(1.0 * nSub); }
  function quarterWave() { return 550 / (4 * nFilm); }

  /* Standing in for the three cones. Declared as an approximation. */
  function toRGB() {
    var sens = [[600, 60], [545, 55], [455, 50]];
    var c = [0, 0, 0], norm = [0, 0, 0];
    for (var l = 380; l <= 700; l += 5) {
      var refl = R(l);
      for (var k = 0; k < 3; k++) {
        var g = Math.exp(-Math.pow((l - sens[k][0]) / sens[k][1], 2));
        c[k] += refl * g; norm[k] += g;
      }
    }
    return c.map(function (v, k) {
      var x = norm[k] ? v / norm[k] : 0;
      return Math.round(255 * Math.min(1, Math.pow(x * 3.6, 0.55)));
    });
  }

  var cvSpec = host.querySelector('[data-view="spectrum"]');
  var cvFilm = host.querySelector('[data-view="film"]');
  var out = {
    d: host.querySelector('[data-out="d"]'),
    peak: host.querySelector('[data-out="peak"]'),
    r550: host.querySelector('[data-out="r550"]'),
    ideal: host.querySelector('[data-out="ideal"]'),
    qw: host.querySelector('[data-out="qw"]'),
    verdict: host.querySelector('[data-out="tfmsg"]')
  };
  function fmt(x, n) { return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n); }

  var INK = "#332E5C", SAGE = "#33543B", CORR = "#8C2F45", RULE = "#C5C7DC", SOFT = "#615A6E";

  function readout() {
    if (out.d) out.d.textContent = String(Math.round(d));
    if (out.peak) out.peak.textContent = String(peakLambda());
    if (out.r550) out.r550.textContent = fmt(R(550) * 100, 2);
    if (out.ideal) out.ideal.textContent = fmt(idealIndex(), 3);
    if (out.qw) out.qw.textContent = fmt(quarterWave(), 0);
    if (out.verdict) {
      var r = R(550) * 100;
      var coating = nSub > 1.2;
      out.verdict.textContent = coating
        ? (r < 1.2
          ? ("Almost nothing comes back at " + fmt(r, 2) + " percent. That is an anti reflection coating, and it works because the two reflections are nearly equal and opposite. Perfect cancellation would need an index of " + fmt(idealIndex(), 3) + ", and no durable material has one, which is why real lenses use magnesium fluoride at 1.38 and accept nearly zero.")
          : ("Reflecting " + fmt(r, 2) + " percent of green. Try a thickness near " + fmt(quarterWave(), 0) + " nm, which is a quarter of a wavelength inside the film."))
        : ("The strongest wavelength coming back is " + peakLambda() + " nm. Make the film thinner or thicker and that peak sweeps through the spectrum, which is exactly what you see running down a soap bubble as it drains.");
      out.verdict.classList.toggle("is-diffusive", coating && r < 1.2);
    }
  }

  function drawSpectrum() {
    var f = Sim.fitCanvas(cvSpec, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 30, padB = 22;
    function X(l) { return padL + ((l - 380) / 320) * (w - padL - 8); }
    function Y(v) { return (h - padB) - v * (h - padB - 12); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, 8); ctx.lineTo(padL, h - padB); ctx.lineTo(w - 6, h - padB); ctx.stroke();

    if (tier.extras) {
      for (var l = 380; l < 700; l += 4) {
        ctx.fillStyle = "hsl(" + (270 - ((l - 380) / 320) * 270) + ",70%,72%)";
        ctx.globalAlpha = 0.30;
        ctx.fillRect(X(l), h - padB - 6, Math.max(1, (w - padL - 8) / 80), 6);
      }
      ctx.globalAlpha = 1;
    }

    var step = Math.max(2, Math.round(4 / (tier.agents || 1)));
    ctx.beginPath();
    for (var lam = 380, first = true; lam <= 700; lam += step) {
      var xx = X(lam), yy = Y(R(lam));
      first ? (ctx.moveTo(xx, yy), first = false) : ctx.lineTo(xx, yy);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("R", 4, 14);
    ctx.fillText("nm", w - 22, h - 6);
    ctx.fillText("380", padL - 8, h - 6);
    ctx.fillText("700", w - 58, h - 6);
  }

  function drawFilm() {
    var f = Sim.fitCanvas(cvFilm, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var rgb = toRGB();
    ctx.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    ctx.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.62);
    ctx.strokeStyle = SOFT; ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.12, h * 0.14, w * 0.76, h * 0.62);
    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("the colour reflected back", w * 0.12, h - 10);
  }

  function draw() { if (cvSpec) drawSpectrum(); if (cvFilm) drawFilm(); }

  var api = {
    start: function () { readout(); draw(); },
    update: function () { draw(); },
    quality: function (t) { tier = t; draw(); },
    still: function () { readout(); draw(); },
    serialize: function () { return Math.abs(d - 320) < 1 && nSub < 1.2 ? "" : Math.round(d) + "," + fmt(nSub, 2); }
  };

  var dIn = host.querySelector("[data-d]");
  if (dIn) {
    dIn.addEventListener("input", function () { d = parseFloat(dIn.value); readout(); draw(); Sim.writeUrl(); });
    Sim.stepper(dIn, { label: "thickness" });
  }
  host.querySelectorAll("[data-sub]").forEach(function (b) {
    b.addEventListener("click", function () {
      nSub = parseFloat(b.getAttribute("data-sub"));
      nFilm = nSub > 1.2 ? 1.38 : 1.33;      /* magnesium fluoride, or a soap film */
      host.querySelectorAll("[data-sub]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      readout(); draw(); Sim.writeUrl();
    });
  });

  var p = new URLSearchParams(location.search);
  if (p.has("thinfilm")) {
    var parts = String(p.get("thinfilm")).split(",");
    var dv = parseFloat(parts[0]), nv = parseFloat(parts[1]);
    if (isFinite(dv)) { d = dv; if (dIn) dIn.value = String(d); }
    if (isFinite(nv)) { nSub = nv; nFilm = nSub > 1.2 ? 1.38 : 1.33; }
  }

  Sim.onDepth(function (dd) { host.setAttribute("data-depth-view", dd); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "thin film",
    "// Fresnel at each surface, straight on.\n" +
    "r1 = (1 - nFilm) / (1 + nFilm);\n" +
    "r2 = (nFilm - nSub) / (nFilm + nSub);\n" +
    "\n" +
    "// How far out of step the second reflection comes back.\n" +
    "delta = 4 * Math.PI * nFilm * d / lambda;\n" +
    "\n" +
    "// The exact two interface result.\n" +
    "R = (r1**2 + r2**2 + 2*r1*r2*Math.cos(delta)) /\n" +
    "    (1 + r1**2 * r2**2 + 2*r1*r2*Math.cos(delta));\n" +
    "\n" +
    "// R hits zero only if nFilm = Math.sqrt(nSub)\n" +
    "// and d = lambda / (4 * nFilm).",
    [
      "Light arriving straight on. At an angle the path lengthens by a factor of cos of the refracted angle and every colour shifts, which is why a bubble changes as you tilt it.",
      "Two interfaces only, and no absorption in the film. Soap and magnesium fluoride are both effectively transparent across the visible, so that holds here.",
      "Refractive index is treated as constant with wavelength. Real dispersion moves the far violet end slightly.",
      "The colour patch is an approximation. Doing it properly needs the CIE colour matching functions and a chromatic adaptation; here the spectrum is collapsed onto three overlapping Gaussians standing in for the cones. The hue moves correctly with thickness, the exact shade is not colorimetric.",
      "Substrate switches between air at 1.00 for a free soap film and glass at 1.52 for a coated lens, and the film index moves with it to 1.33 or 1.38 accordingly."
    ]
  );

  Sim.register("thinfilm", host, api);
})();
