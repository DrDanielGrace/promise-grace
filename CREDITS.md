# Credits

Everything on this site that came from somewhere else, and where from.

---

## Sound

Five recordings, all from Freesound, all released under **Creative Commons
Zero**, which places them in the public domain and requires no attribution.
Credited here regardless.

| File | Freesound | Uploader | What it is |
|---|---|---|---|
| `assets/sound/drop.mp3` | 667386, "droplet" | MasterSuite | A single droplet falling into water |
| `assets/sound/glass.mp3` | 506913, "Bottle_Clink" | schoman3 | One bottle touched against another |
| `assets/sound/paper.mp3` | 856497, "Turning page (heavy paper)" | xkeril | A hand turning a page of heavy paper |
| `assets/sound/stopper.mp3` | 578640, "Small Bottle Pop" | -GeorgeDiamond- | A small cork easing out of a bottle |
| `assets/sound/swirl.mp3` | 593790, "Liquid Swirl" | JalynCatbtg | Liquid moved around inside a glass |

Every one of these replaced a Mixkit sound that had been settled for. They
were chosen by measurement rather than by name: ninety three candidates were
downloaded, decoded in the browser, and scored on duration, decay, and the
ratio of energy below 700 Hz to energy above 5 kHz, which is the difference
between a recording with a body in it and one that is thin or tinny.
Anything that scored as glare with no body was rejected, which removed most
of the glass candidates, including several with more promising names.

### Nine more, for the instrument frame

The full screen instrument needs sounds the notebook never did, and the rule
is that no two different kinds of interaction may share a recording. A
button, a panel opening, a control appearing, arriving somewhere and leaving
it are five different physical events, so they are five different
recordings. Same again for the simulation: a shell forming, a run finishing
and a result being sent are three more.

All Creative Commons Zero, all from Freesound, all credited here anyway.

| File | Freesound | Uploader | What it is | Where it is used |
|---|---|---|---|---|
| `assets/sound/switch.mp3` | 348221, "Switch Light 02.wav" | tbrook | A light switch giving | A button |
| `assets/sound/latch.mp3` | 683414, "Hard_Latch_Open_Close_1" | SholeColtis | A latch coming free | A panel opening, and the same latch darkened and slowed for one closing |
| `assets/sound/cloth.mp3` | 624478, "Cloth - heavy - shake - run - trouser.wav" | ValentinPetiteau | Heavy cloth moving | A control appearing |
| `assets/sound/swell.mp3` | 24802, "timp_superball_mallet_5.flac" | spt3125 | A timpani rolled with a soft mallet | Arriving at the instrument |
| `assets/sound/shut.mp3` | 382666, "Close Cabinet Drawer_low pitch.wav" | bbrocer | A cabinet drawer closing | Leaving it |
| `assets/sound/settle.mp3` | 828577, "pour Coffee seed into plastic jar in a forest" | sszy | Seed poured into a jar | The depleted shell forming |
| `assets/sound/done.mp3` | 513665, "Crossbar Kiss Off.wav" | 115VAC | A telephone crossbar relay releasing | A run completing |
| `assets/sound/dispatch.mp3` | 398403, "Letter from a house letterbox" | Caitlin_100 | A letter going through a letterbox | The handoff firing |
| `assets/sound/water.mp3` | 342634, "Water in Movement" | paisagemsonoraunila | Water moving | The bed under a crystal growing with convection |
| `assets/sound/room.mp3` | 453551, "room tone medium soft with heater.flac" | kyles | Room tone with a heater in it | The bed that is left when the convection stops |

### Four more, for the laboratory

Under every page, from the moment sound is switched on. A working chemistry
laboratory with nobody doing anything loud is almost entirely ventilation
rather than glassware, so the bed is extraction and air handling, sourced as
a recording. A synthesised pad announces itself as one inside two seconds.

| File | Freesound | Uploader | What it is | Where it is used |
|---|---|---|---|---|
| `assets/sound/vent.mp3` | 108287, "computer_lab.mp3" | BugInTheSYS | Extraction and ventilation in a lab, a low fan with air moving in it | The bed under the whole site |
| `assets/sound/farglass.mp3` | 489731, "glass_set_down 03.wav" | ShadowSilhouette | A glass set down | Two benches away |
| `assets/sound/fardoor.mp3` | 152968, "007_door_closing.wav" | JL_barrett | A door closing | Somewhere else in the building |
| `assets/sound/fartap.mp3` | 383159, "Water from tap" | idabrandao | A tap running | In another room |

Eighty four ventilation candidates were measured, and the one that won did
so on its spectrum rather than its name. Two things separate air moving from
a transformer humming: how much energy sits in the mids relative to the low
end, and how steady it is. An "Electricity Ambience" measured beautifully
low and had nothing above 4 kHz at all, which is a hum and not a room. The
one that won carries its mids 10 dB down and its top 20 dB down from the
total rather than 33 and 41, which is broadband air, and it holds within
half a decibel across all forty five seconds of itself with no voices and no
events in it.

**It does not loop.** A loop long enough to hide its seam is a large file to
put on every page, and a seam you can hear kills the effect outright. So two
playheads take eleven second windows from random places in the thirty second
recording and hand over to each other with three and a half second equal
power crossfades. Ventilation is stationary noise, so a window from anywhere
in it is the same room, and because each window starts somewhere new there
is no period: no arrangement of the material recurs. Measured over fifty
seconds in half second windows: ninety nine windows, quietest -55.2 dBFS,
loudest -51.0, and not one drop out. A seam or a gap at either hand over
would have shown as a hole, and there is none.

