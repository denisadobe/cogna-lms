/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Galeria
 * Fonte: <div data-bloco="galeria"> com linhas (<div>) e células (<div>).
 */
export default function galeriaParser(element, { document }) {
  replaceWithBlock(element, document, 'Galeria', genericRows(element));
}
