/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Quadro box
 * Fonte: <div data-bloco="quadro-box"> com linhas (<div>) e células (<div>).
 */
export default function quadroBoxParser(element, { document }) {
  replaceWithBlock(element, document, 'Quadro box', genericRows(element));
}
