/* =========================================================================
   search.js · finding a thing rather than scrolling to it

   WHAT IT LOOKS THROUGH

   The seventeen instruments and the quantities each one computes, the
   fourteen notebook entries, the seven explainer cards, the five scan
   transcriptions, the five research areas, and every destination on the
   site. Those transcriptions were the reason this exists: they are real
   handwriting, transcribed by hand, and nothing on the site surfaced them
   at all.

   This comment used to say thirteen notebook entries, and it said thirteen
   because the index genuinely held thirteen: the script that built it
   matched `<article class="entry" id=` and entry 12 is `class="entry
   entry-dated"`. The pattern is widened and build-search.py now checks its
   own counts against map.js and exits non-zero if they disagree, so a
   comment and an index cannot quietly drift apart again.

   The index is built from the pages by build-search.py rather than
   maintained alongside them, because an index maintained alongside a page
   is an index that eventually finds things that are no longer there.

   WEIGHT

   Under twenty kilobytes, and not one byte of it is fetched until somebody
   opens the search. The same rule the sound follows, for the same reason:
   most readers will never use it and none of them should pay for it.

   MATCHING

   Every word in the query has to appear somewhere in the row, in any order
   and in any field. Not fuzzy: a search that guesses is a search you cannot
   trust when it finds nothing. Where it matches, it says which field it
   matched in, so a hit on a quantity looks different from a hit on a title.
   ========================================================================= */

