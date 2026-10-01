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

// ordem fixa das linhas: é a ordem dos campos no modelo do Universal Editor
const ORDEM = ['tipo', 'dificuldade', 'bloom', 'texto-base', 'referencia', 'enunciado',
  'a', 'b', 'c', 'd', 'e', 'gabarito', 'resolucao'];

export default function questaoParser(element, { document }) {
  const campos = {};
  [...element.querySelectorAll(':scope > [data-campo]')].forEach((field) => {
    campos[toCampo(field.dataset.campo)] = nodes(field);
  });
  // todas as linhas, mesmo vazias, para os seletores do editor apontarem sempre para o campo certo
  const cells = ORDEM.map((campo) => [campo, campos[campo] || '']);
  replaceWithBlock(element, document, 'Questao', cells);
}
