"""Estrae i contenuti editoriali dalle pagine salvate e produce:

  src/content/pages/<slug>.json    un documento per pagina, a blocchi tipizzati
  src/content/manifest.json        indice completo con conteggi e hash
  migration/extraction-report.json diagnostica per pagina

Uso: python migration/extract.py
"""
import sys
import json
import hashlib
import re
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
from lxml import html as LH

ROOT = Path(".").resolve()
SRC = ROOT / "migration/source/pages"
PAGES_OUT = ROOT / "src/content/pages"
MANIFEST = ROOT / "src/content/manifest.json"
REPORT = ROOT / "migration/extraction-report.json"

STATE = ROOT / "migration/crawl-progress.json"

# tag che emettono un blocco: se presenti, il contenitore non emette testo proprio
BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "table", "details"}

# componenti a tessera: vanno spezzati in parti, non fusi in un paragrafo
CARD_CLASSES = {"event-card", "chapter-card", "omelia-box", "sys", "facet", "card"}

HEAD_TAGS = {"h1": 1, "h2": 2, "h3": 3, "h4": 4, "h5": 5, "h6": 6}

# classi che identificano un ruolo tipografico per i contenitori di solo testo
ROLE_HINTS = [
    ("sec-num", "label"),
    ("card-num", "num"),
    ("card-title", "sub"),
    ("nc-label", "label"),
    ("nc-title", "sub"),
    ("mov-label", "label"),
    ("mov-head", "sub"),
    ("ev-m-label", "label"),
    ("ev-m-val", "value"),
    ("ch-kicker", "label"),
    ("ch-sub", "sub"),
    ("tag", "label"),
    ("chip2", "label"),
    ("era-label", "sub"),
    ("s-label", "label"),
    ("acc-head", "sub"),
    ("card-title", "sub"),
    ("card-body", "p"),
    ("ct", "label"),
    ("src", "label"),
    ("verse", "verse"),
    ("quote", "quote"),
    ("lede", "lede"),
    ("sub", "lede"),
]


def norm(s):
    if s is None:
        return ""
    s = s.replace("\u00a0", " ").replace("\u200b", "")
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\s*\n\s*", " ", s)
    return s.strip()


def class_of(el):
    return (el.get("class") or "").lower()


def role_of(el):
    cls = class_of(el)
    for token, role in ROLE_HINTS:
        if token in cls.split():
            return role
    return "p"


def runs_of(el):
    """Testo inline con grassetti/corsivi preservati come segmenti.

    Gli spazi ai confini tra elementi inline NON vengono tagliati: è ciò che
    tiene separate le parole quando un <strong> spezza la frase.
    """
    out = []

    def push(text, bold=False, italic=False):
        if not text:
            return
        t = re.sub(r"[\s\u00a0\u200b]+", " ", text)
        if not t:
            return
        if out and out[-1].get("b", False) == bold and out[-1].get("i", False) == italic:
            out[-1]["t"] += t
        else:
            seg = {"t": t}
            if bold:
                seg["b"] = True
            if italic:
                seg["i"] = True
            out.append(seg)

    def walk(node, bold=False, italic=False):
        if node.text:
            push(node.text, bold, italic)
        for child in node:
            if not isinstance(child.tag, str):
                if child.tail:
                    push(child.tail, bold, italic)
                continue
            tag = child.tag
            if tag == "br":
                push(" ", bold, italic)
            elif tag == "strong":
                walk(child, True, italic)
            elif tag == "em":
                walk(child, bold, True)
            elif tag == "a":
                walk(child, bold, italic)
            elif tag in ("span", "sup", "sub", "small"):
                walk(child, bold, italic)
            else:
                walk(child, bold, italic)
            if child.tail:
                push(child.tail, bold, italic)

    walk(el)
    if out:
        out[0]["t"] = out[0]["t"].lstrip()
        out[-1]["t"] = out[-1]["t"].rstrip()
        out = [r for r in out if r["t"]]
        # non duplicare lo spazio al confine tra due run
        for prev, nxt in zip(out, out[1:]):
            if prev["t"].endswith(" ") and nxt["t"].startswith(" "):
                nxt["t"] = nxt["t"].lstrip()
        out = [r for r in out if r["t"]]
    return out


