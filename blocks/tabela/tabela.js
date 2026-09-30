import { moveInstrumentation } from '../../scripts/ue-utils.js';

const FONTE = /^fonte\s*:/i;

/**
 * Moves the content of a cell (unwrapping a single paragraph) into an element.
 * @param {Element} cell source cell
 * @param {Element} target target element
 */
function fill(cell, target) {
  const only = cell.children.length === 1 && cell.firstElementChild.matches('p') ? cell.firstElementChild : null;
  target.append(...(only ? only.childNodes : cell.childNodes));
}

const isEmpty = (cell) => !cell.textContent.trim() && !cell.querySelector('picture, img');

/**
 * Builds table rows from block rows ("linhas" format). Trailing empty cells are ignored
 * and shorter rows expand their last cell (colspan).
 * @param {Element[][]} dataRows block rows
 * @param {Element} block
 * @returns {HTMLTableSectionElement[]} thead and tbody
 */
function rowsToTable(dataRows, block) {
  const trimmed = dataRows.map((cells) => {
    const copy = [...cells];
    while (copy.length > 1 && isEmpty(copy[copy.length - 1])) copy.pop();
    return copy;
  });
  const columns = Math.max(...trimmed.map((cells) => cells.length), 1);
  const hasHeader = !block.classList.contains('sem-cabecalho');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  trimmed.forEach((cells, rowIndex) => {
    const isHeader = hasHeader && rowIndex === 0;
    const tr = document.createElement('tr');
    cells.forEach((cell, i) => {
      const tag = isHeader || (block.classList.contains('primeira-coluna') && i === 0) ? 'th' : 'td';
      const el = document.createElement(tag);
      if (tag === 'th') el.scope = isHeader ? 'col' : 'row';
      if (i === cells.length - 1 && cells.length < columns) el.colSpan = columns - cells.length + 1;
      moveInstrumentation(cell, el);
      fill(cell, el);
      tr.append(el);
    });
    (isHeader ? thead : tbody).append(tr);
  });
  return [thead, tbody];
}

/**
 * Normalizes a table authored as rich text (Universal Editor / document table):
 * the first row becomes the header unless the variant "sem-cabecalho" is used, and
 * trailing empty cells are merged into the previous cell (colspan).
 * @param {HTMLTableElement} source authored table
 * @param {Element} block
 * @returns {HTMLTableSectionElement[]} thead and tbody
 */
function richTableToTable(source, block) {
  const rows = [...source.querySelectorAll('tr')].map((tr) => {
    const cells = [...tr.children];
    while (cells.length > 1 && isEmpty(cells[cells.length - 1])) cells.pop();
    return cells;
  });
  const width = (cells) => cells.reduce((sum, cell) => sum + (cell.colSpan || 1), 0);
  const columns = Math.max(...rows.map(width), 1);
  const hasHeader = !block.classList.contains('sem-cabecalho');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  rows.forEach((cells, rowIndex) => {
    const isHeader = hasHeader && rowIndex === 0;
    const row = document.createElement('tr');
    const missing = columns - width(cells);
    cells.forEach((cell, i) => {
      const tag = isHeader || (block.classList.contains('primeira-coluna') && i === 0) ? 'th' : 'td';
      const el = document.createElement(tag);
      if (tag === 'th') el.scope = isHeader ? 'col' : 'row';
      const span = (cell.colSpan || 1) + (i === cells.length - 1 ? missing : 0);
      if (span > 1) el.colSpan = span;
      if (cell.rowSpan > 1) el.rowSpan = cell.rowSpan;
      fill(cell, el);
      row.append(el);
    });
    (isHeader ? thead : tbody).append(row);
  });
  return [thead, tbody];
}

/**
 * Tabela com legenda e fonte.
 * - Linhas de uma célula antes dos dados: legenda ("Tabela 1 | ...").
 * - Linha de uma célula iniciando com "Fonte:": fonte.
 * - Dados: linhas do bloco (a primeira é o cabeçalho) ou uma tabela dentro de uma
 *   célula, como a criada pelo editor de texto rico do Universal Editor.
 * Variantes: centralizada, primeira-coluna, sem-cabecalho.
 * @param {Element} block
 */
export default function decorate(block) {
  let caption;
  let source;
  let richCell;
  const dataRows = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const text = row.textContent.trim();
    const nested = row.querySelector('table');
    if (nested && !richCell) {
      richCell = cells.find((cell) => cell.contains(nested));
    } else if (cells.length === 1 && FONTE.test(text)) {
      [source] = cells;
    } else if (cells.length === 1 && !dataRows.length && !caption && !richCell) {
      [caption] = cells;
    } else if (text || row.querySelector('picture')) {
      dataRows.push(cells);
    }
  });

  const table = document.createElement('table');
  const scroller = document.createElement('div');
  scroller.className = 'tabela-rolagem';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');

  if (caption) {
    const cap = document.createElement('caption');
    moveInstrumentation(caption, cap);
    fill(caption, cap);
    table.append(cap);
  }

  const [thead, tbody] = richCell
    ? richTableToTable(richCell.querySelector('table'), block)
    : rowsToTable(dataRows, block);
  if (richCell) moveInstrumentation(richCell, scroller);
  if (thead.children.length) table.append(thead);
  table.append(tbody);

  scroller.setAttribute('aria-label', caption ? table.caption.textContent.trim() : 'Tabela');
  scroller.append(table);

  const figure = document.createElement('figure');
  figure.append(scroller);
  if (source) {
    const p = document.createElement('p');
    p.className = 'tabela-fonte';
    moveInstrumentation(source, p);
    fill(source, p);
    figure.append(p);
  }
  block.replaceChildren(figure);
}
