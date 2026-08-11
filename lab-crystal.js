/* =========================================================================
   lab-crystal.js · Entry 01, growth under a gravity you can turn down

   The old version showed two fixed panels, 1 g beside 0 g, and asserted the
   difference. This one lets you move gravity continuously and watch the
   reason appear, which is the depletion zone.

   Four views, all driven by the same state:
     the crystal        what you would see
     concentration      the depleted shell around it
     flow               convection, which is what removes that shell
     growth rate        dR/dt against time, where self limiting becomes visible

   THE MODEL, and what is real in it

   Mass transfer to a growing sphere. Steady state diffusion gives
   dR/dt = D (C_inf - C_s) / (rho R). Convection is folded in with the
   Ranz-Marshall style correlation Sh = 1 + 0.5 sqrt(Pe), so Sh -> 1 as flow
   stops and diffusion is all that is left. Peclet is Pe = uR/D with the
   buoyancy velocity taken proportional to g, which is the Stokes regime.

   That much is standard and defensible. What is NOT computed from first
   principles is the defect density. Faster and more convective growth really
   does trap more disorder, but putting a number on it here would be invention,
   so it is carried as an explicitly illustrative proxy, monotonic in growth
   rate and in flow unsteadiness. It is labelled as such in the maths view and
   in the code panel, and the diffraction simulation that receives it says so
   again. The crystal SIZE it hands over is computed. The STRAIN is not.
   ========================================================================= */

