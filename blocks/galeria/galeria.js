import { moveInstrumentation } from '../../scripts/ue-utils.js';

let galeriaCount = 0;

/**
 * Galeria: cada linha tem imagem | legenda (opcional). Exibe um carrossel com
 * rolagem por arraste/scroll-snap, botões anterior/próximo e indicadores.
 * @param {Element} block
 */
export default function decorate(block) {
  galeriaCount += 1;
  const id = `galeria-${galeriaCount}`;

  const track = document.createElement('ul');
  track.className = 'galeria-trilha';
  track.id = `${id}-trilha`;
  track.tabIndex = 0;
  track.setAttribute('aria-label', 'Imagens da galeria');

  const slides = [...block.children].map((row, i, rows) => {
    const picture = row.querySelector('picture');
    const textCells = [...row.children].filter((c) => !c.querySelector('picture') && c.textContent.trim());
    if (!picture && !textCells.length) return null;

    const li = document.createElement('li');
    li.className = 'galeria-slide';
    moveInstrumentation(row, li);
    li.dataset.indice = i;
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} de ${rows.length}`);
    const figure = document.createElement('figure');
    if (picture) figure.append(picture);
    if (textCells.length) {
      const caption = document.createElement('figcaption');
      moveInstrumentation(textCells[0], caption);
      textCells.forEach((cell) => caption.append(...cell.childNodes));
      figure.append(caption);
    }
    li.append(figure);
    return li;
  }).filter(Boolean);
  track.append(...slides);

  const controls = document.createElement('div');
  controls.className = 'galeria-controles';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'galeria-anterior';
  prev.setAttribute('aria-label', 'Imagem anterior');
  prev.setAttribute('aria-controls', track.id);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'galeria-proxima';
  next.setAttribute('aria-label', 'Próxima imagem');
  next.setAttribute('aria-controls', track.id);

  const dots = document.createElement('div');
  dots.className = 'galeria-indicadores';
  const dotButtons = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir para a imagem ${i + 1}`);
    dot.addEventListener('click', () => track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' }));
    dots.append(dot);
    return dot;
  });
  controls.append(prev, dots, next);

  const current = () => Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
  const go = (index) => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, index))];
    if (target) track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));

  const sync = () => {
    const index = current();
    dotButtons.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    prev.disabled = index <= 0;
    next.disabled = index >= slides.length - 1;
  };
  track.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });

  // usado pelo Universal Editor para mostrar o slide selecionado
  block.galeriaIr = go;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carrossel');
  block.setAttribute('aria-label', 'Galeria de imagens');
  block.replaceChildren(track);
  if (slides.length > 1) block.append(controls);
  sync();
}
