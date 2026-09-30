import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Bloco de código: primeira linha é o código (texto ou bloco formatado),
 * segunda linha (opcional) é a linguagem exibida no cabeçalho.
 * @param {Element} block
 */
export default function decorate(block) {
  const [codeRow, langRow] = [...block.children];
  if (!codeRow) return;
  const codeCell = codeRow.firstElementChild;
  const existing = codeCell.querySelector('pre code, pre');
  const source = existing
    ? existing.textContent
    : [...codeCell.querySelectorAll('p')].map((p) => p.textContent).join('\n') || codeCell.textContent;
  const lang = langRow?.textContent.trim() || '';

  const header = document.createElement('div');
  header.className = 'bloco-de-codigo-cabecalho';
  const label = document.createElement('span');
  label.textContent = lang || 'Código';
  moveInstrumentation(langRow?.firstElementChild, label);
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'bloco-de-codigo-copiar';
  copy.textContent = 'Copiar';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(source.trim());
      copy.textContent = 'Copiado!';
    } catch (e) {
      copy.textContent = 'Não foi possível copiar';
    }
    setTimeout(() => { copy.textContent = 'Copiar'; }, 2000);
  });
  header.append(label, copy);

  const pre = document.createElement('pre');
  moveInstrumentation(codeCell, pre);
  pre.tabIndex = 0;
  const code = document.createElement('code');
  if (lang) code.className = `language-${lang.toLowerCase()}`;
  code.textContent = source.replace(/^\n+|\s+$/g, '');
  pre.append(code);

  block.replaceChildren(header, pre);
}