(function () {
  "use strict";
  if (!window.Sim) return;

  var host = document.querySelector('[data-lab="crystal"]');
  if (!host) return;
  var figure = host.closest("figure") || host.parentNode;

  /* ---- physical constants, in units that keep the numbers readable ------ */
  var D = 1.0e-9;        // m^2/s, solute diffusivity in water, typical
  var C_INF = 1.0;       // normalised bulk supersaturation
  var C_EQ = 0.0;        // normalised equilibrium concentration at the face
  var K_GROW = 4.2e-6;   // m/s scale, lumps density and molar volume together
  var U_1G = 1.2e-3;     // m/s, buoyancy driven velocity at full gravity
  var R0 = 12e-6;        // m, seed radius
  var R_MAX = 260e-6;    // m, where we stop

  /* ---- state ----------------------------------------------------------- */
  var g = 1.0;           // fraction of Earth gravity
  var R = R0;
  var t = 0;
  var rate = 0;
  var hist = [];         // {t, rate}
  var seeds = 1;         // set by the nucleation simulation when it runs
  var strainProxy = 0;
  var tier = { agents: 1, extras: true, res: null };
  var running = true;
  var shimmerAcc = 0;       // paces the growth sound off the computed rate
  var wasAbovePe = true;    // for the Peclet threshold, which is the answer
  var shellMarked = false;  // the shell reaching twice the seed radius
  var lastAnnouncedPe = true;

  /* Marks are announced and never sounded here. The notebook page hears
     exactly what it always heard; the instrument frame subscribes to these
     and decides what they look like and what they sound like there. Nothing
     below computes a new quantity, it only says when an existing one has
     crossed something worth noticing. */
  var SHELL_MARK = 2 * R0;  // 24 um, twice the seed

  function mark(kind, extra) {
    if (!window.Sim || !Sim.publish) return;
    var d = { kind: kind, at: Date.now(), g: g, peclet: Pe(),
              radius_um: R * 1e6, shell_um: shell() * 1e6 };
    if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
    Sim.publish("crystal:mark", d);
  }

  function u()  { return U_1G * g; }
  function Pe() { return u() * R / D; }
  function Sh() { return 1 + 0.5 * Math.sqrt(Math.max(Pe(), 0)); }

  /* Growth of one sphere fed by diffusion, enhanced by whatever flow exists. */
  function dRdt() {
    return K_GROW * D * (C_INF - C_EQ) * Sh() / R * 1e6;
  }

  /* Thickness of the depleted shell. Pure diffusion puts it at about R.
     Flow thins it by the Sherwood number, which is the whole point. */
  function shell() { return R / Sh(); }

  function reset() {
    R = R0; t = 0; hist.length = 0; strainProxy = 0; running = true;
    shellMarked = false;
  }

  /* ---- DOM ------------------------------------------------------------- */
  var views = {
    crystal: host.querySelector('[data-view="crystal"]'),
    conc:    host.querySelector('[data-view="conc"]'),
    flow:    host.querySelector('[data-view="flow"]'),
    rate:    host.querySelector('[data-view="rate"]')
  };
  var slider = host.querySelector('[data-g]');
  var out = {
    g:     host.querySelector('[data-out="g"]'),
    pe:    host.querySelector('[data-out="pe"]'),
    sh:    host.querySelector('[data-out="sh"]'),
    r:     host.querySelector('[data-out="r"]'),
    rate:  host.querySelector('[data-out="rate"]'),
    shell: host.querySelector('[data-out="shell"]'),
    verdict: host.querySelector('[data-out="verdict"]')
  };

  function fmt(x, dp) { return (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp); }

  function readout() {
    var pe = Pe();
    if (out.g)  out.g.textContent  = g < 0.001 ? "≈0" : fmt(g, 3);
    if (out.pe) out.pe.textContent = pe < 0.01 ? fmt(pe, 3) : fmt(pe, 2);
    if (out.sh) out.sh.textContent = fmt(Sh(), 2);
    if (out.r)  out.r.textContent  = fmt(R * 1e6, 1);
    if (out.rate) out.rate.textContent = fmt(dRdt() * 1e6, 2);
    if (out.shell) out.shell.textContent = fmt(shell() * 1e6, 1);
    if (out.verdict) {
      out.verdict.textContent = pe > 1
        ? "Flow is winning. Fresh solution keeps arriving, so growth stays fast and the shell never builds."
        : "Diffusion is winning. The shell has built up, growth is slowing itself down, and the crystal comes out even.";
      out.verdict.classList.toggle("is-diffusive", pe <= 1);
    }
  }

  /* ---- drawing --------------------------------------------------------- */
  /* One simulation, two frames. On the notebook page these are the notebook's
     own six colours and nothing has moved. Inside the instrument frame the
     host sets six custom properties instead and the same drawing code puts
     luminous data on a dark surface. The defaults below are the notebook
     values exactly, so a page that sets nothing renders as it always did. */
  var PALETTE = {
    paper: [250, 246, 239], ink:  [51, 46, 92], sage: [51, 84, 59],
    corr:  [140, 47, 69],   rule: [197, 199, 220], soft: [97, 90, 110]
  };

  function readPalette() {
    if (!window.getComputedStyle) return;
    var cs = getComputedStyle(host);
    Object.keys(PALETTE).forEach(function (k) {
      var v = cs.getPropertyValue("--lab-" + k);
      if (!v) return;
      var m = v.trim().match(/^(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)$/);
      if (m) PALETTE[k] = [+m[1], +m[2], +m[3]];
    });
  }

  function rgb(k)          { return "rgb(" + PALETTE[k].join(",") + ")"; }
  function rgba(k, a)      { return "rgba(" + PALETTE[k].join(",") + "," + a + ")"; }

  var PAPER, INK, SAGE, CORR, RULE, SOFT;
  function bindPalette() {
    readPalette();
    PAPER = rgb("paper"); INK = rgb("ink"); SAGE = rgb("sage");
    CORR = rgb("corr");   RULE = rgb("rule"); SOFT = rgb("soft");
  }
  bindPalette();

  function px(v, w) { return (v / R_MAX) * (w * 0.42); }

  function drawCrystal(c) {
    var f = Sim.fitCanvas(c, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2, r = px(R, w);

    /* Unsteady flow chops the face into facets that do not match. That is the
       visible face of the defect proxy, and it is drawn, not measured. */
    var rough = Math.min(strainProxy * 2.6, 0.42);
    var n = Math.max(6, Math.round(18 * (tier.agents || 1)));
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2;
      var wob = 1 + rough * Math.sin(a * 5 + i * 0.7) * 0.5 + rough * Math.sin(a * 9) * 0.3;
      var xx = cx + Math.cos(a) * r * wob, yy = cy + Math.sin(a) * r * wob;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
    ctx.fillStyle = Pe() > 1 ? rgba("corr", 0.16) : rgba("sage", 0.16);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = Pe() > 1 ? CORR : SAGE;
    ctx.stroke();

    if (seeds > 1) {
      ctx.fillStyle = SOFT;
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(seeds + " nuclei sharing the solution", 8, h - 8);
    }
  }

  function drawConc(c) {
    var f = Sim.fitCanvas(c, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2, r = px(R, w), sh = px(shell(), w);

    /* Concentration rises from the face out to the bulk across the shell.
       Drawn as rings rather than a per pixel field so it stays inside budget
       on a weak device. */
    var rings = Math.max(8, Math.round(26 * (tier.agents || 1)));
    for (var i = rings; i >= 1; i--) {
      var frac = i / rings;
      var rr = r + sh * frac * 2.2;
      var conc = 1 - Math.exp(-frac * 2.4);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fillStyle = rgba("ink", (0.05 + conc * 0.13).toFixed(3));
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = PAPER; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();

    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, r + sh, 0, Math.PI * 2);
    ctx.strokeStyle = Pe() > 1 ? CORR : SAGE; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("depleted shell " + fmt(shell() * 1e6, 1) + " um", 8, 14);
  }

  var flowPhase = 0;
  function drawFlow(c) {
    var f = Sim.fitCanvas(c, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2, r = px(R, w);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba("ink", 0.08); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();

    if (!tier.extras && g < 0.2) { label(ctx, w, h, "almost no flow"); return; }

    var strength = Math.min(g, 1);
    var count = Math.max(4, Math.round(22 * strength * (tier.agents || 1)));
    if (count < 1 || strength < 0.004) { label(ctx, w, h, "no convection to speak of"); return; }

    ctx.strokeStyle = rgba("corr", (0.25 + strength * 0.5).toFixed(2));
    ctx.lineWidth = 1.1;
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + flowPhase * 0.6;
      var rr = r + 10 + ((i * 37 + flowPhase * 60 * strength) % (w * 0.34));
      var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.72;
      var len = 6 + strength * 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.sin(a) * len, y + Math.cos(a) * len * 0.7);
      ctx.stroke();
    }
    label(ctx, w, h, "u ≈ " + fmt(u() * 1e3, 2) + " mm/s");
  }

  function label(ctx, w, h, s) {
    ctx.fillStyle = SOFT; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(s, 8, h - 8);
  }

  function drawRate(c) {
    var f = Sim.fitCanvas(c, tier.res), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var pad = 26;
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, 6); ctx.lineTo(pad, h - pad); ctx.lineTo(w - 6, h - pad);
    ctx.stroke();
    ctx.fillStyle = SOFT; ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("dR/dt", 4, 12);
    ctx.fillText("time", w - 30, h - 8);

    if (hist.length < 2) return;
    var maxR = 0, i;
    for (i = 0; i < hist.length; i++) if (hist[i].rate > maxR) maxR = hist[i].rate;
    if (maxR <= 0) return;
    var tMax = hist[hist.length - 1].t || 1;
    ctx.beginPath();
    for (i = 0; i < hist.length; i++) {
      var x = pad + (hist[i].t / tMax) * (w - pad - 8);
      var y = (h - pad) - (hist[i].rate / maxR) * (h - pad - 10);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = Pe() > 1 ? CORR : SAGE; ctx.lineWidth = 1.8; ctx.stroke();
  }

  function drawAll() {
    if (views.crystal) drawCrystal(views.crystal);
    if (views.conc)    drawConc(views.conc);
    if (views.flow && (tier.extras || g > 0.02)) drawFlow(views.flow);
    else if (views.flow) { var f = Sim.fitCanvas(views.flow, tier.res); f.ctx.clearRect(0, 0, f.w, f.h); }
    if (views.rate)    drawRate(views.rate);
  }

  /* ---- the simulation itself ------------------------------------------ */
  var api = {
    start: function () { reset(); readout(); drawAll(); },

    update: function (dt) {
      if (running) {
        var speed = 1400;                       // accelerated, this is minutes of real growth
        var d = dRdt() * dt * speed;
        R = Math.min(R + d, R_MAX);
        t += dt;
        rate = dRdt();

        /* Illustrative only: unsteady flow traps disorder. Monotonic in both
           growth rate and Peclet, and never presented as computed. */
        var unsteady = Math.min(Pe() / (1 + Pe()), 1);
        strainProxy = 0.9 * strainProxy + 0.1 * (unsteady * Math.min(rate * 1e6 / 3, 1));

        if (hist.length === 0 || t - hist[hist.length - 1].t > 0.05) {
          hist.push({ t: t, rate: rate });
          if (hist.length > 220) hist.shift();
        }
        /* Atoms arriving on the face. Under gravity the flow keeps feeding it
           and you hear it often. Turn gravity down, the depleted shell builds,
           the rate falls away, and it thins out to almost nothing. The sound
           carries the same story the growth curve does. */
        if (window.Snd && Snd.enabled()) {
          var s = Math.min(rate * 1e6 / 3, 1);
          shimmerAcc += dt * (0.7 + s * 9);
          /* Both the rate of arrival AND the pitch are the growth rate now,
             so a crystal slowing down in low gravity is heard falling as
             well as thinning out. The old version picked a random pitch. */
          if (shimmerAcc >= 1) { shimmerAcc = 0; Snd.shimmer(s); }

          /* Peclet passing one is the answer to the whole entry: the point
             where transport stops being dominated by flow and starts being
             dominated by diffusion. It has always been a number on screen
             and never an event. */
          var above = Pe() > 1;
          if (above !== wasAbovePe) { Snd.cross(above); wasAbovePe = above; }
        }

        /* The two marks that happen while it runs. The Peclet one is announced
           whether or not sound is on, because the instrument frame draws it. */
        var nowAbove = Pe() > 1;
        if (nowAbove !== lastAnnouncedPe) {
          lastAnnouncedPe = nowAbove;
          mark("peclet", { up: nowAbove });
        }
        if (!shellMarked && shell() >= SHELL_MARK) {
          shellMarked = true;
          mark("shell", { threshold_um: SHELL_MARK * 1e6 });
        }

        if (R >= R_MAX) { running = false; mark("complete"); handoff(); }
      }
      flowPhase += dt * (0.4 + g * 2.2);
      drawAll();
      readout();
    },

    quality: function (tr) { tier = tr; drawAll(); },

    still: function () {
      /* One representative frame plus the caption. Same artefact the reduced
         motion reader and the noscript reader get. */
      R = R_MAX * 0.72;
      hist.length = 0;
      for (var i = 0; i < 40; i++) hist.push({ t: i * 0.1, rate: dRdt() * (1 - i / 90) });
      drawAll(); readout();
    },

    serialize: function () { return g === 1 ? "" : fmt(g, 3); },

    /* The instrument frame puts a visible control on the handoff, because a
       result that only travels when a run happens to finish is a result
       nobody knows they can send. The automatic publish is unchanged. */
    resend: function () { handoff(); },

    /* Called by a frame that has set its own six colours. */
    repalette: function () { bindPalette(); drawAll(); }
  };

  function handoff() {
    /* Size is computed. Strain is a declared proxy. The receiver says so too. */
    Sim.publish("crystal:grown", {
      radius_um: R * 1e6,
      gravity: g,
      peclet: Pe(),
      strain: strainProxy,
      strainIsProxy: true
    });
    mark("handoff", { strainIsProxy: true });
  }

  /* ---- controls -------------------------------------------------------- */
  if (slider) {
    slider.addEventListener("input", function () {
      g = parseFloat(slider.value);
      reset(); readout(); drawAll();
      Sim.writeUrl();
      /* Pitch is gravity, so the sweep from 1 g down to nothing falls. */
      if (window.Snd) Snd.slide();
      wasAbovePe = Pe() > 1;
      lastAnnouncedPe = wasAbovePe;
    });
    Sim.stepper(slider, { label: "gravity" });
  }

  /* Starting a run sounds like starting one: a cork easing out. */
  var replay = host.querySelector('[data-act="replay"]');
  if (replay) replay.addEventListener("click", function () {
    reset(); drawAll(); readout();
    if (window.Snd) Snd.stopper();
  });

  /* Reading gravity back off a shared link. */
  var params = new URLSearchParams(location.search);
  if (params.has("crystal")) {
    var v = parseFloat(params.get("crystal"));
    if (isFinite(v) && v >= 0 && v <= 1) { g = v; if (slider) slider.value = String(g); }
  }

  /* Nucleation, when it has run, decides how many crystals share the solution. */
  Sim.subscribe("nucleation:survivors", function (d) {
    if (!d || !d.count) return;
    seeds = d.count;
    /* More nuclei divide the same solute, so each finishes smaller. Real, and
       it is the reason a fast quench gives you a fine grained solid. */
    R_MAX = 260e-6 / Math.pow(seeds, 1 / 3);
    reset(); drawAll(); readout();
  });

  Sim.onDepth(function (d) { host.setAttribute("data-depth-view", d); });

  Sim.buildDepthControl(figure.querySelector("[data-chrome]") || figure);
  Sim.buildCodeControl(
    figure.querySelector("[data-chrome]") || figure,
    "crystal growth",
    "// Mass transfer to a growing sphere.\n" +
    "// Pe compares transport by flow against transport by diffusion.\n" +
    "function Pe()  { return u * R / D; }          // u proportional to g\n" +
    "function Sh()  { return 1 + 0.5 * Math.sqrt(Pe()); }\n" +
    "function dRdt(){ return K * D * (C_inf - C_s) * Sh() / R; }\n" +
    "\n" +
    "// The depleted shell. Diffusion alone puts it at about R.\n" +
    "// Flow thins it by Sh, which is why convection keeps growth fast.\n" +
    "function shell(){ return R / Sh(); }",
    [
      "One spherical crystal, fed by steady state diffusion, well below the roughening transition.",
      "Buoyancy velocity taken proportional to g, which holds in the Stokes regime and not at high Rayleigh number.",
      "Sh = 1 + 0.5 sqrt(Pe) is a standard correlation, not a solution of the flow.",
      "The defect and strain figure is illustrative. It is monotonic in growth rate and in Peclet, and it is not computed from the physics.",
      "Time is accelerated by roughly 1400 times so a run takes seconds instead of hours."
    ]
  );

  Sim.register("crystal", host, api);
})();
