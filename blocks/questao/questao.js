import { renderTex } from '../../scripts/formula.js';
import { moveInstrumentation } from '../../scripts/ue-utils.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Normalizes a row key: lowercase, no accents, hyphenated.
 * @param {string} text
 * @returns {string}
 */
const toKey = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const KEYS = {
  tipo: 'tipo',
  'tipo-da-questao': 'tipo',
  dificuldade: 'dificuldade',
  bloom: 'bloom',
  'taxonomia-de-bloom': 'bloom',
  titulo: 'titulo',
  'texto-base': 'textoBase',
  referencia: 'referencia',
  'referencia-do-texto-base': 'referencia',
  enunciado: 'enunciado',
  alternativas: 'alternativas',
  gabarito: 'gabarito',
  resposta: 'gabarito',
  'resposta-esperada': 'gabarito',
  resolucao: 'resolucao',
  'resolucao-comentada': 'resolucao',
};

/**
 * Reads the key | value rows of the block.
 * @param {Element} block
 * @returns {object}
 */
function readModel(block) {
  const model = { alternativas: [] };
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = [...row.children];
    if (!keyCell || !valueCell) return;
    const rawKey = keyCell.textContent.trim();
    const letter = rawKey.match(/^([A-F])\)?$/i);
    if (letter) {
      model.alternativas.push({ letra: letter[1].toUpperCase(), cell: valueCell });
      return;
    }
    const key = KEYS[toKey(rawKey)];
    if (key === 'alternativas') {
      // lista ou parágrafos "A) texto"
      const items = valueCell.querySelectorAll('li').length
        ? [...valueCell.querySelectorAll('li')]
        : [...valueCell.querySelectorAll('p')];
      items.forEach((item, i) => {
        const cell = document.createElement('div');
        cell.append(...item.childNodes);
        const first = cell.firstChild;
        if (first?.nodeType === Node.TEXT_NODE) first.nodeValue = first.nodeValue.replace(/^\s*[A-F]\)\s*/i, '');
        model.alternativas.push({ letra: LETRAS[i], cell });
      });
    } else if (key) {
      model[key] = valueCell;
    }
  });
  return model;
}

/**
 * Moves the content of a cell into a new element, rendering display math
 * written as \[ ... \] paragraphs.
 * @param {Element} cell source cell
 * @param {string} className class of the wrapper
 * @returns {Element}
 */
function toContent(cell, className) {
  const div = document.createElement('div');
  div.className = className;
  moveInstrumentation(cell, div);
  div.append(...cell.childNodes);
  div.querySelectorAll('p').forEach((p) => {
    const text = p.textContent.trim();
    const display = text.match(/^\\\[([\s\S]+)\\\]$/);
    if (display) {
      const math = document.createElement('div');
      math.className = 'questao-formula';
      renderTex(math, display[1].trim(), true);
      p.replaceWith(math);
    } else if (/^porque$/i.test(text)) {
      p.className = 'questao-porque';
    } else if (/^(I|II|III|IV|V|VI)\s*[.)–-]\s/.test(text)) {
      p.classList.add('questao-afirmativa');
    }
  });
  return div;
}

/**
 * Notifies the page and a hosting LMS (iframe parent) about an answer.
 * @param {object} detail answer detail
 */
function notify(block, detail) {
  block.dispatchEvent(new CustomEvent('questao:respondida', { bubbles: true, detail }));
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'questao:respondida', ...detail }, '*');
  }
}

function chip(text, className, cell) {
  const span = document.createElement('span');
  span.className = `questao-chip ${className}`;
  span.textContent = text;
  moveInstrumentation(cell, span);
  return span;
}

/**
 * Questão: pergunta com alternativas (ou discursiva), gabarito e resolução comentada.
 * Linhas no formato chave | valor: Tipo, Dificuldade, Bloom, Texto-base, Referência,
 * Enunciado, A..E (ou Alternativas), Gabarito e Resolução.
 * @param {Element} block
 */
