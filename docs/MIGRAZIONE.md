# Migrazione dei contenuti — MetaHistoria

Trasferimento integrale del patrimonio editoriale da
`https://precious-cassata-42205a.netlify.app/` al progetto locale, senza toccare la direzione
artistica del sito di destinazione.

Data: 28 ottobre 2026 · sorgente acquisita in locale · nessuna dipendenza dal dominio Netlify
durante la navigazione.

---

## A. Inventario della sorgente

| Voce | Numero |
|---|---|
| URL interni scoperti | **137** |
| Pagine acquisite (HTTP 200) | **131** |
| Pagine non accessibili | **6** (404 sul sito sorgente) |
| Sezioni principali | **6** |
| Voci di menu | **49** |
| Profondità massima | 3 livelli (`/biblioteca-pentaedrica/casi/…`) |

Il sito sorgente è **statico** (HTML + CSS inline, nessun CMS): il crawling è stato fatto con
`fetch` + parsing, non con un browser, ed è quindi deterministico e ripetibile.

### Pagine non accessibili (collegate ma inesistenti sul sorgente)

Nessun contenuto è stato inventato per queste destinazioni:

```
/modello-civilta-organismo.html
/matrice-apocalittica.html
/atlante-antico-testamento.html
/atlante-vangelo.html
/testi/GeoPolitica_Spirituale/Manuale_ Apocalisse del potere. pdf
/testi/Manuale_ Apocalisse del potere - Commento a Daniele e Apocalisse.docx
```

Sono link rotti già presenti nel sito originale: le pagine corrispondenti **esistono** in forma
valida senza estensione `.html` e sono state migrate (es. `/geopolitica-dell-anima/modello-civilta-organismo`).

### Distribuzione per sezione

| Sezione | Pagine |
|---|---|
| Teologia della geopolitica | 32 |
| Geopolitica dell'anima | 27 |
| Geopolitica classica | 20 |
| Apocalisse del potere | 19 |
| Biblioteca pentaedrica | 16 |
| Geopolitica umana | 13 |
| Atlante visuale, metodo, architettura, Tommaso | 4 |

---

## B. Migrazione

| Voce | Numero |
|---|---|
| Pagine estratte | **131** |
| Route uniche | **126** (9 alias `.html` ricondotti alla pagina canonica) |
| Blocchi tipizzati | **8.984** |
| Caratteri di testo | **2.215.465** |
| Parole (stima) | **~369.000** |
| Unità testuali verificate | **10.681** |
| Unità mancanti | **0** |

### Contenuti mancanti

**Nessuno**, sul perimetro accessibile. La verifica (sotto) confronta ogni singolo elemento
testuale della pagina originale con l'archivio locale.

### Anomalie risolte durante l'estrazione

1. **Parole incollate** ai confini di `<strong>`/`<em>`: i run ora conservano gli spazi originali.
2. **Timeline e card schiacciate** in un unico paragrafo: i componenti a tessera
   (`event-card`, `chapter-card`, `sys`, `omelia-box`, `facet`, `card`) sono emessi come blocchi
   strutturati con parti separate.
3. **Home del sorgente scartata**: l'elemento era `<header id="top">`, confuso con il link "torna su".
4. **Nav-card prev/next** incluse per errore nel corpo: ora sono metadati, non contenuto.
5. **Glifi decorativi** (▾ ▼ ← →) rimossi dal testo e conservati nella navigazione.

---

## C. Modifiche al codice

### Nuovi file

```
src/content/manifest.json          indice: 131 pagine, hash, conteggi, percorso
src/content/navigation.json        6 gruppi, 49 voci, alias
src/content/pages/*.json           131 documenti a blocchi tipizzati
src/lib/router.tsx                 router minimo (history API), Link, useRoute
src/components/EditorialPage.tsx   pagina editoriale (testata, blocchi, indice, riferimenti, capitoli)
src/components/BlockRenderer.tsx   renderer dei blocchi, senza HTML grezzo
src/components/PageRoute.tsx       risoluzione rotta + 404
src/components/Home.tsx            la homepage esistente, spostata invariata
src/styles/article.css             tipografia delle pagine (carta avorio, stessa scala)
migration/crawl.mjs                crawler riprendibile
migration/extract.py               estrazione a blocchi
migration/build_site.py            indice, alias, gerarchia, menu
migration/validate.py              verifica di completezza
migration/check_links.py           verifica dei collegamenti
migration/route-test.js            test Playwright di tutte le route
public/_redirects                  fallback SPA per Netlify
```

### File modificati

