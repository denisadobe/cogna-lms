/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup: remove elementos que não são conteúdo da aula (scripts, estilos, notas
 * editoriais) antes do parsing e limpa atributos auxiliares depois.
 */
export default function transform(hookName, element) {
  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      '[data-nota-editorial]',
    ]);
  }
  if (hookName === 'afterTransform') {
    element.querySelectorAll('[data-rotulo], [data-campo], [data-celula], [data-linha]').forEach((el) => {
      ['data-rotulo', 'data-campo', 'data-celula', 'data-linha'].forEach((attr) => el.removeAttribute(attr));
    });
  }
}
