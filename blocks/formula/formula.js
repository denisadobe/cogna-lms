import { moveInstrumentation } from '../../scripts/ue-utils.js';
import { renderTexInHost } from '../../scripts/formula.js';

/**
 * Fórmula: cada linha contém uma expressão LaTeX e, opcionalmente, um rótulo
 * (ex.: "(1)") na segunda célula. Variante "destaque" envolve as equações num quadro.
 * A expressão fica como texto no elemento e o desenho fica num shadow root, para que
 * edições (Universal Editor) gravem sempre o LaTeX, nunca a fórmula renderizada.
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
    moveInstrumentation(row, line);

    const math = document.createElement('div');
    math.className = 'formula-expressao';
    moveInstrumentation(texCell, math);
    math.textContent = tex;
    line.append(math);

    const label = labelCell?.textContent.trim();
    if (label || labelCell?.hasAttribute('data-aue-prop')) {
      const span = document.createElement('span');
      span.className = 'formula-rotulo';
      moveInstrumentation(labelCell, span);
      span.textContent = label || '';
      line.append(span);
    }
    rendering.push(renderTexInHost(math, tex, true));
    return line;
  }).filter(Boolean);

  block.replaceChildren(...lines);
  await Promise.all(rendering);
}
