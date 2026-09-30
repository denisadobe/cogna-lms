/* eslint-disable */
/* global WebImporter */
import { replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Video
 * Fonte: <div data-bloco="video"> — cada elemento filho (link, imagem, parágrafo, lista)
 * vira uma linha do bloco.
 */
export default function videoParser(element, { document }) {
  const cells = [...element.children].map((child) => [child]);
  replaceWithBlock(element, document, 'Video', cells);
}
