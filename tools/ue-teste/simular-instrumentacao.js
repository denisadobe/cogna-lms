/* eslint-disable */
/**
 * Simulação local da instrumentação do Universal Editor.
 *
 * Aplica atributos data-aue-* no HTML das páginas usando os seletores de
 * component-definition.json (como o editor faz), decora as páginas com os blocos do
 * projeto e informa quais marcações não sobreviveram à decoração.
 *
 * Uso (no console de qualquer página da pré-visualização local):
 *   const { default: simular } = await import('/tools/ue-teste/simular-instrumentacao.js');
 *   await simular(['/content/biblioteca-de-componentes']);
 */
export default async function simular(pages) {
  const defs = await (await fetch('/component-definition.json')).json();
  const byId = Object.fromEntries(defs.groups.flatMap((g) => g.components).map((c) => [c.id, c]));
  const filters = await (await fetch('/component-filters.json')).json();
  const fmap = Object.fromEntries(filters.map((f) => [f.id, f.components || []]));
  const { decorateMain } = await import('/scripts/scripts.js');
  const { loadSections } = await import('/scripts/aem.js');
  const results = {};
  let n = 0;

  for (const path of pages) {
    const html = await (await fetch(`${path}.plain.html`)).text();
    const host = document.createElement('div');
    host.hidden = true;
    document.body.append(host);
    const main = document.createElement('main');
    main.innerHTML = html;
    main.querySelectorAll('.metadata').forEach((m) => m.parentElement.remove());
    host.append(main);
    const expected = [];
    const semMatch = [];

    main.querySelectorAll(':scope > div > div[class]').forEach((block) => {
      const name = block.classList[0];
      const def = byId[name];
      if (!def) return;
      n += 1;
      const res = `urn:teste:${n}`;
      Object.assign(block.dataset, { aueResource: res, aueType: 'component', aueModel: def.model });
      expected.push(res);
      const apply = (root, fields, pfx) => (fields || []).forEach(({ name: fn, selector }) => {
        if (selector.endsWith('[alt]')) return;
        const el = root.querySelector(`:scope > ${selector}`);
        if (!el) { semMatch.push(`${name}:${pfx}${fn}`); return; }
        el.dataset.aueProp = fn;
        el.dataset.aueType = selector.includes('img') ? 'media' : 'richtext';
        expected.push(`${res}|${pfx}${fn}`);
      });
      const { da } = def.plugins;
      if (def.filter && fmap[def.filter]?.length) {
        const item = byId[fmap[def.filter][0]];
        [...block.children].forEach((row, i) => {
          if (i === 0 && da.fields) { apply(block, da.fields, ''); return; }
          Object.assign(row.dataset, { aueResource: `${res}/item-${i}`, aueType: 'component', aueModel: item.model });
          expected.push(`${res}/item-${i}`);
          apply(row, item.plugins.da.fields, `item${i}:`);
        });
      } else if (da.type === 'key-value-block') {
        [...block.children].forEach((row) => {
          const v = row.children[1];
          if (!v) return;
          const k = row.children[0].textContent.trim();
          v.dataset.aueProp = k;
          v.dataset.aueType = 'richtext';
          expected.push(`${res}|${k}`);
        });
      } else {
        apply(block, da.fields, '');
      }
    });

    decorateMain(main);
    await loadSections(main);
    await new Promise((r) => { setTimeout(r, 300); });

    const found = new Set();
    main.querySelectorAll('[data-aue-resource]').forEach((el) => found.add(el.dataset.aueResource));
    main.querySelectorAll('[data-aue-prop]').forEach((el) => {
      const owner = el.closest('[data-aue-resource]:not([data-aue-prop])')
        || el.parentElement.closest('[data-aue-resource]');
      const r = owner?.dataset.aueResource || '?';
      const [base, item] = r.split('/item-');
      found.add(`${base}|${item ? `item${item}:` : ''}${el.dataset.aueProp}`);
    });
    const perdidos = expected.filter((e) => !found.has(e)).map((l) => {
      const b = main.querySelector(`[data-aue-resource="${l.split('|')[0].split('/item-')[0]}"]`);
      return `${b?.classList[0] || '?'} ${l.split('|')[1] || l}`;
    });
    results[path] = { marcacoes: expected.length, perdidos, seletoresSemMatch: semMatch };
    host.remove();
  }
  return results;
}
