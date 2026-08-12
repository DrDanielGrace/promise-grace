/* =========================================================================
   instrument.js · one frame, eight simulations

   WHAT CHANGED FROM THE PROTOTYPE

   The first version of this file was written for the crystal and knew the
   crystal's controls, readout rows and marks by name. Eight simulations do
   not fit that, and eight copies of it would rot at eight different rates.

   So the frame now knows nothing about any particular simulation. It reads
   which one it is from the address, clones that simulation's markup out of a
   <template> in the page, works out the shape of what it just cloned, and
   loads the script that drives it. The markup in those templates was lifted
   verbatim out of the notebook, so every lab-*.js binds to exactly the DOM
   it has always bound to and no number moves.

   WHAT IT WORKS OUT FOR ITSELF

   Which view is the one worth seeing first: the first one.
   Which control is worth meeting on its own: the simulation names it, and
     everything else in the panel becomes a late control.
   Which readout row a mark belongs to: from the row's own data-out name.
   Whether there is a handoff: from whether the simulation declares one.

   WHAT IT STILL DOES

   Brings the thing up rather than opening it. Discloses in four steps with
   everything available from the first screen and never the default. Turns
   every announced mark into a sound, a line in the marks list, and the
   readout row it belongs to lighting in the same frame. Runs the beds. And
   leaves, audibly.
   ========================================================================= */

