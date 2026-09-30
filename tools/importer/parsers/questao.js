/* eslint-disable */
/* global WebImporter */
import { nodes, replaceWithBlock } from '../utils/fonte.js';

/**
 * Parser: Questao
 * Fonte: <section data-bloco="questao"> com campos <div data-campo="Tipo">...</div>
 * (Tipo, Dificuldade, Bloom, Texto-base, Referência, Enunciado, A..E, Gabarito, Resolução).
 * Saída: linhas chave | valor.
 */
// nomes dos campos no Universal Editor (bloco chave | valor)
const CAMPOS = {
  'tipo-da-questao': 'tipo',
  'taxonomia-de-bloom': 'bloom',
  'referencia-do-texto-base': 'referencia',
  'resposta-esperada': 'gabarito',
  resposta: 'gabarito',
  'resolucao-comentada': 'resolucao',
};

const toCampo = (label) => {
  const key = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return CAMPOS[key] || key;
};

export default function questaoParser(element, { document }) {
  const cells = [...element.querySelectorAll(':scope > [data-campo]')]
    .map((field) => [toCampo(field.dataset.campo), nodes(field)]);
  replaceWithBlock(element, document, 'Questao', cells);
}
