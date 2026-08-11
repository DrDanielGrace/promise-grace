/* =========================================================================
   frames.js · what the frame needs to know about each simulation

   The markup for every simulation lives in a <template> in instrument.html,
   lifted verbatim out of the notebook rather than rewritten, so the DOM each
   lab-*.js binds to is the same DOM it has always bound to. Nothing about
   the physics, the readouts or the controls changes by being framed.

   What is here is only the part a frame cannot work out for itself: what to
   call it, where it came from, what result it hands on and to whom, and
   which of its controls is the one worth meeting first.

   PRIMARY CONTROL. The frame opens with one control and adds the rest
   later, so each simulation names the control that is worth having on its
   own. Where that is a slider it is given by its data attribute; where the
   simulation is really a set of choices it is given as a selector. Anything
   not named is a late control and arrives with everything else.
   ========================================================================= */

window.Frames = {

  nucleation: {
    title: "Nucleation, and why most crystals never happen",
    lead: "How rare a crystal actually is.",
    fig: "fig-nucleation",
    script: "lab-nucleation.js",
    /* A driven solution. How much is moving is how hard it is being driven,
       taken off the control rather than invented. */
    bed: { motion: { control: true } },
    /* A cluster has got across. The rate on screen is the measurement; this
       is the first time the count of survivors is not nought. */
    watch: [
      { line: "survived", over: 0.5, label: "FIRST SURVIVOR", cool: true,
        say: "One cluster has reached the critical radius and run away." }
    ],
    primary: "[data-s]",
    /* Publishes a survivor count that the crystal growth simulation uses to
       decide how many crystals are sharing the same solute. */
    sends: { to: "Crystal growth", what: "how many clusters survived",
             where: "instrument.html?sim=crystal" },
    marks: true
  },

  crystal: {
    title: "Crystal growth under variable gravity",
    lead: "Why taking gravity away makes a crystal grow slower rather than faster.",
    fig: "fig-crystal",
    script: "lab-crystal.js",
    /* Convection, and it is proportional to gravity. The simulation says so
       itself, so nothing is declared here. */
    bed: { motion: { api: true } },
    primary: "[data-g]",
    takes: { from: "Nucleation", what: "a seed count",
             where: "instrument.html?sim=nucleation" },
    sends: { to: "Powder diffraction", what: "a radius, and a declared strain proxy",
             where: "instrument.html?sim=diffraction" },
    marks: true
  },

  diffraction: {
    title: "Powder diffraction, and reading a pattern",
    lead: "How a structure is actually identified.",
    fig: "fig-diffraction",
    script: "lab-diffraction.js",
    /* A beam and a detector. Nothing in this one flows, so the bed is the
       room it is standing in and it does not move. */
    bed: { still: true },
    /* Small crystals give broad peaks. Ten nanometres is where the broadening
       stops being a correction and starts being the whole shape. */
    watch: [
      { line: "size", under: 10, label: "CRYSTALLITE 10 nm", cool: true,
        say: "Below about ten nanometres the peaks are wider than the lattice." }
    ],
    primary: "[data-size]",
    takes: { from: "Crystal growth", what: "a crystal",
             where: "instrument.html?sim=crystal" },
    marks: true
  },

  solidify: {
    title: "Solidification, and what a phase diagram is for",
    lead: "What a composition does to a microstructure.",
    fig: "fig-solidify",
    script: "lab-solidify.js",
    /* Hot liquid moves and cold solid does not, so the bed thins out as it
       cools. Read off the temperature that is already on the readout. */
    bed: { motion: { line: "temp", hi: 900, lo: 450 } },
    /* The first solid appears. Both numbers are already on the readout; this
       is the moment the falling one meets the fixed one. */
    watch: [
      { line: "eutectic", over: 0.5, label: "EUTECTIC FORMING", cool: true,
        say: "What is left of the liquid is now freezing as alternating stripes." }
    ],
    primary: "[data-c]",
    marks: true
  },

  titration: {
    title: "Titration, drop by drop",
    lead: "What picking the wrong indicator costs you.",
    fig: "fig-titration",
    script: "lab-titration.js",
    /* A flask with liquid in it, on a bench. There is always a little
       movement and it does not depend on anything, so it is held rather
       than pretended to track something. */
    bed: { motion: { fixed: 0.4 } },
    /* An indicator that turns in the wrong place. One percent is generous:
       the methyl orange case here reads ninety one percent early. */
    watch: [
      { line: "terror", over: 1, abs: true, label: "INDICATOR IS LYING", voice: "complete",
        say: "The reading and the equivalence point are more than one percent apart." },
      { line: "ph", over: 7, label: "PAST NEUTRAL", cool: true,
        say: "The steep part of the curve has gone by." }
    ],
    primary: "[data-vb]",
    marks: true
  },

  thinfilm: {
    title: "Thin film interference, and why a bubble has colours",
    lead: "Where a colour comes from when there is no pigment.",
    fig: "fig-thinfilm",
    script: "lab-thinfilm.js",
    /* Optics on a bench. Nothing moves. */
    bed: { still: true },
    /* The film has cancelled its own reflection, which is what an anti
       reflection coating is for. */
    watch: [
      { line: "r550", under: 0.5, label: "ANTI REFLECTION", cool: true,
        say: "Almost nothing is coming back at 550 nm." }
    ],
    primary: "[data-d]",
    marks: true
  },

  mof: {
    title: "A metal organic framework you can turn over",
    lead: "Why a wider pore is a worse sieve.",
    fig: "fig-mof",
    script: "lab-mof.js",
    /* A solid framework. Nothing moves. */
    bed: { still: true },
    /* The hole has opened far enough to stop being a sieve. */
    watch: [
      { line: "aperture", over: 5.5, label: "APERTURE 5.5 A", voice: "complete",
        say: "Wide enough that most of the gas list walks through it." }
    ],
    primary: "[data-l]",
    marks: true
  },

  thermo: {
    title: "Thermoelectrics, and the argument the field is having",
    lead: "Why the field is hard.",
    fig: "fig-thermo",
    script: "lab-thermo.js",
    /* A solid with heat going through it. Nothing moves. */
    bed: { still: true },
    /* ZT of one is the number the field quotes at each other. */
    watch: [
      { line: "zt", over: 1, label: "ZT 1", cool: true,
        say: "Worth building at. Most materials never get here." }
    ],
    primary: "[data-n]",
    marks: true
  }
};