(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("inst")) return;

  var params = new URLSearchParams(location.search);
  var name = params.get("sim") || "crystal";
  var frame = (window.Frames || {})[name];

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  if (!frame) {
    var miss = $("[data-missing]");
    if (miss) miss.hidden = false;
    var open = $('[data-part="open"]');
    if (open) open.hidden = true;
    return;
  }


  /* ----------------------------------------------------------------------
     BUILD

     Clone the template, then label what came out of it so the stylesheet
     can disclose it. The labels are derived, never hand written per
     simulation, because a per simulation list is a list that goes stale.
     ---------------------------------------------------------------------- */
  var tpl = $('template[data-frame="' + name + '"]');
  if (!tpl) { body.setAttribute("data-stage", "3"); return; }

  var parts = document.createElement("div");
  parts.appendChild(tpl.content.cloneNode(true));

  var question = parts.querySelector(".predict");
  var lab = parts.querySelector("[data-lab]");
  var prose = $$(".nojs-note, .inst-fig", parts);

  if (question) $("[data-slot=\"question\"]").appendChild(question);
  if (lab) $("[data-slot=\"lab\"]").appendChild(lab);

  /* Every lab-*.js hangs its depth control and its code panel off the
     nearest <figure>, or off its own parent when there is no figure. There
     is no figure here, so the chrome container is moved to be that parent
     and the two of them land where they are meant to without any of the
     eight files being told the frame exists. */
  var chrome = $("[data-chrome]");
  if (chrome && lab) lab.parentNode.appendChild(chrome);
  prose.forEach(function (p) {
    if (p.classList.contains("nojs-note")) {
      var q = document.createElement("p");
      q.innerHTML = p.innerHTML;
      $("[data-slot=\"prose\"]").appendChild(q);
    } else {
      $("[data-slot=\"prose\"]").appendChild(p);
    }
  });

  document.title = frame.title + " · Promise Oluwatosin Grace";
  var h1 = $("[data-inst-title]");
  if (h1) h1.textContent = frame.title;

  var leave = $("[data-leave]");
  if (leave) leave.setAttribute("href", "simulations.html");


  /* ---- connected research ----------------------------------------------
     An instrument at full screen used to end. The reader had run it, read
     what it assumed, and then had nowhere to go but back to the index they
     came from, which is how a site full of connected work manages to feel
     like a list of demonstrations.

     What follows is read out of map.js rather than written into eight
     templates: the research area this instrument belongs to, the notebook
     entry that is the same question in prose, the instrument it hands its
     result to, and where the rest of them are.
     ---------------------------------------------------------------------- */
  (function connected() {
    var M = window.Map17;
    var host = $("[data-connected-list]");
    var sec = $("[data-connected]");
    if (!M || !host || !sec) return;

    var me = M.sim(name);
    if (!me) return;

    var out = [];

    var topic = M.topic(me.topic);
    if (topic) {
      out.push({ kind: "RESEARCH", name: topic.name,
                 href: "research.html#" + topic.id, say: topic.question });
    }

    if (me.entry) {
      var e = M.entry(me.entry);
      if (e) {
        out.push({ kind: "NOTEBOOK", name: "Entry " + e.n + ", " + e.name,
                   href: "notebook.html#" + e.id, say: e.say });
      }
    }

    /* whichever chain this one is in, the instrument after it */
    M.CHAINS.forEach(function (c) {
      c.steps.forEach(function (step, i) {
        if (step.sim !== name || !step.carry) return;
        var next = M.sim(c.steps[i + 1] && c.steps[i + 1].sim);
        if (!next) return;
        out.push({ kind: "NEXT IN THE CHAIN", name: next.name, href: next.href,
                   say: "This one sends " + step.carry + " to it." });
      });
    });

    out.push({ kind: "THE LAB", name: "All " + M.COUNTS.sims + " instruments",
               href: "simulations.html",
               say: "Grouped, with what each one computes and what it assumes." });

    out.forEach(function (it) {
      var a = document.createElement("a");
      a.className = "inst-conn";
      a.href = it.href;
      var k = document.createElement("span");
      k.className = "mono inst-conn-kind";
      k.textContent = it.kind;
      var n = document.createElement("span");
      n.className = "inst-conn-name";
      n.textContent = it.name;
      var s = document.createElement("span");
      s.className = "inst-conn-say";
      s.textContent = it.say;
      a.appendChild(k); a.appendChild(n); a.appendChild(s);
      host.appendChild(a);
    });

    sec.hidden = false;
  })();


  /* ---- shape the panel -------------------------------------------------
     Views first, controls and readout into a side column, and the marks and
     handoff panels built rather than written into eight templates.
     ---------------------------------------------------------------------- */
  var views = $$(".lab-view", lab);
  views.forEach(function (v, i) {
    v.setAttribute("data-panel", i === 0 ? "primary" : "extra");
    if (!v.querySelector(".brackets")) {
      var b = document.createElement("span");
      b.className = "brackets";
      b.setAttribute("aria-hidden", "true");
      v.appendChild(b);
    }
  });

  var controls = $(".lab-controls", lab);
  var readout = $(".lab-readout", lab) || $(".readout", lab);

  var side = document.createElement("div");
  side.className = "inst-side";
  if (controls) { controls.setAttribute("data-part", "control"); side.appendChild(controls); }
  if (readout) { readout.setAttribute("data-part", "readout"); side.appendChild(readout); }
  lab.appendChild(side);

  /* Each readout row is named after the quantity it carries, which is what
     lets a mark light the row it belongs to without the frame being told. */
  if (readout) {
    $$(".readout-line", readout).forEach(function (row) {
      var b = row.querySelector("[data-out]");
      if (b) row.setAttribute("data-line", b.getAttribute("data-out"));
    });
  }

  /* ---- one control, then the rest -------------------------------------
     The named control and the label that belongs to it stay. Everything
     else in the panel is late. sim.js adds a stepper next to sliders after
     this runs, so the stepper is caught by its own rule further down.
     ---------------------------------------------------------------------- */
  var primary = frame.primary ? $(frame.primary, controls || lab) : null;
  if (!primary && controls) primary = $("input[type=range]", controls);

  var primaryTop = null;
  if (primary && controls) {
    primaryTop = primary;
    while (primaryTop && primaryTop.parentNode !== controls) primaryTop = primaryTop.parentNode;
  }

  if (controls && primaryTop) {
    var kids = Array.prototype.slice.call(controls.children);
    var keepFrom = kids.indexOf(primaryTop);
    /* a label immediately above the control belongs to it */
    var keep = [primaryTop];
    if (keepFrom > 0 && /^(LABEL|SPAN|P)$/.test(kids[keepFrom - 1].tagName) &&
        kids[keepFrom - 1].textContent.length < 90) {
      keep.unshift(kids[keepFrom - 1]);
    }
    kids.forEach(function (k) {
      if (keep.indexOf(k) < 0) k.setAttribute("data-part", "late-control");
    });
  }


  /* ---- the panels the frame owns -------------------------------------- */
  function panel(cls, part, heading) {
    var s = document.createElement("section");
    s.className = cls;
    s.setAttribute("data-part", part);
    s.setAttribute("aria-label", heading);
    var h = document.createElement("h2");
    h.className = "mono";
    h.textContent = heading.toUpperCase();
    s.appendChild(h);
    side.appendChild(s);
    return s;
  }

  var marksBox = null, list = null;
  if (frame.marks) {
    marksBox = panel("inst-marks", "marks", "Marks");
    list = document.createElement("ol");
    list.className = "mono";
    list.setAttribute("data-marks", "");
    marksBox.appendChild(list);
    var empty = document.createElement("p");
    empty.className = "mono inst-marks-empty";
    empty.textContent = "Nothing yet. Whatever this one counts as a moment worth noticing writes a line here at the instant you hear it.";
    marksBox.appendChild(empty);
  }

  var state = null;
  if (frame.sends) {
    var hand = panel("inst-handoff", "handoff", "Handoff");
    var what = document.createElement("p");
    what.className = "inst-handoff-what";
    what.textContent = "This run sends " + frame.sends.what + " to " + frame.sends.to +
                       ". It goes on its own when a run finishes. This sends it again.";
    hand.appendChild(what);
    var p1 = document.createElement("p");
    var send = document.createElement("button");
    send.type = "button";
    send.className = "inst-btn";
    send.setAttribute("data-resend", "");
    send.textContent = "Send the result to " + frame.sends.to.toLowerCase();
    p1.appendChild(send);
    hand.appendChild(p1);
    var p2 = document.createElement("p");
    var go = document.createElement("a");
    go.className = "inst-btn inst-btn-quiet";
    go.href = frame.sends.where;
    go.textContent = "Open " + frame.sends.to.toLowerCase();
    p2.appendChild(go);
    hand.appendChild(p2);
    state = document.createElement("p");
    state.className = "mono inst-handoff-state";
    state.setAttribute("role", "status");
    state.setAttribute("aria-live", "polite");
    state.setAttribute("data-handoff-state", "");
    state.textContent = "Not sent yet.";
    hand.appendChild(state);

    send.addEventListener("click", function () {
      say("button");
      var api = window.Sim && Sim.api ? Sim.api(name) : null;
      if (api && api.resend) api.resend();
      else state.textContent = "Nothing to send yet. Run it first.";
    });
  }

  if (frame.takes) {
    var t = panel("inst-takes", "handoff", "Takes");
    var line = document.createElement("p");
    line.className = "inst-handoff-what";
    line.textContent = "This one uses " + frame.takes.what + " from " + frame.takes.from +
                       " when there is one. Run that first and this changes.";
    t.appendChild(line);
    var p3 = document.createElement("p");
    var back = document.createElement("a");
    back.className = "inst-btn inst-btn-quiet";
    back.href = frame.takes.where;
    back.textContent = "Open " + frame.takes.from.toLowerCase();
    p3.appendChild(back);
    t.appendChild(p3);
  }


  /* ----------------------------------------------------------------------
     THE RUN IDENTIFIER
     ---------------------------------------------------------------------- */
  function pad(n, w) { return String(n).padStart(w || 2, "0"); }

  function stamp(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
           "-" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }
  function clock(d) {
    return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) +
           "." + String(Math.floor(d.getUTCMilliseconds() / 100));
  }

  var run = $("[data-run-id]");
  if (run) run.textContent = name.toUpperCase() + " · RUN " + stamp(new Date());


  /* ----------------------------------------------------------------------
     SOUND
     ---------------------------------------------------------------------- */
  function say(voice, extra) {
    if (window.Aud && window.Snd && Snd.enabled()) Aud.play(voice, extra);
  }


  /* ----------------------------------------------------------------------
     DISCLOSURE
     ---------------------------------------------------------------------- */
  var stage = 0;
  var touched = 0;

  function reveal(part) {
    var el = $('[data-part="' + part + '"]');
    if (!el || reduced) return;
    el.classList.remove("is-arriving");
    void el.offsetWidth;
    el.classList.add("is-arriving");
  }

  function setStage(next, quiet) {
    next = Math.max(0, Math.min(next, 3));
    if (next <= stage) return;
    var was = stage;
    stage = next;
    body.setAttribute("data-stage", String(stage));

    if (was < 1 && stage >= 1) {
      if (!quiet) { say("arrive"); setTimeout(function () { say("latch"); }, 90); }
      reveal("control");
      startBed();
    }
    if (was < 2 && stage >= 2) {
      if (!quiet) say("appear");
      reveal("readout");
    }
    if (was < 3 && stage >= 3) {
      if (!quiet) { say("appear"); setTimeout(function () { say("latch"); }, 110); }
      ["marks", "handoff", "chrome", "prose", "late-control"].forEach(reveal);
    }

    var ev = $("[data-everything]");
    if (ev) ev.setAttribute("aria-pressed", String(stage >= 3));
    requestAnimationFrame(function () { window.dispatchEvent(new Event("resize")); });
  }

  var begin = $("[data-begin]");
  if (begin) begin.addEventListener("click", function () {
    say("button");
    setStage(1);
    if (primary && primary.focus) primary.focus();
  });

  $$(".predict button[data-a]").forEach(function (b) {
    b.addEventListener("click", function () {
      setTimeout(function () { setStage(1); }, 520);
    });
  });

  var everything = $("[data-everything]");
  if (everything) everything.addEventListener("click", function () {
    say("button");
    setStage(3);
  });

  /* The second door out of the prediction screen. Same destination as the
     Everything control in the header, and it is here as well because a
     reader on the opening screen should not have to find a control at the
     other end of the page to get past it. */
  var openAll = $("[data-everything-open]");
  if (openAll) openAll.addEventListener("click", function () {
    say("button");
    setStage(3);
  });

  /* Any control moving is what advances it. The first move brings the
     readout, the next brings the rest, so the panel arrives at the speed
     the reader is actually working at rather than on a timer. */
  function touch() {
    touched++;
    if (stage === 1) setStage(2);
    else if (stage === 2 && touched > 4) setStage(3);
    bedFromState();
  }

  if (lab) {
    lab.addEventListener("input", touch);
    lab.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("button")) touch();
    });
  }


  /* ----------------------------------------------------------------------
     THE BEDS

     Two loops on the ambient bus. Which pair, and what moves them, is the
     simulation's business rather than the frame's: it reports a number
     between nought and one meaning "how much is moving here", and the beds
     follow it. Where a simulation says nothing, the bed sits still and the
     laboratory underneath simply stays where it is.
     ---------------------------------------------------------------------- */
  var water = null, roomtone = null;

  function startBed() {
    if (!window.Aud) return;
    water = Aud.bed("water", { cap: 0.34, dark: 3400, glide: 0.7, from: 1.0 });
    roomtone = Aud.bed("room", { cap: 0.26, dark: 2600, glide: 0.9, from: 0.5 });
    bedFromState();
  }

  /* How much is moving in this simulation, between nought and one.

     Four ways of knowing, in order of how much the simulation is trusted
     to know it. If it computes the answer it says so itself. Otherwise the
     frame reads a row of the readout, or the position of the control, or is
     told plainly that the answer is a constant. A simulation with nothing
     flowing in it declares that too, and gets the room rather than a bed
     that pretends water is involved. */
  function motion() {
    var b = frame.bed || {};
    if (b.still) return 0;
    var m = b.motion || {};

    if (m.api) {
      var api = window.Sim && Sim.api ? Sim.api(name) : null;
      var v = api && api.motion ? api.motion() : null;
      return isFinite(v) ? v : 0;
    }
    if (m.fixed !== undefined) return m.fixed;
    if (m.line) {
      var r = value(m.line);
      if (r === null) return 0;
      return Math.max(0, Math.min((r - m.lo) / (m.hi - m.lo), 1));
    }
    if (m.control && primary && primary.type === "range") {
      var lo = parseFloat(primary.min), hi = parseFloat(primary.max);
      var at = parseFloat(primary.value);
      if (!isFinite(lo) || !isFinite(hi) || hi === lo) return 0;
      return Math.max(0, Math.min((at - lo) / (hi - lo), 1));
    }
    return 0;
  }

  function bedFromState() {
    if (!water || !roomtone) return;
    /* The square root, because movement in a fluid follows the square root
       of what is driving it far more often than it follows the driver, and
       because the last tenth is where most of the audible change lives. */
    var move = Math.sqrt(Math.max(0, Math.min(motion(), 1)));
    water.set(move);
    roomtone.set(0.35 + 0.65 * (1 - move));
  }

  /* The beds follow the physics, so they are read on the same cadence the
     physics changes on rather than only when a control moves. */
  setInterval(function () { if (stage >= 1) bedFromState(); }, 900);

  if (window.Snd) {
    Snd.onChange(function (on) {
      if (on && stage >= 1) startBed();
      if (!on && window.Aud) { Aud.stopBeds(); water = roomtone = null; }
    });
  }


  /* ----------------------------------------------------------------------
     MARKS

     Every simulation announces its own moments on its own channel and says
     nothing about what they should sound like. The frame decides that, once,
     here, so all eight sound like the same instrument.
     ---------------------------------------------------------------------- */
  var VOICE = {
    threshold: null,      /* lab-*.js already knocks for a threshold */
    forming:   "shell",
    complete:  "complete",
    handoff:   "handoff",
    reading:   "complete"
  };

  function light(which) {
    var row = which
      ? $('[data-line="' + which + '"]')
      : $("[data-handoff-state]");
    if (!row) return;
    row.classList.add("is-marked");
    setTimeout(function () { row.classList.remove("is-marked"); }, 1600);
  }

  function addMark(d) {
    if (!list) return;
    var when = new Date(d.at || Date.now());
    var li = document.createElement("li");
    li.className = "is-new" + (d.cool ? " is-cool" : "");

    var t = document.createElement("time");
    t.dateTime = when.toISOString();
    t.textContent = clock(when);

    var wrap = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = d.label || String(d.kind || "").toUpperCase();
    var s = document.createElement("span");
    s.textContent = d.say || "";
    wrap.appendChild(b);
    if (d.say) wrap.appendChild(s);

    li.appendChild(t);
    li.appendChild(wrap);
    list.appendChild(li);
    while (list.children.length > 12) list.removeChild(list.firstChild);
    if (marksBox) marksBox.setAttribute("data-any", "1");
  }

  function sent(d) {
    if (!state) return;
    state.textContent = "SENT " + clock(new Date()) + (d && d.summary ? "  ·  " + d.summary : "");
    state.setAttribute("data-sent", "1");
  }

  /* ----------------------------------------------------------------------
     WATCHED THRESHOLDS

     Some simulations announce their own moments. Most do not, and the way
     to give those a moment worth hearing is not to reach inside seven files
     and add publishing to each: it is to watch the number that is already
     on the readout in front of the reader.

     That is deliberately the honest version. The mark fires on the value
     the reader can see, formatted exactly as they see it, so there is no
     way for what is heard and what is displayed to disagree. Nothing is
     recomputed here and no threshold is invented: every one of them is a
     round number in the same units as the row it watches, declared in
     frames.js where it can be read in one place.

     Each fires once per crossing and rearms when the value comes back.
     ---------------------------------------------------------------------- */
  var armed = {};

  function value(line) {
    var row = $('[data-line="' + line + '"]');
    if (!row) return null;
    var b = row.querySelector("[data-out]");
    if (!b) return null;
    var n = parseFloat(String(b.textContent).replace(/[^0-9eE.+-]/g, ""));
    return isFinite(n) ? n : null;
  }

  function watch() {
    if (!frame.watch || stage < 1) return;
    frame.watch.forEach(function (w, i) {
      var v = value(w.line);
      if (v === null) return;
      /* An indicator that turns early reads as a negative error, and a
         reading that is ninety one percent wrong is ninety one percent wrong
         in either direction, so some rows are watched on their size. */
      if (w.abs) v = Math.abs(v);
      var hit = w.over !== undefined ? v > w.over : v < w.under;
      if (hit && !armed[i]) {
        armed[i] = true;
        Sim.publish(name + ":mark", {
          kind: w.voice === undefined ? "forming" : "reading",
          voice: w.voice === undefined ? "shell" : w.voice,
          line: w.line, label: w.label, say: w.say, cool: !!w.cool,
          at: Date.now()
        });
      } else if (!hit && armed[i]) {
        /* a hysteresis band, so a value sitting on the threshold does not
           chatter. Ten percent of the threshold, or a tenth of a unit. */
        var band = Math.max(0.1, Math.abs(w.over !== undefined ? w.over : w.under) * 0.1);
        var clear = w.over !== undefined ? v < w.over - band : v > w.under + band;
        if (clear) armed[i] = false;
      }
    });
  }

  setInterval(watch, 250);


  if (window.Sim && Sim.subscribe) {
    Sim.subscribe(name + ":mark", function (d) {
      if (!d || !d.kind) return;
      var voice = d.voice === undefined ? VOICE[d.kind] : d.voice;
      if (voice) say(voice);
      light(d.line);
      addMark(d);
      if (d.kind === "handoff") sent(d);
      if (stage === 2) setStage(3);
    });
  }


  /* ----------------------------------------------------------------------
     BUTTONS, PANELS AND LEAVING
     ---------------------------------------------------------------------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".predict") || t.closest(".aud") ||
        t.closest("[data-sound-toggle]") || t.closest("[data-aud-open]") ||
        t.closest("[data-begin]") || t.closest("[data-everything]") ||
        t.closest("[data-resend]") || t.closest(".site-nav")) return;
    if (t.closest("button") || t.closest(".depth-btn") || t.closest(".stepper button")) {
      say("button");
    }
  }, true);

  $$("details").forEach(function (d) {
    d.addEventListener("toggle", function () { say(d.open ? "latch" : "unlatch"); });
  });

  function goAway(href) {
    if (!window.Snd || !Snd.enabled()) { location.href = href; return; }
    say("leave");
    if (window.Aud) Aud.stopBeds();
    setTimeout(function () { location.href = href; }, 220);
  }

  if (leave) leave.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    goAway(leave.getAttribute("href"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = $("details[open]");
    if (open) { open.open = false; return; }
    if (leave) leave.click();
  });


  /* ----------------------------------------------------------------------
     BRING IT UP

     The script that drives this simulation is loaded last and on purpose:
     everything it binds to is in the document by now, so it finds the same
     DOM it finds on the notebook and behaves identically.
     ---------------------------------------------------------------------- */
  var s = document.createElement("script");
  s.src = frame.script;
  s.defer = true;
  s.addEventListener("load", function () {
    var api = window.Sim && Sim.api ? Sim.api(name) : null;
    if (api && api.repalette) api.repalette();
    /* a link can carry a stage as well as a state */
    var want = parseInt(params.get("stage"), 10);
    if (isFinite(want) && want > 0) setStage(want, true);
  });
  document.body.appendChild(s);

  if (!reduced) {
    body.setAttribute("data-boot", "1");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.setAttribute("data-boot", "2"); });
    });
  }
})();
