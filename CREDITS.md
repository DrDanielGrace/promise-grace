# Credits

Everything on this site that came from somewhere else, and where from.

---

## Sound

Three recordings, all from Mixkit, under the Mixkit Sound Effects Free
Licence, which allows commercial and non commercial use and requires no
attribution and no account. Recorded here anyway.

| File | Source | Mixkit id | Carries |
|---|---|---|---|
| `assets/sound/drop.wav` | Mixkit, "Water drop splashes in cave" | 3179 | A titration drop, pitched by how steep the curve is where it lands |
| `assets/sound/glass.wav` | Mixkit, "Wine glass clink" | 2936 | A surviving nucleus, struck at a pitch set by its size |
| `assets/sound/page.wav` | Mixkit, "Big paper page turn" | 1105 | A page turning, and this is the only one that plays flat |

Licence: https://mixkit.co/license/#sfxFree

All three replaced earlier choices that had been settled for. The old drop
was "Liquid bubble", which is a bubble swelling rather than a drop landing.
The old page turn was "Page turn single", a transient with no rustle in it
and encoded at 32 kbps. Freesound and Pixabay were checked for better
material and Mixkit had the closest recordings of the actual events, so
nothing is owed to anybody and nothing has to appear in the page.

Each file is trimmed to the event itself by finding where the sound rises
above four per cent of its peak and where it falls back under two, then
faded at both ends so the cut cannot add a click of its own. They ship as
22 kHz mono WAV rather than MP3, deliberately: at this length the file size
is the same, and a WAV needs no decoder, which is the cheapest way to keep
the gap between an action and its sound under fifty milliseconds. Measured
latency across every sound on the site is 0.1 to 1.9 ms.

Total weight 77 KB, and none of it is fetched until sound is switched on.

### What is synthesised, and why it has to be

Nothing here is synthesised for want of a recording. Each one carries a
number that moves, and a file plays the same every time.

- **The slider**, whose pitch is its position in its own range, quantised to
  the site's scale, so sweeping one plays a rising or falling run. It used to
  be a random pitch that told you only that you had moved something.
- **The threshold**, a rising pair of notes going up and the same pair
  falling coming down. Used for the Peclet number passing one, a cluster
  passing the critical radius, an indicator's range being entered, and a
  Bragg reflection coming into step.
- **The endpoint tone**, which beats against a detuned copy of itself in
  proportion to the titration error, in either direction, because the
  expensive mistake in that lab reads ninety one per cent low rather than
  high.
- **The nucleation counter**, whose click brightness is the computed barrier
  height. High barrier, rare dull clicks. Low barrier, dense and bright.
- **The diffraction sonification**, where ring time is sharpness. A narrow
  peak sustains on one voice, a wide one is over in a quarter of the time
  across eight detuned voices.
- **The growth shimmer**, pitched and paced by the computed growth rate.

### What was deleted

The glass tap that played on every button, link and disclosure. It told you
that you had clicked something, which you already knew, and it was the
loudest and most frequent sound on the site. Under the rule that a sound
must tell you something the screen has not, it did not qualify.


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
