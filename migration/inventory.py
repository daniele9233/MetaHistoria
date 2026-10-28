"""Inventario delle classi e dei tag nel contenuto principale di tutte le pagine."""
import sys
from collections import Counter
from glob import glob

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from lxml import html as LH

classes = Counter()
tags = Counter()
files = sorted(glob("migration/source/pages/*.html"))

for f in files:
    doc = LH.parse(f).getroot()
    body = doc.body
    if body is None:
        continue
    for el in body.iter():
        if not isinstance(el.tag, str):
            continue
        tags[el.tag] += 1
        for c in (el.get("class") or "").split():
            classes[c] += 1

print("file analizzati:", len(files))
print("\n--- tag piu frequenti ---")
for t, n in tags.most_common(18):
    print(f"{n:7} {t}")
print("\n--- classi piu frequenti ---")
for c, n in classes.most_common(45):
    print(f"{n:7} .{c}")
