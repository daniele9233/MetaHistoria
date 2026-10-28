import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import media from '../data/media.json';
import type { Doc } from '../data/documents';

export type MediaMap = Record<string, { src: string; w: number; h: number; bytes: number }>;
export const IMAGES = media as MediaMap;

function PaperBody({ doc }: { doc: Doc }) {
  const img = IMAGES[doc.imageKey];

  if (doc.variant === 'plate') {
    return (
      <div className="paper__inner">
        <img className="paper__img" src={img.src} alt="" loading="eager" decoding="async" />
        <div className="plate__caption">
          <span>{doc.kicker}</span>
          {doc.title}
        </div>
      </div>
    );
  }

  if (doc.variant === 'map' || doc.variant === 'manuscript') {
    return (
      <div className="paper__inner">
        <div className="plate__mat">
          <img className="paper__img" src={img.src} alt="" loading="eager" decoding="async" />
        </div>
        <div className="plate__caption">{doc.title}</div>
      </div>
    );
  }

  if (doc.variant === 'document') {
    return (
      <div className="paper__inner">
        <div className="doc__sheet">
          <div className="doc__head">{doc.kicker}</div>
          <div className="doc__title">{doc.title}</div>
          <div className="doc__img">
            <img src={img.src} alt="" loading="eager" decoding="async" />
          </div>
          <div className="doc__lines">{doc.excerpt}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="paper__inner">
      <div className="page__masthead">
        <span>MetaHistoria</span>
        <span>{doc.category}</span>
      </div>
      <div className="page__rubric">{doc.kicker}</div>
      <h3 className="page__title">{doc.title}</h3>
      <div className="page__media">
        <img src={img.src} alt="" loading="eager" decoding="async" />
      </div>
      <p className="page__body">{doc.excerpt}</p>
      <div className="page__foot">
        <span>{doc.author}</span>
        <span>{doc.date}</span>
      </div>
    </div>
  );
}

interface PaperProps {
  doc: Doc;
  className?: string;
  style: CSSProperties;
  onOpen?: (doc: Doc, el: HTMLElement) => void;
  onHover?: (doc: Doc, el: HTMLElement) => void;
  onLeave?: () => void;
  delay?: number;
  tabIndex?: number;
}

export const Paper = forwardRef<HTMLDivElement, PaperProps>(function Paper(
  { doc, className = '', style, onOpen, onHover, onLeave, delay = 0 },
  ref,
) {
  const isStatic = !onOpen;

  return (
    <article
      ref={ref}
      className={`paper paper--${doc.variant} ${isStatic ? 'paper--static' : ''} ${className}`}
      style={{ ...style, ['--shade' as string]: doc.shade, ['--fall' as string]: doc.shade * 0.55 }}
      data-doc={doc.id}
      data-category={doc.category}
      onPointerEnter={
        onHover
          ? (e) => {
              if (e.pointerType === 'mouse') onHover(doc, e.currentTarget);
            }
          : undefined
      }
      onPointerLeave={onLeave}
    >
      <PaperBody doc={doc} />
      <span className="paper__shade" aria-hidden="true" />
      <span className="paper__fall" aria-hidden="true" />
      <span className="paper__warm" aria-hidden="true" />
      <span className="paper__edge" aria-hidden="true" />

      {onOpen && (
        <button
          type="button"
          className="paper__hit"
          aria-label={`Apri il documento: ${doc.title} — ${doc.category}`}
          onClick={(e) =>
            onOpen(doc, (e.currentTarget.closest('[data-doc]') as HTMLElement) ?? e.currentTarget)
          }
          data-open={doc.id}
          style={{ animationDelay: `${delay}ms` }}
        />
      )}
    </article>
  );
});