def text_of(el):
    return norm("".join(r["t"] for r in runs_of(el)))


DECOR = "▾▼►▶◀◂←→↑↓·•◆◇☨⚔✝✦"


def clean_text(t):
    if not t:
        return ""
    t = t.strip()
    t = re.sub(r"^[" + DECOR + r"\s]+", "", t)
    t = re.sub(r"[" + DECOR + r"\s]+$", "", t)
    return norm(t)


def leaf_texts(el):
    """Testi foglia in ordine: evita le parole incollate dai layout a griglia."""
    out = []

    def walk(node):
        kids = [c for c in node if isinstance(c.tag, str)]
        if not kids:
            t = clean_text(text_of(node))
            if t:
                out.append(t)
            return
        if node.text and norm(node.text):
            t = clean_text(node.text)
            if t:
                out.append(t)
        for c in kids:
            walk(c)
            if c.tail and norm(c.tail):
                t = clean_text(c.tail)
                if t:
                    out.append(t)

    walk(el)
    return [t for t in out if t]


def card_parts(el):
    """Parti della tessera: una per figlio, con le foglie separate da spazio."""
    parts = []
    for c in el:
        if not isinstance(c.tag, str):
            continue
        t = " ".join(leaf_texts(c)) or clean_text(text_of(c))
        if t:
            parts.append(t)
    return parts


def has_block_desc(el):
    for d in el.iterdescendants():
        if isinstance(d.tag, str) and d.tag in BLOCK_TAGS:
            return True
    return False


STRUCTURAL = {"div", "section", "article", "figure", "li", "table", "ul", "ol", "dl", "blockquote", "details"}


def has_structural_child(el):
    """Vero se contiene figli che sono contenitori (non solo inline)."""
    for c in el:
        if isinstance(c.tag, str) and c.tag in STRUCTURAL:
            return True
    return False


def is_ignored(el):
    cls = class_of(el)
    tokens = cls.split()
    if el.get("id") == "progress":
        return True
    if "nav-cards" in cls or "nav-card" in tokens or "mobile-overlay" in cls:
        return True
    if el.tag in ("script", "style", "noscript", "button"):
        return True
    return False


def walk_blocks(el, out):
    """Percorre in ordine di documento ed emette blocchi senza duplicare testo."""
    for child in el:
        if not isinstance(child.tag, str) or is_ignored(child):
            continue

        tag = child.tag
        cls = class_of(child)

        # componenti a tessera: atomici, prima di qualsiasi discesa
        card_cls = next((c for c in CARD_CLASSES if c in cls.split()), None)
        if card_cls and len(child):
            parts = card_parts(child)
            if parts:
                out.append({"type": "card", "role": card_cls, "parts": parts})
                continue

        # testo iniziale del contenitore, prima dei figli
        if child.text and norm(child.text) and len(child) and tag not in ("p", "h1", "h2", "h3", "h4", "li", "td", "th"):
            r = runs_of_container_lead(child)
            if r:
                out.append({"type": "p", "role": "p", "runs": r})

        if tag in HEAD_TAGS:
            r = runs_of(child)
            if r:
                out.append({"type": "h", "level": HEAD_TAGS[tag], "runs": r, "role": role_of(child)})

        elif tag == "p":
            r = runs_of(child)
            if r:
                out.append({"type": "p", "role": role_of(child), "runs": r})

        elif tag in ("ul", "ol"):
            items = []
            for li in child.findall("li"):
                r = runs_of_li(li)
                if r:
                    items.append(r)
            if items:
                out.append({"type": "list", "ordered": tag == "ol", "items": items, "role": "references" if "refer" in cls else "list"})
            # eventuali liste annidate
            for li in child.findall("li"):
                for nested in li.findall("ul") + li.findall("ol"):
                    walk_blocks_wrap(nested, out)

        elif tag == "blockquote" or "quote" in cls.split():
            r = runs_of(child)
            if r:
                out.append({"type": "quote", "runs": r})

        elif tag == "table":
            head_rows, body_rows = [], []
            for tr in child.iter("tr"):
                cell_els = [c for c in tr if isinstance(c.tag, str) and c.tag in ("td", "th")]
                cells = [text_of(c) for c in cell_els]
                if not any(cells):
                    continue
                if cell_els and all(c.tag == "th" for c in cell_els):
                    head_rows.append(cells)
                else:
                    body_rows.append(cells)
            if head_rows or body_rows:
                out.append({"type": "table", "head": head_rows, "rows": body_rows})

        elif tag == "details":
            summary = child.find("summary")
            if summary is not None:
                r = runs_of(summary)
                if r:
                    out.append({"type": "h", "level": 4, "runs": r, "role": "sub"})
            walk_blocks(child, out)

        elif tag == "div" and has_block_desc(child):
            walk_blocks(child, out)

        else:
            # contenitore di solo testo (o foglia): emette un blocco con il suo testo
            if has_block_desc(child) or has_structural_child(child):
                walk_blocks(child, out)
            else:
                r = runs_of(child)
                if r:
                    out.append({"type": "p", "role": role_of(child), "runs": r})