(function () {
  "use strict";

  /* A result says what kind of thing it is before it says its name, so a
     reader can tell a simulation from a notebook entry without opening it.
     That is the whole reason these are here rather than being one flat
     list of blue links. */
  var KIND = {
    simulation:    "SIMULATION",
    entry:         "NOTEBOOK ENTRY",
    card:          "EXPLAINER",
    transcription: "HANDWRITTEN SCAN",
    research:      "RESEARCH",
    mission:       "MISSION CONTROL",
    page:          "DESTINATION"
  };

  var rows = null, loading = false;
  var panel, input, results, count, open = false;

  function base() {
    return /mission-planner-website/.test(location.pathname) ? "../" : "";
  }

  /* Every colour here is a token. This panel used to be a hard coded dark
     box that appeared on top of a paper page, which made search the one
     part of the site that belonged to no theme and to no page. */
  function css() {
    if (document.getElementById("search-css")) return;
    var s = document.createElement("style");
    s.id = "search-css";
    s.textContent = [
      ".sf{position:fixed;inset:0;z-index:80;display:none;",
      "background:rgba(var(--shadow),0.55);padding:clamp(0.6rem,6vh,4rem) 0.7rem 0.7rem}",
      ".sf[data-open=\"1\"]{display:block}",
      ".sf-box{max-width:44rem;margin:0 auto;background:var(--surface);",
      "border:1px solid var(--rule);border-radius:var(--radius-lg);",
      "box-shadow:0 18px 60px rgba(var(--shadow),0.22);overflow:hidden}",
      ".sf-top{display:flex;align-items:stretch;border-bottom:1px solid var(--rule-soft)}",
      ".sf-top input{flex:1 1 auto;min-width:0;min-height:52px;padding:0.7rem 0.9rem;",
      "background:transparent;border:0;color:var(--ink);font:400 16px/1.3 var(--f-body)}",
      ".sf-top input:focus{outline:none}",
      ".sf-top button{min-height:52px;min-width:52px;background:transparent;border:0;",
      "color:var(--ink-far);font:400 11px/1 var(--f-mono);",
      "letter-spacing:0.09em;cursor:pointer}",
      ".sf-top button:hover{color:var(--brand)}",
      ".sf-count{padding:0.45rem 0.9rem;border-bottom:1px solid var(--rule-soft);",
      "background:var(--brand-wash);",
      "font:400 10px/1.4 var(--f-mono);letter-spacing:0.12em;color:var(--ink-far)}",
      ".sf-list{margin:0;padding:0;list-style:none;max-height:min(60vh,32rem);overflow-y:auto}",
      ".sf-list li{border-bottom:1px solid var(--rule-soft)}",
      ".sf-list li:last-child{border-bottom:0}",
      ".sf-list a{display:block;padding:0.7rem 0.9rem 0.7rem 0.75rem;text-decoration:none;",
      "min-height:44px;border-left:3px solid transparent}",
      ".sf-list a:hover,.sf-list a:focus{background:var(--brand-wash);",
      "border-left-color:var(--brand);outline:none}",
      /* the kind is what tells a simulation from a notebook entry before you
         press it, so it is coloured by the same hierarchy the rest of the
         site uses rather than being one accent for all four */
      ".sf-k{font:400 9px/1 var(--f-mono);letter-spacing:0.14em;color:var(--ink-far)}",
      ".sf-list a[data-k=\"simulation\"] .sf-k{color:var(--lavender-ink)}",
      ".sf-list a[data-k=\"entry\"] .sf-k,",
      ".sf-list a[data-k=\"transcription\"] .sf-k{color:var(--orchid-ink)}",
      ".sf-list a[data-k=\"mission\"] .sf-k{color:var(--gold-ink)}",
      ".sf-list a[data-k=\"card\"] .sf-k{color:var(--ink-far)}",
      ".sf-list a[data-k=\"research\"] .sf-k,",
      ".sf-list a[data-k=\"page\"] .sf-k{color:var(--brand)}",
      ".sf-t{display:block;margin:0.26rem 0 0;color:var(--ink);font:400 15px/1.35 var(--f-body)}",
      ".sf-s{display:block;margin:0.2rem 0 0;color:var(--ink-soft);font:400 12px/1.45 var(--f-body)}",
      ".sf-q{display:block;margin:0.28rem 0 0;color:var(--ink-far);",
      "font:400 9px/1.5 var(--f-mono);letter-spacing:0.1em}",
      ".sf-none{padding:1rem 0.9rem;color:var(--ink-soft);font:400 14px/1.5 var(--f-body)}",
      "@media (prefers-reduced-motion: reduce){.sf *{transition:none!important}}"
    ].join("");
    document.head.appendChild(s);
  }

  function build() {
    css();

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-tool";
    btn.setAttribute("data-search-open", "");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Search the site");
    btn.innerHTML = '<span class="nav-tool-mark" aria-hidden="true">⌕</span>' +
                    '<span class="nav-tool-word">Search</span>';

    panel = document.createElement("div");
    panel.className = "sf";
    panel.setAttribute("data-open", "0");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Search");
    panel.innerHTML =
      '<div class="sf-box">' +
      '<div class="sf-top">' +
      '<input type="search" autocomplete="off" spellcheck="false" ' +
      'aria-label="Search simulations, entries, cards and transcriptions" ' +
      'placeholder="A quantity, an entry, a word in her handwriting">' +
      '<button type="button" data-search-close>Close</button>' +
      "</div>" +
      '<p class="sf-count" data-search-count>Type to search.</p>' +
      '<ul class="sf-list" data-search-list></ul>' +
      "</div>";

    document.body.appendChild(panel);
    input = panel.querySelector("input");
    results = panel.querySelector("[data-search-list]");
    count = panel.querySelector("[data-search-count]");

    btn.addEventListener("click", function () { show(!open); });
    panel.querySelector("[data-search-close]").addEventListener("click", function () { show(false); });
    panel.addEventListener("click", function (e) { if (e.target === panel) show(false); });
    input.addEventListener("input", function () { run(input.value); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { show(false); return; }
      /* the usual key for this, and not while somebody is typing in
         a control belonging to a simulation */
      if (e.key === "/" && !open) {
        var t = e.target;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        e.preventDefault();
        show(true);
      }
    });

    /* The bar puts it where it belongs. If there is no bar it stays here,
       which is how the guide and the planner used to get it. */
    var tools = document.querySelector("[data-nav-tools]");
    if (tools) tools.insertBefore(btn, tools.firstChild);
    else document.body.appendChild(btn);
    document.dispatchEvent(new Event("search:ready"));
  }

  function show(next) {
    open = !!next;
    panel.setAttribute("data-open", open ? "1" : "0");
    var b = document.querySelector("[data-search-open]");
    if (b) b.setAttribute("aria-expanded", String(open));
    if (window.Aud && window.Snd && Snd.enabled()) Aud.play(open ? "latch" : "unlatch");
    if (open) { load(); input.focus(); input.select(); }
  }

  function load() {
    if (rows || loading) return;
    loading = true;
    fetch(base() + "search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { rows = j; loading = false; if (input.value) run(input.value); })
      .catch(function () {
        loading = false;
        count.textContent = "The index did not load.";
      });
  }

  /* Peclet is written with an accent on the readout and typed without one
     by everybody, so both sides are folded before they are compared. The
     same fold makes Angstrom findable. */
  function fold(s) {
    s = String(s || "").toLowerCase();
    return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s;
  }

  function run(q) {
    q = fold(q).trim();
    results.innerHTML = "";
    if (!q) { count.textContent = "Type to search."; return; }
    if (!rows) { count.textContent = "Loading."; return; }

    var words = q.split(/\s+/).filter(Boolean);
    var hits = [];

    rows.forEach(function (r) {
      var hay = fold(r.t + " " + r.s + " " + (r.q || []).join(" "));
      if (!words.every(function (w) { return hay.indexOf(w) >= 0; })) return;
      /* a title match outranks a body match, and a simulation outranks
         prose, because somebody searching "peclet" wants the instrument */
      var score = 0;
      var title = fold(r.t);
      words.forEach(function (w) {
        if (title.indexOf(w) >= 0) score -= 4;
        if (fold((r.q || []).join(" ")).indexOf(w) >= 0) score -= 2;
      });
      if (r.k === "simulation") score -= 1;
      /* A destination is a whole page and is almost never what somebody
         typing a word wants, so it sits below everything with content in
         it and is there for the reader who typed "cv". */
      if (r.k === "page") score += 2;
      hits.push({ r: r, score: score });
    });

    hits.sort(function (a, b) { return a.score - b.score; });

    count.textContent = hits.length
      ? hits.length + (hits.length === 1 ? " RESULT" : " RESULTS")
      : "NOTHING MATCHES ALL OF THOSE WORDS";

    if (!hits.length) {
      var none = document.createElement("li");
      none.innerHTML = '<p class="sf-none">Every word has to appear somewhere. ' +
                       'Try one word instead of three.</p>';
      results.appendChild(none);
      return;
    }

    hits.slice(0, 40).forEach(function (h) {
      var r = h.r;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = base() + r.u;
      a.setAttribute("data-k", r.k);

      var k = document.createElement("span");
      k.className = "sf-k";
      k.textContent = KIND[r.k] || r.k.toUpperCase();

      var t = document.createElement("span");
      t.className = "sf-t";
      t.textContent = r.t;

      a.appendChild(k);
      a.appendChild(t);

      if (r.s) {
        var s = document.createElement("span");
        s.className = "sf-s";
        s.textContent = r.s.length > 150 ? r.s.slice(0, 150) + "..." : r.s;
        a.appendChild(s);
      }
      if (r.q && r.q.length) {
        var qq = document.createElement("span");
        qq.className = "sf-q";
        qq.textContent = r.q.join("  ·  ");
        a.appendChild(qq);
      }
      li.appendChild(a);
      results.appendChild(li);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
