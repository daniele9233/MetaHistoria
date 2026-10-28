import type { Block, Run } from '../content/content';

function Runs({ runs }: { runs?: Run[] }) {
  if (!runs?.length) return null;
  return (
    <>
      {runs.map((r, i) =>
        r.b ? (
          <strong key={i}>{r.t}</strong>
        ) : r.i ? (
          <em key={i}>{r.t}</em>
        ) : (
          <span key={i}>{r.t}</span>
        ),
      )}
    </>
  );
}

/** Renderer dei blocchi estratti: nessun HTML grezzo, solo testo tipizzato. */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const level = Math.min(Math.max(b.level ?? 2, 1), 4);
          const Tag = (`h${level}` as unknown) as 'h2';
          return (
            <Tag key={i} className={`blk-h blk-h${level}`} id={`s-${i}`}>
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
              <h3 key={i} className="blk-h blk-h3 blk-sub">
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
          const items = b.items ?? [];
          const ListTag = b.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={i} className={`blk-list ${b.role === 'references' ? 'blk-list--refs' : ''}`}>
              {items.map((it, j) => (
                <li key={j}>
                  <Runs runs={it} />
                </li>
              ))}
            </ListTag>
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

        if (b.type === 'card') {
          const parts = b.parts ?? [];
          if (!parts.length) return null;
          const [kicker, second, ...rest] = parts;
          const secondIsTitle = !!second && second.length <= 120;
          const body = secondIsTitle ? rest : [second, ...rest].filter(Boolean);
          return (
            <div key={i} className={`blk-card ${b.role === 'event-card' ? 'blk-card--event' : ''}`}>
              <p className="blk-card__kicker">{kicker}</p>
              {secondIsTitle ? <p className="blk-card__title">{second}</p> : null}
              {body.map((p, k) => (
                <p className="blk-card__body" key={k}>
                  {p}
                </p>
              ))}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
