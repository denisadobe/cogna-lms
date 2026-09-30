/* eslint-disable */
/* global WebImporter */
import { nodes, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Banner
 * Fonte: <header data-bloco="banner"> com rótulo (p), título (h1) e chamada (p).
 * Uma <img> opcional vira imagem de fundo (linha própria).
 */
export default function bannerParser(element, { document }) {
  const img = element.querySelector('img');
  if (img) img.remove();
  const cells = [[nodes(element)]];
  if (img) cells.push([img]);
  replaceWithBlock(element, document, 'Banner', cells);
}
