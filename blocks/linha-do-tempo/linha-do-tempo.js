import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Linha do tempo: cada linha tem marco (data/etapa) | descrição, com imagem opcional.
 * Variante "etapas" numera os marcos automaticamente (bom para procedimentos).
 * @param {Element} block
 */
export default function decorate(block) {
  const ol = document.createElement('ol');
  ol.className = 'linha-do-tempo-lista';

  [...block.children].forEach((row) => {
    const [markCell, ...bodyCells] = [...row.children];
    if (!markCell || !row.textContent.trim()) return;

    const li = document.createElement('li');
    li.className = 'linha-do-tempo-item';
    moveInstrumentation(row, li);

    const mark = document.createElement('p');
    mark.className = 'linha-do-tempo-marco';
    mark.textContent = markCell.textContent.trim();
    moveInstrumentation(markCell, mark);

    const body = document.createElement('div');
    body.className = 'linha-do-tempo-conteudo';
    moveInstrumentation(bodyCells[0], body);
    bodyCells.forEach((cell) => body.append(...cell.childNodes));
    const heading = body.querySelector(':scope > :is(h2, h3, h4, h5, h6)');
    if (heading) heading.classList.add('linha-do-tempo-titulo');

    li.append(mark, body);
    ol.append(li);
  });

  block.replaceChildren(ol);
}
