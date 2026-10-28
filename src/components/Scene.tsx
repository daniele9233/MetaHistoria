import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DOCS } from '../data/documents';
import type { Doc } from '../data/documents';
import { Paper } from './Paper';
import { HeroPage } from './HeroPage';
import { Sheet } from './Sheet';

gsap.registerPlugin(ScrollTrigger);

export const HERO = {
  w: 1200,
  h: 870,
  x: 0,
  y: 74,
  z: 92,
  rz: -10.4,
};

/** ?flat — isola la pagina protagonista per verificarla da frontale */
const FLAT =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('flat');

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export interface SceneHandle {
  restore: () => void;
}

interface SceneProps {
  selected: Doc | null;
  ready: boolean;
  onOpen: (doc: Doc, el: HTMLElement) => void;
  onExplore: () => void;
}

export function Scene({ selected, ready, onOpen, onExplore }: SceneProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const heroAnchorRef = useRef<HTMLDivElement>(null);
  const heroPaperRef = useRef<HTMLDivElement>(null);
  const heroMoveRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const bases = useRef<Array<HTMLDivElement | null>>([]);
  const moves = useRef<Array<HTMLDivElement | null>>([]);
  const sheets = useRef<Array<HTMLDivElement | null>>([]);

  const [hovered, setHovered] = useState<Doc | null>(null);
  const [layout, setLayout] = useState({ s: 1, hero: 0.66, mobile: false });

  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // stato di camera/tavola scritto dal ticker
  const st = useRef({
    camX: 0,
    camY: 0,
    camZ: 0,
    camRX: 0,
    camRY: 0,
    dolly: 820,
    tilt: -5,
    worldTilt: 58,
    worldRz: -3,
    worldZ: 0,
    light: 0.4,
  });

  const pointer = useRef({ x: 0, y: 0, active: false });
  const interactivity = useRef(true);

  /* ---------------- layout responsivo ---------------- */

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 760;
      const s = mobile
        ? clamp(vw / 880, 0.34, 0.66)
        : clamp(Math.max(vw / 1344, vh / 752), 0.5, 2.05);
      setLayout({ s, hero: 0.59, mobile });
    };
    compute();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        compute();
        ScrollTrigger.refresh();
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    stageRef.current?.style.setProperty('--s', String(layout.s));
  }, [layout.s]);

  /* ---------------- ticker: scrive i transform ---------------- */

  useEffect(() => {
    const render = () => {
      const s = st.current;
      const cam = cameraRef.current;
      const world = worldRef.current;
      if (cam) {
        cam.style.transform =
          `translate3d(${s.camX.toFixed(2)}px, ${s.camY.toFixed(2)}px, ${(s.camZ - s.dolly).toFixed(2)}px) ` +
          `rotateX(${(s.camRX + s.tilt).toFixed(3)}deg) rotateY(${s.camRY.toFixed(3)}deg)`;
      }
      if (world) {
        world.style.transform = `translateZ(${s.worldZ.toFixed(2)}px) rotateX(${s.worldTilt.toFixed(3)}deg) rotateZ(${s.worldRz.toFixed(3)}deg)`;
      }
      if (lightRef.current) {
        lightRef.current.style.opacity = String(s.light);
      }
    };
    gsap.ticker.add(render);
    render();
    return () => {
      gsap.ticker.remove(render);
    };
  }, []);

  /* ---------------- setup statico + intro ---------------- */

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      DOCS.forEach((doc, i) => {
        const base = bases.current[i];
        const move = moves.current[i];
        const sheet = sheets.current[i];
        if (!base || !move || !sheet) return;
        gsap.set(base, { x: doc.layout.x, y: doc.layout.y, z: doc.layout.z });
        gsap.set(move, { rotationZ: doc.layout.rz, rotationX: doc.layout.rx ?? 0 });
        gsap.set(sheet, { xPercent: -50, yPercent: -50, scale: doc.layout.s ?? 1 });
      });

      if (heroAnchorRef.current) {
        gsap.set(heroAnchorRef.current, { x: HERO.x, y: HERO.y, z: HERO.z });
      }
      if (heroMoveRef.current) {
        gsap.set(heroMoveRef.current, { rotationZ: HERO.rz, rotationX: 0 });
      }
      if (heroPaperRef.current) {
        gsap.set(heroPaperRef.current, { xPercent: -50, yPercent: -50, scale: 0.59 });
      }

      if (FLAT) {
        gsap.set(heroAnchorRef.current, { x: 0, y: 0, z: 0 });
        gsap.set(heroMoveRef.current, { rotationZ: 0, rotationX: 0 });
        gsap.set(heroPaperRef.current, { scale: 1 });
        st.current.dolly = 0;
        st.current.tilt = 0;
        st.current.worldTilt = 0;
        st.current.worldRz = 0;
        st.current.light = 0.7;
        stageRef.current?.classList.add('is-flat');
      }

      if (reduced.current) {
        st.current.dolly = 0;
        st.current.tilt = 0;
        st.current.worldTilt = 52;
        st.current.worldRz = 0;
        st.current.light = 1;
      }
    }, stageRef);

    return () => ctx.revert();
  }, []);

  /* ---------------- intro cinematografica ---------------- */

  const introPlayed = useRef(false);
  useEffect(() => {
    if (!ready || introPlayed.current) return;
    introPlayed.current = true;
    const sheetsNow = sheets.current.filter(Boolean) as HTMLDivElement[];

    if (reduced.current) {
      gsap.set(sheetsNow, { opacity: 1 });
      st.current.dolly = 0;
      st.current.tilt = 0;
      st.current.worldTilt = 52;
      st.current.worldRz = 0;
      st.current.light = 1;
      return;
    }

    const ctx = gsap.context(() => {
      // il sipario impiega 3 s a diradarsi: la scena entra mentre si schiarisce
      const tl = gsap.timeline({ delay: 0.55 });
      gsap.set(rollRef.current, { rotation: -5.6 });
      tl.to(st.current, { dolly: 0, tilt: 0, duration: 2.4, ease: 'power2.out' }, 0)
        .to(st.current, { worldTilt: 52, worldRz: 0, duration: 2.6, ease: 'power2.inOut' }, 0)
        .to(rollRef.current, { rotation: -3.4, duration: 2.4, ease: 'power2.out' }, 0)
        .to(st.current, { light: 1, duration: 2.2, ease: 'power1.inOut' }, 0.15);

      gsap.fromTo(
        sheetsNow,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.25,
          stagger: { amount: 1.2, from: 'center' },
          ease: 'power2.out',
        },
      );
    }, stageRef);

    return () => ctx.revert();
  }, [ready]);

  /* ---------------- hero scale su resize ---------------- */

  useEffect(() => {
    if (heroPaperRef.current) {
      gsap.to(heroPaperRef.current, { scale: layout.hero, duration: 0.6, ease: 'power2.out' });
    }
  }, [layout.hero]);

  /* ---------------- parallax mouse ---------------- */

  useEffect(() => {
    if (reduced.current) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const rx = gsap.quickTo(st.current, 'camRX', { duration: 1.15, ease: 'power3.out' });
    const ry = gsap.quickTo(st.current, 'camRY', { duration: 1.15, ease: 'power3.out' });
    const px = gsap.quickTo(st.current, 'camX', { duration: 1.25, ease: 'power3.out' });
    const py = gsap.quickTo(st.current, 'camY', { duration: 1.25, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      pointer.current.x = nx;
      pointer.current.y = ny;
      rx(ny * -1.5);
      ry(nx * 2.2);
      px(nx * -22);
      py(ny * -14);
    };

    const onLeave = () => {
      rx(0);
      ry(0);
      px(0);
      py(0);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  /* ---------------- hover ---------------- */

  useEffect(() => {
    const label = labelRef.current;
    if (!label) return;

    if (!hovered) {
      gsap.to(label, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-doc="${hovered.id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = r.top < 110;
    label.classList.toggle('doc-label--below', below);
    label.style.left = `${clamp(r.left, 14, window.innerWidth - 300)}px`;
    label.style.top = below ? `${r.bottom + 14}px` : `${r.top - 14}px`;
    gsap.to(label, { opacity: 1, duration: 0.35, ease: 'power2.out' });
  }, [hovered]);

  const handleHover = useCallback((doc: Doc) => {
    if (!interactivity.current) return;
    setHovered(doc);
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(null);
  }, []);

  /* solleva e illumina il documento sotto il cursore */
  useEffect(() => {
    if (!hovered) return;
    const i = DOCS.findIndex((d) => d.id === hovered.id);
    const sheet = sheets.current[i];
    if (!sheet) return;
    const shade = sheet.querySelector<HTMLElement>('.paper__shade');
    gsap.to(sheet, {
      scale: (hovered.layout.s ?? 1) * 1.045,
      z: 30,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    if (shade) {
      gsap.to(shade, { opacity: hovered.shade * 0.72 * 0.5, duration: 0.5, overwrite: 'auto' });
    }
    return () => {
      gsap.to(sheet, {
        scale: hovered.layout.s ?? 1,
        z: 0,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      if (shade) {
        gsap.to(shade, { opacity: hovered.shade * 0.72, duration: 0.55, overwrite: 'auto' });
      }
    };
  }, [hovered]);

  /* ---------------- selezione / focus ---------------- */

  useEffect(() => {
    const sheetsNow = sheets.current.filter(Boolean) as HTMLDivElement[];
    DOCS.forEach((doc, i) => {
      const sheet = sheets.current[i];
      if (!sheet) return;
      const isSel = selected?.id === doc.id;
      const dim = !!selected;
      gsap.to(sheet, {
        opacity: dim ? (isSel ? 1 : 0.12) : 1,
        scale: dim && isSel ? 0.82 : 1,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
    if (selected) setHovered(null);
    void sheetsNow;
  }, [selected]);

  /* ---------------- scroll: cinque fasi ---------------- */

  useEffect(() => {
    if (reduced.current || !ready || FLAT) return;
    const hero = stageRef.current?.closest('.hero');
    if (!hero) return;

    const sheetsNow = sheets.current.filter(Boolean) as HTMLDivElement[];
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero as HTMLElement,
          start: 'top top',
          end: '+=165%',
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            interactivity.current = self.progress < 0.08;
            document.body.classList.toggle('is-scrolled-in', self.progress > 0.55);
            document.body.classList.toggle('is-editorial', self.progress > 0.58);
            stageRef.current?.setAttribute('data-p', self.progress.toFixed(3));
          },
        },
      });

      // Fase 1 — la camera avanza nell'archivio
      tl.to(st.current, { worldZ: -120, duration: 0.22, ease: 'none' }, 0);

      // Fase 2 — le pagine periferiche si aprono in un corridoio
      DOCS.forEach((doc, i) => {
        const base = bases.current[i];
        const sheet = sheets.current[i];
        if (!base || !sheet) return;
        const spread = doc.layout.y < 0 ? 1.42 : 1.26;
        tl.to(
          base,
          {
            x: doc.layout.x * 1.35,
            y: doc.layout.y * spread,
            duration: 0.36,
            ease: 'none',
          },
          0.2,
        );
        tl.to(sheet, { opacity: 0.08, duration: 0.3, ease: 'none' }, 0.24);
      });

      // Fase 3 — la pagina protagonista si raddrizza e viene avanti
      tl.to(st.current, { worldTilt: 0, worldRz: 0, worldZ: 60, duration: 0.34, ease: 'none' }, 0.5);
      tl.to(rollRef.current, { rotation: 0, duration: 0.34, ease: 'none' }, 0.5);
      tl.to(
        heroAnchorRef.current,
        { x: 0, y: 0, z: 120, duration: 0.34, ease: 'none' },
        0.5,
      );
      tl.to(heroMoveRef.current, { rotationZ: 0, duration: 0.34, ease: 'none' }, 0.5);

      // Fase 4 — la pagina riempie il viewport e diventa leggibile
      tl.to(
        heroPaperRef.current,
        {
          scale: () => Math.max(window.innerWidth / HERO.w, window.innerHeight / HERO.h) * 1.01,
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          duration: 0.3,
          ease: 'none',
        },
        0.66,
      );
      tl.to('.stage__bg', { opacity: 0, duration: 0.18, ease: 'none' }, 0.7);
      tl.to(st.current, { light: 0, duration: 0.18, ease: 'none' }, 0.7);
      tl.to(
        ['.stage__grade', '.stage__lift', '.stage__vignette', '.stage__grain'],
        { opacity: 0, duration: 0.2, ease: 'none' },
        0.7,
      );
      tl.to('.hp', { autoAlpha: 0, duration: 0.14, ease: 'none' }, 0.74);
      tl.to(sheetsNow, { opacity: 0, duration: 0.12, ease: 'none' }, 0.76);

      // Fase 5 — il foglio leggibile prende il posto della pagina
      tl.to('.sheet', { autoAlpha: 1, duration: 0.26, ease: 'none' }, 0.8);
      void sheetsNow;
    }, stageRef);

    return () => ctx.revert();
  }, [ready]);

  /* ---------------- ricarica posizioni a font/image pronti ---------------- */

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) void document.fonts.ready.then(refresh);
    const t = window.setTimeout(refresh, 900);
    return () => window.clearTimeout(t);
  }, []);

  const heroVisible = !layout.mobile;

  return (
    <div
      className={`stage ${layout.mobile ? 'is-mobile' : ''}`}
      ref={stageRef}
      style={{ ['--s' as string]: layout.s }}
      data-ready={ready}
    >
      <div className="stage__bg" ref={bgRef} />
      <div className="stage__scale">
        <div className="stage__roll" ref={rollRef}>
          <div className="scene">
          <div className="camera" ref={cameraRef}>
            <div className="world" ref={worldRef}>
              {DOCS.map((doc, i) => (
                <div
                  key={doc.id}
                  className="anchor-base"
                  ref={(el) => {
                    bases.current[i] = el;
                  }}
                >
                  <div
                    className="paper-move"
                    ref={(el) => {
                      moves.current[i] = el;
                    }}
                  >
                    <Paper
                      doc={doc}
                      ref={(el) => {
                        sheets.current[i] = el;
                      }}
                      style={{
                        ['--w' as string]: `${doc.layout.w}px`,
                        ['--h' as string]: `${doc.layout.h}px`,
                        ['--blur-filter' as string]: doc.blur ? `blur(${doc.blur}px)` : 'none',
                        ['--shade' as string]: doc.shade * 0.72,
                        ['--fall' as string]: doc.shade * 0.4,
                      }}
                      onOpen={onOpen}
                      onHover={handleHover}
                      onLeave={handleLeave}
                      delay={i * 40}
                    />
                  </div>
                </div>
              ))}

              <div className="anchor-base anchor-base--hero" ref={heroAnchorRef}>
                <div className="paper-move" ref={heroMoveRef}>
                  <div
                    className="paper paper--hero paper--static"
                    ref={heroPaperRef}
                    data-doc="hero"
                    style={{
                      ['--w' as string]: `${HERO.w}px`,
                      ['--h' as string]: `${HERO.h}px`,
                      ['--shade' as string]: 0,
                      ['--fall' as string]: 0,
                    }}
                  >
                    <HeroPage onExplore={onExplore} />
                    <span className="paper__warm" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="stage__light" ref={lightRef} />
      <div className="stage__grade" />
      <div className="stage__lift" />
      <div className="stage__vignette" />
      <div className="stage__grain" />

      <Sheet onExplore={onExplore} />

      <div className={`doc-label ${heroVisible ? '' : 'doc-label--mobile'}`} ref={labelRef} aria-hidden="true">
        <span className="doc-label__cat">{hovered?.category}</span>
        <span className="doc-label__title">{hovered?.title}</span>
      </div>
    </div>
  );
}
