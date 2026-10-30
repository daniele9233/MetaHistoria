import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { type ManifestPage, type PageDoc, loadPage, childrenOf, findPage } from '../content/content';
import { sectionOf } from '../content/sections';
import { Link, useRoute } from '../lib/router';
import { paginateBook, pageAtPosition, type BookPage } from '../lib/bookPagination';
import { BookContent } from './BookContent';
import { PaperSurface, type PaperSurfaceHandle } from './PaperSurface';

type OutlineItem = { title: string; anchor: string; page: number };

export function BookReader({ page, isSection }: { page: ManifestPage; isSection: boolean }) {
  const { navigate } = useRoute();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const paper = useRef<PaperSurfaceHandle>(null);
  const indexDialog = useRef<HTMLDialogElement>(null);
  const imageDialog = useRef<HTMLDialogElement>(null);
  const currentRef = useRef(0);
  const pagesRef = useRef<BookPage[]>([]);
  const initialLayout = useRef(true);
  const busy = useRef(false);
  const [doc, setDoc] = useState<PageDoc | null>(null);
  const [error, setError] = useState('');
  const [pages, setPages] = useState<BookPage[]>([]);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [spread, setSpread] = useState(2);
  const [turning, setTurning] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const meta = sectionOf(page);
  const chapters = childrenOf(isSection ? page.path : page.parentPath || page.path);
  const total = pages.length;
  const lastStart = Math.max(0, Math.floor((total - 1) / spread) * spread);

  useEffect(() => {
    let active = true;
    loadPage(page).then(value => { if (active) setDoc(value); }).catch(() => { if (active) setError('Non è stato possibile aprire questo volume. Ricarica la pagina per riprovare.'); });
    return () => { active = false; };
  }, [page]);

  const setPosition = useCallback((index: number) => { currentRef.current = index; setCurrent(index); }, []);
  const readHash = useCallback((slices: BookPage[], size: number) => {
    const match = location.hash.match(/^#pagina-(\d+)$/);
    const anchor = location.hash.slice(1);
    const found = match ? Number(match[1]) - 1 : slices.findIndex(slice => slice.anchors.includes(anchor));
    return Math.floor(Math.max(0, Math.min(slices.length - 1, found < 0 ? 0 : found)) / size) * size;
  }, []);

  useEffect(() => {
    if (!doc || !source.current || !stage.current || continuous) return;
    let cancelled = false, timer = 0, generation = 0;
    const layout = async () => {
      const request = ++generation;
      await document.fonts.ready;
      await Promise.all(Array.from(source.current?.querySelectorAll('img') || [], img => { img.loading = 'eager'; return img.decode().catch(() => undefined); }));
      if (cancelled || request !== generation || !source.current || !measure.current || !stage.current) return;
      const nextSpread = stage.current.clientWidth >= 780 ? 2 : 1;
      const width = stage.current.clientWidth / nextSpread;
      const pad = width < 390 ? 22 : width < 500 ? 32 : 44;
      const height = stage.current.clientHeight - 96;
      stage.current.style.setProperty('--leaf-pad', `${pad}px`);
      root.current?.style.setProperty('--body-height', `${height}px`);
      source.current.style.width = `${width - pad * 2}px`;
      measure.current.style.width = `${width - pad * 2}px`;
      const position = pagesRef.current[currentRef.current]?.start;
      const result = paginateBook(source.current, measure.current, height);
      const next = initialLayout.current ? readHash(result, nextSpread) : Math.floor((position ? pageAtPosition(result, position) : 0) / nextSpread) * nextSpread;
      if (!initialLayout.current && /^#pagina-\d+$/.test(location.hash)) history.replaceState(history.state, '', `${location.pathname}${location.search}#pagina-${next + 1}`);
      initialLayout.current = false;
      pagesRef.current = result;
      busy.current = false;
      setTurning(false); setSpread(nextSpread); setPages(result); setPosition(next);
      setOutline(Array.from(source.current.querySelectorAll<HTMLElement>('[data-book-anchor]'), node => ({
        anchor: node.dataset.bookAnchor!, title: node.dataset.bookAnchor === 'copertina' ? 'Copertina' : node.dataset.bookAnchor === 'continua' ? 'Continua la lettura' : node.textContent || '',
        page: result.findIndex(slice => slice.anchors.includes(node.dataset.bookAnchor!)),
      })).filter(item => item.page >= 0));
    };
    const observer = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(() => void layout(), 100); });
    observer.observe(stage.current);
    void layout();
    return () => { cancelled = true; observer.disconnect(); window.clearTimeout(timer); };
  }, [doc, continuous, readHash, setPosition]);

  useEffect(() => {
    const restore = () => { busy.current = false; setTurning(false); setPosition(readHash(pagesRef.current, spread)); };
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, [readHash, setPosition, spread]);

  const commit = useCallback((next: number) => {
    history.pushState({ bookPage: next + 1 }, '', `${location.pathname}${location.search}#pagina-${next + 1}`);
    setPosition(next);
  }, [setPosition]);
  const go = useCallback((index: number) => {
    if (busy.current || !pagesRef.current.length) return;
    const next = Math.max(0, Math.min(lastStart, Math.floor(index / spread) * spread));
    if (next === currentRef.current) return;
    if (continuous) commit(next);
    else paper.current?.turnTo(next);
  }, [commit, continuous, lastStart, spread]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (continuous || indexDialog.current?.open || imageDialog.current?.open || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"],.masthead,[role="region"]')) return;
      if (['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        go(event.key === 'Home' ? 0 : event.key === 'End' ? lastStart : currentRef.current + (['ArrowRight', 'PageDown'].includes(event.key) ? spread : -spread));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [continuous, go, lastStart, spread]);

  useLayoutEffect(() => { if (zoom) imageDialog.current?.showModal(); }, [zoom]);
  const openAnchor = (anchor: string) => {
    indexDialog.current?.close();
    const index = pagesRef.current.findIndex(slice => slice.anchors.includes(anchor));
    if (continuous) Array.from(root.current?.querySelectorAll<HTMLElement>('.book-continuous [data-book-anchor]') || []).find(node => node.dataset.bookAnchor === anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (index >= 0) go(index);
  };
  // Fragments originate only from the typed React renderer. Delegate their links.
  const onContentClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
    if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (anchor.hasAttribute('data-book-image')) {
      event.preventDefault(); setZoom({ src: anchor.href, alt: anchor.querySelector('img')?.alt || 'Tavola dell’atlante' }); return;
    }
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || anchor.hasAttribute('download') || anchor.target === '_blank') return;
    event.preventDefault(); indexDialog.current?.close();
    if (url.pathname === location.pathname && url.hash) openAnchor(url.hash.slice(1));
    else navigate(url.pathname);
  };

  const leaf = (index: number, side: 'left' | 'right', overlay = false) => <div className={`book-leaf book-leaf--${side}`}>
    <div className="book-running-head"><span>MetaHistoria</span><span>{meta?.lens || 'Archivio'}</span></div>
    <div className="book-leaf__body book-prose" onClick={overlay ? undefined : onContentClick}
      dangerouslySetInnerHTML={{ __html: pages[index]?.html || (total ? '<div class="book-endmark" aria-hidden="true">✦</div>' : '<p class="book-preparing">Il volume si sta aprendo…</p>') }} />
    <div className="book-folio"><span>{index < total ? String(index + 1).padStart(2, '0') : '✦'}</span></div>
  </div>;
  const status = spread === 2 ? `Pagine ${current + 1}–${Math.min(current + 2, total)} di ${total}` : `Pagina ${current + 1} di ${total}`;

  return <main className={`book-reader ${continuous ? 'book-reader--continuous' : ''}`} ref={root} style={{ '--book-accent': meta?.accent || '#8c7353' } as CSSProperties}>
    <header className="book-toolbar">
      <div className="book-breadcrumb"><Link to="/">Archivio</Link><span>/</span>{page.parentPath ? <Link to={page.parentPath}>{findPage(page.parentPath)?.title || meta?.title || 'Volume'}</Link> : <span>{page.title}</span>}</div>
      <div className="book-toolbar__actions">
        <button type="button" onClick={() => indexDialog.current?.showModal()} aria-haspopup="dialog"><span aria-hidden="true">☷</span> Indice</button>
        <button type="button" onClick={() => { setContinuous(value => !value); window.scrollTo({ top: 0 }); }} aria-pressed={continuous}>{continuous ? '↩ Torna al libro' : 'Lettura continua'}</button>
        <Link to="/atlante-globo" className="book-atlas-button"><span aria-hidden="true">◎</span> Mappamondo</Link>
      </div>
    </header>
    {error ? <p role="alert" className="book-error">{error}</p> : <>
      <div className="book-heading"><span>Biblioteca MetaHistoria</span><span>{isSection ? 'Un volume, molte prospettive' : 'Il sacro e il potere'}</span></div>
      <div className="book-stage-wrap" hidden={continuous}>
        <PaperSurface ref={paper} stageRef={stage} current={current} spread={spread} total={total}
          version={pages}
          label={`Libro: ${page.title}`} renderLeaf={leaf} onCommit={commit}
          onBusy={value => { busy.current = value; setTurning(value); }} />
      </div>
      {continuous && doc && <article className="book-continuous book-prose" onClick={onContentClick}><BookContent page={page} doc={doc} isSection={isSection} /></article>}
      {!continuous && <footer className="book-controls">
        <button type="button" className="book-nav-button" aria-label="Pagine precedenti" disabled={!total || current === 0 || turning} onClick={() => go(current - spread)}><span aria-hidden="true">←</span><span>Indietro</span></button>
        <div className="book-progress"><div className="book-progress__track"><span style={{ width: `${total ? Math.min(1, (current + spread) / total) * 100 : 0}%` }} /></div>
          <label className="book-page-select"><span>{total ? 'Pagina' : 'Apertura…'}</span><select aria-label="Vai alla pagina" value={current} onChange={event => go(Number(event.target.value))} disabled={!total || turning}>
            {pages.filter((_, i) => i % spread === 0).map((_, i) => <option key={i} value={i * spread}>{i * spread + 1}{spread === 2 && i * spread + 2 <= total ? `–${i * spread + 2}` : ''}</option>)}
          </select><span>di {total || '…'}</span></label>
        </div>
        <button type="button" className="book-nav-button book-nav-button--next" aria-label="Pagine successive" disabled={!total || current >= lastStart || turning} onClick={() => go(current + spread)}><span>Sfoglia</span><span aria-hidden="true">→</span></button>
      </footer>}
      {!continuous && <p className="book-hint">Trascina il bordo della pagina o usa le frecce ← →<span>✦</span>Il tuo segno resta nell’indirizzo della pagina</p>}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{total ? status : 'Apertura del volume'}</p>
    </>}
    <div className="book-workspace" aria-hidden="true" inert>
      <div className="book-prose book-source" ref={source}>{doc && <BookContent page={page} doc={doc} isSection={isSection} />}</div>
      <div className="book-prose book-measure" ref={measure} />
    </div>
    <dialog className="book-index" ref={indexDialog} aria-labelledby="book-index-title" onClick={event => { if (event.target === event.currentTarget) indexDialog.current?.close(); }}>
      <header><p className="book-eyebrow">Il tuo percorso</p><button type="button" aria-label="Chiudi indice" onClick={() => indexDialog.current?.close()}>✕</button></header>
      <h2 id="book-index-title">Indice del volume</h2><p className="book-index__title">{page.title}</p>
      <nav aria-label="Indice del libro">{outline.map(item => <button type="button" key={item.anchor} onClick={() => openAnchor(item.anchor)}><span>{item.title}</span><small>{item.page + 1}</small></button>)}</nav>
      {!!chapters.length && <><p className="book-eyebrow book-index__label">{isSection ? 'Capitoli' : 'Altri capitoli del volume'}</p><nav aria-label="Capitoli">{chapters.map((chapter, i) => <Link key={chapter.id} to={chapter.path} onClick={() => indexDialog.current?.close()} aria-current={chapter.id === page.id ? 'page' : undefined}><small>{String(i + 1).padStart(2, '0')}</small><span>{chapter.title}</span><span aria-hidden="true">↗</span></Link>)}</nav></>}
      <Link to="/atlante-globo" className="book-index__globe" onClick={() => indexDialog.current?.close()}>◎ Apri il mappamondo interattivo ↗</Link>
    </dialog>
    <dialog className="book-image-dialog" ref={imageDialog} aria-label={zoom?.alt || 'Immagine ingrandita'} onClose={() => setZoom(null)} onClick={event => { if (event.target === event.currentTarget) imageDialog.current?.close(); }}>
      <button type="button" onClick={() => imageDialog.current?.close()}>Chiudi ✕</button>{zoom && <img src={zoom.src} alt={zoom.alt} />}
    </dialog>
    {doc && <article className="book-print book-prose"><BookContent page={page} doc={doc} isSection={isSection} /></article>}
  </main>;
}
