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

Total weight 107 KB, and none of it is fetched until sound is switched on.

### What is synthesised

Only what cannot be a recording, and none of it is a note. Everything below
is a short burst of noise, filtered and shaped:

- the slider, which is a fingertip moving across paper
- the threshold knock, where going up is open and woody and coming back down
  is closed and dull, carried by darkness rather than by pitch
- the nucleation counter, a dry tick that gets darker and quieter as the
  barrier rises
- the shimmer of atoms arriving on a growing face

The one exception is the diffraction ring, which is pitched, because
sharpness genuinely is how long a thing rings and the sweep across a pattern
is the best thing the site does with sound.

Everything, recordings included, is mixed through a short synthetic impulse
about a quarter of a second long. It is the size of a room with a bench in
it. It is what stops five separate recordings sounding like five separate
recordings.

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
