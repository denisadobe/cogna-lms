/* eslint-disable */
/* global WebImporter */

/**
 * Sections: cada <section> de primeiro nível da fonte vira uma seção da página.
 * Insere <hr> entre seções e um bloco Section Metadata quando houver data-estilo
 * (ex.: light, dark). Blocos marcados como <section data-bloco> não são seções.
 */
export default function transform(hookName, element, { document }) {
  if (hookName !== 'afterTransform') return;
  const main = element.querySelector('main') || element;
  const sections = [...main.children].filter((el) => el.matches('section:not([data-bloco])'));

  sections.forEach((section, i) => {
    const style = section.dataset.estilo;
    if (style) {
      section.append(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      }));
    }
    if (i > 0) section.before(document.createElement('hr'));
    section.replaceWith(...section.childNodes);
  });
}
