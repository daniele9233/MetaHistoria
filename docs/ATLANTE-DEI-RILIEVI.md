# MetaHistoria — Atlante dei rilievi

Versione locale del 29 ottobre 2026, ispirata alla proposta scelta dall’utente: Mediterraneo tridimensionale, titolo «Entra nel territorio», segnaposto del Vaticano, scheda del dossier e comandi Vista globale / Italia / Esplora.

[Apri l’atlante](http://127.0.0.1:4185/atlante-globo) · [Home e transizione dalla carta](http://127.0.0.1:4185/)

## Comportamento

La superficie è una geometria Three.js deformata con un raster altimetrico; il riferimento grafico non viene usato come sfondo. La camera parte sull’Italia, cambia distanza con i pulsanti +/−, con Alt + rotella o doppio clic, e ruota trascinando. La rotella normale e il gesto verticale su telefono restano disponibili allo scorrimento della pagina.

Il segnaposto e la curva verso il dossier seguono la proiezione del luogo durante i movimenti. Gli otto luoghi dell’indice hanno coordinate geografiche reali e aprono gli articoli esistenti. L’indice completo conserva tutti i 125 collegamenti, inclusa la ricerca per titolo e sezione. I contenuti senza una posizione geografica restano nell’indice editoriale.

La stessa scena entra nella home tramite la timeline esistente; scorrendo indietro si ritorna alla carta. Il lettore dei dossier e la navigazione delle sezioni rimangono disponibili. Su mobile titolo, scheda e comandi vengono ricomposti. Senza WebGL appare l’accesso all’indice completo con il comando per riprovare la scena.

## Superficie, immagini e prestazioni

- Immagine terrestre: [NASA Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/), composito luglio 2004. Rilievi: [NASA Earth Observatory / GEBCO](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/).
- Texture e altimetria sono ospitate nel progetto. Crediti, sorgenti originali, trasformazioni, dimensioni e hash sono in `public/media/earth-relief/SOURCES.json`. Lo script `scripts/prepare-relief-assets.py` riproduce le immagini ottimizzate.
- Versione desktop: colore globale 8k, dettaglio europeo 4k, altimetria 8k; circa 5,77 MB di immagini compresse. Profilo adattivo: globale e altimetria 4k, Europa 2k; circa 1,69 MB. Il profilo viene scelto alla creazione in base a larghezza, concorrenza disponibile e dimensione massima texture.
- Più vertici intorno al Mediterraneo, un’unica superficie continua. Nel profilo alto la scena ha 1.182.504 triangoli, 4 chiamate di disegno, 4 geometrie e 3 programmi. Le normali per pixel derivano dall’altimetria, evitando le striature causate dall’interpolazione sulla griglia adattiva.
- Rilievo amplificato circa 37 volte rispetto alla scala terrestre per la vista editoriale; nella vista globale l’amplificazione si riduce progressivamente. Non è un modello per misure scientifiche.
- Rendering su richiesta: si arresta a camera ferma, fuori vista e con documento nascosto. Le transizioni di camera riutilizzano geometrie, materiali e texture. Le risorse vengono rilasciate allo smontaggio. Con movimento ridotto la camera raggiunge subito la posizione richiesta.

## Verifica

`npm run build` e verifiche della geometria superati. Il controllo finale comprende 19 verifiche funzionali, 11 di integrazione, 3 verifiche conclusive e l’accesso all’indice con WebGL disabilitato. Risultati: `docs/relief-qa.json`.

Sono stati verificati selezione reale del Vaticano con puntatore, voli verso i luoghi, collegamenti al lettore, ricerca, limiti dello zoom, assenza di overflow orizzontale, navigazione delle sezioni, scroll inverso della home, rotazione con gesto orizzontale e scorrimento con gesto verticale, movimento ridotto, sospensione del rendering e stabilità delle risorse durante ripetuti cambi di vista. Nessun errore JavaScript nelle prove di integrazione.

Misura indicativa in Headless Chrome 156 su Windows, viewport 1536 × 1024, DPR 1: 316 intervalli `requestAnimationFrame` durante un cambio di camera; mediana 6,9 ms, 95° percentile 7 ms, nessun intervallo oltre 33,4 ms. Questi sono intervalli del browser sul computer di sviluppo, non tempi GPU né una garanzia per tutti i dispositivi. Mobile e touch sono stati emulati; resta da verificare la resa su telefoni fisici. Vite segnala ancora bundle oltre 500 kB.

Schermate: `relief-desktop.png`, `relief-mobile.png`, `relief-global.png`, `relief-china.png`, `relief-home.png` nella cartella `docs`.

Questa versione sostituisce la precedente sfera editoriale descritta in `CINEMATIC-PAPER-ATLAS.md`; le note sulla carta e sul lettore in quel documento restano riferimenti separati.
