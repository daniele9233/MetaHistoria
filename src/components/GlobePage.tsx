import { useEffect, useRef, useState } from 'react';
import { Link, useRoute } from '../lib/router';
import { EditorialAtlas } from './EditorialAtlas';

let bundle: Promise<void> | undefined;
function loadGlobe() {
  if (customElements.get('metahistoria-globe')) return Promise.resolve();
  if (!bundle) bundle = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/atlante-globo/metahistoria-globe.js';
    script.async = true;
    const fail = () => { bundle = undefined; script.remove(); reject(new Error('Impossibile caricare il mappamondo.')); };
    script.onload = () => customElements.get('metahistoria-globe') ? resolve() : fail();
    script.onerror = fail;
    document.head.append(script);
  });
  return bundle;
}

function LegacyGlobe() {
  const host = useRef<HTMLDivElement>(null);
  const { navigate } = useRoute();
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let element: HTMLElement | undefined;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      event.preventDefault(); navigate(url.pathname);
    };
    setState('loading');
    loadGlobe().then(() => {
      if (!active || !host.current) return;
      element = document.createElement('metahistoria-globe');
      // Relative dossier links always point to this installation, never to a fixed port.
      element.setAttribute('site-base', '');
      element.setAttribute('lens', 'classica');
      element.setAttribute('auto-rotate', String(!matchMedia('(prefers-reduced-motion: reduce)').matches));
      element.addEventListener('click', onClick);
      host.current.replaceChildren(element);
      setState('ready');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; element?.removeEventListener('click', onClick); element?.remove(); };
  }, [navigate, attempt]);
  return <div className="globe-page">
    <h1 className="sr-only">Atlante interattivo del sacro e del potere</h1>
    <nav className="globe-page__nav" aria-label="Percorso dell’atlante"><Link to="/atlante-visuale">← Sfoglia l’Atlante Visuale</Link><Link to="/">MetaHistoria · Archivio</Link></nav>
    {state === 'loading' && <p className="globe-page__loading" role="status">Il mondo prende forma…</p>}
    {state === 'error' && <div className="globe-page__error" role="alert"><p>Il mappamondo non è stato caricato.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Riprova ↻</button></div>}
    <div className="globe-page__canvas" ref={host} />
  </div>;
}

export function GlobePage() {
  const [comparisons, setComparisons] = useState(false);
  return <main className="globe-editorial">
    <h1 className="sr-only">Atlante interattivo del sacro e del potere</h1>
    <EditorialAtlas standalone />
    <details className="globe-legacy" onToggle={event => setComparisons(event.currentTarget.open)}>
      <summary>Confronti editoriali · esplora le cinque lenti</summary>
      {comparisons && <LegacyGlobe />}
    </details>
  </main>;
}
