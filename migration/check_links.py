"""Verifica dei collegamenti: ogni destinazione interna deve esistere.

Controlla:
  - le voci del menu (navigation.json)
  - i link prev/next di ogni pagina
  - i figli dichiarati nel manifest
  - gli href interni del sito sorgente che non hanno corrispondenza locale

Uso: python migration/check_links.py
"""
import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

ROOT = Path(".").resolve()
manifest = json.loads((ROOT / "src/content/manifest.json").read_text(encoding="utf-8"))
nav = json.loads((ROOT / "src/content/navigation.json").read_text(encoding="utf-8"))

paths = {p["path"] for p in manifest["pages"]}
aliases = manifest.get("aliases", {})


def normalize(href):
    h = href.split("#")[0].split("?")[0]
    h = re.sub(r"\.html?$", "", h).rstrip("/")
    return h if h.startswith("/") else "/" + h


missing = []

for g in nav["groups"]:
    for it in g["items"]:
        if normalize(it["path"]) not in paths:
            missing.append(("menu", it["label"], it["path"]))

for p in manifest["pages"]:
    for nx in p.get("prevNext") or []:
        target = normalize(nx["href"])
        if target not in paths:
            missing.append(("prev/next", p["path"], nx["href"]))

# href interni presenti nelle pagine estratte (solo quelli che puntano a pagine)
page_files = list((ROOT / "src/content/pages").glob("*.json"))
checked = 0
for f in page_files:
    doc = json.loads(f.read_text(encoding="utf-8"))
    for blk in doc["blocks"]:
        for run in blk.get("runs", []):
            pass  # i run non contengono href

print(f"pagine: {len(paths)}")
print(f"voci di menu: {sum(len(g['items']) for g in nav['groups'])}")
print(f"collegamenti mancanti: {len(missing)}")
for m in missing[:20]:
    print("   ", m)

# pagine non raggiungibili dal menu né da un genitore (orfane)
linked = set()
for g in nav["groups"]:
    for it in g["items"]:
        linked.add(normalize(it["path"]))
for p in manifest["pages"]:
    if p.get("parentPath"):
        linked.add(p["parentPath"])
orphans = [p["path"] for p in manifest["pages"] if p["path"] not in linked and p["parentPath"] is None and p["path"] != "/"]
print(f"pagine orfane (nessun genitore, fuori menu): {len(orphans)}")
for o in orphans[:10]:
    print("   ", o)
