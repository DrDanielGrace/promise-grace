"""Build the search index.

Everything searchable on this site is already written down somewhere in the
markup, so the index is extracted from the pages rather than maintained
beside them. Maintaining it beside them is how a search box ends up finding
things that are no longer there.

Run this after changing any page that carries one of the four kinds:

    python build-search.py

Four kinds, which is exactly what the brief asks search to cover: the
simulations and the quantities they compute, the explainer cards in the
notebook, and the handwritten scan transcriptions, which exist and which
nothing else on the site surfaces.
"""
import io, json, re, os

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

# ---- the simulations, straight off the index ---------------------------
sims = read("simulations.html")
for m in re.finditer(r'<li class="ix-item[^"]*">(.*?)</li>', sims, re.S):
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

# ---- the explainer cards ------------------------------------------------
nb = read("notebook.html")
for m in re.finditer(r'<section class="card"[^>]*>(.*?)</section>', nb, re.S):
    card = m.group(1)
    h = re.search(r"<h[234][^>]*>(.*?)</h[234]>", card, re.S)
    if not h:
        continue
    section = nb.rfind('<article class="entry" id="', 0, m.start())
    anchor = re.search(r'id="([a-z0-9-]+)"', nb[section:section + 80])
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
    summary = re.search(r"<summary[^>]*>(.*?)</summary>", body, re.S)
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

# ---- the notebook entries, because a search that cannot find an entry
#      is a search that sends people back to scrolling --------------------
for m in re.finditer(r'<article class="entry" id="([a-z0-9-]+)"(.*?)<h2[^>]*>(.*?)</h2>', nb, re.S):
    rows.append({
        "k": "entry",
        "t": text(m.group(3)),
        "u": "notebook.html#" + m.group(1),
        "s": "",
        "q": [],
    })

io.open("search-index.json", "w", encoding="utf-8", newline="").write(
    json.dumps(rows, ensure_ascii=False, separators=(",", ":")))

kinds = {}
for r in rows:
    kinds[r["k"]] = kinds.get(r["k"], 0) + 1
print("search-index.json:", len(rows), "rows", kinds,
      "%.1f KB" % (os.path.getsize("search-index.json") / 1024))
