"""Verifica di completezza per unità testuali.

Per ogni pagina prende ogni elemento testuale del contenuto principale
(p, li, h1-h6, blockquote, td/th, summary, div con solo testo) e verifica che
il suo testo compatto esista nei blocchi estratti. Immune ai confini di blocco:
se una singola unità manca, è una perdita reale.

Sono esentati: nav, footer, script, style, .mobile-overlay, .nav-cards
(questi ultimi sono conservati come metadati prev/next).

Uso: python migration/validate.py [--verbose]
"""
import sys
import json
import re
import copy
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
from lxml import html as LH
from lxml import etree

ROOT = Path(".").resolve()
SRC = ROOT / "migration/source/pages"
PAGES = ROOT / "src/content/pages"
VERBOSE = "--verbose" in sys.argv

UNIT_TAGS = {"p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "td", "th", "summary"}
STRUCTURAL = {"div", "section", "article", "figure", "li", "table", "ul", "ol", "dl", "blockquote", "details"}
SKIP_TAGS = {"script", "style", "noscript", "button"}


DECOR = "▾▼►▶◀◂←→↑↓·•◆◇☨⚔✝✦"


def compact(s):
    """Confronto esatto indipendente da spaziatura e glifi decorativi (frecce CSS)."""
    s = re.sub(r"[" + DECOR + r"]", "", s or "")
    return re.sub(r"[\s\u00a0\u200b]+", "", s)


def main_regions(doc):
    out = []
    for el in doc.body:
        if not isinstance(el.tag, str):
            continue
        if el.tag in ("nav", "footer", "script", "style"):
            continue
        cls = (el.get("class") or "").lower()
        if "mobile-overlay" in cls or el.get("id") == "progress":
            continue
        out.append(el)
    return out


def has_block_child(el):
    """Un contenitore non è un'unità testuale se contiene altri contenitori."""
    for d in el.iterdescendants():
        if isinstance(d.tag, str) and (d.tag in UNIT_TAGS or d.tag in STRUCTURAL):
            return True
    return False


def source_units(doc):
    units = []
    for region in main_regions(doc):
        for el in region.iter():
            if not isinstance(el.tag, str) or el.tag in SKIP_TAGS:
                continue
            ancestor_skip = False
            for a in el.iterancestors():
                cls = (a.get("class") or "").lower() if isinstance(a.tag, str) else ""
                if "nav-cards" in cls or "mobile-overlay" in cls:
                    ancestor_skip = True
                    break
            if ancestor_skip:
                continue
            cls = (el.get("class") or "").lower()
            if "nav-cards" in cls:
                continue
            if el.tag in UNIT_TAGS:
                units.append((el.tag, compact(el.text_content())))
            elif el.tag == "div" and not has_block_child(el):
                units.append(("div", compact(el.text_content())))
    return [(t, u) for t, u in units if len(u) >= 2]


def extracted_compact(page):
    parts = []
    for b in page["blocks"]:
        if "runs" in b:
            parts.append(" ".join(r["t"] for r in b["runs"]))
        elif b.get("type") == "list":
            for it in b["items"]:
                parts.append(" ".join(r["t"] for r in it))
        elif b.get("type") == "table":
            for row in b.get("head", []) + b.get("rows", []):
                parts.append(" ".join(row))
        elif b.get("type") == "card":
            parts.append(" ".join(b.get("parts", [])))
    return compact(" ".join(parts))


report = []
tot_units = tot_missing = 0

for f in sorted(PAGES.glob("*.json")):
    page = json.loads(f.read_text(encoding="utf-8"))
    slug = page["id"]
    src_file = SRC / f"{slug}.html"
    if not src_file.exists():
        continue
    doc = LH.fromstring(src_file.read_text(encoding="utf-8", errors="replace"))

    units = source_units(doc)
    ext = extracted_compact(page)
    missing = [(t, u) for t, u in units if u not in ext]

    tot_units += len(units)
    tot_missing += len(missing)
    report.append(
        {
            "slug": slug,
            "units": len(units),
            "missing": len(missing),
            "coverage": round(1 - (len(missing) / len(units) if units else 0), 5),
            "examples": [u[:110] for _, u in missing[:6]],
        }
    )

report.sort(key=lambda r: r["coverage"])
out = {
    "pages": len(report),
    "units": tot_units,
    "missing": tot_missing,
    "coverage": round(1 - tot_missing / tot_units, 5) if tot_units else 0,
    "details": report,
}
Path("migration/validation-report.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

print(f"pagine: {len(report)} · unità testuali: {tot_units} · mancanti: {tot_missing} · copertura: {out['coverage']*100:.3f}%")
bad = [r for r in report if r["missing"]]
print(f"pagine con unità mancanti: {len(bad)}")
for r in bad[:10]:
    print(f"\n  {r['slug']}  -{r['missing']}/{r['units']} (cop {r['coverage']*100:.1f}%)")
    if VERBOSE:
        for e in r["examples"]:
            print("     ...", e)