def walk_blocks_wrap(el, out):
    walk_blocks(el, out)


def runs_of_container_lead(el):
    """Il testo diretto di un contenitore, senza i figli."""
    if not el.text:
        return []
    t = norm(el.text)
    return [{"t": t}] if t else []


def runs_of_li(li):
    """Testo della voce di lista, esclusi gli eventuali sotto-elenchi."""
    parts = []
    if li.text and norm(li.text):
        parts.append({"t": norm(li.text)})
    for child in li:
        if not isinstance(child.tag, str):
            continue
        if child.tag in ("ul", "ol"):
            continue
        parts.extend(runs_of(child))
        if child.tail and norm(child.tail):
            parts.append({"t": norm(child.tail)})
    # fondi i segmenti adiacenti con la stessa formattazione
    merged = []
    for seg in parts:
        if merged and merged[-1].get("b") == seg.get("b") and merged[-1].get("i") == seg.get("i"):
            merged[-1]["t"] = (merged[-1]["t"] + " " + seg["t"]).strip()
        else:
            merged.append(seg)
    return merged


def page_meta(doc, url_path):
    body = doc.body
    sections = [el for el in body if isinstance(el.tag, str) and el.tag == "section"]
    hero = sections[0] if sections else None

    title = ""
    kicker = ""
    lede = ""
    if hero is not None:
        h = hero.find(".//h1")
        if h is not None:
            title = text_of(h)
        sub = hero.find(".//p[@class='sub']")
        if sub is not None:
            lede = text_of(sub)
        else:
            first_p = hero.find(".//p")
            if first_p is not None:
                lede = text_of(first_p)
        num = hero.find(".//span[@class='sec-num']")
        if num is not None:
            kicker = text_of(num)
    if not title:
        secs = doc.xpath(".//div[contains(@class,'sec-head')]")
        sec = secs[0] if secs else None
        if sec is not None:
            h = sec.find(".//h2")
            if h is not None:
                title = text_of(h)
            nums = sec.xpath(".//span[contains(@class,'sec-num')]")
            if nums:
                kicker = text_of(nums[0])

    prev_next = []
    for a in doc.iter("a"):
        cls = class_of(a)
        if "nav-card" not in cls.split():
            continue
        labels = a.xpath(".//div[contains(@class,'nc-label')]")
        titles = a.xpath(".//div[contains(@class,'nc-title')]")
        prev_next.append(
            {
                "label": text_of(labels[0]) if labels else "",
                "title": text_of(titles[0]) if titles else "",
                "href": a.get("href", ""),
            }
        )

    refs = []
    footer = doc.find(".//footer")
    if footer is not None:
        for div in footer.iter("div"):
            h4 = div.find("h4")
            if h4 is not None and "riferiment" in text_of(h4).lower():
                ul = div.find("ul")
                if ul is not None:
                    for li in ul.findall("li"):
                        t = text_of(li)
                        if t:
                            refs.append(t)

    return title, kicker, lede, prev_next, refs


