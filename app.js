/* =========================================================================
   Promise Oluwatosin Grace, portfolio

   Everything here is an enhancement. The page is fully readable with this
   file removed, so each module checks for its own elements and exits quietly
   if they are missing.

   Interactives run only while on screen, and under reduced motion they draw
   their final state once and explain what the animation would have shown.
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     EDIT ME
     Set CV_READY to false if the file at CV_PATH is ever pulled for
     revision. False turns the three Download CV links back into a short
     note offering to send it by email instead of leaving a dead link.
     --------------------------------------------------------------------- */
  var CV_READY = true;
  var CV_PATH = "assets/promise-grace-research-cv.pdf";
  /* --------------------------------------------------------------------- */

  var root = document.documentElement;
  root.classList.add("js");


  /* =====================================================================
     LEGACY ANCHORS

     The entries were numbered e01 to e12 for one day before the ids became
     subject based, so inserting an entry can never move a link again. Any
     link that went out in that window still lands in the right place.

     DELETE ME after February 2027.
     ===================================================================== */
  var LEGACY_ANCHORS = {
    e01: "question",   e02: "phase-diagrams", e03: "titration",
    e04: "the-study",  e05: "stalactite",     e06: "explaining",
    e07: "projects",   e08: "bench",          e09: "long-way-round",
    e10: "currently",  e11: "notes",          e12: "contact"
  };

  (function () {
    var old = location.hash.slice(1);
    if (!old || !Object.prototype.hasOwnProperty.call(LEGACY_ANCHORS, old)) return;
    var id = LEGACY_ANCHORS[old];

    /* The browser restores the previous scroll position after scripts run, so
       taking that over is the only way the jump survives a reload. */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    if (history.replaceState) history.replaceState(null, "", "#" + id);
    else location.hash = id;

    function land() {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView();
    }
    if (document.readyState === "complete") land();
    else window.addEventListener("load", land);
  })();

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }

  /* If an interactive throws, say so plainly in her handwriting rather than
     leaving an empty box. */
  function fallback(container, text) {
    if (!container) return;
    var p = document.createElement("p");
    p.className = "rm-note";
    p.textContent = text;
    container.appendChild(p);
  }

  function guard(name, fn) {
    try { fn(); }
    catch (err) {
      if (window.console) console.error(name, err);
    }
  }


  /* =====================================================================
     CV LINKS
     ===================================================================== */

  /* The markup links straight at the PDF, so the download works with this
     file removed. This only runs for the exception: if the CV is ever
     pulled for revision, the links become a short note offering to send it
     by email rather than a dead download. */
  guard("cv", function () {
    if (CV_READY) return;

    $$("[data-cv]").forEach(function (a) {
      a.removeAttribute("download");
      a.setAttribute("href", "#cv-note");
    });

    var note = document.createElement("p");
    note.className = "cv-note";
    note.id = "cv-note";
    note.setAttribute("tabindex", "-1");
    note.textContent = "My CV is being rewritten at the moment. Email me and I will send it "
      + "straight to you, usually the same day.";

    var outlinks = $(".outlinks");
    if (outlinks && outlinks.parentNode) {
      outlinks.parentNode.insertBefore(note, outlinks.nextSibling);
    }
  });


  /* =====================================================================
     TOP BAR
     ===================================================================== */

  guard("topbar", function () {
    var bar = $("#topbar");
    var cover = $("#cover");
    if (!bar || !cover || !("IntersectionObserver" in window)) return;

    new IntersectionObserver(function (entries) {
      bar.hidden = entries[0].isIntersecting;
    }, { rootMargin: "-70% 0px 0px 0px" }).observe(cover);
  });


  /* =====================================================================
     REVEALS AND THE PAGE TURN
     Margin notes arrive after their paragraph. Corrections arrive last.
     ===================================================================== */

  guard("reveal", function () {
    if (reduced.matches || !("IntersectionObserver" in window)) return;

    var targets = $$(".margin-note, .correction, .entry h2, .card, .project");
    targets.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });

    targets.forEach(function (el) { io.observe(el); });

    var turner = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("turning");
          turner.unobserve(e.target);
          setTimeout(function () { e.target.classList.remove("turning"); }, 460);
        }
      });
    }, { threshold: 0.06 });

    $$(".entry").forEach(function (el) { turner.observe(el); });
  });


  /* =====================================================================
     OVERLAYS, shared behaviour
     ===================================================================== */

  var lastFocus = null;

  function openOverlay(el) {
    if (!el) return;
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = "hidden";
    var target = $(".overlay-close", el);
    if (target) target.focus();
  }

  function closeOverlay(el) {
    if (!el || el.hidden) return;
    el.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  guard("overlays", function () {
    $$(".overlay").forEach(function (ov) {
      on(ov, "click", function (e) {
        if (e.target === ov || e.target.hasAttribute("data-close")) closeOverlay(ov);
      });
    });

    on(document, "keydown", function (e) {
      if (e.key !== "Escape") return;
      $$(".overlay").forEach(function (ov) { if (!ov.hidden) closeOverlay(ov); });
    });

    // Keep tab focus inside an open panel.
    on(document, "keydown", function (e) {
      if (e.key !== "Tab") return;
      var open = $$(".overlay").filter(function (o) { return !o.hidden; })[0];
      if (!open) return;
      var f = $$("a[href], button, input, [tabindex]:not([tabindex='-1'])", open)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    $$("[data-hurry]").forEach(function (b) {
      on(b, "click", function () { openOverlay($("#hurry")); });
    });
  });


  /* =====================================================================
     LIGHTBOX
     ===================================================================== */

  guard("lightbox", function () {
    var box = $("#lightbox");
    var img = $("#lightbox-img");
    var cap = $("#lightbox-cap");
    if (!box || !img) return;

    $$(".scan-btn").forEach(function (btn) {
      on(btn, "click", function () {
        var name = btn.getAttribute("data-scan");
        var thumb = $("img", btn);
        var figcap = btn.parentNode.querySelector("figcaption");
        img.src = "assets/scans/" + name + ".jpg";
        img.alt = thumb ? thumb.alt : "";
        if (cap) cap.textContent = figcap ? figcap.textContent : "";
        openOverlay(box);
      });
    });

    on(img, "error", function () {
      img.removeAttribute("src");
      if (cap) cap.textContent = img.alt || "This page could not be loaded.";
    });
  });


  /* =====================================================================
     COPY EMAIL
     ===================================================================== */

  guard("copy", function () {
    var btn = $("[data-copy]");
    var out = $("[data-out='copy']");
    if (!btn) return;

    on(btn, "click", function () {
      var value = btn.getAttribute("data-copy");
      var done = function () { if (out) out.textContent = "Copied. I will look out for your message."; };
      var failed = function () { if (out) out.textContent = "That did not copy. The address is " + value; };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, failed);
      } else {
        failed();
      }
    });
  });


  /* =====================================================================
     SIGNUP

     Posts to FormSubmit over fetch. A native form POST would redirect the
     visitor away from the page, which is why this is XHR rather than a
     plain action attribute.

     One thing to know about the first run: FormSubmit sends Promise a
     one-time activation email the very first time this endpoint receives
     anything, and nothing is forwarded until she clicks the link in it.
     She submits her own address once before launch so that no real visitor
     is the one who triggers it.

     If the request fails for any reason, the mailto path takes over, so
     the address still reaches her.
     ===================================================================== */

  var SIGNUP_ENDPOINT = "https://formsubmit.co/ajax/promisetosingrace@gmail.com";

  guard("signup", function () {
    var form = $("[data-signup]");
    if (!form) return;
    var input = $("#email", form);
    var honey = $("input[name='_honey']", form);
    var button = $("button[type='submit']", form);
    var out = $("[data-out='msg']", form);
    var sending = false;

    function say(text, bad) {
      if (!out) return;
      out.textContent = text;
      out.classList.toggle("bad", !!bad);
    }

    function mailtoFallback(value) {
      var subject = encodeURIComponent("Notes please");
      var body = encodeURIComponent(
        "Hi Promise,\n\nPlease add me to your notes.\n\n" + value + "\n"
      );
      say("That did not go through, so your mail app should be opening instead with a short message already written. Send it and I will add you. If nothing happened, write to me at promisetosingrace@gmail.com.");
      window.location.href = "mailto:promisetosingrace@gmail.com?subject=" + subject + "&body=" + body;
    }

    on(form, "submit", function (e) {
      e.preventDefault();
      if (sending) return;

      var value = (input.value || "").trim();

      if (!value) {
        say("I need an address to send them to.", true);
        input.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        say("That does not look like an email address. Check it and try again.", true);
        input.focus();
        return;
      }

      if (!window.fetch) { mailtoFallback(value); return; }

      sending = true;
      if (button) button.disabled = true;
      say("One moment.");

      fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: value,
          _subject: "Notes signup from the site",
          _captcha: "false",
          _template: "table",
          _honey: honey ? honey.value : ""
        })
      })
        .then(function (r) {
          return r.json().then(function (data) { return { ok: r.ok, data: data }; });
        })
        .then(function (res) {
          if (!res.ok || String(res.data.success) !== "true") {
            throw new Error("submission was not accepted");
          }
          form.reset();
          say("Got it, thank you. I will add you to the list, and the next set goes out when I have finished the papers I am on.");
        })
        .catch(function () {
          mailtoFallback(value);
        })
        .then(function () {
          sending = false;
          if (button) button.disabled = false;
        });
    });
  });


  /* =====================================================================
     STUDY WALKTHROUGH
     ===================================================================== */

  guard("study", function () {
    var wrap = $("[data-lab='study']");
    if (!wrap) return;
    var out = $("[data-out='reply']", wrap);
    var buttons = $$("[data-choice]", wrap);

    var replies = {
      interviews:
        ["Interviews would have told me why, in their own words, and I would have learned things I did not know to ask about.",
         "The cost is reach. Thirty interviews is a good week of work, and thirty students cannot tell you what a whole faculty does.",
         "I chose a survey. It was the only method that reached enough students to say something about the population, and I could run it alongside a full teaching load. What I gave up is that I collected what people report about themselves, not what they do."],
      survey:
        ["That is what I chose, and for the reason you probably picked it. It reaches enough people to say something about the population, and one person can run it.",
         "The cost is that a survey collects what people believe about themselves, filtered through what they think a researcher wants to hear. I recorded those answers as behaviour. They are not behaviour.",
         "If I ran it again I would keep the survey and pair it with something I could actually observe."],
      observation:
        ["An observational study would have shown me what students did rather than what they said they did, which is the honest version of the question.",
         "It needs access to their devices or their network, and I had neither. There is also a consent problem I did not have the standing to solve as an undergraduate.",
         "I chose a survey instead. It reached 1,000 students, and I accepted self reporting as the price. That trade is the main thing I would revisit."]
    };

    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", "false");
      on(btn, "click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        var lines = replies[btn.getAttribute("data-choice")] || [];
        out.innerHTML = "";
        lines.forEach(function (line) {
          var p = document.createElement("p");
          p.textContent = line;
          out.appendChild(p);
        });
        Sim.writeUrl();
      });
    });

    /* The maths view here is the arithmetic of the sample, computed rather
       than quoted, because it is the part people wave at instead of
       checking. The margin shrinks with n. The bias underneath it does not,
       and saying both in the same panel is the point. */
    (function () {
      var n = 1000;
      var moe = 1.96 * Math.sqrt(0.25 / n) * 100;
      var nOut = $("[data-out='study-n']", wrap.parentNode);
      var mOut = $("[data-out='study-moe']", wrap.parentNode);
      var bOut = $("[data-out='study-bias']", wrap.parentNode);
      if (nOut) nOut.textContent = String(n);
      if (mOut) mOut.textContent = "plus or minus " + moe.toFixed(1) + " points";
      if (bOut) bOut.textContent = "self report, which does not shrink with n";
    })();

    var studyChrome = wrap.parentNode.querySelector("[data-chrome]");
    if (studyChrome) {
      Sim.buildDepthControl(studyChrome);
      Sim.buildCodeControl(
        studyChrome,
        "study",
        "// This one has no physics in it. It is a walk through a study I ran,\n" +
        "// and the only computed thing on the page is the arithmetic of the\n" +
        "// sample itself, which is worth writing down because it is the part\n" +
        "// people wave at rather than check.\n\n" +
        "n            = 1000;          // students who answered\n" +
        "population   = 'undergraduate and postgraduate, STEM, one university';\n\n" +
        "// The margin of error a sample of this size buys you, at 95 percent,\n" +
        "// for a proportion near a half, which is the worst case:\n" +
        "margin = 1.96 * Math.sqrt(0.25 / n);      // about 3.1 percentage points\n\n" +
        "// What that number does NOT cover is the thing that actually went\n" +
        "// wrong. Sampling error shrinks with n. Self report bias does not\n" +
        "// shrink with n, and a thousand people can be consistently wrong\n" +
        "// about themselves in the same direction all day.",
        [
          "Everything reported here is what students said about their own behaviour. It was written up as behaviour. That is the flaw, and it is the reason this entry exists.",
          "The plus or minus three points is sampling error only. It assumes the thousand were drawn at random from the population they are meant to represent, and they were not: they were the students who chose to answer.",
          "One university, one country, one moment. Nothing here generalises further than that and the original write up should have said so.",
          "The three method replies are my own account of a decision I made at the time, not a citation. Somebody who does survey methodology properly would put it better.",
          "No data from the study is plotted on this page. The walkthrough is the argument, and the thesis itself is linked so you can read what I actually claimed."
        ]
      );
    }
    Sim.state("study", function () {
      var on = buttons.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0];
      return on ? on.getAttribute("data-choice") : "";
    });
    (function () {
      var q = new URLSearchParams(location.search).get("study");
      if (!q) return;
      var b = buttons.filter(function (x) { return x.getAttribute("data-choice") === q; })[0];
      if (b) b.click();
    })();
  });


  /* =====================================================================
     CANVAS HELPERS
     ===================================================================== */

  var INK = "#332E5C", CORR = "#8C2F45", SAGE = "#33543B",
      PAPER = "#FAF6EF", DEEP = "#F1EBE0", RULE = "#C5C7DC",
      ASIDE = "#8A5A2B", BUTTER = "#E9C978";

  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.width, h = canvas.height;
    if (canvas._fitted === dpr) return canvas.getContext("2d");
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.aspectRatio = w + " / " + h;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas._logical = { w: w, h: h };
    canvas._fitted = dpr;
    return ctx;
  }

  /* Runs a draw loop for the two labs not yet rewritten on the engine.

     These already paused when off screen, so they were never the ten-live-
     canvases problem. What they did do is own independent loops, so two of
     them could run at the same time, and the guarantee the engine exists to
     give is that exactly one does.

     So this now hands the step function to the scheduler in sim.js instead
     of holding its own requestAnimationFrame. Same API for the callers, and
     the one-at-a-time rule becomes structural here too rather than merely
     observed. The old path is kept for the case where sim.js is absent, so
     the page still degrades rather than breaking. */
  function ticker(container, step, onStop) {
    var raf = null, running = false, t = 0;

    function frame() {
      if (!running) return;
      t += 1;
      step(t);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (onStop) onStop();
    }

    if (window.Sim && container) {
      var name = container.getAttribute("data-lab") || ("legacy" + Math.random().toString(36).slice(2, 6));
      window.Sim.register(name, container, {
        update: function () { t += 1; step(t); },
        still:  function () { t += 1; step(t); },
        quality: function () {}
      });
      return {
        reset: function () { t = 0; },
        get t() { return t; },
        set t(v) { t = v; },
        stop: function () { if (onStop) onStop(); },
        start: function () {}
      };
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }, { threshold: 0.15 }).observe(container);
    } else {
      start();
    }
    return {
      reset: function () { t = 0; },
      get t() { return t; },
      set t(v) { t = v; },
      stop: stop,
      start: start
    };
  }


  /* =====================================================================
     ENTRY 01, CRYSTAL GROWTH UNDER TWO GRAVITIES

     The mechanism is the documented one. Under 1 g, density differences
     drive convection, so the solution keeps moving, nuclei form in many
     places, crystals sediment and collide, and defects get trapped. Near
     0 g convection is largely absent, transport is diffusion limited, and
     growth is slower, more even and better ordered.
     ===================================================================== */

  /* Entry 01 moved to lab-crystal.js, which runs on the shared engine in
     sim.js so there is exactly one animation loop on the page. The old
     two panel version owned its own loop and could not be paused from
     outside, which is the thing Phase 3 exists to prevent. */


