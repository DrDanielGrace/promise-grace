/* =========================================================================
   structure.js · two small things that change whether people finish

   READING TIME. One quiet line near the top. It sounds like nothing and it
   measurably changes whether somebody starts. Counted from the actual words
   on the page rather than guessed, so it stays right as entries are added.

   A LINK TO EACH ENTRY. The anchors have always existed and nothing ever
   surfaced them. Professors forward things, and they forward the thing they
   were looking at, not the top of the page.
   ========================================================================= */

(function () {
  "use strict";

  var main = document.querySelector("main.sheet");
  if (!main) return;

  /* ----------------------------------------------------------------------
     READING TIME

     Words per minute is a range, not a number. 200 to 250 is the usual
     figure for adults reading for understanding, and this page is dense, so
     it uses 220 and rounds to five minutes. The simulations are not counted
     because time spent on those is not reading and depends entirely on how
     interested you are.
     ---------------------------------------------------------------------- */
  function words() {
    var n = 0;
    Array.prototype.slice.call(main.querySelectorAll(".entry-main, .cover"))
      .forEach(function (el) {
        var clone = el.cloneNode(true);
        Array.prototype.slice.call(
          clone.querySelectorAll("canvas, .lab, script, style, .nojs-note, noscript")
        ).forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
        var t = clone.textContent || "";
        n += t.split(/\s+/).filter(Boolean).length;
      });
    return n;
  }

  function readingTime() {
    var w = words();
    var mins = w / 220;
    var rounded = Math.max(5, Math.round(mins / 5) * 5);
    return { words: w, mins: rounded };
  }

  var cover = main.querySelector(".cover");
  if (cover) {
    var rt = readingTime();
    var p = document.createElement("p");
    p.className = "mono reading-time quiet";
    p.textContent = "About " + rt.mins + " minutes of reading, plus however long you " +
                    "spend playing with the simulations. You do not have to do it in order.";
    var links = cover.querySelector(".cover-links");
    if (links && links.parentNode) links.parentNode.insertBefore(p, links);
    else cover.appendChild(p);
  }

  /* ----------------------------------------------------------------------
     A LINK TO EACH ENTRY
     ---------------------------------------------------------------------- */
  var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);

  Array.prototype.slice.call(main.querySelectorAll(".entry")).forEach(function (entry) {
    if (!entry.id) return;
    var head = entry.querySelector(".entry-no");
    if (!head || head.querySelector(".entry-link")) return;

    var url = location.origin + location.pathname + "#" + entry.id;

    var wrap = document.createElement("span");
    wrap.className = "entry-link";

    if (canCopy) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "entry-link-btn";
      b.textContent = "Copy link";
      b.setAttribute("aria-label", "Copy a link to this entry");
      var msg = document.createElement("span");
      msg.className = "entry-link-msg hand";
      msg.setAttribute("role", "status");
      msg.setAttribute("aria-live", "polite");
      b.addEventListener("click", function () {
        navigator.clipboard.writeText(url).then(function () {
          msg.textContent = "copied";
          setTimeout(function () { msg.textContent = ""; }, 2400);
        }, function () {
          /* Refused, which happens on an insecure origin. Say so and give
             them the thing rather than pretending it worked. */
          msg.textContent = url;
        });
      });
      wrap.appendChild(b);
      wrap.appendChild(msg);
    } else {
      /* No clipboard API. A plain anchor still lets them right click and
         copy, which is what people did for twenty years. */
      var a = document.createElement("a");
      a.className = "entry-link-btn";
      a.href = "#" + entry.id;
      a.textContent = "Link to this entry";
      wrap.appendChild(a);
    }
    head.appendChild(wrap);
  });
})();