The three distant sounds are the low quality Freesound previews rather than
the high, deliberately: they only ever play through an 820 Hz lowpass, so
there is nothing in the better file that could survive to be heard. That is
100 KB saved on every page for no audible difference.

### The levels, set against the bed rather than against silence

Silence is not a condition anyone will hear this site in, so balancing in it
was the wrong test. Measured at the last node before the speakers, with the
laboratory running, everything now sits in one ladder above the bed:

| | over the bed |
|---|---|
| a slider, atoms arriving | +13 to +15 dB |
| the nucleation tick | +18 dB |
| something in the next room | +12 to +15 dB |
| panels, controls appearing, page turns, buttons | +22 to +24 dB |
| glass, a drop, a cork, a mark, a handoff | +26 to +28 dB |
| arriving at an instrument, a run completing | +29 to +30 dB |

The bed itself is about -54 dBFS. The four faders start at 75, 75, 50 and 75.

Chosen the same way as the first five and on a wider field: **514
candidates** downloaded and decoded, each measured on duration, peak, RMS,
DC offset, decay from peak to twenty decibels down, time to the peak,
steadiness across quarter second windows, loop seam, and the same body
against glare ratio. The whole table is in `.physics/audition.csv` so the
choices can be checked rather than taken on trust.

What the measurements threw out, in order of how much they removed:

- **Thin.** Anything whose energy above 5 kHz beat its energy below 700 Hz
  went, which is most of what a search for "switch" returns. Fifty of the
  sixty switch candidates failed on this alone.
- **Clipped.** Peak at or over the ceiling.
- **Synthetic.** The best scoring swell on the numbers was called "Mechanical
  Synth Swell" and was rejected for exactly that reason. The timpani rolled
  with a superball mallet that replaced it is a real instrument in a real
  room and measures deeper anyway.
- **Wrong event.** A "Wood, Scratchy Hits, Metallic, Piano" scored well as a
  closing sound and is not one.
- **Not actually continuous.** For the two beds, anything whose loudness
  varied by more than about half across quarter second windows is an event
  pretending to be a bed. The two that won vary by three and four percent,
  and their heads and tails match to within a third of a decibel, which is
  why they loop without a seam.

Every file is cut on mp3 frame boundaries rather than re-encoded, so what
ships is byte for byte what Freesound served, inside the window that was
kept. Each window was set from the measured onset so that the transient
lands a few tens of milliseconds after the trigger: measured latency from
calling a sound to hearing it is 4 to 17 ms.

Total weight 1.2 MB. 530 KB of that is the two simulation beds, which are
not fetched at all unless a page actually asks for a bed, so switching sound
on costs 665 KB and a page with no simulation on it never pays for the rest.
Nothing at all is fetched until sound is switched on.

### What is synthesised

Only what cannot be a recording, and none of it is a note. Everything below
is a short burst of noise, filtered and shaped:

- the slider, which is a fingertip moving across paper, and which the four
  faders on the audio panel use too, because a fader is a slider and giving
  it a recording of its own would have been one more sample doing a job
  that was already taken
- the threshold knock, where going up is open and woody and coming back down
  is closed and dull, carried by darkness rather than by pitch
- the nucleation counter, a dry tick that gets darker and quieter as the
  barrier rises
- the shimmer of atoms arriving on a growing face

The one exception is the diffraction ring, which is pitched, because
sharpness genuinely is how long a thing rings and the sweep across a pattern
is the best thing the site does with sound.

Everything, recordings included, is mixed through a synthetic impulse. There
are three of them now rather than one, because there are three depth planes:
a tenth of a second for the interface, which sits close and almost dry; a
quarter of a second, the room with a bench in it, for events inside a
simulation; and a second and a third for the ambient beds, which sit at the
back with the top rolled off, because distance takes the top off things.
Each bus owns its own convolver rather than sharing one, so a fader only
ever moves the thing it names.

### What was thrown away, twice

First the click sound on every button and link, because it only told you
that you had clicked.

Then an entire earlier version of this file, which put every sound on a
pentatonic scale so that all of them could carry a number. It worked and it
was horrible: a bell struck over and over. A laboratory is glass, liquid,
paper and small mechanical things, not music. Texture comes first now and
information second, and where carrying a number made a sound uglier, the
number went and the sound stayed.

---

## Data

**ASTM G173-03 reference solar spectra**, global tilt, 37 degree tilted
surface. Downloaded from the National Renewable Energy Laboratory, derived
from SMARTS 2.9.2. 2002 wavelengths from 280 nm to 4000 nm.

Kept in the repository at `assets/astm-g173-am15g.csv` exactly as
downloaded, so anyone can check the arithmetic in `solar.js` against the
original rather than taking the rebinned table on trust.

Source: https://www.nrel.gov/grid/solar-resource/spectra-am1.5

Integrating the published global tilt column gives 1000.371 W per square
metre, which is the standard one sun figure.

---

## Fonts

Fraunces, Source Serif 4, Caveat and IBM Plex Mono, all served by Google
Fonts under the SIL Open Font Licence.

---

## Everything else

The writing, the physics, the notebook scans, the simulations and the code
are Promise Oluwatosin Grace's own work.
