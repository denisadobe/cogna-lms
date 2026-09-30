import { resolveContentPath } from '../../scripts/aula.js';
import { moveInstrumentation } from '../../scripts/ue-utils.js';

let indiceCount = 0;

/**
 * Índice: lista navegável de tópicos.
 * - Com links (lista ou parágrafos): usa os links informados (ex.: seções da aula).
 * - Sem links: gera automaticamente a partir dos títulos (h2) da página.
 * A primeira célula de texto sem link vira o título do índice (padrão: "Nesta página").
 * @param {Element} block
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const titleCell = [...block.querySelectorAll(':scope > div > div')]
    .find((cell) => !cell.querySelector('a[href]') && cell.textContent.trim());
  const picture = block.querySelector('picture');

  indiceCount += 1;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-labelledby', `indice-titulo-${indiceCount}`);
  const title = document.createElement('h2');
  title.id = `indice-titulo-${indiceCount}`;
  title.className = 'indice-titulo';
  title.textContent = titleCell?.textContent.trim() || 'Nesta página';
  moveInstrumentation(titleCell, title);
  nav.append(title);

  const ol = document.createElement('ol');
  const linksCell = [...block.querySelectorAll(':scope > div > div')].find((cell) => cell.querySelector('a[href]'));
  moveInstrumentation(linksCell, ol);
  if (links.length) {
    links.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      const href = a.getAttribute('href');
      link.href = href.startsWith('/') ? resolveContentPath(href) : href;
      link.textContent = a.textContent.trim();
      li.append(link);
      ol.append(li);
    });
  } else {
    const headings = [...document.querySelectorAll('main h2')]
      .filter((h) => !h.closest('.indice, .questao, .botao-expansivel, .folha-de-creditos'));
    headings.forEach((h) => {
      if (!h.id) return;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${h.id}`;
      link.textContent = h.textContent.trim();
      li.append(link);
      ol.append(li);
    });
  }
  nav.append(ol);

  block.replaceChildren();
  if (picture) {
    const media = document.createElement('div');
    media.className = 'indice-imagem';
    media.append(picture);
    block.append(media);
    block.classList.add('com-imagem');
  }
  block.append(nav);
}
