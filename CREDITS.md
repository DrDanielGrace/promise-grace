# Credits

Everything on this site that came from somewhere else, and where from.

---

## Sound

Three recordings. All three are from Mixkit, under the Mixkit Sound Effects
Free Licence, which allows commercial and non commercial use and does not
require attribution or an account. They are listed here anyway, because
saying where a thing came from costs nothing.

| File | Source | Mixkit id | Used for |
|---|---|---|---|
| `assets/sound/tap.mp3` | Mixkit, "Wine glass clink" | 2936 | Buttons and links |
| `assets/sound/page.mp3` | Mixkit, "Page turn single" | 1104 | Turning a page |
| `assets/sound/drop.mp3` | Mixkit, "Liquid bubble" | 3000 | A drop landing in the titration |

Licence: https://mixkit.co/license/#sfxFree

Each file was trimmed to the sound itself and nothing after it, by dropping
whole MPEG frames, so no re-encoding happened and nothing was degraded. The
three together come to 49 KB and none of them is fetched until sound is
switched on.

Nothing was taken from Freesound, so there is no attribution owed to anyone
and nothing that has to appear in the page.

### What is synthesised, and why it had to be

Five sounds are generated in the browser in `sound.js`. Not because nothing
suitable existed in a free library, but because each one has to carry a
number that changes:

- **The endpoint tone.** It has to go sour by exactly the amount you
  overshot the equivalence point by. A second voice is detuned against the
  first in proportion to the overshoot, so you hear the error rather than
  being told about it. A file plays the same every time and cannot do this.
- **The slider tick.** It has to be almost nothing, and vary, so a slider
  feels like an instrument.
- **The settle of a surviving nucleus.** Its pitch comes from the size of
  the cluster that survived.
- **The diffraction sonification.** Peak position becomes pitch and the
  computed peak width becomes how far the tone is smeared across detuned
  voices. It is the same three numbers the graph is drawn from.
- **The nucleation crackle.** One click per cluster that actually crosses
  the barrier. The rate is the computed nucleation rate. Clusters that
  dissolve are silent, and that silence is the information.

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
