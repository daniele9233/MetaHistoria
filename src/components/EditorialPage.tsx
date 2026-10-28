import { useEffect, useMemo, useState } from 'react';
import {
  categoryLabel,
  childrenOf,
  findPage,
  loadPage,
  stripHeaderBlocks,
  type ManifestPage,
  type PageDoc,
} from '../content/content';
import { Link } from '../lib/router';
import { BlockRenderer } from './BlockRenderer';

interface Props {
  page: ManifestPage;
}

export function EditorialPage({ page }: Props) {
  const [doc, setDoc] = useState<PageDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    setError(null);
    loadPage(page)
      .then((d) => alive && setDoc(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    document.title = `${page.title} — MetaHistoria`;
  }, [page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [page.id]);

  const blocks = useMemo(() => (doc ? stripHeaderBlocks(doc) : []), [doc]);
  const children = useMemo(() => childrenOf(page.path), [page.path]);

  const prev = doc?.prevNext?.[0];
  const next = doc?.prevNext?.[1];
  const prevPage = prev ? findPage(prev.href.replace(/\/$/, '')) : null;
  const nextPage = next ? findPage(next.href.replace(/\/$/, '')) : null;

  return (
    <article className="doc">
      <header className="doc__head">
        <div className="doc__crumb">
          <Link to="/" className="doc__crumb-link">
            Archivio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="doc__crumb-cat">{categoryLabel(page.category)}</span>
        </div>

        <p className="doc__kicker">{doc?.kicker || categoryLabel(page.category)}</p>
        <h1 className="doc__title">{page.title}</h1>
        {doc?.lede ? <p className="doc__lede">{doc.lede}</p> : null}

        <div className="doc__meta">
          <span>{page.blocks} blocchi</span>
          <span>{(page.chars / 1000).toFixed(1)}k caratteri</span>
          <a href={page.sourceUrl} target="_blank" rel="noreferrer noopener">
            fonte originale
          </a>
        </div>
      </header>

      {error ? (
        <p className="doc__error">Contenuto non disponibile: {error}</p>
      ) : doc ? (
        <div className="doc__body">
          <BlockRenderer blocks={blocks} />
        </div>
      ) : (
        <div className="doc__loading" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      {children.length > 0 && (
        <aside className="doc__index" aria-label="Pagine della sezione">
          <h2 className="doc__index-title">In questa sezione</h2>
          <ul>
            {children.map((c) => (
              <li key={c.id}>
                <Link to={c.path}>
                  <span className="doc__index-name">{c.title}</span>
                  <span className="doc__index-meta">{c.blocks} blocchi</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {doc?.references?.length ? (
        <section className="doc__refs" aria-label="Riferimenti">
          <h2>Riferimenti</h2>
          <ul>
            {doc.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {(prevPage || nextPage) && (
        <nav className="doc__pager" aria-label="Capitoli">
          {prevPage ? (
            <Link to={prevPage.path} className="doc__pager-link">
              <span>← Precedente</span>
              <strong>{prevPage.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {nextPage ? (
            <Link to={nextPage.path} className="doc__pager-link doc__pager-link--next">
              <span>Successivo →</span>
              <strong>{nextPage.title}</strong>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <footer className="doc__foot">
        <Link to="/" className="doc__back">
          ← Torna all’archivio
        </Link>
      </footer>
    </article>
  );
}
