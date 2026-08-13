"""Build the search index.

Everything searchable on this site is already written down somewhere in the
markup, so the index is extracted from the pages rather than maintained
beside them. Maintaining it beside them is how a search box ends up finding
things that are no longer there.

Run this after changing any page that carries one of the kinds below:

    python build-search.py

THE BUG THIS SCRIPT USED TO HAVE

The notebook entry pattern was `<article class="entry" id="..."`, and entry
12 is `class="entry entry-dated"`, so it was never matched. The index held
thirteen entries, the notebook had fourteen, and nothing anywhere compared
the two. The pattern below allows extra classes, and the count is asserted
against map.js at the end, so the same failure cannot happen quietly again.

WHAT IS INDEXED

    simulation      the seventeen, and the quantities each one computes
    entry           the fourteen notebook entries
    card            the explainer cards inside entry 06
    transcription   the five handwritten pages, transcribed by hand
    research        the five research areas
    page            the destinations that are not any of the above

The transcriptions were the original reason this exists: they are real
handwriting, transcribed by hand, and nothing on the site surfaced them.
"""
import io, json, re, os, sys

def read(p):
    return io.open(p, encoding="utf-8").read()

def text(html):
    html = re.sub(r"<(script|style)\b.*?</\1>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<[^>]+>", " ", html)
    html = (html.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">")
                .replace("&middot;", "·").replace("&hellip;", "..."))
    return re.sub(r"\s+", " ", html).strip()

rows = []

# ---- the simulations, straight off the Lab index ------------------------
sims = read("simulations.html")
for m in re.finditer(r'<li class="ix-item[^"]*"[^>]*>(.*?)</li>', sims, re.S):
    item = m.group(1)
    a = re.search(r'<p class="ix-name"><a href="([^"]+)">(.*?)</a>', item, re.S)
    if not a:
        continue
    find = re.search(r'<p class="ix-find">(.*?)</p>', item, re.S)
    meta = re.findall(r'<p class="mono ix-meta">(.*?)</p>', item, re.S)
    quant = re.findall(r"<span>([^<]+)</span>", item)
    rows.append({
        "k": "simulation",
        "t": text(a.group(2)),
        "u": a.group(1),
        "s": " ".join([text(find.group(1)) if find else ""] + [text(x) for x in meta]).strip(),
        "q": [q.strip() for q in quant if q.strip()],
    })

nb = read("notebook.html")

# ---- the explainer cards ------------------------------------------------
for m in re.finditer(r'<section class="card"[^>]*>(.*?)</section>', nb, re.S):
    card = m.group(1)
    h = re.search(r"<h[234][^>]*>(.*?)</h[234]>", card, re.S)
    if not h:
        continue
    section = nb.rfind('<article class="entry', 0, m.start())
    anchor = re.search(r'id="([a-z0-9-]+)"', nb[section:section + 120])
    rows.append({
        "k": "card",
        "t": text(h.group(1)),
        "u": "notebook.html#" + (anchor.group(1) if anchor else "explaining"),
        "s": text(card)[:220],
        "q": [],
    })

# ---- the scan transcriptions -------------------------------------------
for m in re.finditer(r'<details class="transcript" id="([^"]+)">(.*?)</details>', nb, re.S):
    tid, body = m.group(1), m.group(2)
    rows.append({
        "k": "transcription",
        # Every one of these has the same summary, "Read this page as text",
        # which is right on the page and useless in a list of results. The
        # id is what actually names it.
        "t": tid.replace("tr-", "").replace("-", " ").capitalize() + ", in her handwriting",
        "u": "notebook.html#" + tid,
        "s": text(re.sub(r"<summary[^>]*>.*?</summary>", "", body, flags=re.S))[:400],
        "q": [],
    })

# ---- the notebook entries ----------------------------------------------
#      The class list is allowed to carry more than "entry", which is the
#      whole of the bug this comment exists for: entry 12 is "entry
#      entry-dated" and was silently missing from every index built before
#      this line was widened.
entry_pat = r'<article class="entry[^"]*" id="([a-z0-9-]+)"(.*?)<h2[^>]*>(.*?)</h2>'
entries = 0
for m in re.finditer(entry_pat, nb, re.S):
    entries += 1
    body_start = m.end()
    body_end = nb.find("</article>", body_start)
    body = nb[body_start:body_end if body_end > 0 else body_start]
    rows.append({
        "k": "entry",
        "t": text(m.group(3)),
        "u": "notebook.html#" + m.group(1),
        # the first two paragraphs, so an entry is findable by what it says
        # rather than only by what it is called
        "s": text(body)[:260],
        "q": [],
    })

