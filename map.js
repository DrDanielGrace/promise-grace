/* =========================================================================
   map.js · what connects to what, declared once

   WHY THIS EXISTS

   Two problems, and they turned out to be the same problem.

   The first was counting. The homepage said fourteen entries, the contents
   page said fourteen, and the search index held thirteen, because the
   script that built it matched `<article class="entry" id=` and entry 12 is
   `class="entry entry-dated"`. Three files each counted separately and one
   of them was wrong, and nothing could tell.

   The second was that nothing on the site knew what anything else was
   about. The simulations page listed simulations. The notebook listed
   entries. Neither could say that the crystal growth simulation and entry
   01 are the same question asked twice, because that fact was not written
   down anywhere. A reader who finished one had no way to reach the other
   except by going back to the top.

   So: the relationships are declared here, once, and the counts fall out of
   the declarations rather than being typed. If a simulation is added and
   this file is not updated, the count does not change, which is a failure
   that is visible rather than a number that quietly goes stale.

   WHAT IS NOT HERE

   Prose. The simulations page carries a paragraph on each instrument that
   is worth reading and was written by hand, and the notebook carries the
   entries themselves. Moving that here would mean regenerating both pages
   from JavaScript, which would take the writing out of the markup and take
   the pages away from anyone reading without it. This file holds the
   skeleton. The pages keep the flesh.
   ========================================================================= */

