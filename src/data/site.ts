export const SITE = {
  name: 'MetaHistoria',
  wordmark: 'MetaHistoria',
  tagline: 'Il Metodo Pentapolare: Apocalisse del Potere',
  issue: 'Quaderno 01',
  season: 'Autunno 2025',
  /** navigazione sintetica della pagina in miniatura */
  miniNav: ['Geopolitica', 'Teologia', 'Apocalisse', 'Metodo'],
  concept:
    'Comprendere il mondo attraverso le idee, le fedi, i confini e le forze che hanno plasmato la storia.',
};

export interface MenuGroup {
  label: string;
  items: string[];
}

/** Le sei sezioni del menu a tendina. */
export const MENU: MenuGroup[] = [
  {
    label: 'Geopolitica classica',
    items: [
      'Home lente',
      'Insegnamenti fondamentali',
      'Tributi ai maestri',
      'Il ritorno degli imperi',
      'Zone di tensione',
      'Atlante di storia',
      'Tra teologia e geopolitica',
      'Ecosistema geopolitica',
    ],
  },
  {
    label: 'Geopolitica umana',
    items: [
      'Home lente',
      'Dario Fabbri — Il maestro',
      'Il fondamento: geopolitica umana',
      'I 12 princìpi operativi',
      'Il destino dei popoli',
      'La psicologia delle nazioni',
      'Sotto la pelle del mondo',
      'Verso la teologia',
    ],
  },
  {
    label: "Geopolitica dell'anima",
    items: [
      'Home lente',
      'Insegnamenti fondamentali',
      'Insegnamenti di fede',
      'Atlante storico',
      'Frontiere',
    ],
  },
  {
    label: 'Teologia della geopolitica',
    items: [
      'Home lente',
      'Insegnamenti fondamentali',
      'Manifesto piccolo',
      'Manifesto grande',
      'Oltre le mura di carta',
      'Anti-Machiavelli',
      'Genesi delle bestie',
      'Atlante delle bestie',
      'I portatori del sigillo',
      'Padrone del mondo',
      'Teologia sistematica',
      'Ecosistema tgr',
    ],
  },
  {
    label: 'Apocalisse del potere',
    items: [
      'Home lente',
      'Escatologia e storia',
      'Biblioteca apocalittica',
      'Il problema del male',
      'Katechon e anti-impero',
      'Bestie spirituali e potere',
      "L'Anticristo e il sovrano",
      'Compimento: nuova Gerusalemme',
      'Mappa apocalittica',
      'Genesi delle bestie',
      "Il trionfo dell'Agnello",
    ],
  },
  {
    label: 'Metodo pentaedrico',
    items: ['Il metodo', 'Biblioteca pentaedrica', 'Atlante visuale'],
  },
];
