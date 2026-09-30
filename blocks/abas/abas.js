import { moveInstrumentation } from '../../scripts/ue-utils.js';

let abasCount = 0;

/**
 * Abas: cada linha tem título da aba | conteúdo.
 * Segue o padrão ARIA de tabs (setas, Home/End) e mantém os painéis
 * ocultos pesquisáveis com hidden="until-found".
 * @param {Element} block
 */
export default function decorate(block) {
  abasCount += 1;
  const id = `abas-${abasCount}`;
  const supportsUntilFound = 'onbeforematch' in HTMLElement.prototype;

  const tablist = document.createElement('div');
  tablist.className = 'abas-lista';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  const tabs = [];

  [...block.children].forEach((row, i) => {
    const [titleCell, ...bodyCells] = [...row.children];
    if (!titleCell || !titleCell.textContent.trim()) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'abas-aba';
    tab.id = `${id}-aba-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-painel-${i}`);
    // o título é editado pelo painel do item (a aba fica fora do painel no DOM)
    tab.textContent = titleCell.textContent.trim();

    const panel = document.createElement('div');
    panel.className = 'abas-painel';
    panel.id = `${id}-painel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    moveInstrumentation(row, panel);
    const inner = document.createElement('div');
    inner.className = 'abas-painel-conteudo';
    moveInstrumentation(bodyCells[0], inner);
    bodyCells.forEach((cell) => inner.append(...cell.childNodes));
    panel.append(inner);

    tabs.push(tab);
    panels.push(panel);
    tablist.append(tab);
  });

  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        panels[i].removeAttribute('hidden');
      } else if (supportsUntilFound) {
        panels[i].setAttribute('hidden', 'until-found');
      } else {
        panels[i].hidden = true;
      }
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      const keys = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      };
      if (e.key in keys) {
        e.preventDefault();
        select(keys[e.key], true);
      }
    });
  });

  // quando a busca do navegador encontra texto numa aba oculta, sincroniza a aba selecionada
  block.addEventListener('beforematch', (e) => {
    const index = panels.indexOf(e.target.closest('.abas-painel'));
    if (index >= 0) select(index);
  });

  block.replaceChildren(tablist, ...panels);
  if (tabs.length) select(0);
}
