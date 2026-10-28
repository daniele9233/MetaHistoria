import json, os, sys
from PIL import Image, ImageDraw, ImageFont

manifest = json.load(open(r"src/data/assets.json", encoding="utf-8"))
ids = sorted(manifest.keys())
cols, cell_w, cell_h = 5, 260, 210
rows = (len(ids) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (24, 18, 16))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
except Exception:
    font = ImageFont.load_default()

for i, key in enumerate(ids):
    item = manifest[key]
    p = os.path.join("assets-src", os.path.basename(item["file"]))
    x, y = (i % cols) * cell_w, (i // cols) * cell_h
    try:
        im = Image.open(p).convert("RGB")
        im.thumbnail((cell_w - 16, cell_h - 44))
        sheet.paste(im, (x + (cell_w - im.width) // 2, y + 8))
    except Exception as e:
        draw.text((x + 8, y + 40), f"ERR {e}", fill=(255, 80, 80), font=font)
    label = f"{key}  {item['width']}x{item['height']}"
    draw.text((x + 8, y + cell_h - 32), label, fill=(240, 235, 225), font=font)
    draw.text((x + 8, y + cell_h - 17), item["license"][:38], fill=(184, 156, 114), font=font)

sheet.save("public/assets/_contact-sheet.png")
print("saved", sheet.size)
for key in ids:
    it = manifest[key]
    print(f"{key:14} {it['width']:5}x{it['height']:<5} {it['kind']:12} {it['license'][:20]:20} {it['title'][:60]}")
