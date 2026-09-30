/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Botao expansivel
 * Fonte: <div data-bloco="botao-expansivel"> com linhas (<div>) e células (<div>).
 */
export default function botaoExpansivelParser(element, { document }) {
  replaceWithBlock(element, document, 'Botao expansivel', genericRows(element));
}
