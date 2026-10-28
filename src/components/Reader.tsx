import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Doc } from '../data/documents';
import { IMAGES } from './Paper';

interface ReaderProps {
  doc: Doc;
  next: Doc | null;
  getOrigin: () => DOMRect | null;
  onClose: () => void;
  onNext: (doc: Doc) => void;
}

export function Reader({ doc, next, getOrigin, onClose, onNext }: ReaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const animating = useRef(false);

  const measure = () => {
    const r = getOrigin();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!r || r.width === 0) return null;
    return {
      x: r.left + r.width / 2 - vw / 2,
      y: r.top + r.height / 2 - vh / 2,
      sx: Math.max(r.width / vw, 0.04),
      sy: Math.max(r.height / vh, 0.04),
    };
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    document.body.classList.add('is-locked');
    closeRef.current?.focus({ preventScroll: true });
    el.scrollTop = 0;

    const o = measure();
    if (!o) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { x: o.x, y: o.y, scaleX: o.sx, scaleY: o.sy, opacity: 0.65 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.78, ease: 'power3.inOut' },
    );
    tl.fromTo(
      el.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out' },
      0.32,
    );
    return () => {
      document.body.classList.remove('is-locked');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (animating.current) return;
    animating.current = true;
    const el = ref.current;
    const o = measure();
    if (!el || !o) {
      onClose();
      return;
    }
    gsap.to(el, {
      x: o.x,
      y: o.y,
      scaleX: o.sx,
      scaleY: o.sy,
      opacity: 0,
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: onClose,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const img = IMAGES[doc.imageKey];

  return (
    <div
      className="reader"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
      data-reader={doc.id}
    >
      <div className="reader__bar">
        <div className="reader__crumb">
          <b>{doc.category}</b>
          <span>/</span>
          <span>{doc.kicker}</span>
        </div>
        <button className="reader__close" type="button" onClick={close} ref={closeRef}>
          Torna all’archivio
          <kbd>esc</kbd>
        </button>
      </div>

      <article className="reader__article">
        <header className="reader__head">
          <div>
            <div className="reader__kicker" data-reveal>
              <i />
              {doc.kicker}
            </div>
            <h1 className="reader__title" id="reader-title" data-reveal>
              {doc.title}
            </h1>
            <div className="reader__meta" data-reveal>
              <span>
                di <b>{doc.author}</b>
              </span>
              <span>{doc.date}</span>
              <span>{doc.minutes} min di lettura</span>
            </div>
          </div>
          <p className="reader__standfirst" data-reveal>
            {doc.excerpt}
          </p>
        </header>

        <figure className="reader__figure" data-reveal>
          <img src={img.src} alt={doc.title} />
          <figcaption className="reader__figcap">
            <span>{doc.title}</span>
            <span>Archivio · pubblico dominio</span>
          </figcaption>
        </figure>

        <div className="reader__text">
          {doc.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {next && (
          <div className="reader__more">
            <span>Continua nell’archivio</span>
            <button type="button" className="reader__next" onClick={() => onNext(next)}>
              {next.title}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
