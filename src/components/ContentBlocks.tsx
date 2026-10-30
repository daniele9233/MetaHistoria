import type { Block, Run } from '../content/content';
import { plate } from '../content/sections';
import { Link } from '../lib/router';

function Runs({ runs }: { runs?: Run[] }) {
  if (!runs?.length) return null;
  return (
    <>
      {runs.map((r, i) =>
        r.b ? <strong key={i}>{r.t}</strong> : r.i ? <em key={i}>{r.t}</em> : <span key={i}>{r.t}</span>,
      )}
    </>
  );
}

function cleanCta(s: string) {
  // la sorgente ha un carattere corrotto al posto della freccia: "Leggi ?"
  return s.replace(/[?¿]\s*$/, '').trim() || 'Leggi';
}

function Card({ block }: { block: Block }) {
  const parts = (block.parts ?? []).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;

  let num = '';
  let title = '';
  let cta = '';
  const rest = [...parts];

  if (/^\d{1,3}$/.test(rest[0])) num = rest.shift() ?? '';
  if (rest.length && /^(leggi|apri|vedi|scopri)\b/i.test(rest[rest.length - 1])) cta = rest.pop() ?? '';
  title = rest.shift() ?? '';
  const body = rest.join(' ');

  const inner = (
    <>
      <div className="card__head">
        {num && <span className="card__num">{num}</span>}
        <span className="card__title">{title}</span>
      </div>
      {body && <p className="card__body">{body}</p>}
      <span className="card__cta">
        {cta ? cleanCta(cta) : 'Leggi'}
        <i aria-hidden="true">→</i>
      </span>
    </>
  );

  if (block.href) {
    return (
      <Link to={block.href.replace(/\/$/, '')} className="card card--link">
        {inner}
      </Link>
    );
  }
  return <div className="card">{inner}</div>;
}

function Figure({ block }: { block: Block }) {
  const src = block.src?.startsWith('assets/') ? plate(block.src) : block.src ?? '';
  if (!src) return null;
  return (
    <figure className="fig">
      <img src={src} alt={block.alt ?? ''} loading="lazy" decoding="async" />
      {(block.caption || block.alt) && (
        <figcaption>{block.caption || block.alt}</figcaption>
      )}
    </figure>
  );
}

/** Renderer dei blocchi: testo tipizzato, nessun HTML grezzo. */
export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const level = Math.min(Math.max(b.level ?? 2, 2), 4);
          const Tag = (`h${level}` as unknown) as 'h2';
          return (
            <Tag key={i} className={`blk-h blk-h${level}`} id={`sec-${i}`}>
              <Runs runs={b.runs} />
            </Tag>
          );
        }

        if (b.type === 'p') {
          const role = b.role ?? 'p';
          if (role === 'label' || role === 'num') {
            return (
              <p key={i} className="blk-label">
                <Runs runs={b.runs} />
              </p>
            );
          }
          if (role === 'sub') {
            return (
              <h3 key={i} className="blk-h blk-h3">
                <Runs runs={b.runs} />
              </h3>
            );
          }
          if (role === 'lede') {
            return (
              <p key={i} className="blk-lede">
                <Runs runs={b.runs} />
              </p>
            );
          }
          if (role === 'verse') {
            return (
              <p key={i} className="blk-verse">
                <Runs runs={b.runs} />
              </p>
            );
          }
          return (
            <p key={i} className="blk-p">
              <Runs runs={b.runs} />
            </p>
          );
        }

        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i} className="blk-list">
              {(b.items ?? []).map((it, j) => (
                <li key={j}>
                  <Runs runs={it} />
                </li>
              ))}
            </Tag>
          );
        }

        if (b.type === 'quote') {
          return (
            <blockquote key={i} className="blk-quote">
              <Runs runs={b.runs} />
            </blockquote>
          );
        }

        if (b.type === 'table') {
          return (
            <div className="blk-tablewrap" key={i}>
              <table className="blk-table">
                {(b.head?.length ?? 0) > 0 && (
                  <thead>
                    {b.head!.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <th key={k}>{cell}</th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                )}
                <tbody>
                  {(b.rows ?? []).map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (b.type === 'card') return <Card key={i} block={b} />;
        if (b.type === 'figure') return <Figure key={i} block={b} />;
        return null;
      })}
    </>
  );
}

export { Runs };
