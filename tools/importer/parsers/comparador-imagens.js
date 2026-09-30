/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Comparador imagens
 * Fonte: <div data-bloco="comparador-imagens"> com linhas (<div>) e células (<div>).
 */
export default function comparadorImagensParser(element, { document }) {
  replaceWithBlock(element, document, 'Comparador imagens', genericRows(element));
}
