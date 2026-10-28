import { IMAGES } from './Paper';
import { SITE } from '../data/site';

/**
 * La pagina bianca quando prende tutto lo schermo: stessa impaginazione
 * della miniatura, ma composta per essere letta davvero.
 */
export function Sheet({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="sheet">
      <div className="sheet__inner">
        <header className="sheet__lead">
          <div className="sheet__kicker">
            <i aria-hidden="true" />
            Apocalisse del Potere — {SITE.issue} · {SITE.season}
          </div>
          <h2 className="sheet__title">
            Dove il sacro
            <br />
            diventa <em>potere</em>
          </h2>
          <p className="sheet__stand">
            Le fedi non hanno mai abitato solo i luoghi di culto: hanno tracciato confini, legittimato
            troni, immaginato imperi.
          </p>
        </header>

        <div className="sheet__grid">
          <figure className="sheet__diptych">
            <div className="sheet__shot sheet__shot--wide">
              <img src={IMAGES.atene.src} alt="La Scuola di Atene di Raffaello" />
            </div>
            <div className="sheet__shot sheet__shot--tall">
              <img src={IMAGES.cardinale.src} alt="Ritratto di cardinale di Raffaello" />
            </div>
            <figcaption>Raffaello, 1509–1511 · Stanza della Segnatura</figcaption>
          </figure>

          <div className="sheet__text">
            <p>
              Dalla Scuola di Atene ai trattati di Westfalia, la storia delle civiltà si legge come una
              lunga trattativa tra il cielo e la terra. Ogni ordine politico ha cercato una
              legittimazione più alta di sé: un dio, una legge naturale, una storia inevitabile.
            </p>
            <p>
              Questo archivio raccoglie le tracce di quella trattativa: mappe che spostano il centro del
              mondo, documenti che limitano il potere, immagini che lo rendono visibile.
            </p>
            <div className="sheet__actions">
              <button type="button" className="sheet__btn sheet__btn--solid" onClick={onExplore}>
                Esplora l’archivio
                <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 6h9M6.6 2.4 10.2 6l-3.6 3.6" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
              <a className="sheet__btn sheet__btn--ghost" href="#editorial">
                Il manifesto
              </a>
            </div>
          </div>

          <figure className="sheet__figure">
            <img src={IMAGES.scriba.src} alt="Amanuense al lavoro in una miniatura medievale" />
            <figcaption>L’oro delle Scritture</figcaption>
          </figure>
        </div>

        <footer className="sheet__strip">
          <span className="sheet__strip-label">
            In questo
            <br />
            numero
          </span>
          <div className="sheet__strip-item">
            <span>Teologia</span>
            Il logos prima del dogma
          </div>
          <div className="sheet__strip-item">
            <span>Geopolitica</span>
            L’invenzione della sovranità
          </div>
          <div className="sheet__strip-item">
            <span>Atlante</span>
            Gerusalemme al centro
          </div>
          <span className="sheet__strip-mark">01</span>
        </footer>
      </div>
    </div>
  );
}
