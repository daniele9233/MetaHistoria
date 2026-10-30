import media from '../data/media.json';
import { PAGES, type ManifestPage } from './content';

export interface SectionMeta {
  id: string;
  path: string;
  lens: string;
  title: string;
  kicker: string;
  lede: string;
  hero: string;
  heroAlt: string;
  heroCaption: string;
  pool: string[];
  accent: string;
}

const IMG = media as Record<string, { src: string; w: number; h: number }>;

/** Immagine dell'archivio (WebP ottimizzata) a partire dalla chiave. */
export function img(key: string): string {
  return IMG[key]?.src ?? '';
}

/** Le tavole dell'Atlante: sorgente originale → WebP locale. */
export function plate(src: string): string {
  const name = src.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? src;
  return `/media/tavole/${name}.webp`;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'geopolitica-classica',
    path: '/geopolitica-classica',
    lens: 'Lente 01',
    title: 'Geopolitica Classica',
    kicker: 'Cartografia · confini · territori',
    lede:
      'La lente materiale: risorse, territorio, demografia, potenza militare. Il fondamento su cui tutto si regge, che da solo però non spiega nulla.',
    hero: 'mappamondo',
    heroAlt: 'Planisfero di Abraham Ortelius, 1570: il mondo come teatro',
    heroCaption: 'Ortelius, Theatrum Orbis Terrarum, 1570 — il mondo come teatro.',
    pool: ['mappamondo', 'gerusalemme', 'magna', 'peutinger', 'westfalia', 'vienna'],
    accent: '#6d563d',
  },
  {
    id: 'geopolitica-umana',
    path: '/geopolitica-umana',
    lens: 'Lente 02',
    title: 'Geopolitica Umana',
    kicker: 'Popoli · memoria · fotografia',
    lede:
      'La lente soggettiva: i popoli non sono masse ma comunità con memoria, identità e vocazione. Qui la geopolitica smette di essere geometria.',
    hero: 'archivio',
    heroAlt: 'I quattro grandi della conferenza di Parigi, 1919',
    heroCaption: 'Parigi, 1919 — quattro uomini decidono il destino di milioni di persone.',
    pool: ['archivio', 'sultano', 'cardinale', 'sanpietro'],
    accent: '#7a5a44',
  },
  {
    id: 'geopolitica-dell-anima',
    path: '/geopolitica-dell-anima',
    lens: 'Lente 03',
    title: 'Geopolitica dell’Anima',
    kicker: 'Interiorità · simboli · luce',
    lede:
      'La lente interiore: miti, archetipi, desideri e ferite che muovono una civiltà prima ancora delle sue scelte strategiche.',
    hero: 'caravaggio',
    heroAlt: 'La Vocazione di San Matteo di Caravaggio',
    heroCaption: 'Caravaggio, La Vocazione di San Matteo — la luce che convoca.',
    pool: ['caravaggio', 'filosofo', 'orgaz', 'scriba'],
    accent: '#5c4a58',
  },
  {
    id: 'teologia-geopolitica',
    path: '/teologia-geopolitica',
    lens: 'Lente 04',
    title: 'Teologia della Geopolitica',
    kicker: 'Manoscritti · arte sacra · architetture',
    lede:
      'La lente morale: come la Rivelazione giudica il potere. Peccato, idolatria, discernimento, grazia e speranza dentro la storia.',
    hero: 'atene',
    heroAlt: 'La Scuola di Atene di Raffaello',
    heroCaption: 'Raffaello, La Scuola di Atene — il logos prima del dogma.',
    pool: ['atene', 'codice', 'scriba', 'hagia', 'sanpietro', 'cardinale'],
    accent: '#8a6f52',
  },
  {
    id: 'apocalisse-del-potere',
    path: '/apocalisse-del-potere',
    lens: 'Lente 05',
    title: 'Apocalisse del Potere',
    kicker: 'Escatologia · iconografia · giudizio',
    lede:
      'La lente finale: dove va questo potere? Giudizio, caduta, compimento. Il destino ultimo degli imperi davanti a Dio.',
    hero: 'durer',
    heroAlt: 'Melencolia I di Albrecht Dürer',
    heroCaption: 'Dürer, Melencolia I, 1514 — l’intelletto che ha tutti gli strumenti e nessuna risposta.',
    pool: ['durer', 'orgaz', 'westfalia', 'peutinger'],
    accent: '#6d3b2f',
  },
  {
    id: 'metodo-pentaedrico',
    path: '/metodo-pentaedrico',
    lens: 'Metodo',
    title: 'Metodo Pentaedrico',
    kicker: 'Diagrammi · geometrie · tavole',
    lede:
      'Il metodo che tiene insieme le cinque lenti: un percorso di interpretazione, non una collezione di opinioni.',
    hero: 'tavola-02',
    heroAlt: 'Tavola 02 — Il Metodo Pentaedrico: un unico evento, cinque livelli di lettura',
    heroCaption: 'Tavola 02 — Un unico evento, cinque livelli di lettura.',
    pool: ['tavola-01-architettura', 'tavola-02', 'tavola-03', 'tavola-04', 'tavola-05', 'tavola-06'],
    accent: '#4a4436',
  },
  {
    id: 'biblioteca-pentaedrica',
    path: '/biblioteca-pentaedrica',
    lens: 'Biblioteca',
    title: 'Biblioteca Pentaedrica',
    kicker: 'Casi · opere · letture',
    lede: 'La biblioteca dei casi: la storia universale letta con le cinque lenti, un evento per volta.',
    hero: 'tavola-03',
    heroAlt: 'Tavola 03 — Le cinque lenti con oggetti, domande e fonti',
    heroCaption: 'Tavola 03 — Oggetto, domanda e fonti di ogni lente.',
    pool: ['tavola-03', 'tavola-04', 'tavola-05', 'tavola-06'],
    accent: '#4a4436',
  },
  {
    id: 'atlante-visuale',
    path: '/atlante-visuale',
    lens: 'Atlante',
    title: 'Atlante Visuale',
    kicker: 'Tavole · mappe concettuali',
    lede: 'Sei tavole per vedere il sistema: l’architettura, il metodo, le lenti, il percorso, la genealogia del potere, la cartografia dell’anima.',
    hero: 'tavola-01-architettura',
    heroAlt: 'Tavola 01 — L’architettura di MetaHistoria',
    heroCaption: 'Tavola 01 — La mappa ontologica del sistema.',
    pool: ['tavola-01-architettura', 'tavola-02', 'tavola-03', 'tavola-04', 'tavola-05', 'tavola-06'],
    accent: '#4a4436',
  },
];

