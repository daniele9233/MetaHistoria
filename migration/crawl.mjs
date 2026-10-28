/**
 * Crawler del sito sorgente (sito statico: fetch + regex, niente browser).
 * Riprendibile: lo stato è in migration/crawl-progress.json a ogni pagina.
 *
 * Uso: node migration/crawl.mjs [--max=80]
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://precious-cassata-42205a.netlify.app';
const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'migration/source/pages');
const STATE = path.join(ROOT, 'migration/crawl-progress.json');
const MAX = Number(process.argv.find((a) => a.startsWith('--max='))?.split('=')[1] ?? 120);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalize(href, current) {
  try {
    const u = new URL(href, current ?? BASE + '/');
    if (u.host !== new URL(BASE).host) return null;
    let p = u.pathname.replace(/\/+$/, '');
    if (p === '') p = '/';
    return p; // path only: le query sul sito non distinguono contenuti
  } catch {
    return null;
  }
}

function slugOf(urlPath) {
  if (urlPath === '/') return 'home';
  return urlPath.replace(/^\//, '').replace(/\/+/g, '-').replace(/[^a-z0-9-]/gi, '-');
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE, 'utf8'));
  } catch {
    return { startedAt: new Date().toISOString(), pages: {}, queue: ['/'] };
  }
}

async function fetchPage(urlPath, attempt = 0) {
  const url = BASE + urlPath;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'MetaHistoriaMigration/1.0 (content migration, authorized)' },
    });
    clearTimeout(t);
    const type = res.headers.get('content-type') ?? '';
    const body = type.includes('text/html') ? await res.text() : '';
    return { status: res.status, type, body };
  } catch (e) {
    if (attempt < 2) {
      await sleep(1200 * (attempt + 1));
      return fetchPage(urlPath, attempt + 1);
    }
    return { status: 0, type: '', body: '', error: String(e) };
  }
}

const state = await loadState();
await mkdir(PAGES_DIR, { recursive: true });

let fetched = 0;
while (state.queue.length && Object.keys(state.pages).length < MAX) {
  const urlPath = state.queue.shift();
  if (state.pages[urlPath]) continue;

  const { status, type, body, error } = await fetchPage(urlPath);
  const slug = slugOf(urlPath);

  if (body) {
    await writeFile(path.join(PAGES_DIR, `${slug}.html`), body, 'utf8');
  }

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';

  state.pages[urlPath] = {
    url: BASE + urlPath,
    slug,
    status,
    type,
    bytes: body.length,
    title,
    error: error ?? null,
  };

  if (body) {
    const links = [...body.matchAll(/href=['"]([^'"]+)['"]/g)]
      .map((m) => normalize(m[1], BASE + urlPath))
      .filter(Boolean);
    for (const l of links) {
      if (!state.pages[l] && !state.queue.includes(l)) state.queue.push(l);
    }
  }

  await writeFile(STATE, JSON.stringify(state, null, 2));
  fetched += 1;
  console.log(
    `${String(Object.keys(state.pages).length).padStart(3)} ${String(status).padEnd(4)} ${String(body.length).padStart(7)}b  ${urlPath}`,
  );
  await sleep(120);
}

const pages = Object.values(state.pages);
const ok = pages.filter((p) => p.status === 200 && p.bytes > 0);
console.log(`\n--- fine ---`);
console.log(`pagine scoperte: ${pages.length}`);
console.log(`acquisite:       ${ok.length}`);
console.log(`errori:          ${pages.filter((p) => p.status !== 200).length}`);
console.log(`in coda:         ${state.queue.length}`);
