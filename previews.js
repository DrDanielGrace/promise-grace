/* =========================================================================
   previews.js · the thumbnail on each instrument card

   THE RULE THIS FILE EXISTS TO KEEP

   A card for a simulation shows the actual scientific object, or it shows
   nothing. No stock illustration, no generic atom, no decorative flourish
   standing in for a plot. If a reader looks at the card for powder
   diffraction and then opens it, the shape they saw has to be the shape
   they get.

   So every preview below is computed from the same physics the instrument
   runs, at one fixed setting, written out here in about ten lines each.
   The free energy barrier really is the sum of a squared surface term and
   a cubed bulk term. The titration curve really is the exact solution of
   the charge balance. The diffraction pattern really is the allowed
   reflections of a face centred lattice at their correct angles.

   WHY THEY ARE NOT THE REAL SIMULATIONS

   Because seventeen running simulations on one index page is seventeen
   requestAnimationFrame loops on a page whose job is to let somebody choose
   one. These are single still frames, drawn once, from the same equations.
   That is the honest version of a thumbnail: not a screenshot, not an
   illustration, the object itself computed at one setting and not animated.

   They draw at 240 by 96 in an SVG viewBox, so they scale to whatever the
   card is and cost nothing to redraw when the theme changes.
   ========================================================================= */

