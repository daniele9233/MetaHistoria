import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { shouldComplete, progressForEdge } from '../lib/paperGeometry';
import type { PaperRenderer } from '../lib/paperRenderer';

export interface PaperSurfaceHandle { turnTo: (index: number) => void }
type Phase = 'idle' | 'hover' | 'grabbed' | 'dragging' | 'settling' | 'completed' | 'cancelled';
type Session = { from: number; to: number; direction: number; manual: boolean };
interface Props {
  current: number; spread: number; total: number; label: string;
  stageRef?: RefObject<HTMLDivElement | null>;
  ref?: Ref<PaperSurfaceHandle>;
  renderLeaf: (index: number, side: 'left' | 'right', overlay?: boolean) => ReactNode;
  onCommit: (index: number) => void;
  onBusy?: (busy: boolean) => void;
  className?: string;
  version?: unknown;
}

/** The same controller drives the hero folio and the complete editorial reader.
 * No HTML is rasterized per frame; at most six nearby page surfaces are cached. */
export function PaperSurface({ current, spread, total, label, stageRef, ref, renderLeaf, onCommit, onBusy, className = '', version }: Props) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), sources = useRef<HTMLDivElement>(null);
  const engine = useRef<PaperRenderer | null>(null);
  const rasterizer = useRef<typeof import('../lib/paperRenderer') | null>(null);
  const cache = useRef(new Map<string, Promise<HTMLCanvasElement>>());
  const alive = useRef(true), frame = useRef(0), sessionRef = useRef<Session | null>(null);
  const callbacks = useRef({ onCommit, onBusy }); callbacks.current = { onCommit, onBusy };
  const config = useRef({ current, spread, total }); config.current = { current, spread, total };
  const motion = useRef({ progress: 0, velocity: 0, target: 0, phase: 'idle' as Phase, grabY: .5, last: 0, autoStart: 0 });
  const pointer = useRef<{ id: number; x: number; y: number; lastX: number; lastAt: number; velocity: number; width: number; moved: boolean } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [session, setSession] = useState<Session | null>(null), [painted, setPainted] = useState(false);
  const [backend, setBackend] = useState('loading');
  const [phase, setPhase] = useState<Phase>('idle');
  const captureKeys = new Set<number>([current - 2, current - 1, current, current + 1, current + 2, current + 3]);
  if (session) { captureKeys.add(session.to); captureKeys.add(session.to + 1); }
  const key = (index: number, side: string) => `${index}:${side}`;
  const changePhase = useCallback((next: Phase) => { motion.current.phase = next; if (alive.current) setPhase(next); }, []);

  useEffect(() => { cache.current.clear(); }, [version]);

  useEffect(() => {
    alive.current = true;
    const el = root.current!;
    const resize = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    return () => { alive.current = false; observer.disconnect(); cancelAnimationFrame(frame.current); };
  }, []);

  useEffect(() => {
    if (!size.width || !size.height || !canvas.current) return;
    let active = true;
    cache.current.clear();
    sessionRef.current = null; pointer.current = null;
    setSession(null); setPainted(false); callbacks.current.onBusy?.(false);
    changePhase('idle');
    import('../lib/paperRenderer').then(async module => {
      if (!active || !canvas.current) return;
      rasterizer.current = module;
      try {
        engine.current = new module.PaperRenderer(canvas.current, size.width, size.height, spread);
        await engine.current.warmup();
        if (active) setBackend('webgl');
      } catch { if (active) setBackend('html'); }
    }).catch(() => { if (active) setBackend('html'); });
    const lost = (event: Event) => {
      event.preventDefault(); engine.current?.dispose(); engine.current = null; setBackend('html');
      sessionRef.current = null; pointer.current = null; setSession(null); setPainted(false); callbacks.current.onBusy?.(false); changePhase('cancelled');
    };
    const node = canvas.current; node.addEventListener('webglcontextlost', lost);
    return () => {
      active = false; cancelAnimationFrame(frame.current);
      node.removeEventListener('webglcontextlost', lost);
      engine.current?.dispose(); engine.current = null; cache.current.clear();
    };
  }, [size.width, size.height, spread, changePhase]);

  const capture = useCallback((index: number, side: string) => {
    const id = key(index, side);
    let promise = cache.current.get(id);
    if (!promise) {
      const node = sources.current?.querySelector<HTMLElement>(`[data-capture="${id}"] > *`);
      if (!node || !rasterizer.current) return Promise.reject(new Error('Paper surface not ready'));
      promise = rasterizer.current.capturePaper(node);
      cache.current.set(id, promise);
      promise.catch(() => cache.current.delete(id));
    }
    return promise;
  }, []);

  useEffect(() => {
    if (backend !== 'webgl' || !size.width) return;
    if (root.current) root.current.dataset.texturesReady = 'false';
    const nearby = [current - 2, current - 1, current, current + 1, current + 2, current + 3].filter(i => i >= 0 && i <= total);
    const allowed = new Set(nearby.flatMap(i => [key(i, 'left'), key(i, 'right')]));
    for (const id of cache.current.keys()) if (!allowed.has(id)) cache.current.delete(id);
    let cancelled = false;
    // Sequential preparation avoids a burst of DOM clones and image decodes.
    void (async () => {
      for (const i of nearby) {
        if (cancelled) break;
        const side = spread === 1 || i % 2 === 0 ? 'left' : 'right';
        await capture(i, side).catch(() => undefined);
      }
      if (!cancelled && root.current) root.current.dataset.texturesReady = 'true';
    })();
    return () => { cancelled = true; };
  }, [backend, capture, current, size, spread, total]);

  const finish = useCallback((complete: boolean) => {
    const active = sessionRef.current;
    if (!active) return;
    sessionRef.current = null; pointer.current = null; motion.current.velocity = 0;
    changePhase(complete ? 'completed' : 'cancelled');
    if (complete) callbacks.current.onCommit(active.to);
    callbacks.current.onBusy?.(false); setSession(null); setPainted(false);
    root.current?.style.setProperty('--paper-progress', '0');
  }, [changePhase]);

  const draw = useCallback(() => {
    if (!engine.current || !sessionRef.current) return;
    const m = motion.current;
    engine.current.draw(m.progress, m.grabY);
    if (root.current) {
      root.current.dataset.progress = m.progress.toFixed(4);
      root.current.dataset.renderInfo = JSON.stringify(engine.current.info());
    }
  }, []);

  const tick = useCallback(function animate(now: number) {
    frame.current = 0;
    if (!sessionRef.current || !alive.current) return;
    const m = motion.current;
    const dt = Math.min((now - m.last) / 1000 || 1 / 60, .032); m.last = now;
    if (m.autoStart) {
      const t = Math.min(1, (now - m.autoStart) / 1120);
      m.progress = .5 - .5 * Math.cos(Math.PI * t);
      if (t === 1) { draw(); finish(true); return; }
    } else if (m.phase === 'settling') {
      // Critically damped spring. Small fixed substeps make release frame-independent.
      const steps = Math.ceil(dt / .008), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        m.velocity += ((m.target - m.progress) * 330 - m.velocity * 36.4) * h;
        m.progress = Math.max(0, Math.min(1, m.progress + m.velocity * h));
      }
      if (Math.abs(m.target - m.progress) < .0015 && Math.abs(m.velocity) < .025) {
        m.progress = m.target; draw(); finish(m.target === 1); return;
      }
    }
    draw();
    if (m.autoStart || m.phase === 'settling') frame.current = requestAnimationFrame(animate);
  }, [draw, finish]);

  const begin = useCallback((to: number, manual: boolean, grabY = .5) => {
    const c = config.current;
    if (sessionRef.current || !c.total || to < 0 || to >= c.total || to === c.current) return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || backend === 'html') {
      if (!manual) callbacks.current.onCommit(to);
      return false;
    }
    const next = { from: c.current, to, direction: to > c.current ? 1 : -1, manual };
    sessionRef.current = next;
    Object.assign(motion.current, { progress: 0, velocity: 0, target: 1, grabY, autoStart: 0 });
    callbacks.current.onBusy?.(true); setSession(next); changePhase(manual ? 'grabbed' : 'settling');
    return true;
  }, [backend, changePhase]);

  useImperativeHandle(ref, () => ({ turnTo: index => { begin(index, false); } }), [begin]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const forward = session.direction > 0;
    const frontIndex = spread === 1 ? session.from : forward ? session.from + 1 : session.from;
    const backIndex = spread === 1 ? session.to : forward ? session.to : session.to + 1;
    const frontSide = spread === 1 || !forward ? 'left' : 'right';
    const backSide = spread === 1 || forward ? 'left' : 'right';
    Promise.all([capture(frontIndex, frontSide), capture(backIndex, backSide)]).then(([front, back]) => {
      if (cancelled || sessionRef.current !== session || !engine.current) return;
      engine.current.setPages(front, back, session.direction);
      draw(); setPainted(true);
      motion.current.last = performance.now();
      if (!session.manual) motion.current.autoStart = performance.now();
      frame.current = requestAnimationFrame(tick);
    }).catch(() => { if (!cancelled) { setBackend('html'); finish(!session.manual); } });
    return () => { cancelled = true; cancelAnimationFrame(frame.current); };
  }, [session, spread, capture, draw, finish, tick]);

  // A route/hash update invalidates any uncommitted gesture.
  useEffect(() => {
    if (sessionRef.current && sessionRef.current.from !== current) finish(false);
  }, [current, finish]);

  const release = (cancel = false) => {
    const gesture = pointer.current;
    if (!gesture) return;
    pointer.current = null;
    const node = root.current;
    if (node?.hasPointerCapture(gesture.id)) node.releasePointerCapture(gesture.id);
    const m = motion.current;
    if (!gesture.moved) { finish(false); return; }
    const velocity = performance.now() - gesture.lastAt > 100 ? 0 : gesture.velocity;
    m.target = !cancel && shouldComplete(m.progress, velocity) ? 1 : 0;
    m.velocity = Math.max(-3, Math.min(3, velocity * 1000));
    m.autoStart = 0; changePhase('settling');
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  const forward = !!session && session.direction > 0;
  const left = painted && session && (spread === 1 || !forward) ? session.to : current;
  const right = painted && session && forward ? session.to + 1 : current + 1;
  return <div ref={node => { root.current = node; if (stageRef) stageRef.current = node; }}
    className={`book-stage paper-surface ${spread === 1 ? 'book-stage--single' : ''} ${painted ? 'is-turning' : ''} ${className}`}
    aria-label={label} aria-busy={!total || !!session} data-paper-state={phase} data-renderer={backend} data-progress="0"
    onPointerDown={event => {
      if (event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('a,button,input,select,.book-overflow') || window.getSelection()?.toString()) return;
      const bounds = event.currentTarget.getBoundingClientRect(), x = (event.clientX - bounds.left) / bounds.width;
      const edge = x > .84 ? 1 : x < .16 ? -1 : 0;
      if (!edge) return;
      if (begin(current + edge * spread, true, 1 - (event.clientY - bounds.top) / bounds.height)) {
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastAt: event.timeStamp, velocity: 0, width: bounds.width / spread, moved: false };
      }
    }}
    onPointerMove={event => {
      const g = pointer.current;
      if (!g) {
        if (sessionRef.current) return;
        const b = event.currentTarget.getBoundingClientRect(), x = (event.clientX - b.left) / b.width;
        const canGrab = (x > .84 && current + spread < total) || (x < .16 && current > 0);
        if (motion.current.phase !== (canGrab ? 'hover' : 'idle')) changePhase(canGrab ? 'hover' : 'idle');
        return;
      }
      if (g.id !== event.pointerId || !sessionRef.current) return;
      const dx = event.clientX - g.x, dy = event.clientY - g.y;
      if (!g.moved && Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx) * 1.2) { release(true); return; }
      if (!g.moved && Math.abs(dx) < 5) return;
      if (!g.moved) { g.moved = true; event.currentTarget.setPointerCapture(event.pointerId); changePhase('dragging'); }
      event.preventDefault();
      const direction = sessionRef.current.direction;
      const dt = Math.max(1, event.timeStamp - g.lastAt);
      const b = event.currentTarget.getBoundingClientRect();
      motion.current.grabY = Math.max(0, Math.min(1, 1 - (event.clientY - b.top) / b.height));
      const progress = progressForEdge(1 + dx * direction / g.width, motion.current.grabY);
      g.velocity = (progress - motion.current.progress) / dt;
      g.lastX = event.clientX; g.lastAt = event.timeStamp;
      motion.current.progress = progress;
      motion.current.autoStart = 0;
      if (!frame.current) frame.current = requestAnimationFrame(tick);
    }}
    onPointerUp={() => release()} onPointerCancel={() => release(true)}
    onLostPointerCapture={event => {
      // Touch initially captures on the child under the finger. Its bubbled loss
      // during the handoff to this surface is not cancellation of our capture.
      if (event.target === event.currentTarget && pointer.current && !event.currentTarget.hasPointerCapture(event.pointerId)) release(true);
    }}
    onPointerLeave={() => { if (!pointer.current && !sessionRef.current) changePhase('idle'); }}
    onClickCapture={event => { if (sessionRef.current) { event.preventDefault(); event.stopPropagation(); } }}>
    <div className="book-spread">
      {renderLeaf(left, 'left')}{spread === 2 && renderLeaf(right, 'right')}
    </div>
    <div className="paper-canvas-shell" aria-hidden="true"><canvas className="paper-canvas" ref={canvas} style={{ visibility: painted ? 'visible' : 'hidden' }} /></div>
    <div className="paper-texture-sources" ref={sources} aria-hidden="true" inert>
      {Array.from(captureKeys).filter(i => i >= 0 && i <= total).flatMap(index => (['left', 'right'] as const).map(side =>
        <div key={key(index, side)} data-capture={key(index, side)} style={{ width: size.width / spread, height: size.height }}>{renderLeaf(index, side, true)}</div>))}
    </div>
  </div>;
}
