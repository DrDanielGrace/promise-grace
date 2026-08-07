/* =========================================================================
   lab-titration.js · Entry 03, the mistake worth making early

   The old version let you overshoot and turned the flask pink. That is the
   teaching point and it stays. What it never did was draw the curve, which
   is the thing that explains WHY one drop matters so much at the end and
   almost nothing matters in the middle.

   WHAT IS COMPUTED, all of it exactly

     strong acid, before equivalence   [H+] = (Ca Va - Cb Vb) / (Va + Vb)
     strong acid, after                [OH-] = (Cb Vb - Ca Va) / (Va + Vb)
     weak acid, start                  pH = 0.5 (pKa - log Ca)
     weak acid, buffer region          pH = pKa + log(moles A- / moles HA)
     weak acid, at equivalence         pOH = 0.5 (pKb - log C_salt)
     after equivalence                 excess strong base, as above

   Those are the standard treatments and the numbers come out where a
   textbook says they should: a strong acid against a strong base crosses
   pH 7 exactly at the equivalence point, and a weak acid crosses well above
   it, because the salt left behind is itself basic.

   THE INDICATOR IS THE POINT

   Each indicator changes colour over its own pH range. Pick methyl orange
   for a weak acid and it turns long before the equivalence point, so the
   answer you write down is wrong. That is not a detail, it is the reason
   anyone is taught to choose one, and here you can discover it rather than
   be told it.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="titration"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  var Ca = 0.100, Va = 25.0;      // mol/L and mL of acid in the flask
  var Cb = 0.100;                 // mol/L of base in the burette
  var Vb = 0.0;                   // mL added so far
  var weak = false;               // strong acid by default
  var pKa = 4.76;                 // ethanoic acid
  var Kw = 1e-14;

  var INDICATORS = {
    phenolphthalein: { lo: 8.2, hi: 10.0, name: "phenolphthalein",
                       from: "colourless", to: "pink" },
    methylorange:    { lo: 3.1, hi: 4.4,  name: "methyl orange",
                       from: "red", to: "yellow" },
    bromothymol:     { lo: 6.0, hi: 7.6,  name: "bromothymol blue",
                       from: "yellow", to: "blue" }
  };
  var indicator = "phenolphthalein";

  var tier = { agents: 1, extras: true, res: null };
  var curve = [];

  function equivalenceVolume() { return Ca * Va / Cb; }

  function pHat(vb) {
    var molA = Ca * Va / 1000, molB = Cb * vb / 1000, V = (Va + vb) / 1000;
    if (!weak) {
      if (molB < molA) return -Math.log10((molA - molB) / V);
      if (molB > molA) return 14 + Math.log10((molB - molA) / V);
      return 7;
    }
    var pKb = 14 - pKa;
    if (molB <= 0) return 0.5 * (pKa - Math.log10(Ca));
    if (molB < molA) return pKa + Math.log10(molB / (molA - molB));
    if (Math.abs(molB - molA) < 1e-12) {
      var cSalt = molA / V;
      return 14 - 0.5 * (pKb - Math.log10(cSalt));
    }
    return 14 + Math.log10((molB - molA) / V);
  }

  function ind() { return INDICATORS[indicator]; }
  function colourFraction() {
    var pH = pHat(Vb), i = ind();
    if (pH <= i.lo) return 0;
    if (pH >= i.hi) return 1;
    return (pH - i.lo) / (i.hi - i.lo);
  }
  /* The volume at which the indicator has half turned, which is what a
     student would actually record as the endpoint. */
  function endpointVolume() {
    var i = ind(), mid = (i.lo + i.hi) / 2, lo = 0, hi = equivalenceVolume() * 2;
    for (var k = 0; k < 60; k++) {
      var m = (lo + hi) / 2;
      if (pHat(m) < mid) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  var cvCurve = host.querySelector('[data-view="curve"]');
  var cvFlask = host.querySelector('[data-view="flask"]');
  var out = {
    vol: host.querySelector('[data-out="vol"]'),
    ph: host.querySelector('[data-out="ph"]'),
    equiv: host.querySelector('[data-out="equiv"]'),
    endpoint: host.querySelector('[data-out="endpoint"]'),
    error: host.querySelector('[data-out="terror"]'),
    msg: host.querySelector('[data-out="tmsg"]')
  };
  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

  var INK = "#332E5C", SAGE = "#33543B", CORR = "#8C2F45",
      RULE = "#C5C7DC", SOFT = "#615A6E";

  function readout() {
    var ve = equivalenceVolume(), vend = endpointVolume();
    var err = ((vend - ve) / ve) * 100;
    if (out.vol) out.vol.textContent = fmt(Vb, 2);
    if (out.ph) out.ph.textContent = fmt(pHat(Vb), 2);
    if (out.equiv) out.equiv.textContent = fmt(ve, 2);
    if (out.endpoint) out.endpoint.textContent = fmt(vend, 2);
    if (out.error) out.error.textContent = (err >= 0 ? "+" : "") + fmt(err, 2) + "%";
    if (out.msg) {
      var bad = Math.abs(err) > 1;
      out.msg.textContent = bad
        ? ("With " + ind().name + " on this acid the colour turns at " + fmt(vend, 2) +
           " cm3 but the reaction actually finishes at " + fmt(ve, 2) +
           " cm3. Anyone reading the burette would be out by " + fmt(err, 1) +
           " percent and would never know.")
        : (ind().name + " turns within a whisker of the equivalence point here, which is why it is the one you are told to use.");
      out.msg.classList.toggle("is-diffusive", !bad);
    }
  }

  function rebuild() {
    curve.length = 0;
    var ve = equivalenceVolume(), max = ve * 2;
    var n = Math.max(80, Math.round(320 * (tier.agents || 1)));
    for (var i = 0; i <= n; i++) {
      var v = (i / n) * max;
      curve.push({ v: v, pH: Math.max(0, Math.min(14, pHat(v))) });
    }
  }

  function drawCurve() {
    var f = Sim.fitCanvas(cvCurve, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var padL = 28, padB = 22, max = equivalenceVolume() * 2;
    function X(v) { return padL + (v / max) * (w - padL - 8); }
    function Y(p) { return (h - padB) - (p / 14) * (h - padB - 10); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, 8); ctx.lineTo(padL, h - padB); ctx.lineTo(w - 6, h - padB); ctx.stroke();

    /* the indicator's own range, drawn as a band so you can see whether it
       overlaps the steep part or misses it */
    var i2 = ind();
    ctx.fillStyle = "rgba(140,47,69,0.13)";
    ctx.fillRect(padL, Y(i2.hi), w - padL - 8, Y(i2.lo) - Y(i2.hi));

    if (tier.extras) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = SAGE; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(equivalenceVolume()), 8); ctx.lineTo(X(equivalenceVolume()), h - padB);
      ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.beginPath();
    for (var i = 0; i < curve.length; i++) {
      var xx = X(curve[i].v), yy = Y(curve[i].pH);
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.beginPath(); ctx.arc(X(Vb), Y(pHat(Vb)), 4, 0, Math.PI * 2);
    ctx.fillStyle = CORR; ctx.fill();

    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("pH", 4, 14);
    ctx.fillText("cm3 added", w - 58, h - 6);
  }

  function drawFlask() {
    var f = Sim.fitCanvas(cvFlask, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, top = h * 0.34, bot = h * 0.9, halfTop = w * 0.07, halfBot = w * 0.27;

    ctx.strokeStyle = SOFT; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - halfTop, h * 0.1); ctx.lineTo(cx - halfTop, top);
    ctx.lineTo(cx - halfBot, bot); ctx.lineTo(cx + halfBot, bot);
    ctx.lineTo(cx + halfTop, top); ctx.lineTo(cx + halfTop, h * 0.1);
    ctx.stroke();

    var frac = colourFraction(), i2 = ind();
    var fill = i2.name === "phenolphthalein"
      ? "rgba(190,60,120," + (frac * 0.72).toFixed(2) + ")"
      : i2.name === "methyl orange"
        ? "rgba(200,120,30," + (0.25 + frac * 0.5).toFixed(2) + ")"
        : "rgba(60,110,180," + (0.2 + frac * 0.55).toFixed(2) + ")";
    ctx.beginPath();
    ctx.moveTo(cx - halfBot + 2, bot - 2); ctx.lineTo(cx + halfBot - 2, bot - 2);
    ctx.lineTo(cx + halfTop * 1.6, top + 12); ctx.lineTo(cx - halfTop * 1.6, top + 12);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();

    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(frac < 0.02 ? i2.from : frac > 0.98 ? i2.to : "turning", 8, h - 6);
  }

  function draw() { if (cvCurve) drawCurve(); if (cvFlask) drawFlask(); }

  var api = {
    start: function () { rebuild(); readout(); draw(); },
    update: function () { draw(); },
    quality: function (t) { tier = t; rebuild(); draw(); },
    still: function () { Vb = equivalenceVolume(); rebuild(); readout(); draw(); },
    serialize: function () {
      return (!weak && indicator === "phenolphthalein") ? "" : (weak ? "w" : "s") + "," + indicator;
    }
  };

  host.querySelectorAll("[data-acid]").forEach(function (b) {
    b.addEventListener("click", function () {
      weak = b.getAttribute("data-acid") === "weak";
      host.querySelectorAll("[data-acid]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      Vb = 0; rebuild(); readout(); draw(); Sim.writeUrl();
    });
  });
  host.querySelectorAll("[data-ind]").forEach(function (b) {
    b.addEventListener("click", function () {
      indicator = b.getAttribute("data-ind");
      host.querySelectorAll("[data-ind]").forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === b));
      });
      readout(); draw(); Sim.writeUrl();
    });
  });
  /* ---- sound, and only where it says something --------------------------
     The drop is a recording. The endpoint tone is synthesised, because it
     has to go sour by exactly the amount you overshot by, and no recording
     can do that. Colour turning is the signal a student actually reads, so
     the tone fires when the indicator is half turned, not at equivalence. */
  var wasTurned = false;
  function listen() {
    if (!window.Snd || !Snd.enabled()) { wasTurned = colourFraction() >= 0.5; return; }
    var turned = colourFraction() >= 0.5;
    if (turned && !wasTurned) {
      /* The same number the readout calls ERROR: how far the colour turning
         is from where the reaction actually finished. Sour in either
         direction, because the expensive mistake in this lab is methyl
         orange on a weak acid, and that one turns far too EARLY. A tone that
         only went sour on an overshoot would stay sweet through the worst
         reading on the page. */
      var ve = equivalenceVolume();
      var err = Math.abs(endpointVolume() - ve) / ve;
      if (err > 0.01) {
        Snd.tone({ f: 392, dur: 0.9, gain: 0.16, sour: Math.min(0.03 + err * 0.5, 0.22) });
      } else {
        Snd.tone({ f: 392, dur: 0.7, gain: 0.17 });
        Snd.tone({ f: 588, dur: 0.5, gain: 0.07 });
      }
    }
    wasTurned = turned;
  }

  var vIn = host.querySelector("[data-vb]");
  if (vIn) {
    vIn.max = String(equivalenceVolume() * 2);
    vIn.addEventListener("input", function () {
      Vb = parseFloat(vIn.value); readout(); draw();
      if (window.Snd) Snd.tick();
      listen();
    });
    Sim.stepper(vIn, { label: "volume added" });
  }
  var drop = host.querySelector('[data-act="drop"]');
  if (drop) drop.addEventListener("click", function () {
    Vb = Math.min(Vb + 0.05, equivalenceVolume() * 2);
    if (vIn) vIn.value = String(Vb);
    readout(); draw();
    if (window.Snd) Snd.sample("drop", { gain: 0.4, gap: 90 });
    listen();
  });
  var rinse = host.querySelector('[data-act="rinse"]');
  if (rinse) rinse.addEventListener("click", function () {
    Vb = 0; if (vIn) vIn.value = "0"; readout(); draw();
    wasTurned = false;
  });

  var p = new URLSearchParams(location.search);
  if (p.has("titration")) {
    var parts = String(p.get("titration")).split(",");
    weak = parts[0] === "w";
    if (INDICATORS[parts[1]]) indicator = parts[1];
  }

  Sim.onDepth(function (d) { host.setAttribute("data-depth-view", d); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "titration",
    "// Strong acid against strong base. Just what is left over.\n" +
    "if (molB < molA) pH = -log10((molA - molB) / V);\n" +
    "if (molB > molA) pH = 14 + log10((molB - molA) / V);\n" +
    "\n" +
    "// Weak acid. The buffer region is Henderson-Hasselbalch,\n" +
    "// and at the equivalence point the salt itself is basic,\n" +
    "// which is why it lands above pH 7 and not on it.\n" +
    "pH_start = 0.5 * (pKa - log10(Ca));\n" +
    "pH_buffer = pKa + log10(molB / (molA - molB));\n" +
    "pH_equiv  = 14 - 0.5 * ((14 - pKa) - log10(cSalt));",
    [
      "Activities are taken as concentrations, which is the usual school and undergraduate treatment and is good to about a tenth of a pH unit at these concentrations.",
      "The weak acid is monoprotic with pKa 4.76, which is ethanoic acid. A polyprotic acid has a step for each proton and this does not show that.",
      "Water autoionisation is folded in through Kw rather than solved simultaneously, so the very dilute extremes at the far ends of the curve are approximate.",
      "The endpoint is taken as the volume where the indicator is half turned. A real eye judges first permanent colour, which lands slightly differently and differs between people.",
      "Temperature is 25 degrees throughout, which is what fixes Kw at 1e-14 and the pKa at its quoted value."
    ]
  );

  Sim.register("titration", host, api);
})();
