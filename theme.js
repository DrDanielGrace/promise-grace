/* =========================================================================
   theme.js · light, dark, or whatever the machine already decided

   THREE STATES, NOT TWO

   A two state switch has to pick a starting side, and whichever it picks is
   wrong for half of the people who arrive. So the third state, "system", is
   the one nobody chose, and it is the state everybody starts in. Pressing
   the control moves through system, light, dark and back, and the label
   says which of the three is in force rather than which one pressing it
   would produce, because a control that lies about its own state is worse
   than no control.

   THE FLASH

   A theme applied on DOMContentLoaded is a theme applied after the browser
   has already painted the wrong one. This file is therefore loaded without
   defer, in the head, and does its only urgent job, setting the attribute,
   before anything renders. Building the button waits for the body like
   everything else.

   WHY STORAGE, ON A SITE THAT AVOIDS IT

   Everything else here is deliberately held in the address bar so a link
   carries the state. That is right for a simulation's settings, which
   belong to the thing being shown. It is wrong for a theme, which belongs
   to the person looking, and a theme that resets on every navigation is not
   a preference, it is a nuisance. One key, one word, and the site works
   identically when the write throws.
   ========================================================================= */

(function () {
  "use strict";

  var KEY = "pg-theme";
  var ORDER = ["system", "light", "dark"];

  var LABEL = {
    system: "Theme: auto",
    light:  "Theme: light",
    dark:   "Theme: dark"
  };

  /* The switch, drawn rather than typed, so it carries its state without a
     word next to it at narrow widths. Half filled for system, open for
     light, filled for dark. */
  var MARK = { system: "◐", light: "○", dark: "●" };

  function read() {
    try {
      var v = window.localStorage.getItem(KEY);
      return ORDER.indexOf(v) >= 0 ? v : "system";
    } catch (e) { return "system"; }
  }

  function write(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) {}
  }

  var state = read();

  function apply(v, animate) {
    var root = document.documentElement;
    if (!animate) root.setAttribute("data-theme-changing", "");
    if (v === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", v);
    if (!animate) {
      /* two frames, so the paint that carries the new palette is the one
         with transitions off rather than the one after it */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.removeAttribute("data-theme-changing");
        });
      });
    }
  }

  /* The urgent half, run at parse time. */
  apply(state, true);

  /* ----------------------------------------------------------------------
     THE CONTROL

     Adopted into the navigation bar if there is one, and left where it
     stands if there is not, which is what makes this work on a page that
     has not been given the bar yet.
     ---------------------------------------------------------------------- */
  function build() {
    if (document.querySelector("[data-theme-toggle]")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-theme-toggle", "");
    btn.className = "nav-tool";

    var mark = document.createElement("span");
    mark.className = "nav-tool-mark";
    mark.setAttribute("aria-hidden", "true");

    var word = document.createElement("span");
    word.className = "nav-tool-word";

    btn.appendChild(mark);
    btn.appendChild(word);

    function paint() {
      mark.textContent = MARK[state];
      word.textContent = state === "system" ? "Auto"
                       : state === "light"  ? "Light" : "Dark";
      btn.setAttribute("aria-label", LABEL[state] + ". Press to change.");
      btn.title = LABEL[state];
    }
    paint();

    btn.addEventListener("click", function () {
      state = ORDER[(ORDER.indexOf(state) + 1) % ORDER.length];
      write(state);
      apply(state, false);
      paint();
      if (window.Aud && window.Snd && Snd.enabled()) Aud.play("switch");
      document.dispatchEvent(new CustomEvent("theme:change", { detail: state }));
    });

    var tools = document.querySelector("[data-nav-tools]");
    if (tools) tools.appendChild(btn);
    else document.body.appendChild(btn);

    document.dispatchEvent(new Event("theme:ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }

  /* Anything that draws to a canvas needs telling, because a canvas holds
     the pixels it was given and does not restyle itself. */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () {
      if (state === "system") {
        document.dispatchEvent(new CustomEvent("theme:change", { detail: "system" }));
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  window.Theme = {
    get: function () { return state; },
    dark: function () {
      if (state === "dark") return true;
      if (state === "light") return false;
      return !!(window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  };
})();
