async page => {
  const base = 'http://127.0.0.1:4180';
  const from = Number(0 || 0);
  const to = Number(131 || 45);
  if (!page.url().startsWith(base)) await page.goto(base + '/');
  await page.waitForTimeout(1200);

  const routes = await page.evaluate(async () => (await fetch('/routes.json')).json());
  const slice = routes.slice(from, to);

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  const results = [];
  for (const r of slice) {
    const before = errors.length;
    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, r.path);

    // attende il contenuto: blocchi renderizzati oppure errore dichiarato
    let state = { blocks: 0, missing: false, error: null, title: null };
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(120);
      state = await page.evaluate(() => {
        const h1 = document.querySelector('.doc__title');
        const body = document.querySelector('.doc__body');
        return {
          title: h1 ? h1.textContent.trim() : null,
          blocks: body ? body.children.length : 0,
          missing: !!document.querySelector('.doc--missing'),
          error: document.querySelector('.doc__error')?.textContent ?? null,
        };
      });
      if (state.blocks > 0 || state.missing || state.error) break;
    }

    results.push({
      path: r.path,
      ok: !state.missing && !state.error && state.blocks > 0,
      blocks: state.blocks,
      title: state.title,
      expected: r.title,
    });
  }

  const bad = results.filter((x) => !x.ok);
  return JSON.stringify({
    range: [from, to],
    tested: results.length,
    ok: results.length - bad.length,
    failed: bad.slice(0, 10),
    consoleErrors: errors.slice(0, 8),
  });
}