/**
 * Universal Editor helpers.
 *
 * In the Universal Editor the delivered HTML carries data-aue-* / data-richtext-*
 * attributes on blocks, rows (items) and cells (fields). Blocks that rebuild their
 * DOM must carry those attributes over to the elements that replace the originals,
 * otherwise the editor can no longer select or edit them.
 */

/**
 * Moves attributes from one element to another.
 * @param {Element} from source element
 * @param {Element} to target element
 * @param {string[]} [attributes] attribute names (default: all)
 */
export function moveAttributes(from, to, attributes) {
  if (!from || !to) return;
  const names = attributes || [...from.attributes].map(({ nodeName }) => nodeName);
  names.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value !== null) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Moves Universal Editor instrumentation from one element to another.
 * No-op outside the editor (the attributes are simply not there).
 * @param {Element} from source element
 * @param {Element} to target element
 */
export function moveInstrumentation(from, to) {
  if (!from || !to) return;
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * @returns {boolean} true when the page is rendered inside the Universal Editor
 */
export function isUniversalEditor() {
  return /\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname);
}
