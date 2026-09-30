import { moveInstrumentation } from '../../scripts/ue-utils.js';

let sanfonaCount = 0;

/**
 * Sanfona (acordeão): cada linha tem título | conteúdo.
 * Usa <details> nativo, então o texto oculto continua pesquisável (Ctrl+F).
 * Variante "multipla" permite abrir vários itens ao mesmo tempo.
 * @param {Element} block
 */
export default function decorate(block) {
  sanfonaCount += 1;
  const groupName = `sanfona-${sanfonaCount}`;
  const exclusive = !block.classList.contains('multipla');

  const items = [...block.children].map((row) => {
    const [titleCell, ...bodyCells] = [...row.children];
    if (!titleCell || !titleCell.textContent.trim()) return null;

    const details = document.createElement('details');
    details.className = 'sanfona-item';
    moveInstrumentation(row, details);
    if (exclusive) details.name = groupName;

    const summary = document.createElement('summary');
    summary.className = 'sanfona-titulo';
    const label = document.createElement('span');
    moveInstrumentation(titleCell, label);
    label.append(...(titleCell.querySelector('h1,h2,h3,h4,h5,h6,p')?.childNodes || titleCell.childNodes));
    summary.append(label);

    const body = document.createElement('div');
    body.className = 'sanfona-conteudo';
    moveInstrumentation(bodyCells[0], body);
    bodyCells.forEach((cell) => body.append(...cell.childNodes));

    details.append(summary, body);
    return details;
  }).filter(Boolean);

  block.replaceChildren(...items);
}
