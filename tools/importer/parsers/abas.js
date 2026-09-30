/* eslint-disable */
/* global WebImporter */
import { genericRows, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Abas
 * Fonte: <div data-bloco="abas"> com linhas (<div>) e células (<div>).
 */
export default function abasParser(element, { document }) {
  replaceWithBlock(element, document, 'Abas', genericRows(element));
}
