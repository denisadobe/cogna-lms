/* eslint-disable */
/* global WebImporter */
import { genericRows, nodes, replaceWithBlock } from '../utils/fonte.js';

const FONTE = /^\s*fonte\s*:/i;

/**
 * Parser: Tabela
 * Fonte: <figure data-bloco="tabela"><figcaption>Tabela 1 | ...</figcaption>
 *        <table>...</table><p>Fonte: ...</p></figure>
 * Saída: legenda | tabela (numa única célula, editável como texto rico) | fonte.
 */
export default function tabelaParser(element, { document }) {
  const caption = element.querySelector('figcaption, caption');
  const source = [...element.querySelectorAll(':scope > p')].find((p) => FONTE.test(p.textContent));
  const table = element.querySelector('table');
  const cells = [];
  if (caption) cells.push([nodes(caption)]);
  if (table) {
    // formato editável no Universal Editor: a tabela inteira numa célula (texto rico)
    table.querySelectorAll('caption').forEach((c) => c.remove());
    cells.push([table]);
  } else {
    // alternativa: linhas/células em <div>, como nos demais blocos
    genericRows(element).forEach((row) => cells.push(row));
  }
  if (source) cells.push([nodes(source)]);
  replaceWithBlock(element, document, 'Tabela', cells);
}