const byId = new Map(SECTIONS.map((s) => [s.id, s]));

export function sectionOf(page: ManifestPage): SectionMeta | null {
  return byId.get(page.category) ?? null;
}

/** Didascalie delle immagini dell'archivio (per non accoppiare testo e figura sbagliati). */
export const IMAGE_META: Record<string, { alt: string; caption: string }> = {
  mappamondo: { alt: 'Planisfero di Abraham Ortelius, 1570', caption: 'Ortelius, Theatrum Orbis Terrarum, 1570.' },
  gerusalemme: { alt: 'Carta della Terrasanta, 1771', caption: 'Bonne, Carta dei Luoghi del Nuovo Testamento, 1771.' },
  magna: { alt: 'Magna Carta, British Library', caption: 'Magna Carta, 1215 — il re sotto la legge.' },
  peutinger: { alt: 'Tabula Peutingeriana', caption: 'Tabula Peutingeriana — le strade prima del territorio.' },
  westfalia: { alt: 'La pace di Westfalia a Münster, 1648', caption: 'Ter Borch, La pace di Westfalia, 1648.' },
  vienna: { alt: 'Il congresso di Vienna, 1815', caption: 'Il congresso di Vienna, 1815.' },
  archivio: { alt: 'I quattro grandi alla conferenza di Parigi, 1919', caption: 'Parigi, 1919 — quattro uomini, un mondo.' },
  sultano: { alt: 'Ritratto di Maometto II di Gentile Bellini', caption: 'Gentile Bellini, Maometto II, 1480.' },
  cardinale: { alt: 'Ritratto di cardinale di Raffaello', caption: 'Raffaello, Ritratto di cardinale.' },
  sanpietro: { alt: 'La cupola di San Pietro a Roma', caption: 'La cupola di San Pietro e la città.' },
  caravaggio: { alt: 'La Vocazione di San Matteo di Caravaggio', caption: 'Caravaggio, La Vocazione di San Matteo.' },
  filosofo: { alt: 'Filosofo in meditazione di Rembrandt', caption: 'Rembrandt, Filosofo in meditazione.' },
  orgaz: { alt: 'Il seppellimento del conte di Orgaz di El Greco', caption: 'El Greco, Il seppellimento del conte di Orgaz, 1586.' },
  scriba: { alt: 'Amanuense in una miniatura medievale', caption: 'Un amanuense al lavoro — l’oro delle Scritture.' },
  atene: { alt: 'La Scuola di Atene di Raffaello', caption: 'Raffaello, La Scuola di Atene, 1509–1511.' },
  codice: { alt: 'Pagina miniata del Codex Aureus', caption: 'Codex Aureus Epternacensis — l’oro della pagina.' },
  hagia: { alt: 'L’interno di Santa Sofia a Istanbul', caption: 'Santa Sofia — due fedi, un impero.' },
  durer: { alt: 'Melencolia I di Albrecht Dürer', caption: 'Dürer, Melencolia I, 1514.' },
};

export function imageMeta(key: string): { alt: string; caption: string } {
  if (key.startsWith('tavola')) return { alt: '', caption: '' };
  return IMAGE_META[key] ?? { alt: '', caption: '' };
}

export function sectionImage(key: string): string {
  return key.startsWith('tavola') ? `/media/tavole/${key}.webp` : img(key);
}

/** scelta stabile dell'immagine di una scheda dentro la sezione */
export function pickImage(meta: SectionMeta, page: ManifestPage): string {
  let h = 0;
  for (let i = 0; i < page.id.length; i++) h = (h * 31 + page.id.charCodeAt(i)) % 9973;
  return meta.pool[h % meta.pool.length] ?? meta.hero;
}

export function chaptersOf(path: string): ManifestPage[] {
  return PAGES.filter((p) => p.parentPath === path).sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

export function readingMinutes(chars: number): number {
  const words = chars / 6;
  return Math.max(1, Math.round(words / 200));
}

export function sectionMinutes(pages: ManifestPage[]): number {
  return pages.reduce((sum, p) => sum + readingMinutes(p.chars), 0);
}
