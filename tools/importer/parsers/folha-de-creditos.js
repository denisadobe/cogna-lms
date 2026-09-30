/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Folha de creditos
 * Fonte: <div data-bloco="folha-de-creditos"> com linhas (<div>) e células (<div>).
 */
export default function folhaDeCreditosParser(element, { document }) {
  replaceWithBlock(element, document, 'Folha de creditos', genericRows(element));
}
