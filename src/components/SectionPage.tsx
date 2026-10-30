import { useEffect, useMemo, useState } from 'react';
import { loadPage, stripHeaderBlocks, type Block, type ManifestPage, type PageDoc } from '../content/content';
import {
  chaptersOf,
  pickImage,
  readingMinutes,
  sectionImage,
  sectionMinutes,
  sectionOf,
} from '../content/sections';
import { SECTIONS } from '../content/sections';
import { Link } from '../lib/router';
import { ContentBlocks } from './ContentBlocks';

function ChapterCard({ page, image, lead }: { page: ManifestPage; image: string; lead?: boolean }) {
  const minutes = readingMinutes(page.chars);
  return (
    <Link to={page.path} className={`chapter ${lead ? 'chapter--lead' : ''}`} data-enter>
      <span className="chapter__media">
        <img src={image} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="chapter__body">
        <span className="chapter__meta">{minutes} min di lettura</span>
        <span className="chapter__title">{page.title}</span>
        <span className="chapter__go">
          Apri il capitolo <i aria-hidden="true">→</i>
        </span>
      </span>
    </Link>
  );
}

export function SectionPage({ page }: { page: ManifestPage }) {
  const meta = sectionOf(page);
  const [doc, setDoc] = useState<PageDoc | null>(null);
  const chapters = useMemo(() => chaptersOf(page.path), [page.path]);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    loadPage(page).then((d) => alive && setDoc(d)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [page]);

  const intro = useMemo<Block[]>(
    () => (doc ? stripHeaderBlocks(doc).filter((b) => b.type !== 'card') : []),
    [doc],
  );
  const total = sectionMinutes(chapters);
  const lead = chapters[0];
  const next = SECTIONS[SECTIONS.findIndex((s) => s.id === meta?.id) + 1];

  if (!meta) return null;

  return (
    <div className="lens" style={{ ['--accent' as string]: meta.accent }}>
      <header className="lens__head">
        <div className="lens__crumb">
          <Link to="/">Archivio</Link>
          <span aria-hidden="true">/</span>
          <span>{meta.lens}</span>
        </div>

        <div className="lens__titles">
          <p className="lens__lens" data-enter>
            {meta.lens} · {meta.kicker}
          </p>
          <h1 className="lens__title" data-enter>
            {meta.title}
          </h1>
          <p className="lens__lede" data-enter>
            {doc?.lede || meta.lede}
          </p>
          <p className="lens__meta" data-enter>
            {chapters.length} capitoli · {total} minuti di lettura
          </p>
        </div>

        <figure className="lens__hero" data-enter>
          <img src={sectionImage(meta.hero)} alt={meta.heroAlt} />
          <figcaption>{meta.heroCaption}</figcaption>
        </figure>
      </header>

      {intro.length > 0 && (
        <div className="lens__intro">
          <ContentBlocks blocks={intro} />
        </div>
      )}

      {chapters.length > 0 && (
        <section className="chapters" aria-labelledby="chapters-title">
          <div className="chapters__head">
            <h2 className="chapters__title" id="chapters-title">
              In questo volume
            </h2>
            <p className="chapters__hint">Scegli da dove cominciare.</p>
          </div>

          {lead && <ChapterCard page={lead} image={sectionImage(pickImage(meta, lead))} lead />}

          <div className="chapters__grid">
            {chapters.slice(1, 5).map((c) => (
              <ChapterCard key={c.id} page={c} image={sectionImage(pickImage(meta, c))} />
            ))}
          </div>

          {chapters.length > 5 && (
            <ol className="chapters__index">
              {chapters.slice(5).map((c, i) => (
                <li key={c.id}>
                  <Link to={c.path}>
                    <span className="chapters__index-num">{String(i + 6).padStart(2, '0')}</span>
                    <span className="chapters__index-title">{c.title}</span>
                    <span className="chapters__index-min">{readingMinutes(c.chars)} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {next && (
        <nav className="lens__next" aria-label="Lente successiva">
          <Link to={next.path}>
            <span className="lens__next-label">{next.lens}</span>
            <span className="lens__next-title">{next.title}</span>
            <span className="lens__next-go" aria-hidden="true">
              →
            </span>
          </Link>
        </nav>
      )}
    </div>
  );
}