def main_content(doc):
    body = doc.body
    out = []
    for el in body:
        if not isinstance(el.tag, str):
            continue
        if el.tag in ("nav", "footer", "script", "style"):
            continue
        if is_ignored(el):
            continue
        out.append(el)
    return out


def main():
    PAGES_OUT.mkdir(parents=True, exist_ok=True)
    (ROOT / "migration").mkdir(exist_ok=True)

    progress = json.loads(STATE.read_text(encoding="utf-8"))
    pages = {p["slug"]: p for p in progress["pages"].values() if p.get("status") == 200 and p.get("bytes")}

    docs = []
    report = []
    total_blocks = 0
    total_chars = 0

    for slug, info in sorted(pages.items()):
        path = SRC / f"{slug}.html"
        if not path.exists():
            report.append({"slug": slug, "error": "file mancante"})
            continue

        raw = path.read_text(encoding="utf-8", errors="replace")
        doc = LH.fromstring(raw)
        title, kicker, lede, prev_next, refs = page_meta(doc, info["url"])

        blocks = []
        for region in main_content(doc):
            walk_blocks(region, blocks)

        # deduplica blocchi identici adiacenti prodotti da wrapper ripetuti
        clean = []
        for b in blocks:
            key = json.dumps(b, ensure_ascii=False, sort_keys=True)
            if clean and json.dumps(clean[-1], ensure_ascii=False, sort_keys=True) == key:
                continue
            clean.append(b)

        text = " ".join(
            " ".join(r["t"] for r in (b.get("runs") or []))
            or " ".join(" ".join(r["t"] for r in it) for it in b.get("items", []))
            or " ".join(" ".join(row) for row in b.get("rows", []))
            or " ".join(b.get("parts", []))
            for b in clean
        )
        norm_text = re.sub(r"\s+", " ", text).strip()
        digest = hashlib.sha256(norm_text.encode("utf-8")).hexdigest()

        segments = info["url"].replace("https://precious-cassata-42205a.netlify.app", "").strip("/")
        parts = segments.split("/") if segments else []
        category = parts[0] if parts else "home"

        out = {
            "id": slug,
            "slug": segments or "",
            "sourceUrl": info["url"],
            "title": title or info.get("title") or slug,
            "kicker": kicker,
            "lede": lede,
            "category": category,
            "parentId": ("/".join(parts[:-1]) or None) if len(parts) > 1 else None,
            "blocks": clean,
            "prevNext": prev_next,
            "references": refs,
            "stats": {
                "blocks": len(clean),
                "chars": len(norm_text),
                "hash": digest,
            },
        }

        (PAGES_OUT / f"{slug}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        docs.append(
            {
                "id": slug,
                "slug": segments or "",
                "title": out["title"],
                "category": category,
                "blocks": len(clean),
                "chars": len(norm_text),
                "hash": digest,
                "sourceUrl": info["url"],
                "file": f"pages/{slug}.json",
            }
        )
        total_blocks += len(clean)
        total_chars += len(norm_text)
        report.append({"slug": slug, "blocks": len(clean), "chars": len(norm_text), "ok": len(clean) > 0})

    docs.sort(key=lambda d: (d["category"], d["slug"]))
    MANIFEST.write_text(
        json.dumps(
            {
                "source": "https://precious-cassata-42205a.netlify.app",
                "pages": docs,
                "totals": {
                    "pages": len(docs),
                    "blocks": total_blocks,
                    "chars": total_chars,
                    "words": round(total_chars / 6),
                },
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"pagine estratte: {len(docs)}")
    print(f"blocchi totali:   {total_blocks}")
    print(f"caratteri totali: {total_chars} (~{round(total_chars/6)} parole)")
    empty = [r for r in report if r.get("blocks", 0) == 0]
    print(f"pagine senza blocchi: {len(empty)}")
    for e in empty[:10]:
        print("   ", e)


if __name__ == "__main__":
    main()
