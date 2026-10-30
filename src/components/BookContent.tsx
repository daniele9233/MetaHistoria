import { Fragment } from 'react';
import { type ManifestPage, type PageDoc, childrenOf, findPage, stripHeaderBlocks } from '../content/content';
import { sectionOf, sectionImage, pickImage, imageMeta, plate, readingMinutes } from '../content/sections';
import { ContentBlocks, Runs } from './ContentBlocks';
import { Link } from '../lib/router';

/** Shared source for measured folios, continuous reading and printing. */
export function BookContent({ page, doc, isSection }: { page: ManifestPage; doc: PageDoc; isSection: boolean }) {
  const meta = sectionOf(page);
  const image = meta ? (isSection ? meta.hero : pickImage(meta, page)) : null;
  const caption = image ? (isSection ? meta!.heroCaption : imageMeta(image).caption) : '';
  const siblings = childrenOf(page.parentPath || page.path);
  const siblingIndex = siblings.findIndex(item => item.id === page.id);
  const blocks = stripHeaderBlocks(doc);
  return <>
    <header className="book-cover" data-book-break="page" data-book-anchor="copertina">
      <p className="book-eyebrow">MetaHistoria · {isSection ? 'Il volume' : 'Il capitolo'}</p>
      <span className="book-cover__number">{doc.kicker || meta?.kicker || 'Letture del mondo'}</span>
      <h1>{isSection && meta ? meta.title : doc.title || page.title}</h1>
      <span className="book-rule" aria-hidden="true" />
      {(doc.lede || (isSection && meta?.lede)) && <p className="book-cover__lede">{doc.lede || meta?.lede}</p>}
      <p className="book-cover__edition">{meta?.lens || 'Archivio'}<span>•</span>{readingMinutes(page.chars)} min di lettura</p>
    </header>
    {image && <figure className="book-frontispiece" data-book-break="page">
      <p className="book-eyebrow">Il sacro e il potere</p>
      <a href={sectionImage(image)} data-book-image="true" aria-label="Ingrandisci l’immagine di apertura">
        <img src={sectionImage(image)} alt={isSection ? meta!.heroAlt : imageMeta(image).alt || page.title} loading="eager" />
      </a>
      {caption && <figcaption>{caption}</figcaption>}
      <p className="book-frontispiece__note">Cinque lenti.<br /><em>Un solo mondo da comprendere.</em></p>
      <span className="book-frontispiece__lenses" aria-hidden="true">I <i /> II <i /> III <i /> IV <i /> V</span>
    </figure>}
    {page.path === '/atlante-visuale' && <Link to="/atlante-globo" className="book-globe-link">
      <span className="book-eyebrow">Atlante interattivo ↗</span>
      <strong>Il mondo, attraverso cinque lenti</strong>
      <span>Esplora il mappamondo: città, relazioni e percorsi tra teologia e geopolitica.</span>
    </Link>}
    {blocks.map((block, index) => {
      if (block.type === 'h') {
        const Tag = `h${Math.min(4, Math.max(2, block.level || 2))}` as 'h2' | 'h3' | 'h4';
        return <Tag key={index} data-book-anchor={`sec-${index}`} className={`blk-h blk-h${block.level || 2}`}><Runs runs={block.runs} /></Tag>;
      }
      if (block.type === 'p' && block.role === 'sub') return <h3 key={index} data-book-anchor={`sec-${index}`} className="blk-h blk-h3"><Runs runs={block.runs} /></h3>;
      if (block.type === 'tavola') return <Fragment key={index}>
        <h2 data-book-anchor={`tavola-${block.num || index}`} className="blk-h">{block.num && `${block.num}. `}{block.title}</h2>
        {block.tag && <p className="blk-label">{block.tag}</p>}
        {block.src && <figure className="fig">
          <a href={plate(block.src)} data-book-image="true" aria-label={`Ingrandisci: ${block.title || 'tavola'}`}><img src={plate(block.src)} alt={block.alt || block.title || ''} loading="eager" /></a>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>}
        {block.body?.map((runs, i) => <p key={i} className="blk-p"><Runs runs={runs} /></p>)}
      </Fragment>;
      return <ContentBlocks key={index} blocks={[block]} />;
    })}
    {!!doc.references?.length && <>
      <h2 className="blk-h" data-book-anchor="riferimenti">Riferimenti</h2>
      <ul className="blk-list book-references">{doc.references.map((reference, i) => <li key={i}>{reference}</li>)}</ul>
    </>}
    <nav className="book-colophon" aria-label="Continua la lettura" data-book-break="before" data-book-anchor="continua">
      <span className="book-colophon__mark" aria-hidden="true">✦</span>
      <p className="book-eyebrow">Continua a esplorare</p>
      <h2>Ogni lente apre<br /><em>un’altra prospettiva.</em></h2>
      {siblings[siblingIndex + 1] && <Link to={siblings[siblingIndex + 1].path}><small>Capitolo successivo →</small><strong>{siblings[siblingIndex + 1].title}</strong></Link>}
      {page.parentPath && <Link to={page.parentPath}><small>← Torna al volume</small><strong>{findPage(page.parentPath)?.title || meta?.title || 'Indice della sezione'}</strong></Link>}
      <Link to="/atlante-globo"><small>Atlante interattivo ↗</small><strong>Esplora il mappamondo</strong></Link>
      <Link to="/"><small>MetaHistoria</small><strong>Torna all’archivio</strong></Link>
    </nav>
  </>;
}
