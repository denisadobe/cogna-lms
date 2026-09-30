import { moveInstrumentation } from '../../scripts/ue-utils.js';

let modalCount = 0;

/**
 * Botão expansível: cada linha tem rótulo do botão | conteúdo exibido numa janela modal.
 * Um título (h2-h4) no início do conteúdo vira o título da janela.
 * @param {Element} block
 */
export default function decorate(block) {
  const buttons = [...block.children].map((row) => {
    const [labelCell, ...bodyCells] = [...row.children];
    const labelText = labelCell?.textContent.trim();
    if (!labelText) return null;
    modalCount += 1;
    const id = `modal-${modalCount}`;

    const dialog = document.createElement('dialog');
    dialog.className = 'botao-expansivel-modal';
    dialog.setAttribute('closedby', 'any');

    const body = document.createElement('div');
    body.className = 'botao-expansivel-conteudo';
    moveInstrumentation(bodyCells[0], body);
    bodyCells.forEach((cell) => body.append(...cell.childNodes));
    const heading = body.querySelector(':scope > :is(h2, h3, h4)');
    const title = document.createElement('h2');
    title.id = `${id}-titulo`;
    title.className = 'botao-expansivel-titulo';
    title.textContent = heading ? heading.textContent.trim() : labelText;
    heading?.remove();
    dialog.setAttribute('aria-labelledby', title.id);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'botao-expansivel-fechar';
    close.setAttribute('aria-label', 'Fechar');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());

    dialog.append(close, title, body);
    // fallback de light-dismiss para navegadores sem suporte a closedby
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button primary botao-expansivel-botao';
    button.setAttribute('aria-haspopup', 'dialog');
    button.textContent = labelText;
    moveInstrumentation(labelCell, button);
    button.addEventListener('click', () => dialog.showModal());

    const wrapper = document.createElement('div');
    wrapper.className = 'botao-expansivel-item';
    moveInstrumentation(row, wrapper);
    wrapper.append(button, dialog);
    return wrapper;
  }).filter(Boolean);

  block.replaceChildren(...buttons);
}
