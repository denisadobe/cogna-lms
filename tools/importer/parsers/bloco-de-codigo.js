/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Bloco de codigo
 * Fonte: <div data-bloco="bloco-de-codigo"> com linhas (<div>) e células (<div>).
 */
export default function blocoDeCodigoParser(element, { document }) {
  replaceWithBlock(element, document, 'Bloco de codigo', genericRows(element));
}
