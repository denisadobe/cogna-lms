import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Comparador de imagens: duas imagens (antes | depois) sobrepostas com um controle
 * deslizante. Rótulos opcionais numa segunda linha.
 * @param {Element} block
 */
export default function decorate(block) {
  const pictures = [...block.querySelectorAll('picture')].slice(0, 2);
  if (pictures.length < 2) return;
  const labelCells = [...block.querySelectorAll(':scope > div > div')]
    .filter((cell) => !cell.querySelector('picture') && cell.textContent.trim());
  const labels = labelCells.map((cell) => cell.textContent.trim());

  const stage = document.createElement('div');
  stage.className = 'comparador-imagens-palco';
  stage.style.setProperty('--posicao', '50%');

  const before = document.createElement('div');
  before.className = 'comparador-imagens-antes';
  before.append(pictures[0]);
  const after = document.createElement('div');
  after.className = 'comparador-imagens-depois';
  after.append(pictures[1]);

  [[before, labels[0] || 'Antes'], [after, labels[1] || 'Depois']].forEach(([el, text], i) => {
    const tag = document.createElement('span');
    tag.className = 'comparador-imagens-rotulo';
    tag.textContent = text;
    moveInstrumentation(labelCells[i], tag);
    el.append(tag);
  });

  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = '100';
  range.value = '50';
  range.className = 'comparador-imagens-controle';
  range.setAttribute('aria-label', `Comparar ${labels[0] || 'antes'} e ${labels[1] || 'depois'}`);
  range.addEventListener('input', () => stage.style.setProperty('--posicao', `${range.value}%`));

  const handle = document.createElement('span');
  handle.className = 'comparador-imagens-alca';
  handle.setAttribute('aria-hidden', 'true');

  stage.append(after, before, handle, range);
  block.replaceChildren(stage);
}
