import { useEffect, useMemo, useRef, useState } from 'react';
import {
  childrenOf,
  loadPage,
  stripHeaderBlocks,
  type Block,
  type ManifestPage,
  type PageDoc,
} from '../content/content';
import { imageMeta, pickImage, readingMinutes, sectionImage, sectionOf } from '../content/sections';
import { Link } from '../lib/router';
import { ContentBlocks } from './ContentBlocks';
import { Plate } from './Plate';

function headingText(b: Block) {
  return (b.runs ?? []).map((r) => r.t).join(' ');
}

export function ArticlePage({ page }: { page: ManifestPage }) {
  const meta = sectionOf(page);
  const [doc, setDoc] = useState<PageDoc | null>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    loadPage(page).then((d) => alive && setDoc(d)).catch(() => undefined);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = document.documentElement;
        const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
        if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [page.id]);

  const blocks = useMemo(() => (doc ? stripHeaderBlocks(doc) : []), [doc]);
  const toc = useMemo(
    () =>
      blocks
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.type === 'h' && (b.level ?? 2) === 2)
        .map(({ b, i }) => ({ id: `sec-${i}`, text: headingText(b) }))
        .filter((h) => h.text.length > 2),
    [blocks],
  );

  const plates = useMemo(() => blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.type === 'tavola'), [blocks]);
  const firstPlate = plates.length ? plates[0].i : -1;
  const before = firstPlate >= 0 ? blocks.slice(0, firstPlate) : blocks;
  const after = plates.length ? blocks.slice(plates[plates.length - 1].i + 1) : [];

  const siblings = useMemo(() => (page.parentPath ? childrenOf(page.parentPath) : []), [page.parentPath]);
  const pos = siblings.findIndex((s) => s.id === page.id);
  const prev = pos > 0 ? siblings[pos - 1] : null;
  const next = pos >= 0 && pos < siblings.length - 1 ? siblings[pos + 1] : null;

  const minutes = readingMinutes(page.chars);
  const heroKey = meta ? pickImage(meta, page) : 'atene';

  return (
    <article
      className={`art ${plates.length > 0 ? 'art--atlas' : ''}`}
      style={meta ? ({ ['--accent' as string]: meta.accent } as React.CSSProperties) : undefined}
    >
      <span className="art__progress" aria-hidden="true">
        <i ref={barRef} />
      </span>

      <header className="art__head">
        <div className="art__crumb">
          <Link to="/">Archivio</Link>
          <span aria-hidden="true">/</span>
          {meta ? <Link to={meta.path}>{meta.title}</Link> : <span>{page.category}</span>}
        </div>

        <p className="art__kicker" data-enter>
          {meta?.lens ?? 'MetaHistoria'}
          {siblings.length > 0 && pos >= 0 ? ` · Capitolo ${String(pos + 1).padStart(2, '0')}` : ''}
        </p>
        <h1 className="art__title" data-enter>
          {page.title}
        </h1>
        {doc?.lede && (
          <p className="art__lede" data-enter>
            {doc.lede}
          </p>
        )}
        <p className="art__meta" data-enter>
          <span>{minutes} min di lettura</span>
          <span>{Math.round(page.chars / 1000)} mila caratteri</span>
          <a href={page.sourceUrl} target="_blank" rel="noreferrer noopener" className="art__source">
            fonte
          </a>
        </p>
      </header>

      {meta && (
        <figure className="art__hero" data-enter>
          <img src={sectionImage(heroKey)} alt={imageMeta(heroKey).alt || meta.heroAlt} />
          <figcaption>{imageMeta(heroKey).caption || meta.heroCaption}</figcaption>
        </figure>
      )}

      <div className="art__layout">
        <aside className="art__rail" aria-label="Indice del capitolo">
          <div className="rail__inner">
            {toc.length > 2 && (
              <nav className="rail__toc">
                <p className="rail__label">In questo capitolo</p>
                <ol>
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {meta && (
              <Link to={meta.path} className="rail__back">
                ← {meta.title}
              </Link>
            )}
          </div>
        </aside>

        <div className="art__body">
          <ContentBlocks blocks={before} />

          {plates.length > 0 && (
            <div className="plates">
              {plates.map(({ b, i }) => (
                <Plate
                  key={i}
                  index={i}
                  num={b.num ?? ''}
                  title={b.title ?? ''}
                  tag={b.tag ?? ''}
                  caption={b.caption ?? ''}
                  src={`/media/tavole/${(b.src ?? '').split('/').pop()?.replace(/\.[a-z]+$/i, '')}.webp`}
                  alt={b.alt ?? ''}
                  body={b.body}
                />
              ))}
            </div>
          )}

          {after.length > 0 && <ContentBlocks blocks={after} />}
        </div>
      </div>

      <nav className="art__pager" aria-label="Capitoli">
        {prev ? (
          <Link to={prev.path} className="pager__item pager__item--prev">
            <span>← Precedente</span>
            <strong>{prev.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={next.path} className="pager__item pager__item--next">
            <span>Successivo →</span>
            <strong>{next.title}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <footer className="art__foot">
        <Link to="/" className="art__back">
          ← Torna all’archivio
        </Link>
      </footer>
    </article>
  );
}

export type { PageDoc };
