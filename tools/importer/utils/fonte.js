/* global WebImporter */

/**
 * Helpers shared by the lesson parsers.
 *
 * Source documents ("fontes") are the structured HTML produced from the lesson Word
 * file. Components are marked with data-bloco="<nome>" and optional
 * data-variante="a, b". Unless a parser says otherwise, the direct children of the
 * component are rows and the direct children of each row are cells.
 */

/**
 * Returns the child nodes of an element as an array (so they can be moved).
 * @param {Element} el
 * @returns {Node[]}
 */
export function nodes(el) {
  return el ? [...el.childNodes] : [];
}

/**
 * Reads variants declared on the source element.
 * @param {Element} element
 * @returns {string[]}
 */
export function variants(element) {
  return (element.dataset.variante || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Generic rows/cells reader: rows are child elements, cells are their child elements.
 * A row without child elements becomes a single cell with its own content.
 * @param {Element} element
 * @returns {Array<Array<Node[]>>}
 */
export function genericRows(element) {
  return [...element.children].map((row) => {
    const cells = [...row.children].filter((c) => c.matches('div, [data-celula]'));
    if (!cells.length) return [[row]];
    return cells.map((cell) => nodes(cell));
  });
}

/**
 * Creates the block table and replaces the source element with it.
 * @param {Element} element source element
 * @param {Document} document
 * @param {string} name block name
 * @param {Array} cells block rows (without the header row)
 * @returns {Element}
 */
export function replaceWithBlock(element, document, name, cells) {
  const block = WebImporter.Blocks.createBlock(document, {
    name,
    variants: variants(element),
    cells,
  });
  element.replaceWith(block);
  return block;
}
