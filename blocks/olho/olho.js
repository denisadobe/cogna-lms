import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Olho: destaque lateral com título curto | texto de apoio.
 * Aceita uma linha com duas colunas ou duas linhas de uma coluna.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim());
  const [titleCell, ...textCells] = cells;
  if (!titleCell) return;

  const title = document.createElement('p');
  title.className = 'olho-titulo';
  title.textContent = titleCell.textContent.trim();
  moveInstrumentation(titleCell, title);

  const text = document.createElement('div');
  text.className = 'olho-texto';
  if (textCells[0]) moveInstrumentation(textCells[0], text);
  textCells.forEach((cell) => text.append(...cell.childNodes));

  const aside = document.createElement('aside');
  aside.append(title, text);
  block.replaceChildren(aside);
}
