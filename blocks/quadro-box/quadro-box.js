import { moveInstrumentation } from '../../scripts/ue-utils.js';

const ROTULOS = {
  atencao: 'Atenção',
  dica: 'Dica',
  exemplo: 'Exemplo',
  reflita: 'Reflita',
  importante: 'Importante',
  'saiba-mais': 'Saiba mais',
};

/**
 * Quadro box: cada célula vira um quadro. Várias células/linhas formam uma grade.
 * Variantes (atencao, dica, exemplo, reflita, importante, saiba-mais) viram
 * quadros de destaque com rótulo e ícone.
 * @param {Element} block
 */
export default function decorate(block) {
  const variant = Object.keys(ROTULOS).find((v) => block.classList.contains(v));
  const boxes = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture'));
    cells.forEach((cell) => {
      const box = document.createElement('div');
      box.className = 'quadro-box-item';
      // cada linha é um item no Universal Editor; a célula é o campo de texto
      if (cells.length === 1) moveInstrumentation(row, box);
      const content = document.createElement('div');
      content.className = 'quadro-box-conteudo';
      moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
      box.append(content);

      const first = content.firstElementChild;
      const heading = content.querySelector(':scope > :is(h2, h3, h4, h5, h6)');
      if (heading) {
        heading.classList.add('quadro-box-titulo');
      } else if (variant && first?.matches('p') && first.children.length === 1
        && first.firstElementChild.matches('strong') && first.textContent.trim() === first.firstElementChild.textContent.trim()) {
        first.classList.add('quadro-box-titulo');
      }

      if (variant && !content.querySelector('.quadro-box-titulo')) {
        const label = document.createElement('p');
        label.className = 'quadro-box-titulo';
        label.textContent = ROTULOS[variant];
        box.prepend(label);
      }
      boxes.push(box);
    });
  });

  block.replaceChildren(...boxes);
  block.classList.toggle('grade', boxes.length > 1);
}
