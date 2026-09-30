import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Folha de créditos: primeira linha é o título da obra/aula; as linhas seguintes
 * são rótulo | texto (ex.: "Autoria", "Revisão técnica", "Imagens").
 * Linhas de uma coluna viram parágrafos centrais (ex.: direitos autorais, endereço).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [titleRow, ...rest] = rows;

  const header = document.createElement('div');
  header.className = 'folha-de-creditos-capa';
  const title = document.createElement('h2');
  title.textContent = titleRow?.textContent.trim() || 'Créditos';
  moveInstrumentation(titleRow?.firstElementChild, title);
  header.append(title);

  const body = document.createElement('div');
  body.className = 'folha-de-creditos-corpo';

  rest.forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim());
    if (!cells.length) return;
    if (cells.length === 1) {
      const p = document.createElement('div');
      p.className = 'folha-de-creditos-nota';
      moveInstrumentation(row, p);
      const text = document.createElement('div');
      moveInstrumentation(cells[0], text);
      text.append(...cells[0].childNodes);
      p.append(text);
      body.append(p);
      return;
    }
    const [labelCell, ...valueCells] = cells;
    const item = document.createElement('div');
    item.className = 'folha-de-creditos-item';
    moveInstrumentation(row, item);
    const label = document.createElement('h3');
    label.textContent = labelCell.textContent.trim();
    moveInstrumentation(labelCell, label);
    const value = document.createElement('div');
    moveInstrumentation(valueCells[0], value);
    valueCells.forEach((cell) => value.append(...cell.childNodes));
    item.append(label, value);
    body.append(item);
  });

  block.replaceChildren(header, body);
}