# ---- the research areas -------------------------------------------------
#      Read out of map.js, which is where they are declared, rather than out
#      of research.html, which renders them.
#
#      The concepts go in as quantities. Without them a search for
#      "perovskite" found nothing at all, which is absurd on a site whose
#      current status line is about perovskites: the word was declared under
#      the solar area and simply never indexed.
mp = read("map.js")
for m in re.finditer(
        r'id:\s*"([a-z-]+)",\s*\n\s*name:\s*"([^"]+)",\s*\n\s*question:\s*"([^"]+)"'
        r'(.*?)concepts:\s*\[(.*?)\]',
        mp, re.S):
    concepts = re.findall(r'"([^"]+)"', m.group(5))
    rows.append({
        "k": "research",
        "t": m.group(2),
        "u": "research.html#" + m.group(1),
        "s": m.group(3),
        "q": concepts,
    })

# ---- the Mission Control modules ----------------------------------------
#      Seven of the seventeen instruments live on that page, and the prose
#      around them was the largest unindexed body of writing on the site.
try:
    mc = read("mission-planner-website/index.html")
except IOError:
    mc = ""
for m in re.finditer(
        r'<article class="viz" id="(viz-[a-z]+)"[^>]*>(.*?)</article>', mc, re.S):
    vid, body = m.group(1), m.group(2)
    h = re.search(r"<h3[^>]*>(.*?)</h3>", body, re.S)
    if not h:
        continue
    # the prose, without the controls and the readouts, which are noise in a
    # list of search results
    prose = re.sub(r'<(figure|div class="viz-controls").*?</\1>', " ", body, flags=re.S)
    rows.append({
        "k": "mission",
        "t": text(h.group(1)),
        "u": "mission-planner-website/index.html#" + vid,
        "s": text(prose)[:300],
        "q": [],
    })

# ---- the destinations that are not any of the above ---------------------
PAGES = [
    ("The research", "research.html",
     "One question, the five areas underneath it, and the chain that connects them."),
    ("The Lab", "simulations.html",
     "Every instrument, grouped, with what each one computes and what it assumes."),
    ("The research notebook", "notebook.html",
     "Fourteen entries, with the working shown and the mistakes left in."),
    ("Mission Control", "mission-planner-website/index.html",
     "Teaching herself solar materials science in public. The plan, the progress, and what went wrong."),
    ("The research atlas", "contents.html",
     "Everything on this site and how it connects, with four routes through it."),
    ("Research CV", "cv.html",
     "Education, publication, training with every certificate linked, teaching and laboratory experience."),
    ("About Promise", "about.html",
     "Chemistry graduate, chemistry educator in Lagos, teaching herself materials science."),
    ("Archive", "archive.html",
     "The publication, the certificates, the handwritten pages and the reference data."),
    ("How to use this site", "guide.html",
     "Three ways in, the three depths every simulation has, and one question worked all the way through."),
]
for t, u, s in PAGES:
    rows.append({"k": "page", "t": t, "u": u, "s": s, "q": []})

io.open("search-index.json", "w", encoding="utf-8", newline="").write(
    json.dumps(rows, ensure_ascii=False, separators=(",", ":")))

kinds = {}
for r in rows:
    kinds[r["k"]] = kinds.get(r["k"], 0) + 1
print("search-index.json:", len(rows), "rows", kinds,
      "%.1f KB" % (os.path.getsize("search-index.json") / 1024))

# ---- the check that stops this drifting again ---------------------------
#      map.js declares how many there are. If this script finds a different
#      number, one of the two is wrong and it should be loud rather than
#      quiet, because quiet is exactly how the last one lasted.
def declared(name):
    m = re.search(r"var " + name + r" = \[(.*?)\n  \];", mp, re.S)
    if not m:
        return None
    # Exactly four spaces then a brace, which is a top level entry in the
    # array. A looser \s* also matches the nested step objects inside each
    # chain, and would count two chains as seven the moment this was used
    # for anything but SIMS and ENTRIES.
    return len(re.findall(r"\n    \{", m.group(1)))

want_entries = declared("ENTRIES")
want_sims = declared("SIMS")
found_sims = kinds.get("simulation", 0)

bad = False
if want_entries is not None and want_entries != entries:
    print("MISMATCH: map.js declares %d notebook entries, notebook.html has %d"
          % (want_entries, entries))
    bad = True
if want_sims is not None and want_sims != found_sims:
    print("MISMATCH: map.js declares %d simulations, simulations.html has %d"
          % (want_sims, found_sims))
    bad = True
if bad:
    sys.exit(1)
print("counts agree: %d entries, %d simulations" % (entries, found_sims))
