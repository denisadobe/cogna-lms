import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Banner da aula: rótulo (ex.: "Unidade 1 · Aula 1"), título, frase de chamada e
 * imagem opcional. Linhas podem vir em qualquer ordem; imagens viram fundo.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'banner-conteudo';
  const media = document.createElement('div');
  media.className = 'banner-imagem';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (!content.hasAttribute('data-aue-prop') && !cell.querySelector(':scope > picture:only-child')) {
      moveInstrumentation(cell, content);
    }
    [...cell.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      const picture = node.nodeType === Node.ELEMENT_NODE
        && (node.matches('picture') ? node : node.querySelector('picture'));
      if (picture && !node.textContent.trim()) {
        media.append(picture);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const p = document.createElement('p');
        p.textContent = node.textContent.trim();
        content.append(p);
      } else {
        content.append(node);
      }
    });
  });

  const heading = content.querySelector('h1, h2, h3');
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      prev.classList.add('banner-rotulo');
      prev = prev.previousElementSibling;
    }
    let next = heading.nextElementSibling;
    while (next) {
      next.classList.add('banner-chamada');
      next = next.nextElementSibling;
    }
  }

  block.replaceChildren(content);
  if (media.children.length) {
    block.classList.add('com-imagem');
    const img = media.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    block.prepend(media);
  }
}
