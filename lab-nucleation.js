/* =========================================================================
   lab-nucleation.js · Entry 01, why most clusters die

   Classical nucleation theory. Most explanations draw the barrier and stop,
   which hides the only interesting thing about it: nucleation is random.
   Clusters flicker into existence and dissolve, over and over, and once in a
   while one crosses the critical radius and runs away. That is what makes it
   click, so that is what is drawn.

   WHAT IS COMPUTED

     dG(r) = 4 pi r^2 gamma - (4/3) pi r^3 dGv        the two competing terms
     dGv   = k T ln(S) / vm                           driving force per volume
     r*    = 2 gamma / dGv                            the peak of that curve
     dG*   = 16 pi gamma^3 / (3 dGv^2)                the barrier height
     J     = A exp(-dG* / kT)                         nucleation rate

   All of that is standard and follows from the two terms. Surface costs you
   energy and scales with r squared. Bulk pays you back and scales with r
   cubed. Cubes beat squares eventually, which is the whole argument.

   WHAT IS NOT COMPUTED

   The individual cluster walk. Real clusters gain and lose molecules with
   rates set by attachment kinetics I am not modelling. Here each cluster
   takes a biased random step whose drift follows the sign of the local slope
   of dG. The statistics come out right, more clusters survive as S rises,
   but any single trajectory is illustrative. It is labelled as such, and the
   survivor count it hands to the growth simulation is labelled again there.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="nucleation"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  /* ---- constants, in units chosen so the numbers read well -------------- */
  var kT = 4.11e-21;        // J at 298K
  var GAMMA = 0.045;        // J/m^2, a plausible solid liquid interfacial energy
  var VM = 3.0e-29;         // m^3 per molecule
  var A_PRE = 1e30;         // pre exponential, order of magnitude only

  var S = 3.0;              // supersaturation ratio
  var clusters = [];
  var survivors = 0, died = 0;
  var tier = { agents: 1, extras: true, res: null };
  var spawnAcc = 0;
  var listening = false;      // the sonification, off until asked for

  function dGv() { return kT * Math.log(Math.max(S, 1.0001)) / VM; }
  function rStar() { return 2 * GAMMA / dGv(); }
  function dGStar() { return (16 * Math.PI * Math.pow(GAMMA, 3)) / (3 * Math.pow(dGv(), 2)); }
  function J() { return A_PRE * Math.exp(-dGStar() / kT); }
  /* The true escape fraction goes as exp of minus the barrier in kT, which
     runs from about 1 in 40 down to 1 in 10^52 across this slider. Shown
     literally the field is either empty or saturated and the reader learns
     nothing, so the exponent is divided by four to keep the whole range
     legible. The ORDERING and the exponential SHAPE are real. The absolute
     fraction is not, and the rate J in the readout is the unscaled one. */
  function pSurvive() { return Math.exp(-(dGStar() / kT) / 4); }

  function dG(r) { return 4 * Math.PI * r * r * GAMMA - (4 / 3) * Math.PI * r * r * r * dGv(); }

  /* ---- DOM ------------------------------------------------------------- */
  var cvEnergy = host.querySelector('[data-view="energy"]');
  var cvField  = host.querySelector('[data-view="field"]');
  var slider   = host.querySelector('[data-s]');
  var out = {
    s: host.querySelector('[data-out="s"]'),
    rstar: host.querySelector('[data-out="rstar"]'),
    barrier: host.querySelector('[data-out="barrier"]'),
    rate: host.querySelector('[data-out="rate"]'),
    survived: host.querySelector('[data-out="survived"]'),
    died: host.querySelector('[data-out="died"]')
  };

  /* Box-Muller. A uniform step makes the walk look wrong at the tails. */
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  function sci(x) {
    if (!isFinite(x)) return "0";
    if (x === 0) return "0";
    var e = Math.floor(Math.log10(Math.abs(x)));
    return fmt(x / Math.pow(10, e), 1) + "e" + e;
  }

  function readout() {
    if (out.s) out.s.textContent = fmt(S, 2);
    if (out.rstar) out.rstar.textContent = fmt(rStar() * 1e9, 2);
    if (out.barrier) out.barrier.textContent = fmt(dGStar() / kT, 1);
    if (out.rate) out.rate.textContent = sci(J());
    if (out.survived) out.survived.textContent = String(survivors);
    if (out.died) out.died.textContent = String(died);
  }

  var INK = "#332E5C", SAGE = "#33543B", CORR = "#8C2F45",
      RULE = "#C5C7DC", SOFT = "#615A6E", ASIDE = "#8A5A2B";

  /* ---- the energy curve ------------------------------------------------ */
  function drawEnergy() {
    var f = Sim.fitCanvas(cvEnergy, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var pad = 30, rs = rStar();
    var rMax = Math.max(rs * 2.6, 1e-9);
    var peak = dG(rs) || 1;

    function X(r) { return pad + (r / rMax) * (w - pad - 10); }
    function Y(g) { return h / 2 - (g / (peak * 1.9)) * (h / 2 - 14); }

    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(w - 8, Y(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, 8); ctx.lineTo(pad, h - 12); ctx.stroke();

    var N = Math.max(40, Math.round(120 * (tier.agents || 1))), i, r;

    if (tier.extras) {
      /* The two terms that are fighting, drawn separately because the fight
         is the explanation. */
      ctx.strokeStyle = "rgba(140,47,69,0.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (i = 0; i <= N; i++) { r = (i / N) * rMax; var s2 = 4 * Math.PI * r * r * GAMMA;
        i ? ctx.lineTo(X(r), Y(s2)) : ctx.moveTo(X(r), Y(s2)); }
      ctx.stroke();

      ctx.strokeStyle = "rgba(51,84,59,0.55)";
      ctx.beginPath();
      for (i = 0; i <= N; i++) { r = (i / N) * rMax; var b3 = -(4 / 3) * Math.PI * r * r * r * dGv();
        i ? ctx.lineTo(X(r), Y(b3)) : ctx.moveTo(X(r), Y(b3)); }
      ctx.stroke();
    }

    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath();
    for (i = 0; i <= N; i++) { r = (i / N) * rMax; i ? ctx.lineTo(X(r), Y(dG(r))) : ctx.moveTo(X(r), Y(dG(r))); }
    ctx.stroke();

    ctx.setLineDash([3, 3]); ctx.strokeStyle = ASIDE; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X(rs), Y(dG(rs))); ctx.lineTo(X(rs), Y(0)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ASIDE; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("r*", X(rs) - 5, Y(dG(rs)) - 6);
    ctx.fillStyle = SOFT;
    ctx.fillText("radius", w - 46, Y(0) + 14);
    ctx.fillText("dG", 4, 14);
  }

  /* ---- the stochastic field -------------------------------------------- */
  function spawn() {
    var rs = rStar();
    /* Whether this one gets across is drawn from the computed barrier.
       See pSurvive() for why the exponent is compressed. */
    clusters.push({ r: rs * (0.10 + Math.random() * 0.35),
                    x: 0.08 + Math.random() * 0.84,
                    y: 0.12 + Math.random() * 0.76,
                    fated: Math.random() < pSurvive(),
                    born: 0, escaped: false });
  }

  function stepClusters(dt) {
    var rs = rStar();
    var cap = Math.round(70 * (tier.agents || 1));
    /* Spawn attempts scale with the computed rate, normalised so the field
       stays readable across the whole slider range. */
    spawnAcc += dt * (2 + 26 * Math.min(Math.log10(Math.max(J(), 1)) / 12, 1));
    while (spawnAcc >= 1) { spawnAcc -= 1; if (clusters.length < cap) spawn(); }

    for (var i = clusters.length - 1; i >= 0; i--) {
      var c = clusters[i];
      c.born += dt;
      /* Drift follows the slope of dG: uphill below r*, downhill above it.
         The random part is what makes any of it interesting. */
      /* The walk carries the cluster toward the outcome already drawn for
         it, with real noise on top so no two paths look alike. The slope of
         dG sets which way it leans. Trajectories are illustrative and say so.
         What is real is how many get across, because that is set by the
         computed barrier. */
      var slope = 8 * Math.PI * c.r * GAMMA - 4 * Math.PI * c.r * c.r * dGv();
      var slopeN = slope * rs / Math.max(dGStar(), 1e-30);
      var lean = c.fated ? 0.55 : -Math.abs(slopeN) * 0.75;
      var noise = gauss() * 0.42;
      c.r += (lean + noise) * rs * dt * 2.4;

      /* A cluster dissolving makes no sound. That is not an omission, it is
         the information: almost all of them go this way and you are meant to
         hear how rarely the counter clicks. */
      if (c.r <= rs * 0.04) { clusters.splice(i, 1); died++; continue; }
      if (c.r > rs * 2.3 && !c.escaped) {
        c.escaped = true; survivors++;
        if (listening && window.Snd && Snd.enabled()) {
          Snd.crackle(Math.min(c.r / rs / 3, 1));
          Snd.settle(c.r / rs);
        }
      }
      if (c.r > rs * 4.5) { clusters.splice(i, 1); continue; }
    }
  }

  function drawField() {
    var f = Sim.fitCanvas(cvField, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var rs = rStar();
    for (var i = 0; i < clusters.length; i++) {
      var c = clusters[i];
      var frac = c.r / rs;
      var rad = Math.max(1.2, Math.min(frac * 7, 20));
      ctx.beginPath();
      ctx.arc(c.x * w, c.y * h, rad, 0, Math.PI * 2);
      if (c.escaped) { ctx.fillStyle = "rgba(51,84,59,0.75)"; }
      else if (frac > 1) { ctx.fillStyle = "rgba(51,84,59,0.35)"; }
      else { ctx.fillStyle = "rgba(140,47,69,0.28)"; }
      ctx.fill();
    }
    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("red dissolves, green survived", 8, h - 8);
  }

  function draw() { if (cvEnergy) drawEnergy(); if (cvField) drawField(); }

  function reset() { clusters.length = 0; survivors = 0; died = 0; spawnAcc = 0; }

  var pushAcc = 0;
  var api = {
    start: function () { reset(); draw(); readout(); },
    update: function (dt) {
      stepClusters(dt);
      draw(); readout();
      pushAcc += dt;
      if (pushAcc > 1.5) {
        pushAcc = 0;
        /* Survivor count is what sets how many crystals share the solution.
           Declared as illustrative because the walk that produced it is. */
        Sim.publish("nucleation:survivors", {
          count: Math.max(1, survivors), supersaturation: S,
          rStar_nm: rStar() * 1e9, isProxy: true
        });
      }
    },
    quality: function (t) { tier = t; draw(); },
    still: function () {
      reset();
      for (var i = 0; i < 26; i++) { spawn(); }
      for (var k = 0; k < 3; k++) stepClusters(0.4);
      survivors = 2;
      draw(); readout();
    },
    serialize: function () { return S === 3 ? "" : fmt(S, 2); }
  };

  if (slider) {
    slider.addEventListener("input", function () {
      S = parseFloat(slider.value); reset(); draw(); readout(); Sim.writeUrl();
      if (window.Snd) Snd.tick();
    });
    Sim.stepper(slider, { label: "supersaturation" });
  }

  /* The sonification is its own switch, off until asked for, and the button
     turns page sound on too so nobody presses it and hears nothing. */
  var listenBtn = host.querySelector('[data-listen="nucleation"]');
  if (listenBtn) {
    listenBtn.addEventListener("click", function () {
      listening = !listening;
      if (listening && window.Snd && !Snd.enabled()) Snd.set(true);
      listenBtn.setAttribute("aria-pressed", String(listening));
      var lab = listenBtn.querySelector("[data-listen-label]");
      if (lab) lab.textContent = listening ? "Stop listening" : "Listen to it";
    });
  }
  var p = new URLSearchParams(location.search);
  if (p.has("nucleation")) {
    var v = parseFloat(p.get("nucleation"));
    if (isFinite(v) && v > 1 && v <= 12) { S = v; if (slider) slider.value = String(S); }
  }

  Sim.onDepth(function (d) { host.setAttribute("data-depth-view", d); });
  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "nucleation",
    "// Surface costs you energy and goes as r squared.\n" +
    "// Bulk pays you back and goes as r cubed. Cubes win eventually.\n" +
    "function dGv()    { return k*T*Math.log(S) / vm; }\n" +
    "function dG(r)    { return 4*Math.PI*r*r*gamma - (4/3)*Math.PI*r*r*r*dGv(); }\n" +
    "function rStar()  { return 2*gamma / dGv(); }\n" +
    "function dGStar() { return 16*Math.PI*gamma**3 / (3*dGv()**2); }\n" +
    "function J()      { return A * Math.exp(-dGStar() / (k*T)); }",
    [
      "Spherical clusters and an interfacial energy that does not depend on size, which is the classical approximation and it overestimates the barrier for very small clusters.",
      "Homogeneous nucleation only. A real vessel nucleates on its walls and on dust long before this.",
      "Interfacial energy fixed at 0.045 J/m2 and molecular volume at 3e-29 m3, both plausible rather than measured for any one substance.",
      "The pre exponential A is an order of magnitude, so the rate J is a shape against supersaturation and not an absolute number per second. The survival fraction on screen uses exp(-dG*/4kT) rather than exp(-dG*/kT), because the true exponent spans over fifty orders of magnitude across this slider and would show either an empty field or a saturated one. Ordering and shape are real, the absolute fraction is not.",
      "Individual cluster trajectories are illustrative. What is real is the fraction that survives, which is drawn from the computed barrier."
    ]
  );

  Sim.register("nucleation", host, api);
})();
