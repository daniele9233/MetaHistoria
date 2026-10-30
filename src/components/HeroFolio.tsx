import { useRef, useState } from 'react';
import { HeroPage } from './HeroPage';
import { PaperSurface, type PaperSurfaceHandle } from './PaperSurface';
import { SECTIONS, img } from '../content/sections';
import { Link } from '../lib/router';

export function HeroFolio({ onExplore }: { onExplore: () => void }) {
  const [current, setCurrent] = useState(0), [busy, setBusy] = useState(false);
  const paper = useRef<PaperSurfaceHandle>(null);
  const count = 1 + SECTIONS.length;
  const leaf = (index: number) => {
    if (index === 0) return <HeroPage onExplore={onExplore} />;
    const section = SECTIONS[Math.max(0, index - 1) % SECTIONS.length];
    return <article className="hero-folio__page"><div><small>{section.lens} · MetaHistoria</small><h2>{section.title}</h2>
      <p>{section.lede}</p><Link to={section.path}>Apri il volume ↗</Link></div>
      <figure><img src={img(section.hero)} alt={section.heroAlt} /><figcaption>{section.heroCaption}</figcaption></figure></article>;
  };
  return <div className="hero-folio" onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : current + (event.key === 'ArrowRight' ? 1 : -1);
    paper.current?.turnTo(Math.max(0, Math.min(count - 1, next)));
  }}>
    <PaperSurface ref={paper} current={current} spread={1} total={count} label="Sfoglia le prospettive di MetaHistoria"
      renderLeaf={leaf} onCommit={setCurrent} onBusy={setBusy} />
    <nav className="hero-folio__controls" aria-label="Sfoglia l’archivio">
      <span>Trascina il bordo · {current + 1}/{count}</span>
      <button type="button" disabled={!current || busy} aria-label="Prospettiva precedente" onClick={() => paper.current?.turnTo(current - 1)}>←</button>
      <button type="button" disabled={current === count - 1 || busy} aria-label="Prospettiva successiva" onClick={() => paper.current?.turnTo(current + 1)}>→</button>
    </nav>
    <span className="sr-only" aria-live="polite">Prospettiva {current + 1} di {count}</span>
  </div>;
}
