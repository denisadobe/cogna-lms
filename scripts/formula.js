import { loadCSS, loadScript } from './aem.js';

let katexPromise;

const katexBase = () => `${window.hlx.codeBasePath}/scripts/katex`;

/**
 * Loads the vendored KaTeX library (script + stylesheet) once.
 * @returns {Promise<object>} the global katex object
 */
export function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([
      loadCSS(`${katexBase()}/katex-swap.min.css`),
      loadScript(`${katexBase()}/katex.min.js`),
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

const SHADOW_STYLE = `
  :host { display: inline; }
  :host(.formula-host-bloco) { display: block; overflow: auto hidden; }
  .katex-display { margin: 0.4em 0; text-align: var(--formula-alinhamento, center); }
  .katex-display > .katex { text-align: var(--formula-alinhamento, center); }
`;

/**
 * Renders math inside a shadow root of the host element. The host keeps its original
 * LaTeX text in the light DOM, so the content stays intact when it is read or saved
 * (e.g. by the Universal Editor); only the shadow root shows the rendered formula.
 * @param {Element} host element whose text is the formula source
 * @param {string} tex LaTeX expression (without delimiters)
 * @param {boolean} displayMode block (true) or inline (false)
 */
export async function renderTexInHost(host, tex, displayMode = true) {
  host.classList.add(displayMode ? 'formula-host-bloco' : 'formula-host');
  // o texto-fonte não é exibido, mas leitores de tela o anunciariam junto da fórmula
  // (que já traz MathML acessível no shadow root)
  const source = host.firstElementChild;
  if (!(host.childNodes.length === 1 && source?.classList.contains('formula-fonte'))) {
    const span = document.createElement('span');
    span.className = 'formula-fonte';
    span.setAttribute('aria-hidden', 'true');
    span.append(...host.childNodes);
    host.append(span);
  }
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  if (!root.querySelector('style')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${katexBase()}/katex-swap.min.css`;
    const style = document.createElement('style');
    style.textContent = SHADOW_STYLE;
    root.append(link, style);
  }
  const target = document.createElement(displayMode ? 'div' : 'span');
  target.className = 'formula-alvo';
  await renderTex(target, tex, displayMode);
  root.querySelector('.formula-alvo')?.remove();
  root.append(target);
  host.dataset.formulaTex = tex;
}

const INLINE_MATH = /\\\((.+?)\\\)/g;
const HAS_INLINE_MATH = /\\\(.+?\\\)/;
const ONLY_INLINE = /^\s*\\\((.+?)\\\)\s*$/;
const DISPLAY_MATH = /^\s*\\\[([\s\S]+)\\\]\s*$/;

/**
 * Renders math written in text: paragraphs containing only \[ ... \] become display
 * formulas and \( ... \) inside text becomes inline formulas. Safe to call again on the
 * same container (e.g. after an edit): rendered formulas are updated, not duplicated.
 * @param {Element} container element to scan
 */
export async function renderInlineMath(container) {
  const pending = [];

  container.querySelectorAll('p').forEach((p) => {
    if (p.closest('pre, code')) return;
    const display = p.textContent.match(DISPLAY_MATH);
    if (!display) return;
    if (p.shadowRoot && p.dataset.formulaTex === display[1].trim()) return;
    p.classList.add('formula-bloco');
    pending.push(renderTexInHost(p, display[1].trim(), true));
  });

  // spans already created on an earlier pass (or kept in saved content)
  container.querySelectorAll('span.formula-inline').forEach((span) => {
    const match = span.textContent.match(ONLY_INLINE);
    if (!match || (span.shadowRoot && span.dataset.formulaTex === match[1])) return;
    pending.push(renderTexInHost(span, match[1], false));
  });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (
      HAS_INLINE_MATH.test(node.nodeValue)
        && !node.parentElement.closest('pre, code, .formula-inline, .formula-host-bloco, .formula-expressao')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    ),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    let last = 0;
    node.nodeValue.replace(INLINE_MATH, (match, tex, offset) => {
      fragment.append(node.nodeValue.slice(last, offset));
      const span = document.createElement('span');
      span.className = 'formula-inline';
      span.textContent = match;
      pending.push(renderTexInHost(span, tex, false));
      fragment.append(span);
      last = offset + match.length;
      return match;
    });
    fragment.append(node.nodeValue.slice(last));
    node.replaceWith(fragment);
  });

  await Promise.all(pending);
}
