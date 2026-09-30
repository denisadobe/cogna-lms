import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Citação: primeira linha é o texto citado; linha seguinte (opcional) é o autor/fonte.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim() || c.querySelector('picture'));
  const [quoteCell, ...rest] = cells;
  if (!quoteCell) return;

  const figure = document.createElement('figure');
  const blockquote = document.createElement('blockquote');
  moveInstrumentation(quoteCell, blockquote);
  blockquote.append(...quoteCell.childNodes);
  figure.append(blockquote);

  const authorCell = rest.find((c) => c.textContent.trim());
  if (authorCell) {
    const caption = document.createElement('figcaption');
    moveInstrumentation(authorCell, caption);
    caption.textContent = authorCell.textContent.trim().replace(/^[—–-]\s*/, '');
    figure.append(caption);
  }

  block.replaceChildren(figure);
}
