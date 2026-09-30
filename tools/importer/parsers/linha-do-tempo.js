/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Linha do tempo
 * Fonte: <div data-bloco="linha-do-tempo"> com linhas (<div>) e células (<div>).
 */
export default function linhaDoTempoParser(element, { document }) {
  replaceWithBlock(element, document, 'Linha do tempo', genericRows(element));
}
