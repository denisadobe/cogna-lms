/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Olho
 * Fonte: <div data-bloco="olho"> com linhas (<div>) e células (<div>).
 */
export default function olhoParser(element, { document }) {
  replaceWithBlock(element, document, 'Olho', genericRows(element));
}
