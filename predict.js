/* =========================================================================
   predict.js · commit to an answer before you touch it

   Rule 2.10 says predict before it runs, every time. Rule 2.1 says nothing
   is locked and nothing gates content behind progress. Both apply, so:

   the question sits above the simulation, the simulation runs whether or
   not anybody answers, and committing to an answer reveals what actually
   happens and does nothing else. Nothing is withheld until you have earned
   it. The point of predicting is that being wrong out loud is what makes
   the correction stick, which is the same reason her notes are full of red.

   The answer and both verdicts live here rather than in the markup, because
   the verdict gives the answer away and putting it in the served HTML means
   anybody curious can read it off before committing. The questions and the
   options are in index.html where they belong, keyed by the same name.
   ========================================================================= */

(function () {
  "use strict";

  var A = {
    nucleation: {
      right: "c",
      yes: "Right, and almost none is generous. The barrier sits in an exponential, so the survival share falls off a cliff as the supersaturation drops. Watch how many plain dots vanish for every ringed one that gets across.",
      no: "Almost none. Making a surface costs energy before being solid pays any of it back, so a small cluster is more likely to fall apart than to grow. Only the rare one that happens to reach the critical radius runs away. Push the slider up and watch the ringed ones become less rare."
    },
    crystal: {
      right: "b",
      yes: "Right, slower, and that is the whole answer. Nothing stirs, so it has to wait for solute to diffuse in, and waiting is what makes it come out even.",
      no: "Slower. Under gravity, convection never stops sweeping fresh solution past the crystal. Take that away and a depleted shell builds up around it, and it can only grow as fast as diffusion refills that shell. Watch the shaded ring as you drag gravity down."
    },
    diffraction: {
      right: "b",
      yes: "Right. The angles come from the spacing, which has not changed. The widths come from how far the order carries, which has.",
      no: "The peaks land at the same angles, because the angles come from the lattice spacing and that has not changed. What changes is the width. A small crystal has fewer planes to cancel out the almost-right angles, so its peaks smear. Drag the size down to four nanometres and watch."
    },
    phase: {
      right: "c",
      yes: "Right, both at once. That region is not a boundary you cross, it is a place you sit, with liquid and solid coexisting and their proportions set by where you are in it.",
      no: "Both at once. The two lines are not one freezing point smeared out. Between them, liquid and solid coexist, and the ratio is fixed by how far across the gap you are. That is what the lever rule is measuring, and it is why a phase diagram is a set of instructions rather than a picture."
    },
    solidify: {
      right: "b",
      yes: "Right, and the difference is enormous. One grows tree shaped crystals into the liquid, the other freezes as alternating stripes of two solids.",
      no: "No, and it is not subtle. Away from the eutectic you get dendrites, tree shaped crystals reaching into the remaining liquid. At the eutectic you get lamellae, alternating stripes of two solids growing together. Same alloy, same cooling, different composition, and a different material comes out."
    },
    titration: {
      right: "b",
      yes: "Right, and picking the wrong one is not a small error. Try methyl orange against the weak acid and read the number it gives you.",
      no: "Only if you picked the right one. An indicator turns over its own narrow pH range, and it only tells you the truth if that range sits inside the steep part of the curve. Put methyl orange against a weak acid here and it turns ninety one percent early, and the reading looks perfectly reasonable."
    },
    study: {
      right: "b",
      yes: "Right, and that is the thing I did not see at the time. I measured what students were willing to say about themselves, and I wrote it up as what they did.",
      no: "People answer what sounds good. A thousand is plenty, and the question reads clearly enough. What it cannot do is separate what somebody does from what somebody is happy to claim. I did not see that until I did the research methods course, and it is the main thing I would change."
    },
    stalactite: {
      right: "b",
      yes: "That is my guess too. Nothing sinks, so nothing settles preferentially downward, and the mineral should come out all round the bead. But I want to be straight with you: this is a prediction, not an answer. I have not found the paper and I do not know.",
      no: "I think it is a rounded shell, because nothing sinks and so nothing settles preferentially downward. But I am not going to pretend that is settled. It is a prediction, it is written down and dated below, and the box next to it is empty because I have not found the paper. If you know, the button underneath opens an email."
    },
    mof: {
      right: "a",
      yes: "Right, more gets through, and that is exactly the problem. A framework that lets everything through separates nothing.",
      no: "More gets through. The aperture is the cell edge less the van der Waals lining, and lengthening the strut widens it. The catch is that a wider hole is a worse sieve. Open it far enough and every gas on the list passes, which is its own kind of useless."
    },
    thermo: {
      right: "b",
      yes: "Right. The same electrons carry both, so most of the ways of improving one damage the other. That fight is the field.",
      no: "Hard, and it is the reason the field exists. In most materials the same electrons carry the charge and a good share of the heat, so making it conduct electricity better usually makes it conduct heat better too. Watch the two figures move as you dope it."
    },
    thinfilm: {
      right: "b",
      yes: "Right. One reflection off the front, one off the back, and whether they agree or cancel depends on the thickness and on the wavelength.",
      no: "The same wave arriving twice. Some light reflects off the front of the film and some off the back, and the back one has travelled further. At some wavelengths the two arrive in step and reinforce, at others they cancel. Drag the thickness and watch which colour survives."
    }
  };

  var SAID = {};   /* what this reader answered, in memory, never stored */

  Array.prototype.slice.call(document.querySelectorAll(".predict"))
    .forEach(function (p) {
      var key = p.getAttribute("data-predict");
      var a = A[key];
      if (!a) return;

      var result = p.querySelector(".predict-result");
      var buttons = Array.prototype.slice.call(p.querySelectorAll("button[data-a]"));

      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          var pick = b.getAttribute("data-a");
          var ok = pick === a.right;
          SAID[key] = pick;

          result.textContent = ok ? a.yes : a.no;
          result.className = "predict-result " + (ok ? "is-right" : "is-wrong");
          result.hidden = false;

          buttons.forEach(function (o) {
            o.setAttribute("aria-pressed", String(o === b));
            o.classList.toggle("is-chosen", o === b);
            /* Not disabled. Changing your mind is allowed, and a disabled
               control is one more thing a keyboard has to skip past. */
          });

          if (window.Snd && Snd.enabled()) {
            /* Right and wrong sound different, and wrong is not a buzzer.
               It is the same note, flattened. */
            Snd.tone(ok ? { f: 528, dur: 0.28, gain: 0.12 }
                        : { f: 396, dur: 0.36, gain: 0.11, sour: 0.06 });
          }
        });
      });
    });

  window.__predictions = SAID;
})();
