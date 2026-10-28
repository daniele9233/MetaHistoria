import { IMAGES } from './Paper';
import { SITE } from '../data/site';

const Mark = () => (
  <svg className="hp__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="0.9" />
    <path d="M12 3.4v17.2M5.2 12h13.6" stroke="currentColor" strokeWidth="0.55" opacity="0.55" />
    <circle cx="12" cy="12" r="2.1" stroke="currentColor" strokeWidth="0.9" />
  </svg>
);

/**
 * La pagina protagonista: una vera homepage in miniatura, in HTML,
 * così da restare nitida anche quando la camera si avvicina.
 */
export function HeroPage({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="hp">
      <header className="hp__top">
        <div className="hp__brand">
          <Mark />
          <span className="hp__wordmark">MetaHistoria</span>
        </div>

        <nav className="hp__nav" aria-label="Sezioni">
          {SITE.miniNav.map((item) => (
            <a key={item} href="#editorial" tabIndex={-1}>
              {item}
            </a>
          ))}
        </nav>

        <span className="hp__issue">
          <i className="hp__dot" />
          {SITE.issue} · {SITE.season}
        </span>
      </header>

      <div className="hp__body">
        <div className="hp__lede">
          <div className="hp__eyebrow">
            <i />
            In questo numero
          </div>
          <h1 className="hp__title">
            Dove il sacro
            <br />
            diventa <em>potere</em>
          </h1>
          <p className="hp__standfirst">
            Le fedi non hanno mai abitato solo i luoghi di culto: hanno tracciato confini, legittimato
            troni, immaginato imperi.
          </p>
        </div>

        <div className="hp__diptych">
          <div className="hp__shot hp__shot--wide">
            <img src={IMAGES.atene.src} alt="La Scuola di Atene di Raffaello" loading="eager" />
          </div>
          <div className="hp__shot hp__shot--tall">
            <img src={IMAGES.cardinale.src} alt="Ritratto di cardinale di Raffaello" loading="eager" />
          </div>
          <div className="hp__shotcap">Raffaello, 1509–1511 · Stanza della Segnatura</div>
        </div>

        <div className="hp__text">
          <p>
            Dalla Scuola di Atene ai trattati di Westfalia, la storia delle civiltà si legge come una
            lunga trattativa tra il cielo e la terra. Ogni ordine politico ha cercato una legittimazione
            più alta di sé: un dio, una legge naturale, una storia inevitabile.
          </p>
          <p>
            Questo archivio raccoglie le tracce di quella trattativa: mappe che spostano il centro del
            mondo, documenti che limitano il potere, immagini che lo rendono visibile.
          </p>
          <blockquote className="hp__quote">«Ogni mappa è una dichiarazione di intenti.»</blockquote>
          <p className="hp__text-second">
            Nessun ordine politico è sopravvissuto senza una storia che lo rendesse necessario. È
            questo il filo che unisce la teologia delle origini alla geopolitica dei nostri giorni.
          </p>
          <div className="hp__byline">A cura della redazione · 14 minuti di lettura</div>

          <div className="hp__actions">
            <button type="button" className="hp__btn hp__btn--solid" onClick={onExplore}>
              Esplora l’archivio
              <svg className="hp__arrow" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h9M6.6 2.4 10.2 6l-3.6 3.6" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
            <a className="hp__btn hp__btn--ghost" href="#editorial" tabIndex={-1}>
              Il manifesto
            </a>
          </div>
        </div>

        <div className="hp__figure">
          <div className="hp__figure-media">
            <img
              src={IMAGES.scriba.src}
              alt="Amanuense al lavoro in una miniatura medievale"
              loading="eager"
            />
            <span className="hp__figure-num">01</span>
          </div>
          <div className="hp__figure-cap">L’oro delle Scritture</div>
        </div>
      </div>

      <footer className="hp__foot">
        <div className="hp__foot-label">
          In questo
          <br />
          numero
        </div>
        <div className="hp__foot-item">
          <span>Teologia</span>
          Il logos prima del dogma
        </div>
        <div className="hp__foot-item">
          <span>Geopolitica</span>
          L’invenzione della sovranità
        </div>
        <div className="hp__foot-item">
          <span>Atlante</span>
          Gerusalemme al centro
        </div>
        <div className="hp__foot-mark">01</div>
      </footer>
    </div>
  );
}
