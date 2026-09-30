import { getMetadata } from '../../scripts/aem.js';
import { contentBase, getAulaNav, markVisited } from '../../scripts/aula.js';

/**
 * Builds the lesson summary dropdown (sumário) listing every section of the lesson.
 * @param {object} nav parsed lesson navigation
 * @returns {Element}
 */
function buildSumario(nav) {
  const visited = markVisited(window.location.pathname.replace(/\/$/, ''));
  const wrapper = document.createElement('div');
  wrapper.className = 'header-sumario';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'header-sumario-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'header-sumario-panel');
  const position = nav.index >= 0 ? `${nav.index + 1} de ${nav.steps.length}` : `${nav.steps.length} seções`;
  toggle.innerHTML = `<span class="header-sumario-label">Sumário</span>
    <span class="header-sumario-pos">${position}</span>`;

  const panel = document.createElement('div');
  panel.id = 'header-sumario-panel';
  panel.className = 'header-sumario-panel';
  panel.hidden = true;

  const ol = document.createElement('ol');
  nav.steps.forEach((step, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = step.href;
    a.textContent = step.title;
    if (step.current) {
      a.setAttribute('aria-current', 'page');
      li.classList.add('atual');
    } else if (visited.has(step.href.replace(/\/$/, ''))) {
      li.classList.add('visitada');
    }
    a.dataset.numero = i + 1;
    li.append(a);
    ol.append(li);
  });
  panel.append(ol);

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) setOpen(false);
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

/**
 * loads and decorates the header (demo navigation bar for lesson pages)
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  const bar = document.createElement('nav');
  bar.id = 'nav';
  bar.setAttribute('aria-label', 'Navegação da aula');

  const brand = document.createElement('a');
  brand.className = 'header-brand';
  brand.href = contentBase() ? `${contentBase()}/index` : '/';
  brand.innerHTML = `<img src="${window.hlx.codeBasePath}/icons/cogna-logo.png" alt="Cogna Educação" width="628" height="230">`;
  bar.append(brand);

  const info = document.createElement('div');
  info.className = 'header-info';
  bar.append(info);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(bar);
  block.append(navWrapper);

  const nav = await getAulaNav();
  if (!nav) {
    const title = getMetadata('og:title') || document.title;
    info.innerHTML = `<span class="header-aula">${title}</span>`;
    return;
  }

  const disciplina = document.createElement('span');
  disciplina.className = 'header-disciplina';
  disciplina.textContent = [nav.disciplina, nav.unidade].filter(Boolean).join(' · ');
  const aula = document.createElement('span');
  aula.className = 'header-aula';
  aula.textContent = nav.aula;
  info.append(disciplina, aula);

  bar.append(buildSumario(nav));

  if (nav.index >= 0) {
    const progress = document.createElement('div');
    progress.className = 'header-progresso';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Progresso na aula');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(nav.steps.length));
    progress.setAttribute('aria-valuenow', String(nav.index + 1));
    progress.style.setProperty('--progresso', `${((nav.index + 1) / nav.steps.length) * 100}%`);
    navWrapper.append(progress);
  }
}