export default function decorate(block) {
  const model = readModel(block);
  const numero = [...document.querySelectorAll('main .questao')].indexOf(block) + 1 || 1;
  const id = `questao-${numero}`;
  const tipo = model.tipo?.textContent.trim() || '';
  const discursiva = /discursiva/i.test(tipo) || !model.alternativas.length;
  const gabaritoTexto = model.gabarito?.textContent.trim() || '';
  const correta = discursiva ? null : (gabaritoTexto.match(/^\s*([A-F])\b/i)?.[1] || '').toUpperCase();

  const card = document.createElement('article');
  card.className = 'questao-card';
  card.setAttribute('aria-labelledby', `${id}-titulo`);

  // cabeçalho
  const header = document.createElement('header');
  header.className = 'questao-cabecalho';
  const title = document.createElement('h3');
  title.id = `${id}-titulo`;
  title.className = 'questao-titulo';
  title.textContent = model.titulo?.textContent.trim() || `Questão ${numero}`;
  const chips = document.createElement('div');
  chips.className = 'questao-chips';
  if (tipo) chips.append(chip(tipo, 'questao-chip-tipo', model.tipo));
  const dificuldade = model.dificuldade?.textContent.trim();
  if (dificuldade) chips.append(chip(dificuldade, `questao-chip-dificuldade nivel-${toKey(dificuldade)}`, model.dificuldade));
  const bloom = model.bloom?.textContent.trim();
  if (bloom) chips.append(chip(`Bloom: ${bloom}`, 'questao-chip-bloom', model.bloom));
  header.append(title, chips);
  card.append(header);

  if (model.textoBase) card.append(toContent(model.textoBase, 'questao-texto-base'));
  if (model.referencia) {
    const ref = toContent(model.referencia, 'questao-referencia');
    card.append(ref);
  }
  if (model.enunciado) card.append(toContent(model.enunciado, 'questao-enunciado'));

  const feedback = document.createElement('div');
  feedback.className = 'questao-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  const resolucao = document.createElement('div');
  resolucao.className = 'questao-resolucao';
  resolucao.hidden = true;
  if (discursiva && model.gabarito) {
    const h = document.createElement('h4');
    h.textContent = 'Resposta esperada';
    resolucao.append(h, toContent(model.gabarito, 'questao-resolucao-conteudo'));
  }
  const resolucaoRepetida = discursiva && model.gabarito
    && model.resolucao?.textContent.trim() === gabaritoTexto;
  if (model.resolucao && !resolucaoRepetida) {
    const h = document.createElement('h4');
    h.textContent = 'Resolução comentada';
    resolucao.append(h, toContent(model.resolucao, 'questao-resolucao-conteudo'));
  }

  const actions = document.createElement('div');
  actions.className = 'questao-acoes';

  if (discursiva) {
    const label = document.createElement('label');
    label.className = 'questao-resposta-rotulo';
    label.htmlFor = `${id}-resposta`;
    label.textContent = 'Sua resposta';
    const textarea = document.createElement('textarea');
    textarea.id = `${id}-resposta`;
    textarea.className = 'questao-resposta';
    textarea.rows = 6;
    textarea.placeholder = 'Escreva aqui o seu raciocínio antes de conferir a resposta esperada.';

    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'button primary';
    reveal.textContent = 'Ver resposta esperada';
    reveal.setAttribute('aria-expanded', 'false');
    reveal.addEventListener('click', () => {
      const open = resolucao.hidden;
      resolucao.hidden = !open;
      reveal.setAttribute('aria-expanded', String(open));
      reveal.textContent = open ? 'Ocultar resposta esperada' : 'Ver resposta esperada';
      if (open) {
        notify(block, {
          numero, tipo, discursiva: true, resposta: textarea.value,
        });
      }
    });
    actions.append(reveal);
    card.append(label, textarea, actions, resolucao);
    block.replaceChildren(card);
    return;
  }

  // alternativas
  const form = document.createElement('form');
  form.className = 'questao-form';
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.className = 'visually-hidden';
  legend.textContent = `Alternativas da ${title.textContent}`;
  fieldset.append(legend);

  model.alternativas.forEach(({ letra, cell }) => {
    const label = document.createElement('label');
    label.className = 'questao-alternativa';
    label.dataset.letra = letra;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = id;
    input.value = letra;
    const badge = document.createElement('span');
    badge.className = 'questao-letra';
    badge.textContent = letra;
    badge.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'questao-alternativa-texto';
    moveInstrumentation(cell, text);
    const only = cell.children.length === 1 && cell.firstElementChild.matches('p') ? cell.firstElementChild : null;
    text.append(...(only ? only.childNodes : cell.childNodes));
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = `Alternativa ${letra}: `;
    text.prepend(sr);
    label.append(input, badge, text);
    fieldset.append(label);
  });
  form.append(fieldset);

  const verify = document.createElement('button');
  verify.type = 'submit';
  verify.className = 'button primary';
  verify.textContent = 'Verificar resposta';
  verify.disabled = true;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button secondary';
  retry.textContent = 'Tentar novamente';
  retry.hidden = true;

  const toggleResolucao = document.createElement('button');
  toggleResolucao.type = 'button';
  toggleResolucao.className = 'button secondary questao-ver-resolucao';
  toggleResolucao.textContent = 'Ver resolução comentada';
  toggleResolucao.hidden = true;
  toggleResolucao.setAttribute('aria-expanded', 'false');
  toggleResolucao.addEventListener('click', () => {
    const open = resolucao.hidden;
    resolucao.hidden = !open;
    toggleResolucao.setAttribute('aria-expanded', String(open));
    toggleResolucao.textContent = open ? 'Ocultar resolução comentada' : 'Ver resolução comentada';
  });

  actions.append(verify, retry, toggleResolucao);
  form.append(actions);

  form.addEventListener('change', () => { verify.disabled = !form.querySelector('input:checked'); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const chosen = form.querySelector('input:checked');
    if (!chosen) return;
    const acertou = chosen.value === correta;
    fieldset.disabled = true;
    form.querySelectorAll('.questao-alternativa').forEach((label) => {
      label.classList.toggle('correta', label.dataset.letra === correta);
      label.classList.toggle('incorreta', label.dataset.letra === chosen.value && !acertou);
    });
    card.classList.toggle('acertou', acertou);
    card.classList.toggle('errou', !acertou);
    feedback.innerHTML = acertou
      ? '<strong>Resposta correta!</strong> Muito bem.'
      : `<strong>Resposta incorreta.</strong> A alternativa correta é a <strong>${correta}</strong>.`;
    verify.hidden = true;
    retry.hidden = false;
    toggleResolucao.hidden = !resolucao.children.length;
    notify(block, {
      numero, tipo, escolhida: chosen.value, correta, acertou,
    });
  });

  retry.addEventListener('click', () => {
    fieldset.disabled = false;
    form.reset();
    form.querySelectorAll('.questao-alternativa').forEach((label) => label.classList.remove('correta', 'incorreta'));
    card.classList.remove('acertou', 'errou');
    feedback.textContent = '';
    verify.hidden = false;
    verify.disabled = true;
    retry.hidden = true;
    toggleResolucao.hidden = true;
    resolucao.hidden = true;
    toggleResolucao.setAttribute('aria-expanded', 'false');
    toggleResolucao.textContent = 'Ver resolução comentada';
    form.querySelector('input')?.focus();
  });

  card.append(form, feedback, resolucao);
  block.replaceChildren(card);
}
