export type Category = 'Teologia' | 'Geopolitica' | 'Storia' | 'Atlante';

export type Variant = 'plate' | 'page' | 'map' | 'document' | 'manuscript';

/** Coordinata nello spazio-tavolo, in pixel di progetto (base 1344×752). */
export interface Layout {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  rz: number;
  rx?: number;
  s?: number;
}

export interface Doc {
  id: string;
  category: Category;
  kicker: string;
  title: string;
  imageKey: string;
  variant: Variant;
  tone: 'light' | 'dark';
  /** 0 = pienamente illuminato, 1 = quasi in ombra */
  shade: number;
  /** sfocatura ottica dei documenti lontani, in px */
  blur?: number;
  layout: Layout;
  excerpt: string;
  body: string[];
  author: string;
  date: string;
  minutes: number;
}

/**
 * Composizione deterministica dell'archivio.
 * Le coordinate derivano dall'analisi di template.png: la tavola è inclinata
 * di 52° sull'asse X, quindi y_schermo ≈ y_mondo × 0.616.
 */
export const DOCS: Doc[] = [
  {
    id: 'filosofo',
    category: 'Teologia',
    kicker: 'Interno',
    title: 'La stanza della meditazione',
    imageKey: 'filosofo',
    variant: 'plate',
    tone: 'dark',
    shade: 0.2,
    layout: { x: 88, y: -540, z: 12, w: 480, h: 400, rz: -12.5, rx: 1.5 },
    blur: 0.7,
    excerpt:
      'Rembrandt dipinge la luce che entra da una finestra e non spiega nulla: la filosofia nasce in una stanza in penombra.',
    body: [
      'C’è una scala a chiocciola, una finestra, due figure. Non sappiamo chi siano, e forse non è la domanda giusta. Rembrandt costruisce uno spazio in cui la luce non illumina gli oggetti: li rende dubbi. La stanza è il primo trattato di teologia negativa dipinto in Olanda.',
      'Nel Seicento la filosofia abbandona la piazza e si ritira nella stanza. È una scelta politica prima che spirituale: chi pensa lontano dal principe può permettersi di pensare contro il principe. La penombra è la condizione del pensiero libero.',
    ],
    author: 'Marta Vergani',
    date: '12 settembre 2025',
    minutes: 7,
  },
  {
    id: 'gerusalemme',
    category: 'Atlante',
    kicker: 'Cartografia',
    title: 'Gerusalemme al centro del mondo',
    imageKey: 'gerusalemme',
    variant: 'map',
    tone: 'light',
    shade: 0.18,
    layout: { x: 368, y: -513, z: 10, w: 400, h: 330, rz: -12, rx: -1 },
    blur: 0.6,
    excerpt:
      'Nelle mappe devozionali la città non è un luogo: è il punto in cui il tempo si piega e la geografia diventa teologia.',
    body: [
      'Le carte della Terrasanta non servono a orientarsi. Servono a ricordare. Il disegno è approssimativo, le distanze sono simboliche, il centro è sempre Gerusalemme — anche quando la geografia reale lo sposterebbe altrove.',
      'Questa licenza cartografica ha conseguenze lunghe. Chi controlla la rappresentazione del centro controlla la legittimità di chi lo abita. Le mappe sono state, per secoli, argomenti teologici travestiti da strumenti di navigazione.',
    ],
    author: 'Pietro Lombardi',
    date: '3 ottobre 2025',
    minutes: 6,
  },
  {
    id: 'magna',
    category: 'Storia',
    kicker: 'Documenti',
    title: 'Il re sotto la legge',
    imageKey: 'magna',
    variant: 'document',
    tone: 'light',
    shade: 0.34,
    layout: { x: -252, y: -578, z: 8, w: 420, h: 500, rz: -12, rx: 0.8 },
    blur: 1.4,
    excerpt:
      'La Magna Carta non concede libertà: concede procedure. È il documento che trasforma il potere in una questione di forma.',
    body: [
      'Runnymede, 1215. I baroni non chiedono la libertà: chiedono che il re smetta di decidere da solo. La Carta è un elenco di casi, di termini, di testimoni. Il suo genio è aver capito che il limite al potere non si proclama, si scrive.',
      'Per secoli il testo fu citato più che letto. Ma la sua ombra è lunga: ogni costituzione che parla di «giusto processo» sta citando, senza saperlo, un accordo tra un sovrano impopolare e i suoi nobili più irritati.',
    ],
    author: 'Elena Ricci',
    date: '28 agosto 2025',
    minutes: 9,
  },
  {
    id: 'codice',
    category: 'Teologia',
    kicker: 'Manoscritti',
    title: 'L’oro delle Scritture',
    imageKey: 'codice',
    variant: 'manuscript',
    tone: 'light',
    shade: 0.28,
    layout: { x: 593, y: -286, z: 6, w: 340, h: 470, rz: -11, rx: -0.6 },
    blur: 1,
    excerpt:
      'Miniare un Vangelo era un atto di fede e di economia: l’oro della pagina era anche il credito del committente.',
    body: [
      'Un codice miniato costa quanto una cascina. La foglia d’oro non serve a rendere leggibile il testo: serve a rendere visibile la gerarchia di chi lo possiede. La bellezza è un’iscrizione di status.',
      'Nei laboratori monastici la copia era preghiera, ma anche contabilità. Ogni colore ha un prezzo, ogni colore ha un significato. Il blu oltremare, macinato dal lapislazzuli afgano, era la prova materiale di un commercio che univa i monasteri del Reno alle cave dell’Hindu Kush.',
    ],
    author: 'Fra’ Anselmo Bruni',
    date: '17 settembre 2025',
    minutes: 8,
  },
  {
    id: 'archivio',
    category: 'Geopolitica',
    kicker: 'Archivio',
    title: 'Quattro uomini, un mondo',
    imageKey: 'archivio',
    variant: 'page',
    tone: 'light',
    shade: 0.22,
    layout: { x: 508, y: 88, z: 18, w: 430, h: 340, rz: -10, rx: 1 },
    blur: 1,
    excerpt:
      'Parigi, 1919: la fotografia di un ordine mondiale che si crede definitivo e che durerà vent’anni.',
    body: [
      'Wilson, Lloyd George, Clemenceau, Orlando. La foto è costruita come un ritratto di famiglia: quattro uomini in doppiopetto che decidono il destino di milioni di persone che non sono nella stanza.',
      'Il trattato di Versailles ridefinisce confini con righelli e ambasciate. La delegazione cinese, presente ma ignorata, tornerà a Pechino con una lezione che il Novecento non dimenticherà: chi non scrive le regole le subisce.',
    ],
    author: 'Giulia Fanti',
    date: '1 ottobre 2025',
    minutes: 5,
  },
  {
    id: 'sultano',
    category: 'Storia',
    kicker: 'Ritratti',
    title: 'Il sultano e il pittore',
    imageKey: 'sultano',
    variant: 'plate',
    tone: 'light',
    shade: 0.3,
    layout: { x: 470, y: 560, z: 16, w: 660, h: 760, rz: -9, rx: 0.5 },
    blur: 0.8,
    excerpt:
      'Maometto II volle un ritratto all’europea. Fu il primo gesto di una lunga trattativa tra immagine e divieto.',
    body: [
      'Gentile Bellini arriva a Istanbul nel 1479 con un compito semplice e impossibile: dipingere un sovrano che governa un impero con una delle tradizioni figurative più rigide del mondo.',
      'Il risultato è un ibrido straordinario: la prospettiva italiana, l’oro persiano, lo sguardo frontale che nessun ritratto ottomano aveva osato. Il volto è un documento diplomatico: dice che il sultano è un principe come gli altri, e che non lo è affatto.',
    ],
    author: 'Andrea Serra',
    date: '22 settembre 2025',
    minutes: 6,
  },
  {
    id: 'westfalia',
    category: 'Geopolitica',
    kicker: 'Trattati',
    title: 'L’invenzione della sovranità',
    imageKey: 'westfalia',
    variant: 'document',
    tone: 'light',
    shade: 0.14,
    layout: { x: -620, y: 460, z: 14, w: 600, h: 780, rz: -13, rx: 1.2 },
    blur: 0.8,
    excerpt:
      'Münster, 1648. Nasce l’idea che esista un «interno» degli Stati, sottratto a ogni autorità superiore.',
    body: [
      'La pace di Westfalia è ricordata come l’atto di nascita della sovranità moderna. In realtà è una mediazione tra stremati: nessuno dei firmatari immaginava di fondare un sistema. Fondarono un vocabolario.',
      'Da quel vocabolario discendono le Nazioni Unite e i suoi limiti. Ogni volta che si invoca il diritto internazionale si cita un compromesso tra principi esausti, redatto in latino e in francese, in una città di provincia della Vestfalia.',
    ],
    author: 'Lorenzo Bassi',
    date: '8 settembre 2025',
    minutes: 10,
  },
  {
    id: 'vienna',
    category: 'Geopolitica',
    kicker: 'Congresso',
    title: 'L’Europa delle cancellerie',
    imageKey: 'vienna',
    variant: 'page',
    tone: 'light',
    shade: 0.52,
    layout: { x: -612, y: -75, z: 0, w: 440, h: 380, rz: -14.5, rx: -1.3 },
    blur: 2.4,
    excerpt:
      'Il congresso che ridisegnò l’Europa senza consultare una sola popolazione. Funzionò per un secolo.',
    body: [
      'Metternich chiamava il congresso «una macchina per fare ordine». L’ordine era la stabilità dinastica, e il prezzo fu la rimozione sistematica delle questioni nazionali dal tavolo delle trattative.',
      'Il sistema funzionò fino a quando le nazionalità che aveva ignorato non trovarono eserciti. È la lezione che ogni conferenza di pace successiva ha tentato di aggirare, con esiti alterni.',
    ],
    author: 'Lorenzo Bassi',
    date: '14 settembre 2025',
    minutes: 7,
  },
  {
    id: 'mappamondo',
    category: 'Atlante',
    kicker: 'Planisferi',
    title: 'Dove finisce un impero',
    imageKey: 'mappamondo',
    variant: 'map',
    tone: 'light',
    shade: 0.58,
    layout: { x: -712, y: 169, z: -4, w: 520, h: 420, rz: -16, rx: 1.8 },
    blur: 2.8,
    excerpt:
      'Ogni planisfero è una dichiarazione di intenti: la proiezione scelta decide chi sta al centro e chi al margine.',
    body: [
      'Ortelius disegna il mondo nel 1570 e lo intitola Theatrum: teatro. Non è una metafora innocente. La mappa è una messa in scena in cui l’Europa occupa il palco e le altre terre sono quinte.',
      'La proiezione di Mercatore, nata per la navigazione, gonfia le latitudini alte e con esse le ambizioni coloniali. Ancora oggi, guardando un planisfero, guardiamo una decisione politica travestita da geometria.',
    ],
    author: 'Pietro Lombardi',
    date: '5 settembre 2025',
    minutes: 8,
  },
  {
    id: 'orgaz',
    category: 'Storia',
    kicker: 'Pittura',
    title: 'Il conte, il santo, la città',
    imageKey: 'orgaz',
    variant: 'plate',
    tone: 'dark',
    shade: 0.42,
    layout: { x: -32, y: 526, z: 22, w: 520, h: 420, rz: -11.5, rx: 1 },
    blur: 1,
    excerpt:
      'El Greco trasforma un funerale locale in una controversia teologica sull’aldilà. E la dipinge per una parrocchia.',
    body: [
      'È il 1586. La parrocchia di Santo Tomé a Toledo paga per un dipinto che commemorі un benefattore. El Greco consegna due registri sovrapposti: la sepoltura in basso, l’accoglienza celeste in alto, e nessun confine netto tra i due.',
      'La città è tutta lì, ritratta nei volti dei nobili. Il miracolo non è un’eccezione: è l’ipotesi che tiene insieme una comunità. Dipingere il cielo significa dipingere il modo in cui una città immagina se stessa.',
    ],
    author: 'Marta Vergani',
    date: '19 settembre 2025',
    minutes: 7,
  },
  {
    id: 'atene',
    category: 'Teologia',
    kicker: 'Affreschi',
    title: 'Il logos prima del dogma',
    imageKey: 'atene',
    variant: 'page',
    tone: 'light',
    shade: 0.36,
    layout: { x: -242, y: 526, z: 20, w: 420, h: 380, rz: -12, rx: -1.4 },
    blur: 1.5,
    excerpt:
      'Raffaello mette i filosofi pagani nelle stanze del papa. È il più grande atto di diplomazia intellettuale del Rinascimento.',
    body: [
      'Nel 1511 la Stanza della Segnatura era l’ufficio personale di Giulio II. Raffaello vi dipinge Platone e Aristotele, Pitagora e Tolomeo, senza attribuire a nessuno l’inferno che la teologia ufficiale riservava ai pagani.',
      'L’operazione è politica: se la sapienza antica è compatibile con la fede, la Chiesa può rivendicarne l’eredità. Il cristianesimo smette di essere una frattura e diventa un compimento. È una tesi, non una verità: ma nessuno la dipinse meglio.',
    ],
    author: 'Elena Ricci',
    date: '11 settembre 2025',
    minutes: 9,
  },
  {
    id: 'peutinger',
    category: 'Atlante',
    kicker: 'Itinerari',
    title: 'Le vie del mondo',
    imageKey: 'peutinger',
    variant: 'map',
    tone: 'light',
    shade: 0.62,
    layout: { x: -252, y: -570, z: 2, w: 620, h: 110, rz: -11, rx: 0 },
    blur: 2.8,
    excerpt:
      'La Tabula Peutingeriana non descrive lo spazio: elenca le strade. Una mappa come sequenza di decisioni.',
    body: [
      'Undici metri di pergamena per settemila luoghi. Non è una carta geografica: è un elenco di tappe, è il primo manuale di logistica dell’Occidente.',
      'La forma allungata non è un errore: è una scelta funzionale. Chi viaggia non ha bisogno della forma del mondo, ha bisogno della distanza tra una fonte e la successiva. La mappa è già un’interfaccia.',
    ],
    author: 'Pietro Lombardi',
    date: '30 agosto 2025',
    minutes: 5,
  },
  {
    id: 'durer',
    category: 'Teologia',
    kicker: 'Incisioni',
    title: 'La notte della ragione',
    imageKey: 'durer',
    variant: 'plate',
    tone: 'dark',
    shade: 0.48,
    layout: { x: -532, y: 201, z: 2, w: 330, h: 420, rz: -13, rx: 1.5 },
    blur: 1.9,
    excerpt:
      'Melencolia è il ritratto dell’intelletto che ha tutti gli strumenti e nessuna risposta. Dürer lo incide nel 1514.',
    body: [
      'Attorno alla figura ci sono il compasso, la sfera, la scala, la bilancia: tutti gli strumenti della misura. Nessuno di essi è in uso. La malinconia è la sospensione tra il potere tecnico e l’impotenza del senso.',
      'L’incisione diventa un’icona del pensiero moderno: la conoscenza non consola, espone. È il rovescio esatto dell’umanesimo trionfante che Raffaello dipingeva tre anni prima, a poche centinaia di chilometri di distanza.',
    ],
    author: 'Fra’ Anselmo Bruni',
    date: '25 settembre 2025',
    minutes: 6,
  },
  {
    id: 'hagia',
    category: 'Storia',
    kicker: 'Architetture',
    title: 'Due fedi, un impero',
    imageKey: 'hagia',
    variant: 'page',
    tone: 'dark',
    shade: 0.88,
    layout: { x: -522, y: -448, z: 4, w: 420, h: 620, rz: -13, rx: 1.1 },
    blur: 3,
    excerpt:
      'Santa Sofia è stata cattedrale, moschea, museo, di nuovo moschea. La sua cupola ha cambiato padrone senza mai cambiare forma.',
    body: [
      'Giustiniano la consacra nel 537 e non la descrive: la dichiara «superiore a Salomone». La cupola è un argomento teologico costruito in mattoni, e la sua ampiezza è la prova visibile di una gerarchia.',
      'Nel 1453 i conquistatori non la distruggono: la convertono. Perché distruggere ciò che si può ereditare? Santa Sofia è la lezione più lunga sulla continuità del potere: non si abbatte il simbolo, lo si abita.',
    ],
    author: 'Andrea Serra',
    date: '2 ottobre 2025',
    minutes: 8,
  },
  {
    id: 'sanpietro',
    category: 'Storia',
    kicker: 'Architetture',
    title: 'La cupola e la città',
    imageKey: 'sanpietro',
    variant: 'page',
    tone: 'dark',
    shade: 0.62,
    layout: { x: -520, y: -300, z: 2, w: 540, h: 720, rz: -14, rx: -1.2 },
    blur: 2.4,
    excerpt:
      'Costruire San Pietro significò vendere il cielo per finanziare la pietra. E provocare una frattura che dura ancora.',
    body: [
      'La basilica costa più di quanto la cristianità potesse permettersi. Le indulgenze che la finanziano sono lo scandalo che Lutero inchioda a una porta di Wittenberg: un’architettura che genera una riforma.',
      'La cupola di Michelangelo è l’immagine di un cattolicesimo che si vuole universale e visibile. Ogni pellegrino che alza gli occhi compie, senza saperlo, un atto di adesione politica.',
    ],
    author: 'Elena Ricci',
    date: '6 settembre 2025',
    minutes: 7,
  },
  {
    id: 'caravaggio',
    category: 'Teologia',
    kicker: 'Luce',
    title: 'La luce che convoca',
    imageKey: 'caravaggio',
    variant: 'plate',
    tone: 'dark',
    shade: 0.3,
    layout: { x: -432, y: 6, z: 24, w: 460, h: 260, rz: -12, rx: 1.2 },
    blur: 1.4,
    excerpt:
      'Caravaggio non dipinge il divino: dipinge il momento in cui qualcuno si accorge di essere chiamato.',
    body: [
      'La Vocazione di San Matteo è costruita su un gesto: la mano di Cristo che indica un esattore delle tasse. La luce non viene dal cielo, viene dalla porta. Il miracolo accade in un ufficio.',
      'Per la prima volta il sacro non ha aureola: ha una manica di velluto e un conto da riscuotere. È questa la rivoluzione che la Controriforma non aveva previsto e che il secolo successivo avrebbe pagato.',
    ],
    author: 'Marta Vergani',
    date: '20 settembre 2025',
    minutes: 6,
  },
  {
    id: 'cardinale',
    category: 'Storia',
    kicker: 'Ritratti',
    title: 'Il porporato e il principe',
    imageKey: 'cardinale',
    variant: 'plate',
    tone: 'light',
    shade: 0.52,
    layout: { x: -700, y: 84, z: 6, w: 330, h: 420, rz: -16, rx: 1.4 },
    blur: 2.2,
    excerpt:
      'Un ritratto di Raffaello, un cardinale senza nome, un’intera grammatica del potere ecclesiastico.',
    body: [
      'Non sappiamo chi sia. Forse proprio per questo il quadro funziona: il porporato è un ruolo prima che una persona. Lo sguardo è laterale, mai frontale; la mano è appoggiata, mai operante.',
      'Raffaello codifica qui l’immagine del prelato di curia: colto, discreto, immobile. È un’icona che resisterà per secoli, fino alla fotografia e oltre.',
    ],
    author: 'Giulia Fanti',
    date: '13 settembre 2025',
    minutes: 4,
  },
];

export const HERO_DOC_ID = 'sacro-potere';
