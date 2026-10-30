import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { ATLAS, ATLAS_COUNTS, categoryLabel } from '../lib/editorialAtlas';
import { loadPage, type PageDoc } from '../content/content';
import { img } from '../content/sections';
import { Link } from '../lib/router';
import type { AtlasRenderer, AtlasView, AtlasProjection } from '../lib/atlasRenderer';

export interface EditorialAtlasHandle { setProgress: (value: number) => void }
const VATICAN = ATLAS.places[0]?.id || '';
export function EditorialAtlas({ ref, standalone = false }: { ref?: Ref<EditorialAtlasHandle>; standalone?: boolean }) {
  const root = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const connector = useRef<SVGPathElement>(null), pin = useRef<HTMLSpanElement>(null);
  const indexDialog = useRef<HTMLDialogElement>(null), search = useRef<HTMLInputElement>(null);
  const engine = useRef<AtlasRenderer | null>(null), reveal = useRef(standalone ? 1 : 0);
  const [view, setView] = useState<AtlasView>('italy'), [selected, setSelected] = useState<string | null>(VATICAN);
  const [doc, setDoc] = useState<PageDoc | null>(null), [status, setStatus] = useState('loading');
  const [query, setQuery] = useState(''), [scope, setScope] = useState<'places' | 'all'>('places');
  const [attempt, setAttempt] = useState(0);
  const node = ATLAS.places.find(n => n.id === selected);
  const current = useRef({ view, selected }); current.current = { view, selected };
  const selection = useRef<(id: string) => void>(() => {});
  selection.current = id => {
    setSelected(id); engine.current?.focus(id);
    if (current.current.view !== 'global') { setView('explore'); engine.current?.setView('explore'); }
  };
  const project = (point: AtlasProjection) => {
    const element = root.current;
    if (!element) return;
    const width = element.clientWidth, height = element.clientHeight;
    element.dataset.anchorVisible = String(point.visible);
    const mobile = width < 760;
    const cardX = mobile ? 20 : Math.min(width - 336, Math.max(width * .65, point.x + 110));
    const cardY = mobile ? height - 236 : Math.max(130, Math.min(height - 250, point.y - 145));
    element.style.setProperty('--dossier-x', `${cardX}px`); element.style.setProperty('--dossier-y', `${cardY}px`);
    if (pin.current) pin.current.style.transform = `translate(${point.x}px,${point.y}px)`;
    const endX = mobile ? width * .65 : cardX, endY = mobile ? cardY : cardY + 48;
    connector.current?.setAttribute('d', `M ${point.x} ${point.y} Q ${point.x + 30} ${endY} ${endX} ${endY}`);
  };
  useImperativeHandle(ref, () => ({ setProgress: value => {
    reveal.current = value; engine.current?.setReveal(value);
    root.current?.classList.toggle('is-interactive', value > .98);
    if (!standalone && root.current) root.current.inert = value < .98;
  } }), [standalone]);

  useEffect(() => {
    let active = true, visible = true;
    setStatus('loading');
    if (root.current && !standalone) root.current.inert = reveal.current < .98;
    import('../lib/atlasRenderer').then(async ({ AtlasRenderer }) => {
      if (!active || !canvas.current) return;
      const created = await AtlasRenderer.create(canvas.current, id => selection.current(id), point => { if (active) project(point); });
      if (!active) { created.dispose(); return; }
      engine.current = created;
      created.setView(current.current.view); created.focus(current.current.selected);
      created.setReveal(reveal.current); created.setVisible(visible); setStatus('ready');
    }).catch(() => { if (active) setStatus('fallback'); });
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; engine.current?.setVisible(visible); });
    if (canvas.current) observer.observe(canvas.current);
    const lost = (event: Event) => { event.preventDefault(); engine.current?.dispose(); engine.current = null; setStatus('fallback'); };
    const element = canvas.current; element?.addEventListener('webglcontextlost', lost);
    return () => { active = false; observer.disconnect(); element?.removeEventListener('webglcontextlost', lost); engine.current?.dispose(); engine.current = null; };
  }, [standalone, attempt]);
  useEffect(() => {
    engine.current?.focus(selected); setDoc(null);
    if (!node) return;
    let active = true;
    loadPage(node.page).then(value => { if (active) setDoc(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [node, selected]);

  const openIndex = (all = false) => {
    setScope(all ? 'all' : 'places'); setQuery('');
    if (!indexDialog.current?.open) indexDialog.current?.showModal();
    requestAnimationFrame(() => search.current?.focus());
  };
  const changeView = (next: AtlasView) => {
    setView(next); engine.current?.setView(next);
    if (next === 'italy') { setSelected(VATICAN); engine.current?.focus(VATICAN); }
    if (next === 'global') setSelected(null);
    if (next === 'explore') openIndex();
  };
  const items = scope === 'places' ? ATLAS.places : ATLAS.topics;
  const filtered = items.filter(item => `${item.label} ${item.page.title} ${categoryLabel(item.page.category)}`.toLocaleLowerCase('it').includes(query.toLocaleLowerCase('it')));
  const thumbnail = node?.page.path.endsWith('/vaticano') ? img('sanpietro') : img('mappamondo');

  return <section className={`atlas-reveal relief-atlas ${standalone ? 'is-interactive' : ''}`} ref={root}
    aria-label="Atlante dei rilievi" data-atlas-status={status} data-view={view} data-anchor-visible="false">
    <div className="relief-world"><canvas ref={canvas} role="img" aria-label="Terra con rilievi tridimensionali. Trascina per ruotare e seleziona un luogo. Usa i pulsanti per cambiare vista e avvicinare." /></div>
    <div className="relief-shade" aria-hidden="true" />
    <header className="relief-heading"><p>Atlante dei rilievi<span aria-hidden="true" /></p><h2>Entra nel<br />territorio.</h2></header>
    <svg className="relief-connector" aria-hidden="true"><path ref={connector} /></svg>
    <span className="relief-pin" ref={pin} aria-hidden="true"><i /></span>
    {node && <article className="relief-dossier" aria-live="polite" aria-atomic="true">
      <img src={thumbnail} alt={node.page.path.endsWith('/vaticano') ? 'La cupola della Basilica di San Pietro' : 'Cartografia dell’archivio MetaHistoria'} />
      <div><span className="relief-dossier__place">{node.label}</span><h3>{node.page.title}</h3>
        {doc && <p className="sr-only">{doc.lede || doc.kicker}</p>}
        <Link to={node.page.path}>Apri il dossier <span aria-hidden="true">↗</span></Link>
      </div>
    </article>}
    {status === 'loading' && <div className="relief-status" role="status"><i />Il territorio prende forma…</div>}
    {status === 'fallback' && <div className="relief-fallback" role="status"><p>Esplora l’archivio anche senza la vista 3D.</p><button type="button" onClick={() => openIndex(true)}>Apri tutte le letture ↗</button><button type="button" onClick={() => setAttempt(value => value + 1)}>Riprova la vista 3D</button></div>}
    <nav className="relief-navigation" aria-label="Navigazione del territorio">
      <button type="button" aria-pressed={view === 'global'} onClick={() => changeView('global')}>
        <svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="10" /><ellipse cx="14" cy="14" rx="4" ry="10" /><path d="M4 14h20M6 8h16M6 20h16" /></svg><span>Vista globale</span></button>
      <span className="relief-navigation__line" aria-hidden="true" />
      <button type="button" aria-pressed={view === 'italy'} onClick={() => changeView('italy')}><span className="relief-navigation__point" aria-hidden="true" /><span>Italia</span></button>
      <span className="relief-navigation__line" aria-hidden="true" />
      <button type="button" aria-pressed={view === 'explore'} onClick={() => changeView('explore')} aria-haspopup="dialog"><span className="relief-navigation__point" aria-hidden="true" /><span>Esplora</span></button>
    </nav>
    <div className="relief-tools" aria-label="Controlli della mappa"><button type="button" aria-label="Avvicina al territorio" title="Avvicina · anche Alt + rotella" onClick={() => engine.current?.zoom(1)}>+</button><button type="button" aria-label="Allontana dal territorio" onClick={() => engine.current?.zoom(-1)}>−</button><button type="button" className="relief-index-button" aria-label="Indice di tutti gli articoli" aria-haspopup="dialog" onClick={() => openIndex(true)}>☷</button></div>
    <footer className="relief-caption"><span>NASA Earth Observatory <i>·</i> Rilievi amplificati</span><button type="button" onClick={() => openIndex(true)}>{ATLAS_COUNTS.articles} letture <span aria-hidden="true">↗</span></button></footer>
    <dialog className="relief-index" ref={indexDialog} aria-labelledby="relief-index-title" onClick={event => { if (event.target === event.currentTarget) indexDialog.current?.close(); }}>
      <div className="relief-index__header"><span>MetaHistoria · percorsi di lettura</span><button type="button" aria-label="Chiudi indice dell’atlante" onClick={() => indexDialog.current?.close()}>✕</button></div>
      <h2 id="relief-index-title">Scegli una prospettiva.</h2>
      <div className="relief-index__tabs" role="group" aria-label="Tipo di contenuto"><button type="button" aria-pressed={scope === 'places'} onClick={() => setScope('places')}>Luoghi · {ATLAS_COUNTS.places}</button><button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>Tutte le letture · {ATLAS_COUNTS.articles}</button></div>
      <label className="relief-search"><span>Cerca nell’archivio</span><input ref={search} type="search" placeholder="Un luogo, un titolo, una sezione…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <nav aria-label="Letture dell’atlante" className="relief-index__results">
        {filtered.map(item => <div key={item.id}>
          {scope === 'places' ? <button className="relief-place-option" type="button" onClick={() => { setSelected(item.id); engine.current?.focus(item.id); setView('explore'); engine.current?.setView('explore'); indexDialog.current?.close(); }}><span>{item.label}</span><small>{item.page.title}</small><i aria-hidden="true">↗</i></button>
            : <Link to={item.page.path} onClick={() => indexDialog.current?.close()}><span>{item.page.title}</span><small>{categoryLabel(item.page.category)}</small><i aria-hidden="true">↗</i></Link>}
        </div>)}
        {!filtered.length && <p>Nessuna lettura trovata. Prova un altro titolo.</p>}
      </nav>
      <Link className="relief-index__visual" to="/atlante-visuale" onClick={() => indexDialog.current?.close()}>Sfoglia anche l’Atlante Visuale ↗</Link>
    </dialog>
  </section>;
}
