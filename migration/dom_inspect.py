"""Ispeziona la struttura DOM di una pagina sorgente salvata."""
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from lxml import html as LH


def walk(el, depth=0, maxdepth=4):
    for child in el:
        if not isinstance(child.tag, str):
            continue
        cls = child.get("class", "")
        txt = (child.text_content() or "").strip().replace("\n", " ")[:60]
        pad = "  " * depth
        print(f"{pad}<{child.tag}{' .' + cls if cls else ''}> {txt}")
        if depth < maxdepth:
            walk(child, depth + 1, maxdepth)


path = sys.argv[1] if len(sys.argv) > 1 else "migration/source/pages/geopolitica-classica-atlante-di-storia.html"
doc = LH.parse(path).getroot()
walk(doc.body, 0, int(sys.argv[2]) if len(sys.argv) > 2 else 3)
