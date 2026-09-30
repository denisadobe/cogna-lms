/* eslint-disable */
/* global WebImporter */
import { replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Embed
 * Fonte: <div data-bloco="embed"> — cada elemento filho (link, imagem, parágrafo, lista)
 * vira uma linha do bloco.
 */
export default function embedParser(element, { document }) {
  const cells = [...element.children].map((child) => [child]);
  replaceWithBlock(element, document, 'Embed', cells);
}
