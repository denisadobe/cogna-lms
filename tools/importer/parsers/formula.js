/* eslint-disable */
/* global WebImporter */
import { replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Formula
 * Fonte: <div data-bloco="formula"><p data-rotulo="(1)">LaTeX</p>...</div>
 * Cada parágrafo vira uma linha: expressão LaTeX | rótulo opcional.
 */
export default function formulaParser(element, { document }) {
  const cells = [...element.querySelectorAll('p')].map((p) => {
    const row = [p.textContent.trim()];
    if (p.dataset.rotulo) row.push(p.dataset.rotulo);
    return row;
  });
  replaceWithBlock(element, document, 'Formula', cells);
}
