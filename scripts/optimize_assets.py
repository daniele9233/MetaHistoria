"""Ottimizza gli asset: WebP, lato lungo massimo 1100px, qualità 82.
Scrive public/assets/opt/*.webp e src/data/media.json con dimensioni reali."""
import json, os
from PIL import Image

manifest = json.load(open("src/data/assets.json", encoding="utf-8"))
out_dir = "public/assets/opt"
os.makedirs(out_dir, exist_ok=True)
media = {}
total = 0

for key, item in manifest.items():
    src = os.path.join("assets-src", os.path.basename(item["file"]))
    if not os.path.exists(src):
        continue
    im = Image.open(src).convert("RGB")
    # i documenti molto larghi (es. rotoli) restano larghi: limite sul lato lungo
    im.thumbnail((1100, 1100), Image.LANCZOS)
    dest = os.path.join(out_dir, f"{key}.webp")
    im.save(dest, "WEBP", quality=82, method=6)
    size = os.path.getsize(dest)
    total += size
    media[key] = {
        "src": f"/assets/opt/{key}.webp",
        "w": im.width,
        "h": im.height,
        "bytes": size,
    }
    print(f"{key:14} {im.width:5}x{im.height:<5} {size/1024:6.0f}kb")

json.dump(media, open("src/data/media.json", "w", encoding="utf-8"), indent=2)
print(f"\nTotale: {total/1024/1024:.2f} MB")