| File | Modifica |
|---|---|
| `src/App.tsx` | diventa il guscio di routing: testata + homepage oppure pagina |
| `src/components/Masthead.tsx` | le voci puntano alle pagine reali (prima a `#editorial`) |
| `src/main.tsx` | `RouterProvider` + import di `article.css` |
| `public/routes.json` | elenco route per i test automatici |

**Non modificati:** `Scene.tsx`, `HeroPage.tsx`, `Sheet.tsx`, `Paper.tsx`, `Reader.tsx`,
`Editorial.tsx`, `scene.css`, `hero-page.css`, `sheet.css`, `reader.css`, `editorial.css`,
`masthead.css` (solo dati), `documents.ts`, `site.ts`, gli asset e le immagini.

### Dipendenze aggiunte

**Nessuna.** Il router è ~60 righe di history API; i contenuti sono JSON importati con
`import.meta.glob`, una chunk per pagina.

---

## D. Verifiche

### Completezza dei testi

`migration/validate.py` confronta, per ogni pagina, **ogni elemento testuale della sorgente**
(`p`, `li`, `h1–h6`, `blockquote`, `td/th`, `summary`, `div` foglia) con il testo compatto
dell'archivio locale, escludendo spaziatura e glifi decorativi.

```
pagine: 131 · unità testuali: 10.681 · mancanti: 0 · copertura: 100.000%
```

Il metodo è deterministico (nessun giudizio semantico) e immune ai confini di blocco: se una
singola unità mancasse, comparirebbe nel report con il suo testo.

### Collegamenti

```
pagine: 126 · voci di menu: 49 · collegamenti mancanti: 0 · pagine orfane: 0
```

### Route (Playwright, build di produzione)

Tutte le 131 route sono state aperte con il router reale, attendendo il rendering del contenuto:

```
testate: 131 · ok: 131 · fallite: 0 · errori in console: 0
```

### Build e tipi

```
tsc --noEmit       0 errori
vite build         ok — 132 chunk JS, un chunk per pagina
dist/              ~7,9 MB (testi, immagini, font)
```

Il bundle iniziale resta ~494 kB (React + GSAP); **nessun articolo** viene caricato prima che la
sua route venga aperta.

### Responsive

Verificati a 1344×752, 1440×900 e 390×844: nessuno scroll orizzontale, colonna singola su mobile,
testata ad accordion, articoli lunghi leggibili.

---

## E. Design

### Homepage: prima / dopo

Confronto pixel tra `docs/01-hero.png` (prima) e lo stato attuale, a 1344×752:

| Regione | Pixel diversi |
|---|---|
| Pagina protagonista centrale | 0,354% (solo antialiasing del testo) |
| Resto della scena (archivio, luci, carte) | **0,000%** |
| Testata (due voci cambiate: *Indice/Colophon* → *Archivio/Atlante*) | 9,2% (modifica voluta) |
| Due carte periferiche sfocate | differenza di rasterizzazione fra due caricamenti |

La **composizione tridimensionale, la prospettiva, la palette, la tipografia e le animazioni sono
identiche**: nessun file della scena è stato toccato. Le due carte che differiscono sono pagine
con `filter: blur()`: Chrome rasterizza quei layer a risoluzione lievemente diversa fra un
caricamento a freddo e uno a caldo — comportamento preesistente, non introdotto dalla migrazione.

### Perché la scena non è cambiata

- La homepage è stata spostata in `Home.tsx` **senza modifiche di codice**, solo di contenitore.
- Il router monta la scena solo su `/`; sulle altre route il componente non esiste, quindi le
  timeline GSAP e ScrollTrigger vengono smontate con il loro context (nessuna interferenza).
- Nessun CSS della scena è stato riscritto; `article.css` è interamente scopato su `.doc` e
  `.blk-*`.

### Pagine interne: linguaggio del sito

Carta avorio (`--paper`), Cormorant Garamond per i titoli, Inter per le etichette, oro spento per
le rubriche, filetti sottili, capolettera, colonna di lettura da ~70 caratteri, testata scura
condivisa con la homepage. Nessun font, colore o spaziatura proviene dal sito sorgente.

---

## Come si rigenera

```bash
node migration/crawl.mjs            # riscarica le pagine (riprendibile)
python migration/extract.py         # estrae i blocchi in src/content/pages
python migration/build_site.py      # indice, alias, menu
python migration/validate.py        # verifica di completezza
python migration/check_links.py     # verifica dei collegamenti
npm run build
```

I file grezzi scaricati restano in `migration/source/` (escluso dal build).
