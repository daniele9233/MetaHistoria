import manifestJson from '../content/manifest.json';
import navigationJson from '../content/navigation.json';

export interface Run {
  t: string;
  b?: boolean;
  i?: boolean;
}

export type BlockType = 'h' | 'p' | 'list' | 'quote' | 'table' | 'card';

export interface Block {
  type: BlockType;
  level?: number;
  role?: string;
  runs?: Run[];
  ordered?: boolean;
  items?: Run[][];
  head?: string[][];
  rows?: string[][];
  parts?: string[];
}

export interface PageDoc {
  id: string;
  slug: string;
  sourceUrl: string;
  title: string;
  kicker: string;
  lede: string;
  category: string;
  parentId: string | null;
  blocks: Block[];
  prevNext: { label: string; title: string; href: string }[];
  references: string[];
  stats: { blocks: number; chars: number; hash: string };
}

export interface ManifestPage {
  id: string;
  slug: string;
  title: string;
  category: string;
  blocks: number;
  chars: number;
  hash: string;
  sourceUrl: string;
  file: string;
  path: string;
  parentPath: string | null;
  order: number;
}

export interface NavItem {
  label: string;
  path: string;
  id: string;
}

export interface NavGroup {
  label: string;
  path: string;
  items: NavItem[];
}

export interface Navigation {
  groups: NavGroup[];
  aliases: Record<string, string>;
  extra: NavItem[];
}

export const MANIFEST = manifestJson as unknown as { pages: ManifestPage[]; aliases: Record<string, string> };
export const NAVIGATION = navigationJson as unknown as Navigation;

export const PAGES: ManifestPage[] = MANIFEST.pages;
export const ALIASES: Record<string, string> = { ...MANIFEST.aliases, ...NAVIGATION.aliases };

const byPath = new Map<string, ManifestPage>();
const byId = new Map<string, ManifestPage>();
for (const p of PAGES) {
  byPath.set(p.path, p);
  byId.set(p.id, p);
}

/** Caricatori lazy: un chunk per pagina, niente articoli nel bundle iniziale. */
const loaders = import.meta.glob<PageDoc>('../content/pages/*.json');

/** indicizza per nome file: immune alla forma delle chiavi del glob */
const loadersByFile = new Map<string, () => Promise<PageDoc>>(
  Object.entries(loaders).map(([key, load]) => [key.split('/').pop() ?? key, load]),
);

export function findPage(path: string): ManifestPage | null {
  const clean = path.replace(/\/+$/, '') || '/';
  const direct = byPath.get(clean);
  if (direct) return direct;

  const alias = ALIASES[clean.replace(/^\//, '')];
  if (alias) {
    const viaAlias = byPath.get('/' + alias.replace(/^\//, ''));
    if (viaAlias) return viaAlias;
  }
  return null;
}

export function findPageById(id: string): ManifestPage | null {
  return byId.get(id) ?? null;
}

export function childrenOf(path: string): ManifestPage[] {
  return PAGES.filter((p) => p.parentPath === path).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function loadPage(page: ManifestPage): Promise<PageDoc> {
  const loader = loadersByFile.get(`${page.id}.json`);
  if (!loader) throw new Error(`Contenuto non trovato per ${page.id}`);
  return loader();
}

/** Rimuove i blocchi iniziali che ripetono kicker/titolo/sommario dell'intestazione. */
export function stripHeaderBlocks(doc: PageDoc): Block[] {
  const blocks = [...doc.blocks];
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const textOf = (b: Block) => (b.runs ?? []).map((r) => r.t).join(' ');
  const targets = new Set([norm(doc.kicker), norm(doc.title), norm(doc.lede)].filter(Boolean));

  let guard = 0;
  while (blocks.length > 1 && guard < 5) {
    const b = blocks[0];
    if (b.type !== 'p' && b.type !== 'h') break;
    const txt = norm(textOf(b));
    if (!txt || !targets.has(txt)) break;
    blocks.shift();
    guard += 1;
  }
  return blocks;
}

export const CATEGORY_LABELS: Record<string, string> = {
  'geopolitica-classica': 'Geopolitica classica',
  'geopolitica-umana': 'Geopolitica umana',
  'geopolitica-dell-anima': "Geopolitica dell'anima",
  'teologia-geopolitica': 'Teologia della geopolitica',
  'apocalisse-del-potere': 'Apocalisse del potere',
  'biblioteca-pentaedrica': 'Biblioteca pentaedrica',
  'metodo-pentaedrico': 'Metodo pentaedrico',
  home: 'MetaHistoria',
  'atlante-visuale': 'Atlante visuale',
  'tommaso-problema-del-male': 'Apocalisse del potere',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, ' ');
}