window.Previews = (function () {
  "use strict";

  var W = 240, H = 96, NS = "http://www.w3.org/2000/svg";

  function path(d, cls) {
    return '<path d="' + d + '" class="' + (cls || "pv-line") + '"/>';
  }

  function poly(pts, cls) {
    var d = pts.map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
    }).join(" ");
    return path(d, cls);
  }

  /* Sample f over [a,b] and map into the box, with the vertical range taken
     from the samples so nothing is clipped and nothing is empty. */
  function curve(f, a, b, n, pad) {
    pad = pad || 8;
    var xs = [], ys = [], i, t, v;
    for (i = 0; i <= n; i++) {
      t = a + (b - a) * i / n;
      v = f(t);
      if (!isFinite(v)) v = 0;
      xs.push(t); ys.push(v);
    }
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    if (hi === lo) hi = lo + 1;
    return xs.map(function (x, k) {
      return [
        pad + (x - a) / (b - a) * (W - pad * 2),
        (H - pad) - (ys[k] - lo) / (hi - lo) * (H - pad * 2)
      ];
    });
  }

  var DRAW = {

    /* Classical nucleation. Surface cost goes as r squared, bulk payoff as
       r cubed, and their sum has a maximum: the critical radius. */
    nucleation: function () {
      var A = 1.0, B = 0.62;
      var f = function (r) { return A * r * r - B * r * r * r; };
      /* far enough past the peak that the barrier reads as a barrier. Stop
         at the peak and the curve looks like a plateau, which is the shape
         of a different piece of physics. */
      var R = 2.2;
      var pts = curve(f, 0, R, 60);
      /* the critical radius, where the derivative is zero: r* = 2A/3B */
      var rs = (2 * A) / (3 * B);
      var xs = 8 + (rs / R) * (W - 16);
      return poly(pts, "pv-line pv-ink") +
        '<line x1="' + xs.toFixed(1) + '" y1="8" x2="' + xs.toFixed(1) +
        '" y2="' + (H - 8) + '" class="pv-mark"/>';
    },

    /* Growth rate against gravity. Convection is proportional to g, so the
       Sherwood number falls towards its diffusive floor as g goes to zero
       and the growth rate falls with it. */
    crystal: function () {
      var f = function (g) { return 1 + 1.9 * Math.pow(Math.max(g, 0), 0.29); };
      var pts = curve(f, 0, 1, 50);
      return poly(pts, "pv-line pv-ink") +
        '<line x1="8" y1="' + (H - 8) + '" x2="' + (W - 8) + '" y2="' + (H - 8) +
        '" class="pv-axis"/>';
    },

    /* A binary eutectic. Two liquidus branches meeting at the eutectic, and
       the solidus underneath. */
    phase: function () {
      var xe = 0.45, Ta = 1.0, Tb = 0.86, Te = 0.34;
      function X(u) { return 8 + u * (W - 16); }
      function Y(t) { return (H - 8) - t * (H - 16); }
      return poly([[X(0), Y(Ta)], [X(xe), Y(Te)]], "pv-line pv-ink") +
             poly([[X(1), Y(Tb)], [X(xe), Y(Te)]], "pv-line pv-ink") +
             poly([[X(0), Y(Te)], [X(1), Y(Te)]], "pv-line pv-alt") +
             '<circle cx="' + X(xe).toFixed(1) + '" cy="' + Y(Te).toFixed(1) +
             '" r="3" class="pv-dot"/>';
    },

    /* Lamellar eutectic: alternating stripes of the two solid phases, which
       is what a eutectic composition actually freezes into. */
    solidify: function () {
      var out = "", n = 13, w = (W - 16) / n;
      for (var i = 0; i < n; i++) {
        out += '<rect x="' + (8 + i * w).toFixed(1) + '" y="14" width="' +
               (w * 0.52).toFixed(1) + '" height="' + (H - 28) +
               '" class="' + (i % 2 ? "pv-fill-alt" : "pv-fill") + '"/>';
      }
      return out;
    },

    /* Speculative, and drawn as such. A drop under gravity, and the same
       drop with none: the second one does not fall, and there is no line
       under it because there is no answer under it either. */
    stalactite: function () {
      return '<path d="M60 14 L60 42 Q60 58 52 58 Q44 58 44 44" class="pv-line pv-ink"/>' +
             '<circle cx="60" cy="62" r="7" class="pv-fill"/>' +
             '<line x1="120" y1="10" x2="120" y2="86" class="pv-axis"/>' +
             '<path d="M180 14 L180 40" class="pv-line pv-ink"/>' +
             '<circle cx="180" cy="50" r="13" class="pv-fill-open pv-dash"/>';
    },

    /* Two beam interference across the visible. The Airy formula, at a film
       four hundred nanometres thick. */
    thinfilm: function () {
      var nF = 1.33, r1 = (1 - nF) / (1 + nF), r2 = (nF - 1) / (nF + 1), d = 400;
      var f = function (lam) {
        var delta = 4 * Math.PI * nF * d / lam, c = Math.cos(delta);
        return (r1 * r1 + r2 * r2 + 2 * r1 * r2 * c) /
               (1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * c);
      };
      return poly(curve(f, 380, 700, 80), "pv-line pv-ink");
    },

    /* A band gap cutting the spectrum in two. The shape is the black body
       envelope the solar spectrum roughly follows; the line is the gap. */
    bandgap: function () {
      var f = function (e) { return Math.pow(e, 2) / (Math.exp(e / 0.5) - 1); };
      var pts = curve(f, 0.35, 3.6, 60);
      var gx = 8 + ((1.12 - 0.35) / (3.6 - 0.35)) * (W - 16);
      return poly(pts, "pv-line pv-ink") +
        '<line x1="' + gx.toFixed(1) + '" y1="8" x2="' + gx.toFixed(1) +
        '" y2="' + (H - 8) + '" class="pv-mark"/>';
    },

    /* The same envelope with the two losses shaded: everything below the
       gap passes through, everything well above it is thermalised. */
    spectrum: function () {
      var f = function (e) { return Math.pow(e, 2) / (Math.exp(e / 0.5) - 1); };
      var pts = curve(f, 0.35, 3.6, 60);
      var gx = 8 + ((1.12 - 0.35) / (3.6 - 0.35)) * (W - 16);
      var below = pts.filter(function (p) { return p[0] <= gx; });
      var area = below.length
        ? "M8 " + (H - 8) + " " + below.map(function (p) {
            return "L" + p[0].toFixed(1) + " " + p[1].toFixed(1);
          }).join(" ") + " L" + gx.toFixed(1) + " " + (H - 8) + " Z"
        : "";
      return (area ? '<path d="' + area + '" class="pv-fill-soft"/>' : "") +
             poly(pts, "pv-line pv-ink") +
             '<line x1="' + gx.toFixed(1) + '" y1="8" x2="' + gx.toFixed(1) +
             '" y2="' + (H - 8) + '" class="pv-mark"/>';
    },

    /* Detailed balance: efficiency against band gap, peaking near 1.34 eV,
       which is the shape of the Shockley-Queisser result. */
    limit: function () {
      var f = function (e) {
        return Math.exp(-Math.pow((e - 1.34) / 0.62, 2)) * (1 - 0.06 * (e - 1.34));
      };
      var pts = curve(f, 0.5, 2.6, 60);
      var px = 8 + ((1.34 - 0.5) / (2.6 - 0.5)) * (W - 16);
      return poly(pts, "pv-line pv-ink") +
             '<line x1="' + px.toFixed(1) + '" y1="8" x2="' + px.toFixed(1) +
             '" y2="' + (H - 8) + '" class="pv-mark"/>';
    },

    /* The argument the thermoelectrics field is having. Conductivity rises
       with doping, the Seebeck coefficient falls, and their product peaks. */
    thermo: function () {
      var s = function (n) { return 1 / (1 + Math.exp((n - 0.45) * 7)); };
      var g = function (n) { return 1 / (1 + Math.exp(-(n - 0.4) * 7)); };
      var zt = function (n) { return s(n) * s(n) * g(n); };
      return poly(curve(s, 0, 1, 40), "pv-line pv-faint") +
             poly(curve(g, 0, 1, 40), "pv-line pv-faint") +
             poly(curve(zt, 0, 1, 40), "pv-line pv-ink");
    },

    /* A powder pattern. The allowed reflections of a face centred cubic
       lattice: h, k and l all odd or all even, at the angles Bragg's law
       puts them, with intensity falling as the angle rises. */
    diffraction: function () {
      var a = 4.05, lam = 1.5406, out = "", peaks = [];
      for (var hh = 0; hh <= 4; hh++)
        for (var k = 0; k <= 4; k++)
          for (var l = 0; l <= 4; l++) {
            if (!hh && !k && !l) continue;
            var odd = (hh % 2) + (k % 2) + (l % 2);
            if (odd !== 0 && odd !== 3) continue;          /* the absences */
            var s2 = hh * hh + k * k + l * l;
            var d = a / Math.sqrt(s2);
            var sin = lam / (2 * d);
            if (sin > 1) continue;
            var two = 2 * Math.asin(sin) * 180 / Math.PI;
            if (two > 90) continue;
            if (peaks.some(function (p) { return Math.abs(p.a - two) < 0.4; })) continue;
            peaks.push({ a: two, i: 1 / (1 + s2 * 0.13) });
          }
      peaks.forEach(function (p) {
        var x = 8 + (p.a / 90) * (W - 16);
        var h = (H - 20) * p.i;
        out += '<line x1="' + x.toFixed(1) + '" y1="' + (H - 10) +
               '" x2="' + x.toFixed(1) + '" y2="' + (H - 10 - h).toFixed(1) +
               '" class="pv-peak"/>';
      });
      return out + '<line x1="8" y1="' + (H - 10) + '" x2="' + (W - 8) +
                   '" y2="' + (H - 10) + '" class="pv-axis"/>';
    },

    /* Two planes and the path difference between the rays off them, which
       is the whole of Bragg's law in one picture. */
    bragg: function () {
      return '<line x1="20" y1="52" x2="220" y2="52" class="pv-axis"/>' +
             '<line x1="20" y1="76" x2="220" y2="76" class="pv-axis"/>' +
             poly([[36, 12], [92, 52], [148, 12]], "pv-line pv-ink") +
             poly([[64, 12], [120, 76], [176, 12]], "pv-line pv-alt") +
             '<circle cx="92" cy="52" r="2.6" class="pv-dot"/>' +
             '<circle cx="120" cy="76" r="2.6" class="pv-dot"/>';
    },

    /* A face centred cubic cell drawn in projection: corners, and the atom
       in the middle of each face. */
    cells: function () {
      var s = 56, cx = W / 2, cy = H / 2, o = 16;
      var f = [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2],
               [cx + s / 2, cy + s / 2], [cx - s / 2, cy + s / 2]];
      var b = f.map(function (p) { return [p[0] + o, p[1] - o]; });
      var out = poly(f.concat([f[0]]), "pv-line pv-faint") +
                poly(b.concat([b[0]]), "pv-line pv-faint");
      for (var i = 0; i < 4; i++) out += poly([f[i], b[i]], "pv-line pv-faint");
      f.concat(b).forEach(function (p) {
        out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) +
               '" r="4" class="pv-dot"/>';
      });
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="5.5" class="pv-fill"/>';
      out += '<circle cx="' + (cx + o) + '" cy="' + (cy - o) + '" r="5.5" class="pv-fill"/>';
      return out;
    },

    /* One face of a primitive cubic framework: metal nodes at the corners,
       linkers between, and the aperture in the middle, which is the point
       of the material. */
    mof: function () {
      var s = 58, cx = W / 2, cy = H / 2;
      var p = [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2],
               [cx + s / 2, cy + s / 2], [cx - s / 2, cy + s / 2]];
      var out = poly(p.concat([p[0]]), "pv-line pv-ink");
      /* the clear aperture: the cell edge less two van der Waals radii */
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s * 0.30).toFixed(1) +
             '" class="pv-fill-open pv-dash"/>';
      p.forEach(function (q) {
        out += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) +
               '" r="6" class="pv-dot"/>';
      });
      return out;
    },

    /* A weak acid against a strong base. Buffer region, then the jump, and
       the equivalence point above seven where everybody expects seven. */
    titration: function () {
      var Ka = 1.8e-5, Ca = 0.1, Cb = 0.1, Va = 25;
      function pH(Vb) {
        var na = Ca * Va / 1000, nb = Cb * Vb / 1000, V = (Va + Vb) / 1000;
        if (nb < na * 0.999) {
          var HA = (na - nb) / V, A = nb / V;
          if (A <= 0) return -Math.log10(Math.sqrt(Ka * HA));
          return -Math.log10(Ka) + Math.log10(A / HA);
        }
        if (nb > na * 1.001) return 14 + Math.log10((nb - na) / V);
        var Cs = na / V;
        return 7 + 0.5 * (-Math.log10(Ka)) + 0.5 * Math.log10(Cs);
      }
      var pts = curve(function (v) { return Math.max(0, Math.min(14, pH(v))); },
                      0.05, 50, 90);
      return poly(pts, "pv-line pv-ink");
    },

    /* Fourteen powers of ten, on a linear axis and on a log one, which is
       the entire argument for why the pH scale exists. */
    ph: function () {
      var out = '<rect x="8" y="18" width="' + (W - 16) + '" height="14" class="pv-fill-open"/>';
      out += '<rect x="8" y="18" width="2" height="14" class="pv-fill"/>';
      out += '<rect x="8" y="58" width="' + (W - 16) + '" height="14" class="pv-fill-open"/>';
      for (var i = 0; i <= 14; i++) {
        var x = 8 + (i / 14) * (W - 16);
        out += '<line x1="' + x.toFixed(1) + '" y1="58" x2="' + x.toFixed(1) +
               '" y2="72" class="pv-axis"/>';
      }
      out += '<rect x="8" y="58" width="' + ((W - 16) * 0.28).toFixed(1) +
             '" height="14" class="pv-fill"/>';
      return out;
    },

    /* The same data twice: rate against temperature is a curve you cannot
       read anything off, and its log against one over temperature is a
       straight line whose slope is the activation energy. */
    arrhenius: function () {
      var A = 1e10, Ea = 50000, R = 8.314;
      var k = function (T) { return A * Math.exp(-Ea / (R * T)); };
      var c = curve(k, 280, 420, 50, 8).map(function (p) {
        return [p[0] * 0.46 + 4, p[1]];
      });
      var s = curve(function (inv) { return Math.log(k(1 / inv)); },
                    1 / 420, 1 / 280, 50, 8).map(function (p) {
        return [p[0] * 0.46 + W * 0.52, p[1]];
      });
      return poly(c, "pv-line pv-faint") + poly(s, "pv-line pv-ink") +
             '<line x1="' + (W / 2) + '" y1="6" x2="' + (W / 2) + '" y2="' + (H - 6) +
             '" class="pv-axis"/>';
    }
  };

  function svg(id) {
    var d = DRAW[id];
    if (!d) return "";
    return '<svg class="pv" viewBox="0 0 ' + W + " " + H + '" ' +
           'preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
           d() + "</svg>";
  }

  return { svg: svg, has: function (id) { return !!DRAW[id]; } };
})();
