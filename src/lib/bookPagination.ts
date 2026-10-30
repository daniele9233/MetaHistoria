export interface BookPosition { source: number; offset: number }
export interface BookPage { html: string; start: BookPosition; anchors: string[] }

/** Measure the actual typeset DOM. Splits retain inline markup and every character. */
export function paginateBook(source: HTMLElement, measure: HTMLElement, height: number): BookPage[] {
  const pages: BookPage[] = [];
  const queue = Array.from(source.children, (child, index) => {
    const node = child.cloneNode(true) as HTMLElement;
    node.dataset.source = String(index);
    node.dataset.offset = '0';
    node.querySelectorAll('img').forEach(image => image.loading = 'eager');
    return node;
  });
  measure.replaceChildren();
  const fits = () => measure.getBoundingClientRect().height <= height + 0.5;
  const flush = () => {
    if (!measure.children.length) return;
    const first = measure.firstElementChild as HTMLElement;
    pages.push({ html: measure.innerHTML,
      start: { source: Number(first.dataset.source), offset: Number(first.dataset.offset || 0) },
      anchors: Array.from(measure.querySelectorAll<HTMLElement>('[data-book-anchor]'), e => e.dataset.bookAnchor!),
    });
    measure.replaceChildren();
  };
  const tryPart = (part: HTMLElement) => {
    measure.append(part);
    const okay = fits();
    part.remove();
    return okay;
  };
  const shell = (node: HTMLElement) => node.cloneNode(false) as HTMLElement;
  const continuation = (node: HTMLElement, offset: number) => {
    delete node.dataset.bookAnchor;
    node.removeAttribute('id');
    node.dataset.offset = String(offset);
    node.classList.add('book-continuation');
    return node;
  };

  function splitText(node: HTMLElement): [HTMLElement, HTMLElement] | null {
    const text = node.textContent || '';
    const ends = Array.from(text.matchAll(/\S+\s*/g), match => match.index! + match[0].length);
    if (ends.length < 2) return null;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const texts: { node: Text; start: number; end: number }[] = [];
    let current: Node | null;
    let length = 0;
    while ((current = walker.nextNode())) {
      const size = current.textContent?.length || 0;
      texts.push({ node: current as Text, start: length, end: length + size });
      length += size;
    }
    const pairAt = (cut: number): [HTMLElement, HTMLElement] => {
      const point = texts.find(entry => entry.end >= cut)!;
      const prefix = document.createRange();
      prefix.selectNodeContents(node);
      prefix.setEnd(point.node, cut - point.start);
      const suffix = document.createRange();
      suffix.selectNodeContents(node);
      suffix.setStart(point.node, cut - point.start);
      const left = shell(node), right = shell(node);
      left.append(prefix.cloneContents());
      right.append(suffix.cloneContents());
      continuation(right, Number(node.dataset.offset || 0) + cut);
      return [left, right];
    };
    let low = 0, high = ends.length - 2, best = -1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (tryPart(pairAt(ends[middle])[0])) { best = middle; low = middle + 1; }
      else high = middle - 1;
    }
    // Avoid a one-line fragment at the foot of a page.
    if (best < 0 || (measure.children.length > 0 && best < 9)) return null;
    return pairAt(ends[best]);
  }

  function splitCollection(node: HTMLElement): [HTMLElement, HTMLElement] | null {
    const table = node.querySelector('table');
    const items = table ? Array.from(table.tBodies[0]?.rows || []) : Array.from(node.children);
    if (!items.length) return null;
    const build = (children: Element[], rest: boolean) => {
      const wrapper = shell(node);
      if (!table) {
        children.forEach(child => wrapper.append(child.cloneNode(true)));
        if (node.tagName === 'OL') wrapper.setAttribute('start', String(Number(node.getAttribute('start') || 1) + (rest ? items.length - children.length : 0)));
      } else {
        const copy = table!.cloneNode(false) as HTMLTableElement;
        if (table!.tHead) copy.append(table!.tHead.cloneNode(true));
        const body = document.createElement('tbody');
        children.forEach(child => body.append(child.cloneNode(true)));
        copy.append(body); wrapper.append(copy);
      }
      return wrapper;
    };
    let low = 1, high = items.length - 1, best = 0;
    while (low <= high) {
      const count = (low + high) >> 1;
      if (tryPart(build(items.slice(0, count), false))) { best = count; low = count + 1; }
      else high = count - 1;
    }
    if (!best) return null;
    const left = build(items.slice(0, best), false), right = build(items.slice(best), true);
    const consumed = items.slice(0, best).reduce((total, item) => total + (item.textContent?.length || 0), 0);
    continuation(right, Number(node.dataset.offset || 0) + consumed);
    return [left, right];
  }

  while (queue.length) {
    const node = queue.shift()!;
    if (node.dataset.bookBreak === 'before') flush();
    measure.append(node);
    if (fits()) {
      if (node.dataset.bookBreak === 'after' || node.dataset.bookBreak === 'page') flush();
      continue;
    }
    node.remove();
    const isText = node.matches('p,blockquote,.card') && !node.querySelector('img');
    const pair = isText ? splitText(node) : node.matches('ul,ol,.blk-tablewrap,.book-cover,.book-colophon,.book-frontispiece') ? splitCollection(node) : null;
    if (pair) {
      measure.append(pair[0]); flush(); queue.unshift(pair[1]); continue;
    }
    if (measure.children.length) {
      // Keep headings with the block that follows, even at a page boundary.
      const last = measure.lastElementChild as HTMLElement;
      if (last.matches('h2,h3,h4,.blk-label') && measure.children.length > 1) {
        last.remove(); flush(); queue.unshift(last, node);
      } else { flush(); queue.unshift(node); }
      continue;
    }
    // Rare oversized tables/cards remain entirely available in a keyboard-scrollable panel.
    // Continuous reading and printing also expose their complete natural layout.
    const panel = document.createElement('div');
    panel.className = 'book-overflow';
    panel.dataset.source = node.dataset.source;
    panel.dataset.offset = node.dataset.offset;
    panel.tabIndex = 0;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Contenuto esteso: scorri per leggerlo interamente');
    panel.style.maxHeight = `${height - 2}px`;
    panel.append(node); measure.append(panel); flush();
  }
  flush();
  return pages;
}

export function pageAtPosition(pages: BookPage[], position: BookPosition): number {
  let index = 0;
  pages.forEach((page, i) => {
    if (page.start.source < position.source || (page.start.source === position.source && page.start.offset <= position.offset)) index = i;
  });
  return index;
}
