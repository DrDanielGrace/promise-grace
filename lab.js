/* =========================================================================
   lab.js · turning the catalogue into a gallery, without rewriting it

   THE DECISION THIS FILE IS

   The simulations index carried a paragraph on each instrument, written by
   hand, and every one of them is worth reading. The obvious way to build a
   visual gallery is to generate the whole page from a data file, and doing
   that would have taken seventeen good paragraphs out of the markup, put
   them inside a JavaScript string, and left the page blank for anybody
   reading without it.

   So the markup stays exactly as it was written, and what is added is added
   to it: the preview, the honesty tag, and the line saying which research
   area the instrument belongs to. Each item already carries a data-sim
   naming itself, and everything else is looked up in map.js.

   THE CHAINS

   These were four lines of prose near the bottom of the page. They are the
   strongest single idea on the site: run the first simulation and the last
   one changes, because a computed result is genuinely carried between them.
   That deserves to be seen rather than described, so the section is
   redrawn as two chains with the carried quantity named on each arrow, and
   every node in them opens the instrument it names.
   ========================================================================= */

(function () {
  "use strict";

  var M = window.Map17;
  if (!M) return;

  var STATUS = {
    computed:    ["COMPUTED", "tag-computed",
                  "Every number on the readout comes out of the equations."],
    measured:    ["MEASURED", "tag-measured",
                  "At least one quantity is integrated off a real reference table."],
    speculative: ["SPECULATIVE", "tag-spec",
                  "A dated prediction with nothing behind it yet."]
  };

  var WHERE = {
    frame:    ["FULL SCREEN", "Opens in the instrument frame."],
    notebook: ["IN THE NOTEBOOK", "Runs inside the notebook entry it belongs to."],
    mission:  ["ON MISSION CONTROL", "Runs inside the learning plan it belongs to."]
  };

  /* ----------------------------------------------------------------------
     THE CARDS
     ---------------------------------------------------------------------- */
  function dress() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-sim]"), function (li) {
      var id = li.getAttribute("data-sim");
      var s = M.sim(id);
      if (!s) return;

      var name = li.querySelector(".ix-name");
      if (!name) return;

      /* the preview goes above the name, so the eye reaches the object
         before it reaches the sentence about the object */
      if (window.Previews && Previews.has(id)) {
        var fig = document.createElement("div");
        fig.className = "ix-pv";
        fig.setAttribute("data-sim-pv", id);
        fig.innerHTML = Previews.svg(id);
        li.insertBefore(fig, li.firstChild);
      }

      /* the honesty tag and where it lives, on one line under the name */
      var st = STATUS[s.status], wh = WHERE[s.home];
      var bar = document.createElement("p");
      bar.className = "mono ix-tags";

      var tag = document.createElement("span");
      tag.className = "tag " + st[1];
      tag.textContent = st[0];
      tag.title = st[2];
      bar.appendChild(tag);

      if (wh) {
        var w = document.createElement("span");
        w.className = "ix-where";
        w.textContent = wh[0];
        w.title = wh[1];
        bar.appendChild(w);
      }

      var topic = M.topic(s.topic);
      if (topic) {
        var t = document.createElement("a");
        t.className = "ix-topic";
        t.href = "research.html#" + topic.id;
        t.textContent = topic.name;
        bar.appendChild(t);
      }
      name.parentNode.insertBefore(bar, name.nextSibling);

      /* the flag the markup already carried duplicates the "where" tag now */
      Array.prototype.forEach.call(li.querySelectorAll(".ix-flag"), function (f) {
        f.remove();
      });

      /* what to read after running it */
      if (s.entry) {
        var e = M.entry(s.entry);
        if (e) {
          var p = document.createElement("p");
          p.className = "mono ix-read";
          var a = document.createElement("a");
          a.href = "notebook.html#" + e.id;
          a.textContent = "Entry " + e.n + ", " + e.name;
          p.appendChild(document.createTextNode("THE WRITING BEHIND IT  "));
          p.appendChild(a);
          li.appendChild(p);
        }
      }
    });
  }

  /* ----------------------------------------------------------------------
     THE CHAINS

     Drawn rather than described. Each node is the instrument, each arrow
     carries the name of the quantity actually handed on, and the note at
     the end is the claim the chain is making.
     ---------------------------------------------------------------------- */
  function chains() {
    var host = document.querySelector("[data-chains]");
    if (!host) return;

    M.CHAINS.forEach(function (c) {
      var fig = document.createElement("figure");
      fig.className = "chain";
      fig.setAttribute("data-chain", c.id);

      var cap = document.createElement("figcaption");
      cap.className = "mono chain-head";
      cap.textContent = c.name;
      fig.appendChild(cap);

      var row = document.createElement("div");
      row.className = "chain-row";

      c.steps.forEach(function (step, i) {
        var s = M.sim(step.sim);
        if (!s) return;

        var a = document.createElement("a");
        a.className = "chain-node";
        a.href = s.href;
        a.setAttribute("data-status", s.status);

        if (window.Previews && Previews.has(s.id)) {
          var pv = document.createElement("span");
          pv.className = "chain-pv";
          pv.innerHTML = Previews.svg(s.id);
          a.appendChild(pv);
        }

        var nm = document.createElement("span");
        nm.className = "chain-name";
        nm.textContent = s.name;
        a.appendChild(nm);

        var q = document.createElement("span");
        q.className = "chain-q";
        q.textContent = s.q;
        a.appendChild(q);

        row.appendChild(a);

        if (step.carry) {
          var arrow = document.createElement("span");
          arrow.className = "chain-arrow";
          arrow.innerHTML = '<span class="chain-carry mono"></span>' +
                            '<span class="chain-tip" aria-hidden="true"></span>';
          arrow.querySelector(".chain-carry").textContent = step.carry;
          /* said in words too, because the arrow is a picture and the thing
             being carried is the whole point */
          arrow.setAttribute("aria-label",
            "carries " + step.carry + " to the next instrument");
          row.appendChild(arrow);
        }
      });

      fig.appendChild(row);

      var say = document.createElement("p");
      say.className = "chain-say";
      say.textContent = c.say;
      fig.appendChild(say);

      var note = document.createElement("p");
      note.className = "chain-note";
      note.textContent = c.note;
      fig.appendChild(note);

      host.appendChild(fig);
    });
  }

  /* ----------------------------------------------------------------------
     THE COUNTS AT THE TOP

     Read from map.js, and they say where the seventeen actually are,
     because "seventeen simulations" with no further explanation is the kind
     of number that invites somebody to go and count.
     ---------------------------------------------------------------------- */
  function counts() {
    var C = M.COUNTS;
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
      var n = C[el.getAttribute("data-count")];
      if (typeof n === "number") el.textContent = M.word(n);
    });
    /* The number beside each group heading, counted rather than typed. */
    Object.keys(M.GROUPS).forEach(function (g) {
      var head = document.querySelector("#" + g + " > h2 > span");
      if (!head) return;
      var n = M.SIMS.filter(function (s) { return s.group === g; }).length;
      head.textContent = M.word(n);
    });

    var run = document.querySelector("[data-run-id]");
    if (run) {
      run.textContent = C.sims + " INSTRUMENTS · " + C.simsFramed +
        " AT FULL SCREEN · " + C.simsMission + " ON MISSION CONTROL · " +
        C.simsNotebook + " IN THE NOTEBOOK";
    }
  }

  function go() {
    counts();
    dress();
    chains();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go);
  } else {
    go();
  }
})();
