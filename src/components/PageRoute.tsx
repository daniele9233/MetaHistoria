import { useEffect } from 'react';
import { findPage } from '../content/content';
import { SECTIONS } from '../content/sections';
import { PageShell } from './PageShell';
import { BookReader } from './BookReader';
import { GlobePage } from './GlobePage';
import { Link, useRoute } from '../lib/router';

export function PageRoute() {
  const { path } = useRoute();
  const page = findPage(path);

  useEffect(() => {
    if (path === '/atlante-globo') document.title = 'Mappamondo interattivo — MetaHistoria';
    else if (page) document.title = `${page.title} — MetaHistoria`;
    else document.title = 'Pagina non trovata — MetaHistoria';
  }, [page, path]);

  if (path === '/atlante-globo') return <GlobePage />;

  if (!page) {
    return (
      <PageShell routeKey={path}>
        <section className="missing">
          <p className="art__kicker">Errore 404</p>
          <h1 className="art__title">Questa pagina non esiste</h1>
          <p className="art__lede">
            Il percorso <code>{path}</code> non corrisponde a nessuna delle pagine dell’archivio.
          </p>
          <Link to="/" className="art__back">
            ← Torna all’archivio
          </Link>
        </section>
      </PageShell>
    );
  }

  const isSection = SECTIONS.some((s) => s.path === page.path);

  return <BookReader key={page.id} page={page} isSection={isSection} />;
}
