import { loadCSS, loadScript } from './aem.js';

let katexPromise;

/**
 * Loads the vendored KaTeX library (script + stylesheet) once.
 * @returns {Promise<object>} the global katex object
 */
export function loadKatex() {
  if (!katexPromise) {
    const base = `${window.hlx.codeBasePath}/scripts/katex`;
    katexPromise = Promise.all([
      loadCSS(`${base}/katex-swap.min.css`),
      loadScript(`${base}/katex.min.js`),
    ]).then(() => window.katex);
  }
  return katexPromise;
}

/**
 * Renders a LaTeX expression into an element. Falls back to the raw source on error.
 * @param {Element} target element that receives the rendered math
 * @param {string} tex LaTeX source
 * @param {boolean} displayMode block (true) or inline (false) rendering
 */
export async function renderTex(target, tex, displayMode = true) {
  const katex = await loadKatex();
  try {
    // renderToDomTree (instead of katex.render) also works in documents without a
    // doctype, such as the local preview of plain HTML
    // eslint-disable-next-line no-underscore-dangle
    const tree = katex.__renderToDomTree(tex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
    target.replaceChildren(tree.toNode());
  } catch (e) {
    target.textContent = tex;
  }
}

const INLINE_MATH = /\\\((.+?)\\\)/g;
const HAS_INLINE_MATH = /\\\(.+?\\\)/;

/**
 * Renders inline math written as \( ... \) inside text of the given container.
 * @param {Element} container element to scan
 */
export async function renderInlineMath(container) {
  // parágrafos que contêm somente \[ ... \] viram equações em destaque
  [...container.querySelectorAll('p')]
    .filter((p) => !p.closest('.katex, pre, code'))
    .forEach((p) => {
      const display = p.textContent.trim().match(/^\\\[([\s\S]+)\\\]$/);
      if (!display) return;
      const div = document.createElement('div');
      div.className = 'formula-bloco';
      renderTex(div, display[1].trim(), true);
      p.replaceWith(div);
    });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (
      HAS_INLINE_MATH.test(node.nodeValue) && !node.parentElement.closest('pre, code, .katex')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    ),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (!nodes.length) return;

  await loadKatex();
  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    let last = 0;
    node.nodeValue.replace(INLINE_MATH, (match, tex, offset) => {
      fragment.append(node.nodeValue.slice(last, offset));
      const span = document.createElement('span');
      span.className = 'formula-inline';
      renderTex(span, tex, false);
      fragment.append(span);
      last = offset + match.length;
      return match;
    });
    fragment.append(node.nodeValue.slice(last));
    node.replaceWith(fragment);
  });
}
