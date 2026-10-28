import { useEffect, useRef, useState } from 'react';
import { NAVIGATION } from '../content/content';
import { SITE } from '../data/site';
import { Link } from '../lib/router';

export function Masthead() {
  const [open, setOpen] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const closeAll = () => {
    setOpen(null);
    setMobileOpen(false);
  };

  return (
    <header
      className={`masthead ${open !== null ? 'is-menu-open' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
      ref={rootRef}
    >
      <div className="masthead__bar">
        <Link className="masthead__brand" to="/" onClick={closeAll}>
          <span className="masthead__name">{SITE.wordmark}</span>
          <span className="masthead__tag">{SITE.tagline}</span>
        </Link>

        <button
          type="button"
          className="masthead__toggle"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          Sezioni
          <i className="nav__caret" aria-hidden="true" />
        </button>

        <nav
          className="nav"
          aria-label="Sezioni"
          ref={navRef}
          onPointerLeave={() => setOpen(null)}
          onBlur={(e) => {
            if (!navRef.current?.contains(e.relatedTarget as Node)) setOpen(null);
          }}
        >
          {NAVIGATION.groups.map((group, i) => (
            <div
              key={group.label}
              className={`nav__item ${open === i ? 'is-open' : ''}`}
              onPointerEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
            >
              <button
                type="button"
                className="nav__trigger"
                aria-expanded={open === i}
                aria-controls={`nav-panel-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="nav__label">{group.label}</span>
                <i className="nav__caret" aria-hidden="true" />
              </button>

              <div className="nav__panel" id={`nav-panel-${i}`} role="group" aria-label={group.label}>
                <div className="nav__panel-head">{group.label}</div>
                <ul className="nav__list">
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <Link to={item.path} onClick={closeAll}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <div className="masthead__meta">
          <Link to="/" onClick={closeAll}>
            Archivio
          </Link>
          <Link to="/atlante-visuale" onClick={closeAll}>
            Atlante
          </Link>
        </div>
      </div>
    </header>
  );
}
