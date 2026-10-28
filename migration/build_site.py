"""Costruisce navigation.json e completa il manifest:
- deduplica le pagine identiche (stesso hash), tenendo lo slug più pulito
- assegna parent e ordine
- risolve il menu del sorgente in id locali

Uso: python migration/build_site.py
"""
import sys
import json
import re
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
from lxml import html as LH

ROOT = Path(".").resolve()
MANIFEST = ROOT / "src/content/manifest.json"
PAGES = ROOT / "src/content/pages"
NAV_OUT = ROOT / "src/content/navigation.json"
HOME_HTML = ROOT / "migration/source/pages/home.html"


def norm(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def clean_slug(path):
    """/a/b.html -> a/b ; /a/b/ -> a/b"""
    p = path.strip("/")
    p = re.sub(r"\.html?$", "", p)
    return p


def slug_id(path):
    p = clean_slug(path)
    return "home" if p == "" else p.replace("/", "-")


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pages = manifest["pages"]

    # --- menu del sorgente -------------------------------------------------
    doc = LH.fromstring(HOME_HTML.read_text(encoding="utf-8", errors="replace"))
    groups = []
    for li in doc.xpath("//nav//li"):
        trigger = li.find("a")
        if trigger is None:
            continue
        label = norm(trigger.text_content()).replace("▾", "").strip()
        if not label:
            continue
        items = []
        for a in li.xpath(".//div[contains(@class,'dropdown')]/a"):
            href = (a.get("href") or "").strip()
            items.append({"label": norm(a.text_content()), "url": href, "id": slug_id(href)})
        if items:
            groups.append({"label": label, "id": slug_id("/" + items[0]["url"].strip("/").split("/")[0]), "items": items})

    # --- pagine fuori menu: agganciale al gruppo giusto --------------------
    def path_of(p):
        s = clean_slug(p.get("canonicalSlug") or p["slug"])
        return "/" + s if s else "/architettura"

    by_path = {path_of(p): p for p in pages}
    extras = [
        ("/tommaso-problema-del-male", "apocalisse del potere"),
        ("/architettura", "metodo pentaedrico"),
    ]
    for path, group_label in extras:
        page = by_path.get(path)
        if not page:
            print(f"  ! pagina non trovata per extra: {path}")
            continue
        for g in groups:
            if g["label"].lower() != group_label:
                continue
            if any(it["id"] == page["id"] for it in g["items"]):
                continue
            g["items"].append({"label": page["title"], "url": path, "id": page["id"]})

    # --- dedup per hash ----------------------------------------------------
    by_hash = {}
    for p in pages:
        by_hash.setdefault(p["hash"], []).append(p)

    aliases = {}
    canonical_ids = set()
    for h, group in by_hash.items():
        # preferisci lo slug senza ".html" e senza "-html" finale
        def score(p):
            s = p["slug"]
            return (s.endswith(".html") or s.endswith("-html"), len(s))

        group.sort(key=score)
        keep = group[0]
        canonical_ids.add(keep["id"])
        for other in group[1:]:
            aliases[other["slug"]] = keep["slug"]

    # --- la home del sorgente diventa la pagina /architettura -------------
    for p in pages:
        if p["id"] == "home":
            aliases.pop("", None)
            p["canonicalSlug"] = "architettura"
            p["title"] = "MetaHistoria — Il Metodo Pentapolare"
            canonical_ids.add("home")

    # --- parent e ordine ---------------------------------------------------
    slugs = {clean_slug(p["slug"]) for p in pages if p["id"] in canonical_ids}
    nav_order = {}
    for g in groups:
        for i, it in enumerate(g["items"]):
            nav_order[slug_id(it["url"])] = i

    for p in pages:
        s = clean_slug(p.get("canonicalSlug") or p["slug"])
        parts = s.split("/") if s else []
        parent = "/".join(parts[:-1]) if len(parts) > 1 else None
        while parent and parent not in slugs:
            parent = "/".join(parent.split("/")[:-1]) or None
        p["path"] = "/" + s if s else "/architettura"
        p["parentPath"] = ("/" + parent) if parent else None
        p["order"] = nav_order.get(p["id"], 100)

    # --- scrivi navigation.json -------------------------------------------
    nav = {
        "groups": [
            {
                "label": g["label"],
                "path": "/" + clean_slug(g["items"][0]["url"]).split("/")[0] if g["items"] else "/",
                "items": [{"label": it["label"], "path": "/" + clean_slug(it["url"]), "id": it["id"]} for it in g["items"]],
            }
            for g in groups
        ],
        "aliases": aliases,
        "extra": [
            {"label": p["title"], "path": p["path"], "id": p["id"]}
            for p in sorted(pages, key=lambda x: (x["category"], x["order"], x["title"]))
            if p["id"] not in {i["id"] for g in groups for i in g["items"]}
        ],
    }
    NAV_OUT.write_text(json.dumps(nav, ensure_ascii=False, indent=1), encoding="utf-8")
    manifest["aliases"] = aliases
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"pagine: {len(pages)} · canoniche: {len(canonical_ids)} · alias: {len(aliases)}")
    print(f"menu: {len(nav['groups'])} gruppi, {sum(len(g['items']) for g in nav['groups'])} voci")
    print(f"pagine fuori menu: {len(nav['extra'])}")


if __name__ == "__main__":
    main()
