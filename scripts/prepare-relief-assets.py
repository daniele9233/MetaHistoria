"""Prepare local, cloud-free NASA maps for the interactive relief atlas.
No generated imagery: RGB is Blue Marble, elevation is the NASA/GEBCO raster.
Run with Python + Pillow + NumPy; downloads are retained in assets-src/earth-relief.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import re
import urllib.request
import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets-src' / 'earth-relief'
OUT = ROOT / 'public' / 'media' / 'earth-relief'
SOURCE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 300_000_000
base_page = 'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/'
elev_page = 'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/'

def source_url(page, pattern):
    html = urllib.request.urlopen(page, timeout=60).read().decode()
    return re.search(pattern, html).group(0)

color_url = source_url(base_page, r'https://assets\.science\.nasa\.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world\.200407[^\"<> ]*21600x10800\.jpg')
height_url = source_url(elev_page, r'https://assets\.science\.nasa\.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_21600x10800\.jpg')

def download(spec):
    name, url = spec
    path = SOURCE / name
    if not path.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'MetaHistoria/1.0 (NASA Earth Observatory credit retained)'})
        with urllib.request.urlopen(request, timeout=120) as response:
            path.write_bytes(response.read())
    print(f'{name}: {path.stat().st_size:,} bytes', flush=True)
    return path

with ThreadPoolExecutor(max_workers=2) as pool:
    rgb_path, height_path = pool.map(download, [('nasa-july-21600.jpg', color_url), ('nasa-elevation-21600.jpg', height_url)])

rgb = Image.open(rgb_path)
elevation = Image.open(height_path)
assert rgb.size == elevation.size == (21600, 10800)

def grade(color, height):
    """Warm, restrained publication palette; retain all coastlines and features.
    NASA's base-map ocean is black; give only those pixels a deep teal albedo.
    """
    color = ImageEnhance.Color(color.convert('RGB')).enhance(.78)
    values = np.asarray(color).copy()
    heights = np.asarray(height.convert('L'))
    water = (values.max(axis=2) < 24) & (heights < 3)
    values[water] = [9, 34, 41]
    return Image.fromarray(values)

for width, label in [(8192, '8k'), (4096, '4k')]:
    size = (width, width // 2)
    h = elevation.resize(size, Image.Resampling.LANCZOS).convert('L')
    grade(rgb.resize(size, Image.Resampling.LANCZOS), h).save(OUT / f'earth-day-{label}.webp', quality=89, method=6)
    h.save(OUT / f'earth-height-{label}.jpg', quality=96, subsampling=0)

# A higher detail regional color tile, aligned exactly to global equirectangular UVs.
west, south, east, north = -20, 20, 65, 66
w, h = rgb.size
box = ((west + 180) / 360 * w, (90 - north) / 180 * h, (east + 180) / 360 * w, (90 - south) / 180 * h)
region_rgb, region_height = rgb.crop(box), elevation.crop(box)
for width, label in [(4096, '4k'), (2048, '2k')]:
    size = (width, round(width * (north - south) / (east - west)))
    color = grade(region_rgb.resize(size, Image.Resampling.LANCZOS), region_height.resize(size, Image.Resampling.LANCZOS))
    color.save(OUT / f'europe-day-{label}.webp', quality=91, method=6)

metadata = {
    'credit': 'NASA Earth Observatory; Blue Marble: Next Generation, Reto Stockli / NASA GSFC. Topography: NASA Earth Observatory / GEBCO.',
    'colorSource': color_url, 'colorCollection': base_page,
    'elevationSource': height_url, 'elevationCollection': elev_page,
    'projection': 'Equirectangular; longitude -180 to 180, latitude 90 to -90 in image rows.',
    'elevationRangeMeters': [0, 6400],
    'region': {'west': west, 'south': south, 'east': east, 'north': north},
    'processing': 'Lanczos downsample; RGB saturation 0.78; black ocean pixels assigned deep teal. Elevation retained as linear data. Vertical exaggeration is applied in the renderer, never to the source.',
    'files': {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in OUT.iterdir() if p.suffix in ['.webp', '.jpg']},
}
(OUT / 'SOURCES.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
for path in OUT.iterdir():
    print(path.name, path.stat().st_size, flush=True)
