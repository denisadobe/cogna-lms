import { getAulaNav } from '../../scripts/aula.js';

/**
 * Builds a previous/next link card.
 * @param {object} step lesson step
 * @param {string} direction 'anterior' or 'proxima'
 * @returns {Element}
 */
function buildStepLink(step, direction) {
  const a = document.createElement('a');
  a.className = `footer-passo footer-${direction}`;
  a.href = step.href;
  a.rel = direction === 'anterior' ? 'prev' : 'next';
  const label = document.createElement('span');
  label.className = 'footer-passo-rotulo';
  label.textContent = direction === 'anterior' ? 'Anterior' : 'Próxima';
  const title = document.createElement('span');
  title.className = 'footer-passo-titulo';
  title.textContent = step.title;
  a.append(label, title);
  return a;
}

/**
 * loads and decorates the footer (previous / next lesson section)
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const nav = await getAulaNav();

  if (nav && nav.index >= 0) {
    const pager = document.createElement('nav');
    pager.className = 'footer-paginacao';
    pager.setAttribute('aria-label', 'Seções da aula');
    const prev = nav.steps[nav.index - 1];
    const next = nav.steps[nav.index + 1];
    pager.append(prev ? buildStepLink(prev, 'anterior') : document.createElement('span'));
    pager.append(next ? buildStepLink(next, 'proxima') : document.createElement('span'));
    block.append(pager);
  }

  const legal = document.createElement('p');
  legal.className = 'footer-legal';
  legal.textContent = `© ${new Date().getFullYear()} Cogna Educação. Todos os direitos reservados.`;
  block.append(legal);
}
