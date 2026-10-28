/**
 * Scarica immagini autentiche di pubblico dominio da Wikimedia Commons.
 * Per ogni voce: cerca su Commons, valida il risultato con una regex di
 * pertinenza, scarica una miniatura da 1200px e registra i metadati
 * (autore, licenza, pagina sorgente) in src/data/assets.json.
 *
 * Uso: node scripts/fetch-assets.mjs [id ...]
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('assets-src');
const MANIFEST = path.resolve('src/data/assets.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'IlSacroEIlPotere/1.0 (educational demo)';
const FREE = /^(public domain|pd|cc0|cc by|cc-by|cc by-sa|cc-by-sa)/i;

const WANTED = [
  { id: 'atene', query: 'School of Athens Raphael fresco', must: /school of athens/i, expect: 'painting' },
  { id: 'caravaggio', query: 'Calling of Saint Matthew Caravaggio', must: /calling of saint matthew|vocazione/i, expect: 'painting' },
  { id: 'orgaz', query: 'El Greco Burial of the Count of Orgaz', must: /orgaz/i, expect: 'painting' },
  { id: 'durer', query: 'Albrecht Durer Melencolia I', must: /melencolia/i, expect: 'engraving' },
  { id: 'mappamondo', query: 'Ortelius world map orbis terrarum', must: /orbis|world map|ortelius/i, expect: 'map' },
  { id: 'peutinger', query: 'Tabula Peutingeriana', must: /peutinger/i, expect: 'map' },
  { id: 'hagia', query: 'Hagia Sophia interior dome', must: /hagia sophia/i, expect: 'architecture' },
  { id: 'magna', query: 'Magna Carta 1215', must: /magna carta/i, expect: 'document' },
  { id: 'westfalia', query: 'Peace of Westphalia 1648', must: /westph|westfal/i, expect: 'document' },
  { id: 'vienna', query: 'Congress of Vienna 1815 Isabey', must: /vienna|isabey/i, expect: 'painting' },
  { id: 'manoscritto', query: 'illuminated manuscript page medieval Latin', must: /manuscript|manoscritto|codex|illuminat/i, expect: 'manuscript' },
  { id: 'gerusalemme', query: 'Jerusalem map 16th century antique', must: /jerusalem|gerusalemme/i, expect: 'map' },
  { id: 'sanpietro', query: 'Saint Peter Basilica Rome interior dome', must: /saint peter|st\. peter|san pietro/i, expect: 'architecture' },
  { id: 'cardinale', query: 'Raphael portrait of a cardinal', must: /cardinal/i, expect: 'painting' },
  { id: 'archivio', query: 'Paris Peace Conference 1919', must: /paris peace|peace conference|1919/i, expect: 'photo' },
  { id: 'sultano', query: 'Ottoman sultan portrait painting', must: /sultan|ottoman|mehmed|suleiman/i, expect: 'painting' },
  { id: 'filosofo', query: 'Rembrandt philosopher in meditation', must: /philosopher|rembrandt/i, expect: 'painting' },
  { id: 'codice', query: 'Codex Aureus illuminated', must: /codex aureus|codex/i, expect: 'manuscript' },
  { id: 'scriba', query: 'medieval scribe writing manuscript illumination', must: /scrib|writer|writing|amanuense|copia/i, expect: 'manuscript' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripHtml(s = '') {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function api(params, attempt = 0) {
  const url = new URL(API);
  url.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', ...params }).toString();
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429 && attempt < 4) {
    const wait = 3000 * (attempt + 1);
    console.log(`  … 429, attendo ${wait}ms`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function search(query) {
  const json = await api({
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime',
    iiurlwidth: '1200',
  });
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .map((p) => {
      const info = p.imageinfo[0];
      const meta = info.extmetadata ?? {};
      return {
        title: p.title,
        page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        thumb: info.thumburl,
        width: info.width,
        height: info.height,
        license: stripHtml(meta.LicenseShortName?.value ?? ''),
        artist: stripHtml(meta.Artist?.value ?? ''),
        description: stripHtml(meta.ImageDescription?.value ?? '').slice(0, 300),
      };
    })
    .filter((c) => c.license && FREE.test(c.license));
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  const only = process.argv.slice(2);

  for (const item of WANTED) {
    if (only.length && !only.includes(item.id)) continue;
    if (!only.length && manifest[item.id]?.file) {
      console.log(`skip ${item.id}`);
      continue;
    }
    let results = [];
    try {
      results = await search(item.query);
    } catch (e) {
      console.warn(`  ricerca fallita: ${e.message}`);
    }
    await sleep(1200);
    const ranked = results.filter((r) => item.must.test(`${r.title} ${r.description}`));
    const chosen = ranked[0] ?? results[0];
    if (!chosen) {
      console.error(`x ${item.id}: nessun risultato`);
      continue;
    }
    try {
      const file = `${item.id}.jpg`;
      const bytes = await download(chosen.thumb, path.join(OUT_DIR, file));
      manifest[item.id] = { ...chosen, file: `/assets/${file}`, bytes, kind: item.expect };
      console.log(
        `ok ${item.id.padEnd(13)} ${String(Math.round(bytes / 1024)).padStart(5)}kb  ${chosen.license.padEnd(18)} ${chosen.title}`,
      );
      await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
      await sleep(800);
    } catch (e) {
      console.error(`x ${item.id}: download fallito ${e.message}`);
    }
  }
  console.log(`\nManifest: ${MANIFEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
