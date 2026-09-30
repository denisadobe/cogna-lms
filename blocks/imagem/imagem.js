import { moveInstrumentation } from '../../scripts/ue-utils.js';

const FONTE = /^fonte\s*:/i;

/**
 * Opens an image in a modal dialog for detailed viewing.
 * @param {HTMLImageElement} img source image
 * @param {string} label accessible label
 */
function openZoom(img, label) {
  const dialog = document.createElement('dialog');
  dialog.className = 'imagem-zoom';
  dialog.setAttribute('closedby', 'any');
  dialog.setAttribute('aria-label', label || 'Imagem ampliada');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'imagem-zoom-fechar';
  close.setAttribute('aria-label', 'Fechar');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());

  const big = document.createElement('img');
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  big.className = 'imagem-zoom-img';

  dialog.append(close, big);
  dialog.addEventListener('close', () => dialog.remove());
  // fallback de light-dismiss para navegadores sem suporte a closedby
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
  document.body.append(dialog);
  dialog.showModal();
}

/**
 * Imagem/Figura: legenda ("Figura 1 | ..."), imagem e fonte ("Fonte: ...").
 * As linhas podem vir em qualquer ordem; a fonte é detectada pelo prefixo "Fonte:".
 * @param {Element} block
 */
export default function decorate(block) {
  const figure = document.createElement('figure');
  let caption;
  let source;
  let picture;

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic && !picture) {
      picture = pic;
      return;
    }
    const text = cell.textContent.trim();
    if (!text) return;
    if (FONTE.test(text)) {
      source = document.createElement('p');
      source.className = 'imagem-fonte';
      moveInstrumentation(cell, source);
      source.append(...(cell.querySelector('p') ? cell.querySelector('p').childNodes : cell.childNodes));
    } else if (!caption) {
      caption = document.createElement('figcaption');
      caption.className = 'imagem-legenda';
      moveInstrumentation(cell, caption);
      caption.append(...(cell.querySelector('p') ? cell.querySelector('p').childNodes : cell.childNodes));
    }
  });

  if (!picture) return;

  const img = picture.querySelector('img');
  if (img && !img.alt && caption) img.alt = caption.textContent.replace(/^figura\s*\d+\s*[|–-]\s*/i, '').trim();

  const media = document.createElement('div');
  media.className = 'imagem-midia';
  media.append(picture);

  if (!block.classList.contains('sem-zoom') && img) {
    const zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'imagem-ampliar';
    zoom.setAttribute('aria-label', 'Ampliar imagem');
    zoom.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.42 1.4-5.39-5.38A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm1 2v3h3v2h-3v3H9v-3H6V9h3V6h2z"/></svg>';
    zoom.addEventListener('click', () => openZoom(img, caption?.textContent));
    media.append(zoom);
  }

  if (caption) figure.append(caption);
  figure.append(media);
  if (source) figure.append(source);
  block.replaceChildren(figure);
}
