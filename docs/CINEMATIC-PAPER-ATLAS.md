# MetaHistoria — carta deformabile e atlante editoriale

Consegna locale del 29 ottobre 2026, nel progetto esistente `D:\sito-fra2-copia`.

## Prova la versione compilata

- [Home e transizione](http://127.0.0.1:4185/)
- [Libro: Geopolitica Classica](http://127.0.0.1:4185/geopolitica-classica)
- [Atlante editoriale](http://127.0.0.1:4185/atlante-globo)

L’anteprima locale è stata avviata sulla porta 4185. Per riavviarla dalla cartella del progetto: `npm run preview -- --host 127.0.0.1 --port 4185`. Prima di distribuire una modifica: `npm run build`.

## Risultato

Il lettore conserva testi HTML selezionabili, indice, numerazione nell’indirizzo, immagini ingrandibili, lettura continua, stampa e collegamenti. Durante la sfogliatura un livello WebGL temporaneo rappresenta lo stesso contenuto su una superficie curva. Il medesimo sistema è presente nella pagina protagonista della hero, che ora permette di sfogliare le prospettive dell’archivio.

La home passa dall’archivio cartaceo alla sfera dei contenuti attraverso un’unica timeline GSAP. Il globo è invisibile all’apertura, viene preparato prima dell’ingresso e diventa interattivo al termine della rivelazione. Lo scroll inverso ricostruisce la sequenza precedente.

## Implementazione della carta

- `PlaneGeometry` Three.js con 56 × 14 segmenti, 855 vertici. Le coordinate sono aggiornate con integrazione della curvatura lungo la lunghezza del foglio; non si tratta della rotazione di un piano rigido.
- Dorso vincolato, piega che cambia con il progresso e il punto verticale di presa, ondulazione secondaria contenuta, normali ricalcolate e materiali separati per fronte e retro.
- Il progresso viene ricavato invertendo la posizione del bordo libero: il foglio segue lo spostamento della mano in coordinate locali.
- Pointer Events, presa trasferita alla superficie del libro e gestione di cancellazione e perdita della cattura. Un gesto verticale resta disponibile allo scroll del documento.
- Stati espliciti `idle`, `hover`, `grabbed`, `dragging`, `settling`, `completed`, `cancelled`.
- Soglia di completamento al 40%, combinata con la velocità recente. Dopo una pausa la velocità non resta artificialmente accumulata. L’inversione del gesto può annullare il movimento.
- Sfogliatura automatica di 1.120 ms; rilascio regolato da una molla criticamente smorzata con piccoli sottointervalli temporali.
- Luce direzionale, materiale opaco e ombre dinamiche sulla pagina sottostante. Il livello WebGL resta nascosto a riposo.
- Cattura temporanea dell’HTML con `html-to-image`, font locali incorporati, cache limitata alle pagine vicine e nessuna rasterizzazione durante il singolo fotogramma del drag.
- Compilazione anticipata dei materiali. La copia delle proprietà CSS è limitata a quelle usate dal layout editoriale per evitare blocchi durante la preparazione delle pagine successive.

Sono stati letti StPageFlip, Grabfold e l’esempio Google. La modalità HTML di Grabfold usa una piega piana; il suo curl WebGL richiede immagini. L’esempio Google usa HTML-in-Canvas sperimentale. È stato quindi adottato un sistema personalizzato, preservando l’HTML originale a riposo e senza richiedere funzioni sperimentali del browser.

## Transizione e globo

La timeline estende il percorso già presente a circa 220vh, con `scrub: 0.7`. Le carte periferiche arretrano; il foglio centrale si raddrizza e si allontana. Le linee del foglio si raccordano otticamente con le orbite, mentre scala e profondità della sfera vengono definite dal medesimo progresso. Non vengono creati ScrollTrigger indipendenti per comandare lo stesso passaggio.

Il globo ha due rappresentazioni distinte:

| Vista | Fonte e significato |
| --- | --- |
| Temi | 125 percorsi editoriali unici, ricavati dal manifest attuale. I gruppi corrispondono a 9 famiglie del sito. Le 116 connessioni seguono esclusivamente i legami capitolo–volume presenti nei dati. Nessun continente o significato geografico viene attribuito ai temi. |
| Luoghi | Gli 8 ancoraggi geografici già presenti nell’atlante originale. Titoli, ID e indirizzi vengono risolti nel manifest; le anteprime caricano il documento effettivo. Per 6 luoghi è disponibile anche il dossier della Geopolitica dell’Anima. |

Le anteprime si aprono selezionando un punto con raycasting o utilizzando l’indice testuale. La camera si orienta progressivamente. Sono disponibili ritorno alla vista generale, pausa della rotazione e ricerca nell’indice.

Il precedente mappamondo con cinque lenti e confronti editoriali rimane disponibile nella pagina dell’atlante, sotto **Confronti editoriali · esplora le cinque lenti**, ed è caricato solo all’apertura di quel pannello.

## File principali

| File | Intervento |
| --- | --- |
| `src/components/PaperSurface.tsx` | Controller condiviso, drag, stati, cache e passaggio HTML/WebGL. |
| `src/lib/paperGeometry.ts` | Curvatura, inversa della posizione del bordo, soglia e inerzia del rilascio. |
| `src/lib/paperRenderer.ts` | Geometria, cattura delle pagine, materiali, luci e ombre. |
| `src/lib/webglRenderer.ts` | Creazione e riutilizzo del contesto WebGL durante i cambi di layout. |
| `src/components/BookReader.tsx` | Collegamento al nuovo controller mantenendo le funzioni del lettore. |
| `src/components/HeroFolio.tsx` | Sfogliatura delle prospettive nella hero esistente. |
| `src/components/Scene.tsx` | Timeline hero–atlante, reversibilità, modalità a movimento ridotto e sospensione fuori vista. |
| `src/components/Home.tsx` | Indicazioni e conteggio coerenti con le due fasi della home. |
| `src/lib/editorialAtlas.ts` | Adattamento dei contenuti reali e separazione tra temi e luoghi. |
| `src/lib/atlasRenderer.ts` | Sfera, confini geografici, nodi instanziati, raycasting e camera. |
| `src/components/EditorialAtlas.tsx` | Anteprime, indice accessibile, ricerca e controlli. |
| `src/components/GlobePage.tsx` | Atlante completo e accesso al componente originale. |
| `src/styles/cinematic.css`, `src/main.tsx` | Stili e integrazione responsive. |
| `package.json`, `package-lock.json` | Three.js, html-to-image e tipi Three.js. |

La build aggiornata è in `dist/`. Questo intervento non modifica i JSON degli articoli né l’algoritmo di impaginazione. Il repository conteneva già numerose modifiche locali: quelle estranee a questo lavoro sono state conservate.

## Strumenti e versioni effettive

React/React DOM 19.3.1, Vite 6.4.5, TypeScript 5.9.3, GSAP 3.15.0, `@gsap/react` 2.1.2. Aggiunti Three.js 0.186.1, `@types/three` 0.186.0 e `html-to-image` 1.11.13.

Non sono stati aggiunti R3F, Drei, Lenis o altri motori concorrenti. I renderer Three.js sono gestiti nel lifecycle dei componenti React.

Installate globalmente in Codex **24 skill Three.js e 8 skill GSAP** dai repository richiesti. Consultate le skill pertinenti a geometria, animazione, interazione, shader, compatibilità React, performance, debugging, test, timeline e ScrollTrigger. Usata la skill Playwright per il collaudo. Chrome DevTools MCP è configurato e ha risposto alle verifiche di pagina, emulazione e screenshot.

## Verifiche eseguite

Le cinque suite salvate in [cinematic-qa.json](cinematic-qa.json) riportano **34 controlli superati**:

- Libro: pausa stabile al 25% e 50%, rilascio sotto/sopra soglia, avanti/indietro, inversione, pulsanti, tastiera, indice e lettura continua.
- Touch Chrome emulato: sfogliatura orizzontale, scroll verticale conservato, nessun cambio pagina durante il gesto verticale e nessuno scorrimento orizzontale indesiderato.
- Casi limite: flick breve e rapido, `pointercancel`, resize durante il movimento, recupero del renderer, dodici attivazioni rapide con un solo avanzamento, ingrandimento immagini e componente originale a cinque lenti.
- Transizione: globo inizialmente nascosto, stato intermedio, interattività finale, ritorno allo stesso progresso, occultamento tornando alla hero e apertura del dossier corretto.
- Movimento ridotto e WebGL disabilitato: globo sotto la prima schermata, atlante utilizzabile, sfogliatura istantanea e accesso ai 125 articoli tramite indice.

Inoltre: selezione diretta di un punto 3D verificata sul Caso Vaticano; orientamento orizzontale 844 × 390 senza overflow laterale e con collegamenti raggiungibili; 125 nodi tematici univoci, coordinate finite e nessun genitore editoriale irrisolto. I test numerici della carta verificano dorso fisso, geometria finita, limiti della lunghezza, corrispondenza mano–bordo, flick e inversione.

Build TypeScript/Vite completata. Nessun errore nella console nell’ultima verifica della pagina dell’atlante. Non è stata rieseguita la precedente verifica completa dell’impaginazione di tutti i 131 documenti, poiché quel modulo e i contenuti non sono stati cambiati.

## Prestazioni misurate

Dati completi: [cinematic-performance.json](cinematic-performance.json).

Chrome 156 headless su Windows, NVIDIA RTX 4080 SUPER, viewport 1440 × 900, DPR 1, senza rallentamento emulato. Campioni di circa 1,7 secondi; sono tempi tra callback `requestAnimationFrame`, non tempi GPU isolati.

| Misura finale | Carta | Globo |
| --- | ---: | ---: |
| Campioni | 241 | 246 |
| Mediana | 6,9 ms | 6,9 ms |
| 95° percentile | 7,0 ms | 7,1 ms |
| 99° percentile | 13,8 ms | 7,2 ms |
| Fotogrammi oltre 25 ms | 0 | 0 |
| Long task durante il campione | 0 | 0 |
| Draw call | 5 | 4 |
| Triangoli, inclusi i passaggi delle ombre | 6.274 | 20.476 |

Prima dell’ottimizzazione della preparazione CSS, la prima sfogliatura mostrava 5 fotogrammi oltre 25 ms e long task fino a 101 ms. Nel campione finale non compaiono questi blocchi.

Dopo quattro sfogliature alternate: 2 geometrie, 5 texture e 4 programmi costanti nel renderer della carta. Tre cicli libro–atlante senza errori, con un solo canvas nella pagina dell’atlante. Queste osservazioni non sostituiscono un’analisi completa della memoria su lunga durata.

## Screenshot

- [Hero](cinematic-hero.png)
- [Libro a riposo](cinematic-book-rest.png)
- [Carta al 25%](cinematic-book-25.png), [50%](cinematic-book-50.png), [75%](cinematic-book-75.png)
- [Sfogliatura indietro](cinematic-book-back.png)
- [Transizione](cinematic-transition.png)
- [Globo](cinematic-globe.png)
- [Articolo selezionato](cinematic-selected.png)
- [Libro mobile](cinematic-mobile-book.png), [touch](cinematic-touch-turn.png), [atlante mobile](cinematic-mobile-atlas.png)
- [Movimento ridotto](cinematic-reduced-motion.png)
- [Fallback libro](cinematic-fallback-book.png), [fallback atlante](cinematic-fallback-atlas.png)
- [Orientamento orizzontale](cinematic-landscape.png)

## Limiti residui

- Touch e orientamento sono stati verificati tramite emulazione Chrome; non sono stati provati dispositivi fisici iOS/Android, Safari o Firefox.
- Le misure di fluidità si riferiscono al desktop indicato e non garantiscono lo stesso risultato su telefoni o GPU meno potenti.
- Durante il movimento il testo è temporaneamente rasterizzato; selezione e interazione HTML tornano disponibili a riposo. La perdita di WebGL conserva navigazione e lettura senza deformazione.
- Vite segnala ancora chunk superiori a 500 kB: bundle principale circa 552 kB e modulo Three.js condiviso circa 529 kB prima di gzip. I renderer 3D sono caricati dinamicamente e condividono la libreria.
- Nessuna pubblicazione online è stata eseguita.

## Riferimenti consultati

[Grabfold](https://github.com/javocsoft/grabfold), [StPageFlip](https://github.com/Nodlik/StPageFlip), [Google HTML-in-Canvas book](https://github.com/GoogleChromeLabs/css-web-ui-demos/blob/main/html-in-canvas/public/demos/webgl-interactive-book.html), [skill Three.js](https://github.com/cesartevisual/threejs-skills), [skill GSAP](https://github.com/greensock/gsap-skills), [configurazione MCP di Codex](https://developers.openai.com/learn/docs-mcp).

Le licenze e attribuzioni dell’atlante geografico preesistente restano in `public/atlante-globo/LICENSES.md`.
