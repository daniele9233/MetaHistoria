# Sorgenti del mappamondo MetaHistoria

Il componente originale creato per MetaHistoria è integrato in `/atlante-globo`.
Il bundle viene caricato soltanto quando si apre questa pagina. Tutti i collegamenti ai dossier usano l’origine del sito corrente.

- `src/data.json`: luoghi, cinque lenti, relazioni editoriali e collegamenti ai dossier.
- `src/component.js`: elemento personalizzato, interazioni e disegno del globo.
- `src/component.css`: stile isolato nel componente.
- `src/world.json`: geometria del mondo.
- `src/d3.min.js`, `src/topojson.min.js`: librerie incluse localmente.

Dalla cartella del progetto, eseguire `node globe-source/build.cjs` dopo una modifica a questi sorgenti; poi `npm run build` per aggiornare la versione distribuibile in `dist/`.

Licenze e attribuzioni sono in `public/atlante-globo/LICENSES.md` e `public/atlante-globo/licenses/`.
I collegamenti luminosi rappresentano confronti tra letture del sito, non flussi culturali misurati o alleanze.
