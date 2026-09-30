/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Citacao
 * Fonte: <div data-bloco="citacao"> com linhas (<div>) e células (<div>).
 */
export default function citacaoParser(element, { document }) {
  replaceWithBlock(element, document, 'Citacao', genericRows(element));
}
