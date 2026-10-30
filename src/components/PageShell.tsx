import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';

interface Props {
  children: ReactNode;
  /** cambia quando cambia la pagina: riavvia l'ingresso */
  routeKey: string;
}

/**
 * L'ingresso nel volume: il foglio si posa con una lieve prospettiva,
 * l'ombra del bordo si ritira e il contenuto si assesta. Una sola regia.
 */
export function PageShell({ children, routeKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28, rotateX: 3.4, transformPerspective: 1400, transformOrigin: '50% 0%' },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.62, ease: 'power3.out', clearProps: 'transform' },
      );
      const items = el.querySelectorAll('[data-enter]');
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.52, stagger: 0.07, delay: 0.08, ease: 'power2.out', clearProps: 'transform' },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [routeKey]);

  return (
    <div className="page" ref={ref}>
      {children}
    </div>
  );
}
