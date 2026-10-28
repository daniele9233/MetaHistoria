import { useEffect } from 'react';
import { findPage } from '../content/content';
import { EditorialPage } from './EditorialPage';
import { Link, useRoute } from '../lib/router';

export function PageRoute() {
  const { path } = useRoute();
  const page = findPage(path);

  useEffect(() => {
    if (!page) document.title = 'Pagina non trovata — MetaHistoria';
  }, [page]);

  if (page) return <EditorialPage page={page} key={page.id} />;

  return (
    <section className="doc doc--missing">
      <header className="doc__head">
        <p className="doc__kicker">Errore 404</p>
        <h1 className="doc__title">Questa pagina non esiste</h1>
        <p className="doc__lede">
          Il percorso <code>{path}</code> non corrisponde a nessuna delle pagine migrate.
        </p>
      </header>
      <div className="doc__foot">
        <Link to="/" className="doc__back">
          ← Torna all’archivio
        </Link>
      </div>
    </section>
  );
}
