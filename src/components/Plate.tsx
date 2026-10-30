import { useEffect, useState } from 'react';
import type { Run } from '../content/content';

interface Props {
  num: string;
  title: string;
  tag: string;
  caption: string;
  src: string;
  alt: string;
  body?: Run[][];
  index: number;
}

/** Tavola dell'Atlante: immagine consultabile, didascalia, ingrandimento. */
export function Plate({ num, title, tag, caption, src, alt, body, index }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('is-locked');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('is-locked');
    };
  }, [open]);

  return (
    <article className="plate" id={`tavola-${num || index}`} data-enter>
      <header className="plate__head">
        {num && <span className="plate__num">{num}</span>}
        <div className="plate__titles">
          <h2 className="plate__title">{title}</h2>
          {tag && <span className="plate__tag">{tag}</span>}
        </div>
      </header>

      <button
        type="button"
        className="plate__canvas"
        onClick={() => setOpen(true)}
        aria-label={`Ingrandisci la tavola ${num}: ${title}`}
      >
        <img src={src} alt={alt || title} loading="lazy" decoding="async" />
        <span className="plate__zoom" aria-hidden="true">
          Ingrandisci
        </span>
      </button>

      {caption && <p className="plate__caption">{caption}</p>}

      {!!body?.length && (
        <div className="plate__text">
          {body.map((runs, i) => (
            <p key={i}>
              {runs.map((r, j) =>
                r.b ? <strong key={j}>{r.t}</strong> : r.i ? <em key={j}>{r.t}</em> : <span key={j}>{r.t}</span>,
              )}
            </p>
          ))}
        </div>
      )}

      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Tavola ${num}: ${title}`}
          onClick={() => setOpen(false)}
        >
          <button type="button" className="lightbox__close" onClick={() => setOpen(false)} autoFocus>
            Chiudi
          </button>
          <img src={src} alt={alt || title} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </article>
  );
}
