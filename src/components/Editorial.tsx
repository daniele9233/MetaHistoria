import { useMemo } from 'react';
import type { ReactNode } from 'react';
import assets from '../data/assets.json';
import { DOCS } from '../data/documents';
import type { Category, Doc } from '../data/documents';

const AREAS: Array<{
  key: Category;
  glyph: string;
  name: string;
  title: ReactNode;
  desc: string;
}> = [
  {
    key: 'Teologia',
    glyph: 'T',
    name: 'Teologia',
    title: (
      <>
        Il cielo come <em>costituzione</em>
      </>
    ),
    desc:
      'Il modo in cui gli uomini hanno immaginato il divino ha preceduto e giustificato ogni ordine politico. Testi, immagini e controversie che hanno definito il sacro — e con esso il potere che lo amministra.',
  },
  {
    key: 'Geopolitica',
    glyph: 'G',
    name: 'Geopolitica',
    title: (
      <>
        La fede dei <em>confini</em>
      </>
    ),
    desc:
      'Confini, trattati, sfere d’influenza: la politica internazionale è una teologia secolarizzata, che promette ordine in cambio di obbedienza e chiama «realismo» la propria metafisica.',
  },
  {
    key: 'Storia',
    glyph: 'S',
    name: 'Storia',
    title: (
      <>
        Rovine che <em>governano</em>
      </>
    ),
    desc:
      'Imperi che cadono, città che restano, memorie che decidono. La storia non è lo sfondo del presente: è l’argomento con cui ogni presente pretende di essere inevitabile.',
  },
];

const CREDITS = Object.entries(assets as Record<string, { license: string; artist: string; page: string; title: string }>)
  .filter(([, v]) => /^CC/i.test(v.license))
  .map(([key, v]) => ({ key, ...v }));

interface EditorialProps {
  onOpen: (doc: Doc) => void;
  onBack: () => void;
}

export function Editorial({ onOpen, onBack }: EditorialProps) {
  const grouped = useMemo(() => {
    const map = new Map<Category, Doc[]>();
    for (const doc of DOCS) {
      const list = map.get(doc.category) ?? [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return map;
  }, []);

  return (
    <section className="editorial" id="editorial" aria-labelledby="editorial-title">
      <div className="editorial__inner">
        <header className="editorial__intro">
          <div>
            <div className="editorial__eyebrow">
              <i />
              Aree tematiche
            </div>
            <h2 className="editorial__title" id="editorial-title">
              Tre modi di
              <br />
              <em>leggere</em> il mondo
            </h2>
          </div>
          <p className="editorial__lede">
            <strong>MetaHistoria</strong> è un archivio editoriale che attraversa teologia,
            geopolitica e storia delle civiltà per capire come le idee diventano istituzioni — e come
            le istituzioni riscrivono le idee.
          </p>
        </header>

        {AREAS.map((area) => {
          const docs = (grouped.get(area.key) ?? []).slice(0, 3);
          return (
            <article className="area" key={area.key} id={`area-${area.key.toLowerCase()}`}>
              <div className="area__index">
                <span className="area__glyph" aria-hidden="true">
                  {area.glyph}
                </span>
                <span className="area__name">{area.name}</span>
              </div>

              <div>
                <h3 className="area__title">{area.title}</h3>
                <p className="area__desc">{area.desc}</p>
              </div>

              <div className="area__list">
                {docs.map((doc) => (
                  <button
                    type="button"
                    className="area__item"
                    key={doc.id}
                    onClick={() => onOpen(doc)}
                    data-area-link={doc.id}
                  >
                    <span className="area__item-title">{doc.title}</span>
                    <span className="area__item-meta">{doc.minutes} min</span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <footer className="colophon" id="colophon">
        <div className="colophon__inner">
          <div className="colophon__grid">
            <div>
              <div className="colophon__brand">MetaHistoria</div>
              <p className="colophon__tag">
                Teologia, geopolitica e storia delle civiltà. Un archivio di idee, fedi e confini.
              </p>
            </div>

            <div>
              <div className="colophon__h">Sezioni</div>
              <ul className="colophon__list">
                <li>
                  <a href="#area-teologia">Teologia</a>
                </li>
                <li>
                  <a href="#area-geopolitica">Geopolitica</a>
                </li>
                <li>
                  <a href="#area-storia">Storia</a>
                </li>
                <li>
                  <a href="#editorial">Atlante</a>
                </li>
              </ul>
            </div>

            <div>
              <div className="colophon__h">Colophon</div>
              <ul className="colophon__list">
                <li>
                  <button type="button" onClick={onBack} className="to-top">
                    Torna all’archivio
                  </button>
                </li>
                <li>
                  <a href="#colophon">Crediti delle immagini</a>
                </li>
                <li>
                  <a href="#editorial">Manifesto</a>
                </li>
              </ul>
            </div>
          </div>

          <p className="colophon__note">
            Questo è un progetto editoriale dimostrativo. Le immagini provengono da Wikimedia Commons e
            sono di pubblico dominio, fatta eccezione per le due opere indicate qui sotto, rilasciate con
            licenza Creative Commons. Nessun contenuto è riprodotto a fini commerciali.
            {CREDITS.map((c) => (
              <span key={c.key}>
                {' '}
                · {c.title.replace(/^File:/, '')} — {c.artist || 'autore non indicato'}, {c.license} (
                <a href={c.page} target="_blank" rel="noreferrer noopener">
                  fonte
                </a>
                )
              </span>
            ))}
          </p>

          <div className="colophon__base">
            <span>© 2025 MetaHistoria</span>
            <span>Progetto editoriale · homepage</span>
            <button type="button" className="to-top" onClick={onBack}>
              Torna all’archivio ↑
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
