/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Sanfona
 * Fonte: <div data-bloco="sanfona"> com linhas (<div>) e células (<div>).
 */
export default function sanfonaParser(element, { document }) {
  replaceWithBlock(element, document, 'Sanfona', genericRows(element));
}
