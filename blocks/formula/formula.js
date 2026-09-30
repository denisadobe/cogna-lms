import { moveInstrumentation } from '../../scripts/ue-utils.js';

import { renderTex } from '../../scripts/formula.js';

/**
 * Fórmula: cada linha contém uma expressão LaTeX e, opcionalmente, um rótulo
 * (ex.: "(1)") na segunda célula. Variante "destaque" envolve as equações num quadro.
 * @param {Element} block
 */
export default async function decorate(block) {
  const rendering = [];
  const lines = [...block.children].map((row) => {
    const [texCell, labelCell] = [...row.children];
    const tex = texCell?.textContent.trim();
    if (!tex) return null;

    const line = document.createElement('div');
    line.className = 'formula-linha';
    // a expressão é editada pelo painel de propriedades; a linha é o item selecionável
    moveInstrumentation(row, line);

    const math = document.createElement('div');
    math.className = 'formula-expressao';
    math.dataset.tex = tex;
    math.textContent = tex;
    line.append(math);

    const label = labelCell?.textContent.trim();
    if (label) {
      const span = document.createElement('span');
      span.className = 'formula-rotulo';
      span.textContent = label;
      line.append(span);
    }
    rendering.push(renderTex(math, tex, true));
    return line;
  }).filter(Boolean);

  block.replaceChildren(...lines);
  await Promise.all(rendering);
}
