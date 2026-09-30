import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Embed: incorpora um conteúdo externo (simulador, H5P, formulário, apresentação...)
 * a partir de um link. Título opcional na segunda linha; a variante "alto" usa
 * proporção 4:3 e a "quadrado", 1:1. Carrega somente quando fica visível.
 * @param {Element} block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const href = link?.href || block.textContent.match(/https?:\/\/\S+/)?.[0];
  if (!href) return;
  const titleCell = [...block.querySelectorAll(':scope > div > div')]
    .find((cell) => !cell.querySelector('a[href]') && cell.textContent.trim());
  const title = titleCell?.textContent.trim() || 'Conteúdo incorporado';

  const frame = document.createElement('div');
  frame.className = 'embed-moldura';
  const iframe = document.createElement('iframe');
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'fullscreen; clipboard-write; encrypted-media; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = href;
  frame.append(iframe);

  block.replaceChildren(frame);
  if (titleCell) {
    const caption = document.createElement('p');
    caption.className = 'embed-titulo';
    caption.textContent = title;
    moveInstrumentation(titleCell, caption);
    block.append(caption);
  }
}