window.Map17 = (function () {
  "use strict";

  /* ----------------------------------------------------------------------
     THE FIVE RESEARCH TOPICS

     Only topics the existing work actually supports. There is no topic here
     without at least one instrument and one piece of writing behind it, and
     nothing is listed as an interest that has nothing under it.
     ---------------------------------------------------------------------- */
  var TOPICS = [
    {
      id: "reduced-gravity",
      name: "Reduced gravity",
      question: "How does reduced gravity change the way materials form?",
      say: "The question the whole site is downstream of. Take away buoyancy " +
           "and you take away convection, and everything that depended on " +
           "fresh solution arriving has to happen by diffusion instead.",
      concepts: ["convection", "transport", "buoyancy", "Péclet number", "materials formation"],
      sims: ["crystal"],
      entries: ["question", "stalactite"],
      mission: [],
      related: ["crystal-formation", "structure"],
      accent: "brand"
    },
    {
      id: "crystal-formation",
      name: "Crystal formation",
      question: "What decides whether a crystal happens at all, and what it comes out like?",
      say: "Nucleation is the rare cluster that survives. Growth is what " +
           "happens to it afterwards. Solidification is the same argument " +
           "run on an alloy, where the phase diagram is the instruction sheet.",
      concepts: ["nucleation", "critical radius", "growth", "solidification",
                 "phase diagrams", "the lever rule", "eutectics"],
      sims: ["nucleation", "crystal", "solidify", "phase"],
      entries: ["question", "phase-diagrams"],
      mission: [],
      related: ["reduced-gravity", "structure"],
      accent: "lavender"
    },
    {
      id: "structure",
      name: "Structure and measurement",
      question: "How do you find out what a structure actually is?",
      say: "You cannot see a lattice. You measure where the X rays go and " +
           "work backwards, and the absences do as much of the identifying " +
           "as the peaks do.",
      concepts: ["diffraction", "Bragg's law", "unit cells", "systematic absences",
                 "Williamson-Hall", "crystallite size", "strain"],
      sims: ["diffraction", "bragg", "cells"],
      entries: ["question"],
      mission: ["viz-bragg", "viz-cells"],
      related: ["crystal-formation", "functional"],
      accent: "brand"
    },
    {
      id: "functional",
      name: "Functional materials",
      question: "What makes a material useful rather than merely interesting?",
      say: "Three of the five things on her research interests list, and each " +
           "one is a material designed around a single property: a hole of a " +
           "particular size, a wave cancelling itself, two conductivities " +
           "that will not both go the right way at once.",
      concepts: ["porous frameworks", "MOFs", "thin films", "interference",
                 "thermoelectrics", "figure of merit"],
      sims: ["mof", "thinfilm", "thermo"],
      entries: ["interests"],
      mission: [],
      related: ["solar", "structure"],
      accent: "orchid"
    },
    {
      id: "solar",
      name: "Solar materials",
      question: "Why can one solar cell never beat about a third of the sunlight it is given?",
      say: "The one she is teaching herself now, in public. It starts with the " +
           "measured spectrum rather than a sketch of one, and every loss in " +
           "the budget is integrated off that table.",
      concepts: ["band gaps", "the solar spectrum", "photon losses",
                 "Shockley-Queisser", "perovskites", "tandem cells"],
      sims: ["bandgap", "spectrum", "limit"],
      entries: [],
      mission: ["viz-bandgap", "viz-spectrum", "viz-limit"],
      related: ["functional", "structure"],
      accent: "gold"
    }
  ];

  /* ----------------------------------------------------------------------
     THE SEVENTEEN

     Seventeen interactive instruments, and the architecture underneath that
     number is not one thing. Eight run in the full screen instrument frame.
     Two live inside the notebook and have never had a frame. Seven belong
     to Mission Control and run on its own scheduler. The `home` field says
     which, because "seventeen simulations" with no further explanation is
     the kind of number that invites somebody to go and count.

     `status` is the honesty label and is the same vocabulary the pages use:
       computed     every number on the readout comes out of the equations
       measured     at least one number is integrated off a real table
       speculative  a prediction with no answer behind it yet
     ---------------------------------------------------------------------- */
  var SIMS = [
    { id: "nucleation", name: "Nucleation",
      q: "Can a cluster survive long enough to become a crystal?",
      home: "frame", href: "instrument.html?sim=nucleation",
      group: "crystal-formation", status: "computed",
      topic: "crystal-formation", entry: "question" },

    { id: "crystal", name: "Crystal growth",
      q: "Why does taking gravity away make a crystal grow slower?",
      home: "frame", href: "instrument.html?sim=crystal",
      group: "crystal-formation", status: "computed",
      topic: "reduced-gravity", entry: "question" },

    { id: "phase", name: "The phase diagram",
      q: "What is actually in the beaker at this point on the diagram?",
      home: "notebook", href: "notebook.html#fig-phase",
      group: "crystal-formation", status: "computed",
      topic: "crystal-formation", entry: "phase-diagrams" },

    { id: "solidify", name: "Solidification",
      q: "What does a composition do to a microstructure?",
      home: "frame", href: "instrument.html?sim=solidify",
      group: "crystal-formation", status: "computed",
      topic: "crystal-formation", entry: "phase-diagrams" },

    { id: "stalactite", name: "The stalactite",
      q: "A stalactite exists because gravity makes water drip. Take gravity away, and what forms?",
      home: "notebook", href: "notebook.html#fig-stal",
      group: "crystal-formation", status: "speculative",
      topic: "reduced-gravity", entry: "stalactite" },

    { id: "thinfilm", name: "Thin film interference",
      q: "Where does a colour come from when there is no pigment?",
      home: "frame", href: "instrument.html?sim=thinfilm",
      group: "light", status: "computed",
      topic: "functional", entry: "interests" },

    { id: "bandgap", name: "Band gaps",
      q: "Why is a material transparent to some light and not to other light?",
      home: "mission", href: "mission-planner-website/index.html#viz-bandgap",
      group: "light", status: "computed",
      topic: "solar", entry: null },

    { id: "spectrum", name: "Where the sunlight goes",
      q: "How much of the sun does a solar cell throw away before anything electrical happens?",
      home: "mission", href: "mission-planner-website/index.html#viz-spectrum",
      group: "light", status: "measured",
      topic: "solar", entry: null },

    { id: "limit", name: "The Shockley-Queisser limit",
      q: "Why can one solar cell never beat about a third?",
      home: "mission", href: "mission-planner-website/index.html#viz-limit",
      group: "light", status: "measured",
      topic: "solar", entry: null },

    { id: "thermo", name: "Thermoelectrics",
      q: "Why does improving one property of a thermoelectric damage the other?",
      home: "frame", href: "instrument.html?sim=thermo",
      group: "light", status: "computed",
      topic: "functional", entry: "interests" },

    { id: "diffraction", name: "Powder diffraction",
      q: "How is a structure actually identified?",
      home: "frame", href: "instrument.html?sim=diffraction",
      group: "structure", status: "computed",
      topic: "structure", entry: "question" },

    { id: "bragg", name: "Bragg's law",
      q: "What is a diffraction peak, before there is a pattern of them?",
      home: "mission", href: "mission-planner-website/index.html#viz-bragg",
      group: "structure", status: "computed",
      topic: "structure", entry: null },

    { id: "cells", name: "Unit cells",
      q: "How many atoms are actually inside a unit cell?",
      home: "mission", href: "mission-planner-website/index.html#viz-cells",
      group: "structure", status: "computed",
      topic: "structure", entry: null },

    { id: "mof", name: "A metal organic framework",
      q: "Why is a wider pore a worse sieve?",
      home: "frame", href: "instrument.html?sim=mof",
      group: "structure", status: "computed",
      topic: "functional", entry: "interests" },

    { id: "titration", name: "Titration",
      q: "What does picking the wrong indicator cost you?",
      home: "frame", href: "instrument.html?sim=titration",
      group: "bench", status: "computed",
      topic: "crystal-formation", entry: "titration" },

    { id: "ph", name: "Why the pH scale is logarithmic",
      q: "Why does the scale exist at all?",
      home: "mission", href: "mission-planner-website/index.html#viz-ph",
      group: "bench", status: "computed",
      topic: "functional", entry: "titration" },

    { id: "arrhenius", name: "Arrhenius, plotted twice",
      q: "What does linearising a curve actually buy you?",
      home: "mission", href: "mission-planner-website/index.html#viz-arrhenius",
      group: "bench", status: "computed",
      topic: "functional", entry: null }
  ];

  var GROUPS = {
    "crystal-formation": "Crystal formation",
    "light":             "Light and materials",
    "structure":         "Structure and measurement",
    "bench":             "Chemistry at the bench"
  };

  /* ----------------------------------------------------------------------
     THE FOURTEEN ENTRIES

     In the order they appear in the notebook, which is the order she wrote
     them in rather than a ranking. `kind` is the artefact label: what sort
     of thing the entry mostly is, so an index can say so without opening it.
     ---------------------------------------------------------------------- */
  var ENTRIES = [
    { id: "question",       n: "01", name: "The question",
      kind: "question",   say: "Why a crystal grown in space comes out cleaner than one grown here.",
      sims: ["nucleation", "crystal", "diffraction"], topic: "reduced-gravity" },
    { id: "phase-diagrams", n: "02", name: "Phase diagrams, properly explained",
      kind: "calculation", say: "A phase diagram is not a picture, it is a set of instructions.",
      sims: ["phase", "solidify"], topic: "crystal-formation" },
    { id: "titration",      n: "03", name: "A titration you can get wrong",
      kind: "observation", say: "Pick the wrong indicator and you read the endpoint ninety one percent early.",
      sims: ["titration"], topic: "crystal-formation" },
    { id: "the-study",      n: "04", name: "The study I ran",
      kind: "result",     say: "Her undergraduate research project, and what she now thinks was wrong with it.",
      sims: [], topic: null },
    { id: "stalactite",     n: "05", name: "The stalactite question",
      kind: "hypothesis", say: "A dated prediction with an empty box beside it, waiting for the answer.",
      sims: ["stalactite"], topic: "reduced-gravity" },
    { id: "explaining",     n: "06", name: "Explaining things",
      kind: "reflection", say: "Two years of finding out which explanations actually work.",
      sims: [], topic: null },
    { id: "projects",       n: "07", name: "Things I built for students",
      kind: "observation", say: "What she made when the equipment was not there.",
      sims: [], topic: null },
    { id: "bench",          n: "08", name: "At the bench",
      kind: "observation", say: "The practical work she runs, and what a small budget teaches you.",
      sims: [], topic: null },
    { id: "long-way-round", n: "09", name: "The long way round",
      kind: "reflection", say: "Her grades, said out loud rather than hidden. They went up every year.",
      sims: [], topic: null },
    { id: "training",       n: "10", name: "What I taught myself",
      kind: "reference",  say: "The Arizona State specialisation and the research methods course, every certificate linked.",
      sims: [], topic: null },
    { id: "interests",      n: "11", name: "What I want to work on",
      kind: "question",   say: "All five research interests, and what actually connects them.",
      sims: ["thinfilm", "mof", "thermo"], topic: "functional" },
    { id: "currently",      n: "12", name: "Currently",
      kind: "reflection", say: "What she is doing right now, dated so you can tell if it is stale.",
      sims: [], topic: null },
    { id: "notes",          n: "13", name: "Notes I send",
      kind: "reference",  say: "Occasional, short, and you can leave whenever you like.",
      sims: [], topic: null },
    { id: "contact",        n: "14", name: "Get in touch",
      kind: "reference",  say: "What she is applying for, when, and where.",
      sims: [], topic: null }
  ];

  /* ----------------------------------------------------------------------
     THE TWO CHAINS

     Five of the seventeen are not separate. A result computed in one is
     carried into the next and used there, which is the argument the whole
     set is making. The carried quantity is named, because a chain that does
     not say what it is handing on is a diagram rather than a mechanism.
     ---------------------------------------------------------------------- */
  var CHAINS = [
    {
      id: "crystal",
      name: "Crystal formation, end to end",
      say: "More survivors share the same solute, so each crystal finishes " +
           "smaller, and a smaller crystal gives broader peaks.",
      steps: [
        { sim: "nucleation", carry: "how many survived" },
        { sim: "crystal",    carry: "a radius, and a declared strain proxy" },
        { sim: "diffraction", carry: null }
      ],
      note: "The size that comes out of the diffraction is computed. The " +
            "strain that goes into it is a declared proxy, and both ends say so."
    },
    {
      id: "solar",
      name: "A solar cell, end to end",
      say: "Pick a gap on the measured spectrum, send it, and the two losses " +
           "you were just looking at reappear as the outer bands of the " +
           "efficiency budget.",
      steps: [
        { sim: "spectrum", carry: "a band gap" },
        { sim: "limit",    carry: null }
      ],
      note: "Integrated from the NREL reference table, not sketched."
    }
  ];

  /* ----------------------------------------------------------------------
     COUNTS

     Derived, never typed. Anything on the site that states a number reads
     it from here.
     ---------------------------------------------------------------------- */
  function homed(where) {
    return SIMS.filter(function (s) { return s.home === where; }).length;
  }

  var COUNTS = {
    sims:        SIMS.length,
    simsFramed:  homed("frame"),
    simsNotebook: homed("notebook"),
    simsMission: homed("mission"),
    entries:     ENTRIES.length,
    topics:      TOPICS.length,
    chains:      CHAINS.length,
    scans:       5   /* the handwritten pages in assets/scans, transcribed */
  };

  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven",
               "eight", "nine", "ten", "eleven", "twelve", "thirteen",
               "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
               "nineteen", "twenty"];

  function byId(list) {
    var m = {};
    list.forEach(function (x) { m[x.id] = x; });
    return m;
  }

  var simById = byId(SIMS), topicById = byId(TOPICS), entryById = byId(ENTRIES);

  return {
    TOPICS: TOPICS, SIMS: SIMS, ENTRIES: ENTRIES, CHAINS: CHAINS,
    GROUPS: GROUPS, COUNTS: COUNTS,

    sim:   function (id) { return simById[id]; },
    topic: function (id) { return topicById[id]; },
    entry: function (id) { return entryById[id]; },

    word:  function (n) { return WORDS[n] || String(n); },
    Word:  function (n) {
      var w = WORDS[n] || String(n);
      return w.charAt(0).toUpperCase() + w.slice(1);
    },

    /* Where a thing lives, said in words, because "seventeen simulations"
       is only honest if the page can also say where they are. */
    simsIn: function (where) {
      return SIMS.filter(function (s) { return s.home === where; });
    },
    simsOf: function (topicId) {
      return SIMS.filter(function (s) { return s.topic === topicId; });
    },
    entriesOf: function (topicId) {
      return ENTRIES.filter(function (e) { return e.topic === topicId; });
    }
  };
})();
