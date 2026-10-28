import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Scene } from './Scene';
import { Editorial } from './Editorial';
import { Reader } from './Reader';
import { IMAGES } from './Paper';
import { DOCS } from '../data/documents';
import { SITE } from '../data/site';
import type { Doc } from '../data/documents';

/** La homepage cinematografica: resta identica, cambia solo il contenitore. */
export function Home() {
  const [ready, setReady] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Doc | null>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'MetaHistoria — Il Metodo Pentapolare: Apocalisse del Potere';
  }, []);

  /* pre-carica le immagini della scena, poi alza il sipario */
  useEffect(() => {
    const keys = Object.keys(IMAGES);
    let done = 0;
    let alive = true;
    const tick = () => {
      done += 1;
      if (!alive) return;
      setProgress(done / keys.length);
      if (done >= keys.length) setReady(true);
    };
    keys.forEach((k) => {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = IMAGES[k].src;
    });
    if (keys.length === 0) setReady(true);
    const fallback = window.setTimeout(() => setReady(true), 6500);
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!ready || !veilRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline({ delay: reduced ? 0.1 : 0.25 });
    tl.to(veilRef.current, {
      opacity: 0,
      duration: reduced ? 0.4 : 3,
      ease: 'power2.inOut',
    }).add(() => setVeilGone(true));
    return () => {
      tl.kill();
    };
  }, [ready]);

  const openDoc = useCallback((doc: Doc) => {
    setSelected(doc);
  }, []);

  const getOrigin = useCallback(() => {
    if (!selected) return null;
    const el = document.querySelector<HTMLElement>(`[data-doc="${selected.id}"]`);
    return el ? el.getBoundingClientRect() : null;
  }, [selected]);

  const closeReader = useCallback(() => {
    const id = selected?.id;
    setSelected(null);
    if (id) {
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-open="${id}"]`);
        el?.focus({ preventScroll: true });
      });
    }
  }, [selected]);

  const nextOf = selected
    ? (DOCS.find((d) => d.category === selected.category && d.id !== selected.id) ?? null)
    : null;

  const goToEditorial = useCallback(() => {
    document.getElementById('editorial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const backToArchive = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <main>
        <section className="hero" id="archivio" aria-label="Archivio tridimensionale">
          <Scene selected={selected} ready={ready} onOpen={openDoc} onExplore={goToEditorial} />
        </section>

        <Editorial onOpen={openDoc} onBack={backToArchive} />
      </main>

      <div className="chrome">
        <div />
        <div />
        <div className="chrome__bottom">
          <div className="chrome__hint">
            <span className="hint__line" aria-hidden="true" />
            <span>Muovi il cursore · apri un documento</span>
          </div>
          <div className="chrome__count">{String(DOCS.length).padStart(2, '0')} documenti</div>
        </div>
      </div>

      {selected && (
        <Reader
          key={selected.id}
          doc={selected}
          next={nextOf}
          getOrigin={getOrigin}
          onClose={closeReader}
          onNext={(d) => setSelected(d)}
        />
      )}

      {!veilGone && (
        <div className="veil" ref={veilRef} aria-hidden="true">
          <div className="veil__inner">
            <div className="veil__name">{SITE.wordmark}</div>
            <div className="veil__sub">{SITE.tagline}</div>
            <div className="veil__bar">
              <i style={{ width: `${Math.max(8, progress * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
