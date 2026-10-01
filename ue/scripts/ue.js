/*
 * Comportamentos carregados somente dentro do Universal Editor.
 * Os blocos já preservam a instrumentação (data-aue-*) ao montar o DOM; aqui ficam
 * apenas as reações às ações do autor no editor.
 */

import { renderInlineMath, renderTexInHost } from '../../scripts/formula.js';

let mathTimer;

/**
 * Redesenha as fórmulas depois que o editor altera o conteúdo. O LaTeX fica no texto
 * dos elementos (o desenho fica em shadow root), então basta comparar e redesenhar.
 */
function refreshMath() {
  clearTimeout(mathTimer);
  mathTimer = setTimeout(() => {
    const main = document.querySelector('main');
    if (!main) return;
    main.querySelectorAll('.formula-expressao').forEach((el) => {
      const tex = el.textContent.trim();
      if (tex && tex !== el.dataset.formulaTex) renderTexInHost(el, tex, true);
    });
    renderInlineMath(main);
  }, 150);
}

/**
 * Mostra, dentro do bloco, o item selecionado no editor (aba, sanfona, slide, modal).
 * @param {Element} element elemento selecionado (item do bloco)
 */
function revealItem(element) {
  const block = element.closest('.block');
  if (!block) return;

  if (block.classList.contains('sanfona')) {
    const details = element.closest('details');
    if (details) {
      block.querySelectorAll('details').forEach((d) => { d.open = d === details; });
    }
  }

  if (block.classList.contains('abas')) {
    const panel = element.closest('.abas-painel');
    const tab = panel && block.querySelector(`[aria-controls="${panel.id}"]`);
    tab?.click();
  }

  if (block.classList.contains('galeria')) {
    const slide = element.closest('.galeria-slide');
    if (slide && block.galeriaIr) block.galeriaIr(Number(slide.dataset.indice));
  }

  if (block.classList.contains('botao-expansivel')) {
    const item = element.closest('.botao-expansivel-item');
    block.querySelectorAll('dialog[open]').forEach((d) => d.close());
    // não modal: o editor continua podendo selecionar o conteúdo da janela
    item?.querySelector('dialog')?.show();
  }
}

function setupEventHandlers() {
  // imagem trocada no painel: remove as fontes otimizadas antigas para exibir a nova
  document.body.addEventListener('aue:content-patch', ({ detail: { patch, request } }) => {
    let element = document.querySelector(`[data-aue-resource="${request.target.resource}"]`);
    if (element && element.getAttribute('data-aue-prop') !== patch.name) {
      element = element.querySelector(`[data-aue-prop="${patch.name}"]`);
    }
    if (element?.getAttribute('data-aue-type') !== 'media') return;
    const picture = element.tagName === 'IMG' ? element.closest('picture') : element;
    picture?.querySelectorAll('source').forEach((source) => source.remove());
    picture?.querySelector('img')?.removeAttribute('srcset');
  });

  ['aue:content-patch', 'aue:content-update', 'aue:content-add', 'aue:content-move']
    .forEach((type) => document.body.addEventListener(type, refreshMath));

  document.body.addEventListener('aue:ui-select', ({ detail }) => {
    const resource = detail?.resource;
    if (!resource) return;
    const element = document.querySelector(`[data-aue-resource="${resource}"]`);
    if (element) revealItem(element);
  });
}

export default function ue() {
  document.body.classList.add('ue-editando');
  setupEventHandlers();
}