/* =====================================================================
     ENTRY 05, THE STALACTITE

     Left, gravity makes the drop fall and the deposit builds downward.
     Right, with almost no gravity the drop never detaches. Surface tension
     holds it as a bead and mineral comes out around its whole surface, so
     a shell builds outward instead of a spike growing down.
     ===================================================================== */

  guard("stalactite", function () {
    var wrap = $("[data-lab='stalactite']");
    if (!wrap) return;
    var canvases = $$("canvas.stage", wrap);
    if (canvases.length < 2) { fallback(wrap, "The comparison did not load."); return; }

    var LOOP = 900;
    var CEIL = 26;

    function drawG(ctx, t) {
      var W = 360, H = 320;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP; ctx.fillRect(0, 0, W, H);

      // Ceiling.
      ctx.fillStyle = "rgba(51,46,92,0.16)";
      ctx.fillRect(0, 0, W, CEIL);

      var cycle = 150;
      var n = Math.floor(t / cycle);        // completed drips
      var p = (t % cycle) / cycle;          // progress through this drip
      var spike = Math.min(70, n * 3.4);

      // The spike that has built so far.
      ctx.beginPath();
      ctx.moveTo(W / 2 - 16, CEIL);
      ctx.quadraticCurveTo(W / 2 - 5, CEIL + spike * 0.75, W / 2, CEIL + spike);
      ctx.quadraticCurveTo(W / 2 + 5, CEIL + spike * 0.75, W / 2 + 16, CEIL);
      ctx.closePath();
      ctx.fillStyle = "rgba(140,47,69,0.20)";
      ctx.fill();
      ctx.strokeStyle = CORR; ctx.lineWidth = 1.2; ctx.stroke();

      // Layer lines, because it is built bit by bit.
      ctx.strokeStyle = "rgba(140,47,69,0.30)";
      ctx.lineWidth = 0.8;
      for (var i = 1; i < Math.min(n, 18); i++) {
        var y = CEIL + (spike * i / Math.min(n, 18));
        var half = 16 * (1 - i / Math.min(n, 18) * 0.9);
        ctx.beginPath(); ctx.moveTo(W / 2 - half, y); ctx.lineTo(W / 2 + half, y); ctx.stroke();
      }

      // The drop: swells, necks, falls.
      var tipY = CEIL + spike;
      if (p < 0.62) {
        var grow = p / 0.62;
        var r = 3 + grow * 6;
        ctx.beginPath();
        ctx.ellipse(W / 2, tipY + r * 0.7, r * 0.85, r * (1 + grow * 0.35), 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(51,84,59,0.55)"; ctx.fill();
      } else {
        var fall = (p - 0.62) / 0.38;
        var fy = tipY + 8 + fall * fall * (H - tipY - 30);
        ctx.beginPath();
        ctx.ellipse(W / 2, fy, 5, 7.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(51,84,59,0.55)"; ctx.fill();
      }

      // Floor and the stalagmite answering it.
      ctx.fillStyle = "rgba(51,46,92,0.16)";
      ctx.fillRect(0, H - 20, W, 20);
      var up = Math.min(40, n * 2.0);
      ctx.beginPath();
      ctx.moveTo(W / 2 - 14, H - 20);
      ctx.quadraticCurveTo(W / 2, H - 20 - up * 1.2, W / 2 + 14, H - 20);
      ctx.closePath();
      ctx.fillStyle = "rgba(140,47,69,0.16)"; ctx.fill();
      ctx.strokeStyle = "rgba(140,47,69,0.55)"; ctx.lineWidth = 1; ctx.stroke();
    }

    function drawZ(ctx, t) {
      var W = 360, H = 320;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(51,46,92,0.16)";
      ctx.fillRect(0, 0, W, CEIL);

      var grow = Math.min(1, t / LOOP);
      var cx = W / 2, cy = CEIL + 34;
      var shell = 16 + grow * 44;

      // The mineral shell, built outward all around the bead.
      for (var k = 6; k >= 1; k--) {
        var rr = shell * (k / 6);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(51,84,59," + (0.18 + 0.10 * (6 - k) / 6) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, shell, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(51,84,59,0.14)"; ctx.fill();
      ctx.strokeStyle = SAGE; ctx.lineWidth = 1.4; ctx.stroke();

      // The bead itself, held by surface tension, breathing very slightly.
      var wob = Math.sin(t * 0.03) * 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, 13 + wob, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(51,84,59,0.50)"; ctx.fill();

      // Nothing falls, so the floor stays bare.
      ctx.fillStyle = "rgba(51,46,92,0.16)";
      ctx.fillRect(0, H - 20, W, 20);
    }

    var c1 = fit(canvases[0]), c2 = fit(canvases[1]);

    if (reduced.matches) {
      drawG(c1, LOOP); drawZ(c2, LOOP);
      fallback(wrap.parentNode,
        "Held at the end of the run. Animated, the left panel drips over and over and the spike grows downward a layer at a time. On the right the drop never falls, and the shell thickens evenly all the way around it.");
      var rmCtrl = $("[data-controls='stalactite']");
      if (rmCtrl) rmCtrl.hidden = true;
      return;
    }

    var tk = ticker(wrap, function (t) {
      if (t > LOOP) { tk.t = 0; return; }
      drawG(c1, t); drawZ(c2, t);
    });

    var ctrls = $("[data-controls='stalactite']");
    if (ctrls) on($("[data-act='replay']", ctrls), "click", function () { tk.t = 0; });

    /* No depth control on this one, deliberately. Every other simulation
       here has something real to reveal at the maths setting, because every
       other one computes something. This one animates a prediction. A
       control that changed nothing when you pressed it would be worse than
       no control, so the page says plainly why it is missing instead. */
    var stalChrome = wrap.parentNode.querySelector("[data-chrome]");
    if (stalChrome) {
      var why = document.createElement("p");
      why.className = "mono no-depth";
      why.textContent = "No picture, mechanism and maths control on this one. " +
        "The other simulations have one because they compute something and can " +
        "show you more of it. This one is an animation of a guess, so there is " +
        "no deeper level to go to, and a control that did nothing would be a lie " +
        "about that.";
      stalChrome.appendChild(why);
      Sim.buildCodeControl(
        stalChrome,
        "stalactite",
        "// There is no physics engine behind this one and it would be wrong\n" +
        "// to imply otherwise. Both panels are an animation of what I think\n" +
        "// happens, drawn from a shape and a clock.\n\n" +
        "// Left, under gravity: a drop swells until surface tension loses to\n" +
        "// weight, then falls, and a little mineral is left behind.\n" +
        "//   falls when  rho * g * V  >  2 * pi * r * gamma\n" +
        "// The animation uses a fixed period rather than solving that, so the\n" +
        "// timing is illustrative. The DIRECTION is not: heavier drops fall\n" +
        "// sooner and lower gravity delays them without limit.\n\n" +
        "// Right, at almost no gravity: the same inequality never turns over,\n" +
        "// so the bead stays put and mineral comes out around all of it.\n" +
        "// What shape that actually gives is the open question below, and I\n" +
        "// have drawn my guess, clearly labelled as a guess.",
        [
          "This is the one simulation on the site that is not computed. It is an animation of a prediction, and the caption, the figure label and the entry all say so.",
          "The drop shape is drawn, not solved. A real pendant drop is a solution of the Young-Laplace equation and it does not look very different, but it is not what is on screen.",
          "The deposition is uniform in the model. Whether it really would be is exactly what I do not know, and it is the thing the empty box below is waiting for.",
          "No timescale is claimed. A real stalactite grows on the order of a tenth of a millimetre a year, and both panels here run in seconds.",
          "There is no state to put in the address bar for this one, because there is nothing to set. It has a replay button and nothing else, so no link can carry a configuration and none pretends to."
        ]
      );
    }
  });


  /* =====================================================================
     ENTRY 03, TITRATION
     ===================================================================== */

  /* Entry 03 moved to lab-titration.js on the shared engine. The old one
     owned its own loop and drew no curve. */


/* =====================================================================
     ENTRY 02, PHASE DIAGRAM

     Two systems. A eutectic with terminal solid solutions, and an
     isomorphous one with complete solubility. Boundaries are real curves,
     regions are decided by those curves, and the lever rule is computed
     from the tie line ends rather than approximated.
     ===================================================================== */

  guard("phase", function () {
    var wrap = $("[data-lab='phase']");
    if (!wrap) return;
    var canvas = $("canvas.phase-canvas", wrap);
    var beaker = $("canvas.beaker-canvas", wrap);
    if (!canvas) { fallback(wrap, "The phase diagram did not load."); return; }

    var ctx = fit(canvas);
    var bctx = beaker ? fit(beaker) : null;

    var W = 520, H = 420;
    var PAD = { l: 52, r: 18, t: 20, b: 46 };
    var PW = W - PAD.l - PAD.r, PH = H - PAD.t - PAD.b;

    var TMIN = 100, TMAX = 1100;

    /* ---- the two systems ---- */

    var eutectic = {
      kind: "eutectic",
      tmA: 1000, tmB: 600,
      xE: 0.58, tE: 380,
      xAlphaMax: 0.18, xBetaMin: 0.92,
      xAlphaRT: 0.03, xBetaRT: 0.985,
      names: { alpha: "α", beta: "β" },

      liquidus: function (x) {
        // Two branches meeting at the eutectic, each bowed downward.
        if (x <= this.xE) {
          var u = x / this.xE;
          return this.tmA + (this.tE - this.tmA) * Math.pow(u, 0.86);
        }
        var v = (x - this.xE) / (1 - this.xE);
        return this.tE + (this.tmB - this.tE) * Math.pow(v, 0.86);
      },
      solidusA: function (x) {         // valid 0 .. xAlphaMax
        var u = x / this.xAlphaMax;
        return this.tmA + (this.tE - this.tmA) * Math.pow(u, 0.72);
      },
      solidusB: function (x) {         // valid xBetaMin .. 1
        var u = (1 - x) / (1 - this.xBetaMin);
        return this.tmB + (this.tE - this.tmB) * Math.pow(u, 0.72);
      },
      solvusA: function (t) {          // composition of alpha at temperature t
        var u = Math.max(0, Math.min(1, (t - TMIN) / (this.tE - TMIN)));
        return this.xAlphaRT + (this.xAlphaMax - this.xAlphaRT) * Math.pow(u, 0.75);
      },
      solvusB: function (t) {
        var u = Math.max(0, Math.min(1, (t - TMIN) / (this.tE - TMIN)));
        return this.xBetaRT + (this.xBetaMin - this.xBetaRT) * Math.pow(u, 0.75);
      }
    };

    var isomorphous = {
      kind: "isomorphous",
      tmA: 1000, tmB: 600,
      names: { solid: "solid solution" },
      /* Both curves are the straight line between the two melting points,
         pulled down by x(1 - x) so they meet exactly at the pure ends and
         bow apart in the middle. The sag constants are kept below the
         melting point difference so both curves stay monotonic, which is
         what lets the tie line inversion below be a safe bisection. */
      liquidus: function (x) {
        return this.tmA + (this.tmB - this.tmA) * x - 100 * x * (1 - x);
      },
      solidus: function (x) {
        return this.tmA + (this.tmB - this.tmA) * x - 380 * x * (1 - x);
      }
    };

    var sys = eutectic;
    var pt = { x: 0.50, t: 900 };
    var lastRegion = "";

    /* ---- geometry ---- */

    function px(x) { return PAD.l + x * PW; }
    function py(t) { return PAD.t + (1 - (t - TMIN) / (TMAX - TMIN)) * PH; }
    function ux(p) { return Math.max(0, Math.min(1, (p - PAD.l) / PW)); }
    function ut(p) {
      var f = 1 - (p - PAD.t) / PH;
      return Math.max(TMIN, Math.min(TMAX, TMIN + f * (TMAX - TMIN)));
    }

    /* Which region are we in, and what are the tie line ends. */
    function classify(x, t) {
      if (sys.kind === "isomorphous") {
        var L = sys.liquidus(x), S = sys.solidus(x);
        if (t >= L) return { name: "Liquid", phases: ["Liquid"], single: true };
        if (t <= S) return { name: "Solid solution", phases: ["Solid solution"], single: true };
        // Tie line: liquid composition on the liquidus, solid on the solidus.
        var xl = invert(function (q) { return sys.liquidus(q); }, t);
        var xs = invert(function (q) { return sys.solidus(q); }, t);
        return {
          name: "Liquid + solid solution",
          phases: ["Liquid", "Solid"],
          single: false,
          xl: xl, xs: xs, left: Math.min(xl, xs), right: Math.max(xl, xs),
          leftName: xl < xs ? "Liquid" : "Solid",
          rightName: xl < xs ? "Solid" : "Liquid"
        };
      }

      // Eutectic system.
      var Lq = sys.liquidus(x);
      if (t >= Lq) return { name: "Liquid", phases: ["Liquid"], single: true };

      if (t >= sys.tE) {
        // Above the eutectic isotherm: either a solid solution or liquid plus one.
        if (x <= sys.xAlphaMax && t <= sys.solidusA(Math.min(x, sys.xAlphaMax))) {
          return { name: "α solid solution", phases: ["α"], single: true };
        }
        if (x >= sys.xBetaMin && t <= sys.solidusB(Math.max(x, sys.xBetaMin))) {
          return { name: "β solid solution", phases: ["β"], single: true };
        }
        if (x < sys.xE) {
          var xa = invert(function (q) { return sys.solidusA(q); }, t, 0, sys.xAlphaMax);
          var xlq = invert(function (q) { return sys.liquidus(q); }, t, 0, sys.xE);
          return {
            name: "Liquid + α", phases: ["Liquid", "α"], single: false,
            left: xa, right: xlq, leftName: "α", rightName: "Liquid"
          };
        }
        var xb = invert(function (q) { return sys.solidusB(q); }, t, sys.xBetaMin, 1);
        var xlq2 = invert(function (q) { return sys.liquidus(q); }, t, sys.xE, 1);
        return {
          name: "Liquid + β", phases: ["Liquid", "β"], single: false,
          left: xlq2, right: xb, leftName: "Liquid", rightName: "β"
        };
      }

      // Below the eutectic isotherm.
      var sa = sys.solvusA(t), sb = sys.solvusB(t);
      if (x <= sa) return { name: "α solid solution", phases: ["α"], single: true };
      if (x >= sb) return { name: "β solid solution", phases: ["β"], single: true };
      return {
        name: "α + β", phases: ["α", "β"], single: false,
        left: sa, right: sb, leftName: "α", rightName: "β"
      };
    }

    /* Find x where curve(x) === t, by bisection. Every curve is monotonic on
       the branch it is called with, which is what makes this safe.

       If t lies outside the range the branch actually covers there is no
       root, so we return the nearer end rather than letting the bisection
       converge on nonsense. */
    function invert(curve, t, lo, hi) {
      lo = lo === undefined ? 0 : lo;
      hi = hi === undefined ? 1 : hi;
      var fa = curve(lo) - t, fb = curve(hi) - t;
      if (fa === 0) return lo;
      if (fb === 0) return hi;
      if ((fa < 0) === (fb < 0)) return Math.abs(fa) < Math.abs(fb) ? lo : hi;

      var a = lo, b = hi;
      for (var i = 0; i < 40; i++) {
        var m = (a + b) / 2, fm = curve(m) - t;
        if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else { b = m; }
      }
      return (a + b) / 2;
    }

    /* ---- drawing ---- */

    function curvePath(fn, from, to) {
      ctx.beginPath();
      var steps = 90;
      for (var i = 0; i <= steps; i++) {
        var x = from + (to - from) * (i / steps);
        var t = fn(x);
        var X = px(x), Y = py(t);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
    }

    function drawAxes() {
      ctx.fillStyle = DEEP;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = RULE; ctx.lineWidth = 1;
      for (var t = 200; t <= 1000; t += 200) {
        ctx.beginPath(); ctx.moveTo(PAD.l, py(t)); ctx.lineTo(W - PAD.r, py(t)); ctx.stroke();
      }
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b);
      ctx.stroke();

      ctx.fillStyle = "#615A6E";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "right";
      for (var t2 = 200; t2 <= 1000; t2 += 200) {
        ctx.fillText(t2 + "°", PAD.l - 7, py(t2) + 4);
      }
      ctx.textAlign = "center";
      ctx.fillText("100% A", PAD.l, H - PAD.b + 18);
      ctx.fillText("100% B", W - PAD.r, H - PAD.b + 18);
      ctx.fillText("composition", PAD.l + PW / 2, H - PAD.b + 34);

      ctx.save();
      ctx.translate(13, PAD.t + PH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("temperature", 0, 0);
      ctx.restore();
    }

    function drawSystem() {
      if (sys.kind === "isomorphous") {
        curvePath(function (x) { return sys.liquidus(x); }, 0, 1);
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
        curvePath(function (x) { return sys.solidus(x); }, 0, 1);
        ctx.strokeStyle = SAGE; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = "rgba(97,90,110,0.85)";
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.fillText("liquidus", px(0.13), py(sys.liquidus(0.13)) - 8);
        ctx.fillText("solidus", px(0.13), py(sys.solidus(0.13)) + 16);
        return;
      }

      // Liquidus, both branches.
      curvePath(function (x) { return sys.liquidus(x); }, 0, 1);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();

      // Solidus branches.
      curvePath(function (x) { return sys.solidusA(x); }, 0, sys.xAlphaMax);
      ctx.strokeStyle = SAGE; ctx.lineWidth = 2; ctx.stroke();
      curvePath(function (x) { return sys.solidusB(x); }, sys.xBetaMin, 1);
      ctx.strokeStyle = SAGE; ctx.lineWidth = 2; ctx.stroke();

      // Solvus lines.
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var t = TMIN + (sys.tE - TMIN) * (i / 60);
        var X = px(sys.solvusA(t)), Y = py(t);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = SAGE; ctx.lineWidth = 1.4; ctx.stroke();

      ctx.beginPath();
      for (var j = 0; j <= 60; j++) {
        var t2 = TMIN + (sys.tE - TMIN) * (j / 60);
        var X2 = px(sys.solvusB(t2)), Y2 = py(t2);
        if (j === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2);
      }
      ctx.strokeStyle = SAGE; ctx.lineWidth = 1.4; ctx.stroke();

      // Eutectic isotherm.
      ctx.beginPath();
      ctx.moveTo(px(sys.xAlphaMax), py(sys.tE));
      ctx.lineTo(px(sys.xBetaMin), py(sys.tE));
      ctx.strokeStyle = CORR; ctx.lineWidth = 2; ctx.stroke();

      // The eutectic point itself.
      ctx.beginPath();
      ctx.arc(px(sys.xE), py(sys.tE), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = CORR; ctx.fill();

      ctx.fillStyle = "rgba(97,90,110,0.85)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("liquidus", px(0.10), py(sys.liquidus(0.10)) - 8);
      ctx.fillText("α", px(0.05), py(sys.tE + 180));
      ctx.fillText("β", px(0.95), py(sys.tE + 180));
      ctx.textAlign = "center";
      ctx.fillText("eutectic", px(sys.xE), py(sys.tE) + 18);
    }

    function drawTieAndPoint(info) {
      if (!info.single) {
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px(info.left), py(pt.t));
        ctx.lineTo(px(info.right), py(pt.t));
        ctx.strokeStyle = ASIDE; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.setLineDash([]);

        [info.left, info.right].forEach(function (x) {
          ctx.beginPath();
          ctx.arc(px(x), py(pt.t), 3, 0, Math.PI * 2);
          ctx.fillStyle = ASIDE; ctx.fill();
        });
      }

      ctx.beginPath();
      ctx.arc(px(pt.x), py(pt.t), 7, 0, Math.PI * 2);
      ctx.fillStyle = BUTTER; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    }

    function drawBeaker(info) {
      if (!bctx) return;
      var w = 240, h = 240;
      bctx.clearRect(0, 0, w, h);

      var x0 = 54, y0 = 24, bw = 132, bh = 190;
      bctx.strokeStyle = INK; bctx.lineWidth = 1.6;
      bctx.strokeRect(x0, y0, bw, bh);

      var liquidFrac = 0, solidFrac = 0, twoSolid = false;
      if (info.single) {
        if (info.name === "Liquid") liquidFrac = 1;
        else solidFrac = 1;
      } else {
        var span = info.right - info.left;
        var fLeft = span > 0 ? (info.right - pt.x) / span : 0.5;
        var fRight = 1 - fLeft;
        if (info.leftName === "Liquid") { liquidFrac = fLeft; solidFrac = fRight; }
        else if (info.rightName === "Liquid") { liquidFrac = fRight; solidFrac = fLeft; }
        else { twoSolid = true; solidFrac = 1; }
      }

      bctx.save();
      bctx.beginPath(); bctx.rect(x0, y0, bw, bh); bctx.clip();

      if (twoSolid) {
        // Two solids sitting together, drawn as two grain populations.
        var spanB = info.right - info.left;
        var fA = spanB > 0 ? (info.right - pt.x) / spanB : 0.5;
        for (var g = 0; g < 90; g++) {
          var gx = x0 + 8 + ((g * 37) % (bw - 16));
          var gy = y0 + 12 + ((g * 53) % (bh - 24));
          var isA = (g / 90) < fA;
          bctx.beginPath();
          bctx.arc(gx, gy, 7, 0, Math.PI * 2);
          bctx.fillStyle = isA ? "rgba(51,84,59,0.42)" : "rgba(140,47,69,0.34)";
          bctx.fill();
        }
      } else {
        // Liquid pools at the bottom, solid grains sit in it.
        var liqH = bh * liquidFrac;
        bctx.fillStyle = "rgba(51,46,92,0.16)";
        bctx.fillRect(x0, y0 + bh - liqH, bw, liqH);

        var count = Math.round(solidFrac * 34);
        for (var s = 0; s < count; s++) {
          var sx = x0 + 14 + ((s * 41) % (bw - 28));
          var sy = y0 + bh - 14 - ((s * 29) % (bh - 28));
          bctx.beginPath();
          for (var v = 0; v < 6; v++) {
            var a = v * Math.PI / 3 + s;
            var vx = sx + Math.cos(a) * 9, vy = sy + Math.sin(a) * 9;
            if (v === 0) bctx.moveTo(vx, vy); else bctx.lineTo(vx, vy);
          }
          bctx.closePath();
          bctx.fillStyle = "rgba(51,84,59,0.40)";
          bctx.fill();
          bctx.strokeStyle = SAGE; bctx.lineWidth = 1; bctx.stroke();
        }
      }
      bctx.restore();

      bctx.fillStyle = "#615A6E";
      bctx.font = "11px ui-monospace, monospace";
      bctx.textAlign = "center";
      bctx.fillText("what you would be holding", w / 2, y0 + bh + 24);
    }

    function drawLever(info) {
      var box = $("[data-lever]", wrap);
      if (!box) return;
      var bars = $(".lever-bars", box);
      var none = $(".lever-none", box);
      bars.innerHTML = "";

      if (info.single) {
        none.hidden = false;
        return;
      }
      none.hidden = true;

      var span = info.right - info.left;
      var fLeft = span > 0 ? (info.right - pt.x) / span : 0.5;
      var pairs = [
        [info.leftName, fLeft],
        [info.rightName, 1 - fLeft]
      ];

      pairs.forEach(function (p) {
        var row = document.createElement("div");
        row.className = "lever-bar";
        var name = document.createElement("span");
        name.textContent = p[0];
        var track = document.createElement("span");
        track.className = "lever-track";
        var fill = document.createElement("span");
        fill.className = "lever-fill";
        fill.style.display = "block";
        fill.style.width = Math.max(0, Math.min(100, p[1] * 100)).toFixed(0) + "%";
        track.appendChild(fill);
        var pct = document.createElement("span");
        pct.textContent = (p[1] * 100).toFixed(0) + "%";
        row.appendChild(name); row.appendChild(track); row.appendChild(pct);
        bars.appendChild(row);
      });
    }

    var crossings = {
      "Liquid": "All liquid up here. Too hot for anything to hold together.",
      "Liquid + α": "You crossed the liquidus. The first solid has appeared, and it is richer in A than the liquid it came out of.",
      "Liquid + β": "You crossed the liquidus on the B side. Solid is appearing, and it is richer in B than the melt.",
      "Liquid + solid solution": "You crossed the liquidus. Liquid and solid are sitting together now, and neither has the composition you started with.",
      "α solid solution": "Past the solidus. The last of the liquid has gone and you are left with one solid phase.",
      "β solid solution": "Past the solidus. All solid now, one phase, B rich.",
      "Solid solution": "Past the solidus. All solid, and the two metals are mixed right through each other.",
      "α + β": "Below the solvus. The solid could not hold all of it in solution any more, so it has separated into two."
    };

    function render() {
      var info = classify(pt.x, pt.t);
      drawAxes();
      drawSystem();
      drawTieAndPoint(info);
      drawBeaker(info);
      drawLever(info);

      var regionOut = $("[data-out='region']", wrap);
      var coordsOut = $("[data-out='coords']", wrap);
      if (regionOut) regionOut.textContent = info.name;
      if (coordsOut) {
        coordsOut.textContent = Math.round(pt.x * 100) + "% B · " + Math.round(pt.t) + " °C";
      }

      /* The maths view. Inside a two phase field the tie line ends give the
         composition of each phase, and the lever rule turns the point's
         position along that line into how much of each you have. These are
         the numbers a phase diagram exists to give you, so they are the
         honest thing to put behind the maths setting rather than a restated
         version of what is already on screen. */
      var leftOut  = $("[data-out='tie-left']", wrap);
      var rightOut = $("[data-out='tie-right']", wrap);
      var fracOut  = $("[data-out='lever']", wrap);
      if (leftOut && rightOut && fracOut) {
        if (info.single || info.left === undefined || info.right === undefined) {
          leftOut.textContent = "one phase, no tie line";
          rightOut.textContent = "one phase, no tie line";
          fracOut.textContent = "100% " + info.name;
        } else {
          var a = info.left, b = info.right;
          var span = b - a;
          var f = span === 0 ? 0 : (pt.x - a) / span;      /* along the tie line */
          f = Math.max(0, Math.min(1, f));
          leftOut.textContent  = Math.round(a * 100) + "% B  (" + (info.leftName || "left") + ")";
          rightOut.textContent = Math.round(b * 100) + "% B  (" + (info.rightName || "right") + ")";
          fracOut.textContent =
            Math.round((1 - f) * 100) + "% " + (info.leftName || "left") + "  ·  " +
            Math.round(f * 100) + "% " + (info.rightName || "right");
        }
      }
      Sim.writeUrl();

      if (info.name !== lastRegion) {
        var msg = $("[data-crossing]", wrap);
        if (msg) msg.textContent = crossings[info.name] || "";
        lastRegion = info.name;
      }
    }

    /* ---- input ---- */

    function fromEvent(e) {
      var r = canvas.getBoundingClientRect();
      var sx = W / r.width, sy = H / r.height;
      /* Sim.pointer lifts the grab point clear of a finger, and does nothing
         at all for a mouse. Dragging a point on a phase diagram with a thumb
         is the exact case the brief calls miserable: without this the thing
         you are trying to place is underneath the thing placing it. */
      var p = (window.Sim && Sim.pointer) ? Sim.pointer(e, canvas)
                                          : { x: e.clientX - r.left, y: e.clientY - r.top };
      var cx = p.x * sx;
      var cy = p.y * sy;
      pt.x = ux(cx);
      pt.t = ut(cy);
      render();
    }

    var dragging = false;
    on(canvas, "pointerdown", function (e) {
      dragging = true;
      // Capture can throw if the pointer is already gone. Losing capture is
      // survivable, so it must not take the drag down with it.
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e);
    });
    on(canvas, "pointermove", function (e) { if (dragging) fromEvent(e); });
    on(canvas, "pointerup", function (e) {
      dragging = false;
      try {
        if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    });
    on(canvas, "pointercancel", function () { dragging = false; });

    on(canvas, "keydown", function (e) {
      var stepX = e.shiftKey ? 0.01 : 0.04;
      var stepT = e.shiftKey ? 10 : 40;
      var used = true;
      if (e.key === "ArrowLeft") pt.x = Math.max(0, pt.x - stepX);
      else if (e.key === "ArrowRight") pt.x = Math.min(1, pt.x + stepX);
      else if (e.key === "ArrowUp") pt.t = Math.min(TMAX, pt.t + stepT);
      else if (e.key === "ArrowDown") pt.t = Math.max(TMIN, pt.t - stepT);
      else used = false;
      if (used) { e.preventDefault(); render(); }
    });

    /* ---- presets ---- */

    function goTo(x, t) {
      if (reduced.matches) { pt.x = x; pt.t = t; render(); return; }
      var x0 = pt.x, t0 = pt.t, start = null;
      function anim(ts) {
        if (start === null) start = ts;
        var k = Math.min(1, (ts - start) / 520);
        var e = 1 - Math.pow(1 - k, 3);
        pt.x = x0 + (x - x0) * e;
        pt.t = t0 + (t - t0) * e;
        render();
        if (k < 1) requestAnimationFrame(anim);
      }
      requestAnimationFrame(anim);
    }

    $$("[data-preset]", wrap.parentNode).forEach(function (btn) {
      on(btn, "click", function () {
        $$("[data-preset]", wrap.parentNode).forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var which = btn.getAttribute("data-preset");
        var msg = $("[data-crossing]", wrap);

        if (which === "complete") {
          sys = isomorphous;
          lastRegion = "";
          // Land inside the lens, so the tie line and the lever rule are
          // actually on screen rather than the point sitting up in the melt.
          // At 45 percent B the lens runs from about 726 to 795 degrees.
          goTo(0.45, 760);
          if (msg) msg.textContent = "Complete solubility. A and B mix in any proportion, in the solid as well as the liquid, so there is one lens and no eutectic anywhere on it.";
        } else if (which === "eutectic") {
          sys = eutectic;
          lastRegion = "";
          goTo(eutectic.xE, eutectic.tE + 6);
          if (msg) msg.textContent = "The eutectic. This mixture melts lower than either metal on its own, and it freezes all at once with no mushy stage, because here the liquidus and solidus meet at a point.";
        } else {
          sys = eutectic;
          lastRegion = "";
          goTo(0.55, 260);
          if (msg) msg.textContent = "Partial solubility. Each solid will dissolve a little of the other and no more, so below the solvus the leftover separates out and you hold two solids at once.";
        }
      });
    });

    /* This lab predates the shared engine and draws itself, so it never got
       the depth control, the code panel or a share of the address bar. All
       three now, the same as every other simulation on the page. */
    var phaseChrome = wrap.closest("figure") &&
                      wrap.closest("figure").querySelector("[data-chrome]");
    if (phaseChrome) {
      Sim.buildDepthControl(phaseChrome);
      Sim.buildCodeControl(
        phaseChrome,
        "phase",
        "// Where the two boundaries sit, for this pair of metals.\n" +
        "liquidus(x) = tmA + (tmB - tmA)*x - 100*x*(1 - x);\n" +
        "solidus(x)  = tmA + (tmB - tmA)*x - 380*x*(1 - x);\n\n" +
        "// Between them you hold two phases at once. The tie line is the\n" +
        "// horizontal at this temperature, and its ends are the composition\n" +
        "// of each phase, found by inverting each boundary.\n" +
        "xLiquid = invert(liquidus, t);\n" +
        "xSolid  = invert(solidus,  t);\n\n" +
        "// The lever rule. How far along that line you sit IS how much of\n" +
        "// each phase you have, and it is the opposite arm that counts.\n" +
        "f = (x - xSolid) / (xLiquid - xSolid);\n" +
        "fractionLiquid = f;  fractionSolid = 1 - f;",
        [
          "The two systems here are shapes with the right topology, not measured data for any real alloy pair. A complete solubility lens and a eutectic with partial solubility, drawn from smooth functions chosen to put the features where they are legible.",
          "Equilibrium throughout. Every reading assumes you cooled slowly enough for the solid to keep re-equilibrating with the liquid, which real castings do not, and that is why the solidification simulation next to this one exists.",
          "The boundaries are inverted numerically to find the tie line ends, so the compositions are exact to the drawn curves rather than to any laboratory measurement.",
          "The lever rule itself is exact, and it is a mass balance rather than a model. Given the tie line ends, the fractions follow with no physics added.",
          "Temperatures are in degrees Celsius on an axis chosen to fit both systems on the same picture. Neither pair is named because neither is real."
        ]
      );
    }
    Sim.state("phase", function () {
      /* Only when it has been moved off where it starts. */
      if (Math.abs(pt.x - 0.5) < 0.005 && Math.abs(pt.t - 900) < 1) return "";
      return pt.x.toFixed(3) + "," + Math.round(pt.t);
    });
    (function () {
      var q = new URLSearchParams(location.search).get("phase");
      if (!q) return;
      var bits = String(q).split(",");
      var x = parseFloat(bits[0]), t = parseFloat(bits[1]);
      if (isFinite(x) && isFinite(t)) { pt.x = Math.max(0, Math.min(1, x)); pt.t = t; }
    })();

    render();

    if (reduced.matches) {
      fallback(wrap.parentNode,
        "Shown at 50 percent B and 900 degrees. Dragging the marker moves through the diagram and the panel updates to show which phases you would be holding and in what proportion.");
    }
  });

})();
