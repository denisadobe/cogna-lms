/* eslint-disable */
/* global WebImporter */
import { replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Indice
 * Fonte: <div data-bloco="indice"> — cada elemento filho (link, imagem, parágrafo, lista)
 * vira uma linha do bloco.
 */
export default function indiceParser(element, { document }) {
  const cells = [...element.children].map((child) => [child]);
  replaceWithBlock(element, document, 'Indice', cells);
}
