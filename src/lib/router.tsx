import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface RouteState {
  path: string;
  navigate: (to: string) => void;
}

const RouteContext = createContext<RouteState>({ path: '/', navigate: () => undefined });

export function normalizePath(p: string): string {
  let s = (p || '/').split('?')[0].split('#')[0];
  try {
    s = decodeURI(s);
  } catch {
    /* path malformato: lo lascio com'è */
  }
  s = s.replace(/\.html?$/i, '');
  s = s.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    const next = normalizePath(to);
    if (next === normalizePath(window.location.pathname)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', next + (next === '/' ? '' : ''));
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export function useRoute() {
  return useContext(RouteContext);
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
}

/** Link interno: mantiene il comportamento del browser (ctrl/cmd-click, tasto destro). */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRoute();
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
