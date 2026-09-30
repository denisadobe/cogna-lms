import { getMetadata } from './aem.js';

/**
 * Local previews of imported content are served under /content; published pages are not.
 * @returns {string} path prefix to prepend to site-absolute content paths
 */
export function contentBase() {
  return window.location.pathname.startsWith('/content/') ? '/content' : '';
}

/**
 * Prefixes a site-absolute path with the content base when needed.
 * @param {string} path site-absolute path
 * @returns {string}
 */
export function resolveContentPath(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  const base = contentBase();
  return base && !path.startsWith(`${base}/`) ? `${base}${path}` : path;
}

const normalize = (path) => path.replace(/\.html$/, '').replace(/\/$/, '') || '/';

let navPromise;

/**
 * Loads the lesson navigation document referenced by the "nav" metadata.
 * The document holds breadcrumb paragraphs (disciplina, unidade, aula)
 * followed by a list of links to each lesson section, in order.
 * @returns {Promise<object|null>} parsed lesson navigation
 */
export function getAulaNav() {
  if (navPromise) return navPromise;
  navPromise = (async () => {
    const navMeta = getMetadata('nav');
    if (!navMeta) return null;
    const navPath = resolveContentPath(new URL(navMeta, window.location).pathname);
    const resp = await fetch(`${navPath}.plain.html`);
    if (!resp.ok) return null;

    const doc = document.createElement('div');
    doc.innerHTML = await resp.text();
    const list = doc.querySelector('ol, ul');
    if (!list) return null;

    const breadcrumb = [...doc.querySelectorAll('p')]
      .filter((p) => !p.querySelector('a') && p.textContent.trim())
      .map((p) => p.textContent.trim());

    const current = normalize(window.location.pathname);
    const steps = [...list.querySelectorAll(':scope > li')].map((li) => {
      const a = li.querySelector('a');
      const href = a ? resolveContentPath(new URL(a.getAttribute('href'), window.location).pathname) : '';
      return {
        title: (a || li).textContent.trim(),
        href,
        current: href && normalize(href) === current,
      };
    }).filter((step) => step.href);

    const index = steps.findIndex((step) => step.current);
    return {
      disciplina: breadcrumb[0] || '',
      unidade: breadcrumb[1] || '',
      aula: breadcrumb[2] || '',
      steps,
      index,
    };
  })();
  return navPromise;
}

const VISITED_KEY = 'aula-visitadas';

/**
 * Remembers visited lesson sections so the summary can show progress.
 * @param {string} path section path
 * @returns {Set<string>} all visited paths
 */
export function markVisited(path) {
  let visited = [];
  try {
    visited = JSON.parse(localStorage.getItem(VISITED_KEY) || '[]');
    if (path && !visited.includes(normalize(path))) {
      visited.push(normalize(path));
      localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    }
  } catch (e) {
    // storage unavailable
  }
  return new Set(visited);
}
