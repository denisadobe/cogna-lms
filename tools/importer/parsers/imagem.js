/* eslint-disable */
/* global WebImporter */
import { nodes, replaceWithBlock } from '../utils/fonte.js';

const FONTE = /^\s*fonte\s*:/i;

/**
 * Parser: Imagem (figura)
 * Fonte: <figure data-bloco="imagem"><figcaption>Figura 1 | ...</figcaption>
 *        <img alt="..."><p>Fonte: ...</p></figure>
 * Saída: linhas legenda | imagem | fonte.
 */
export default function imagemParser(element, { document }) {
  const caption = element.querySelector('figcaption');
  const img = element.querySelector('img');
  const source = [...element.querySelectorAll('p')].find((p) => FONTE.test(p.textContent));
  const cells = [];
  if (caption) cells.push([nodes(caption)]);
  if (img) cells.push([img]);
  if (source) cells.push([nodes(source)]);
  replaceWithBlock(element, document, 'Imagem', cells);
}
