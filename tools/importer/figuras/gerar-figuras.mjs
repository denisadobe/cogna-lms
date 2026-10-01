/* eslint-disable */
// Gera as figuras originais das aulas de Máquinas Elétricas Avançadas (conteúdo fictício de demonstração).
// Uso: node tools/importer/figuras/gerar-figuras.mjs
// Desenha cada figura em SVG, envolve num HTML com a fonte Open Sans e rasteriza com o Chromium headless.
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = join(ROOT, 'assets/aulas/maquinas-eletricas-avancadas/unidade-1');
const TMP = '/tmp/figuras-aulas';
mkdirSync(TMP, { recursive: true });

const C = {
  ink: '#1f2a44', blue: '#00368c', sky: '#007abf', light: '#e8f1fb', grid: '#d9e1ec',
  copper: '#c8742c', copperLight: '#e9a868', iron: '#aeb7c6', ironDark: '#7d889b', red: '#c0392b', green: '#1e8449', muted: '#5b6779',
};
const FONT = "'Open Sans', 'DejaVu Sans', sans-serif";

/* ---------- texto com índices: "R_1", "X_{th}", "s^2" ---------- */
function rich(str) {
  let out = '';
  let i = 0;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  while (i < str.length) {
    const ch = str[i];
    if ((ch === '_' || ch === '^') && i + 1 < str.length) {
      let tok;
      if (str[i + 1] === '{') { const j = str.indexOf('}', i); tok = str.slice(i + 2, j); i = j + 1; } else { tok = str[i + 1]; i += 2; }
      const shift = ch === '_' ? 'sub' : 'super';
      out += `<tspan baseline-shift="${shift}" font-size="68%">${esc(tok)}</tspan>`;
    } else { out += esc(ch); i += 1; }
  }
  return out;
}
function t(x, y, str, o = {}) {
  const { size = 18, anchor = 'middle', weight = 400, fill = C.ink, italic = false, rotate } = o;
  const tr = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}"${italic ? ' font-style="italic"' : ''} dominant-baseline="middle"${tr}>${rich(String(str))}</text>`;
}
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.ink}" stroke-width="${o.w || 2.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
const wire = (pts, o = {}) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${o.stroke || C.ink}" stroke-width="${o.w || 2.5}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${C.ink}"/>`;
const term = (x, y) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>`;

/* ---------- componentes entre dois pontos alinhados ---------- */
function bodyPath(type) {
  if (type === 'R') {
    let d = 'M -30 0';
    const n = 6; const step = 60 / n;
    for (let k = 0; k < n; k += 1) d += ` L ${-30 + step * (k + 0.5)} ${k % 2 ? 9 : -9}`;
    return `<path d="${d} L 30 0" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  if (type === 'L') {
    let d = 'M -30 0';
    for (let k = 0; k < 4; k += 1) d += ' a 7.5 7.5 0 0 1 15 0';
    return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>`;
  }
  if (type === 'box') return `<rect x="-30" y="-10" width="60" height="20" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>`;
  return '';
}
// tipo: R, L, box, ac, open (sem componente, só os fios)
function comp(type, x1, y1, x2, y2, o = {}) {
  const cx = (x1 + x2) / 2; const cy = (y1 + y2) / 2;
  const vertical = x1 === x2;
  const L = Math.hypot(x2 - x1, y2 - y1);
  const half = type === 'ac' ? 24 : 30;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  let g = `<g transform="translate(${cx},${cy}) rotate(${ang})">`;
  g += line(-L / 2, 0, -half, 0, o) + line(half, 0, L / 2, 0, o);
  if (type === 'ac') {
    g += `<circle r="24" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>`;
    g += `<path d="M -13 0 C -8 -14, -3 -14, 0 0 S 8 14, 13 0" fill="none" stroke="${C.ink}" stroke-width="2.2" transform="rotate(${-ang})"/>`;
  } else g += bodyPath(type);
  g += '</g>';
  if (o.label) {
    const [dx, dy] = o.lpos || (vertical ? [44, 0] : [0, -26]);
    g += t(cx + dx, cy + dy, o.label, { size: o.lsize || 19, anchor: o.lanchor || (vertical ? 'start' : 'middle'), italic: false });
  }
  return g;
}
// seta de corrente sobre um fio (dir: r, l, u, d)
function arrow(x, y, dir, label, o = {}) {
  const rot = { r: 0, d: 90, l: 180, u: 270 }[dir];
  let s = `<path d="M -9 -7 L 7 0 L -9 7 Z" fill="${o.fill || C.blue}" transform="translate(${x},${y}) rotate(${rot})"/>`;
  if (label) { const [dx, dy] = o.lpos || [0, -20]; s += t(x + dx, y + dy, label, { size: 18, fill: o.fill || C.blue }); }
  return s;
}
function pol(x, yTop, yBot, label, o = {}) {
  return t(x, yTop, '+', { size: 22, weight: 700 }) + t(x, yBot, '−', { size: 24, weight: 700 })
    + (label ? t(x + (o.dx || 0), (yTop + yBot) / 2, label, { size: 20, anchor: o.anchor || 'middle' }) : '');
}
function meter(x, y, letter, r = 18) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>${t(x, y + 1, letter, { size: 17, weight: 700 })}`;
}

const svgWrap = (w, h, body, bg = '#fff') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;

/* ---------- gráficos ---------- */
const fmt = (v, dec = 0) => v.toFixed(dec).replace('.', ',');
function plot(o) {
  const { x0, y0, w, h, xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel, xdec = 0, ydec = 0 } = o;
  const sx = (x) => x0 + ((x - xmin) / (xmax - xmin)) * w;
  const sy = (y) => y0 + h - ((y - ymin) / (ymax - ymin)) * h;
  let s = '';
  (o.bands || []).forEach((b) => {
    s += `<rect x="${sx(b.from)}" y="${y0}" width="${sx(b.to) - sx(b.from)}" height="${h}" fill="${b.fill}"/>`;
    if (b.label) s += t((sx(b.from) + sx(b.to)) / 2, y0 + 24, b.label, { size: 17, weight: 700, fill: b.color || C.muted });
  });
  xticks.forEach((v) => { s += line(sx(v), y0, sx(v), y0 + h, { stroke: C.grid, w: 1 }); s += t(sx(v), y0 + h + 22, o.xfmt ? o.xfmt(v) : fmt(v, xdec), { size: 15, fill: C.muted }); });
  yticks.forEach((v) => { s += line(x0, sy(v), x0 + w, sy(v), { stroke: C.grid, w: 1 }); s += t(x0 - 10, sy(v), o.yfmt ? o.yfmt(v) : fmt(v, ydec), { size: 15, anchor: 'end', fill: C.muted }); });
  s += line(x0, y0 + h, x0 + w, y0 + h, { w: 2 }) + line(x0, y0, x0, y0 + h, { w: 2 });
  if (ymin < 0) s += line(x0, sy(0), x0 + w, sy(0), { w: 1.8 });
  if (o.extraX) s += o.extraX(sx);
  s += t(x0 + w / 2, y0 + h + 54, xlabel, { size: 17 });
  s += t(x0 - 64, y0 + h / 2, ylabel, { size: 17, rotate: -90 });
  (o.series || []).forEach((se) => {
    const pts = se.pts.filter((p) => p[1] >= ymin - 1e-9 && p[1] <= ymax + 1e-9).map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${se.color}" stroke-width="${se.width || 3}" stroke-linejoin="round"${se.dash ? ` stroke-dasharray="${se.dash}"` : ''}/>`;
  });
  (o.marks || []).forEach((m) => {
    s += `<circle cx="${sx(m.x)}" cy="${sy(m.y)}" r="6" fill="${m.color || C.red}" stroke="#fff" stroke-width="2"/>`;
    if (m.guide) s += line(sx(m.x), sy(m.y), sx(m.x), y0 + h, { stroke: m.color || C.red, w: 1.5, dash: '5 5' }) + line(x0, sy(m.y), sx(m.x), sy(m.y), { stroke: m.color || C.red, w: 1.5, dash: '5 5' });
    if (m.label) s += t(sx(m.x) + (m.dx || 0), sy(m.y) + (m.dy || -22), m.label, { size: 16, weight: 600, fill: m.color || C.red, anchor: m.anchor || 'middle' });
  });
  if (o.legend) {
    let ly = o.legend.y;
    o.series.filter((se) => se.label).forEach((se) => {
      s += line(o.legend.x, ly, o.legend.x + 34, ly, { stroke: se.color, w: 3.5, dash: se.dash });
      s += t(o.legend.x + 44, ly, se.label, { size: 15, anchor: 'start' });
      ly += 26;
    });
  }
  return s;
}

/* ---------- modelo do motor fictício (Aulas 1 e 2) ---------- */
const sq = (x) => x * x;
function motor(p) {
  const { V1, R1, X1, X2, Xm, R2, ws } = p;
  const Vth = (Xm / Math.sqrt(sq(R1) + sq(X1 + Xm))) * V1;
  const Rth = R1 * sq(Xm / (X1 + Xm));
  const Xth = X1;
  const T = (s, r2 = R2) => (3 / ws) * (sq(Vth) / (sq(Rth + r2 / s) + sq(Xth + X2))) * (r2 / s);
  return { Vth, Rth, Xth, T };
}
const WS = (2 * Math.PI * 1800) / 60;
const CASO = motor({ V1: 380 / Math.sqrt(3), R1: 0.070, R2: 0.097, X1: 0.249, X2: 0.249, Xm: 11.55, ws: WS });
const curva = (fn, s0, s1, n = 600) => Array.from({ length: n + 1 }, (_, k) => s0 + ((s1 - s0) * k) / n).filter((s) => Math.abs(s) > 1e-4).map(fn);

/* ====================== FIGURAS ====================== */
const figs = {};

// Circuito equivalente completo por fase
figs['aula-1/figura-1-circuito-equivalente.png'] = () => {
  const T = 90; const B = 330; let s = '';
  s += term(70, T) + term(70, B);
  s += comp('R', 76, T, 200, T, { label: 'R_1' }) + comp('L', 200, T, 320, T, { label: 'jX_1' });
  s += wire([[320, T], [470, T]]) + dot(390, T) + dot(390, B);
  s += wire([[390, T], [390, 130], [350, 130]]) + wire([[390, 130], [430, 130]]);
  s += comp('R', 350, 130, 350, 290, { label: 'R_C', lpos: [-16, 0], lanchor: 'end' }) + comp('L', 430, 130, 430, 290, { label: 'jX_M' });
  s += wire([[350, 290], [430, 290]]) + wire([[390, 290], [390, B]]);
  s += comp('L', 470, T, 600, T, { label: 'jX_2' }) + wire([[600, T], [700, T]]);
  s += comp('R', 700, T, 700, B, { label: 'R_2 / s' });
  s += wire([[76, B], [700, B]]);
  s += arrow(92, T, 'r', 'I_1', { lpos: [0, 24] }) + arrow(640, T, 'r', 'I_2', { lpos: [0, 24] });
  s += pol(70, 140, 280, 'V_1', { dx: 0 }) + pol(530, 140, 280, 'E_1');
  s += t(390, 380, 'Estator  ·  ramo de magnetização  ·  rotor referido ao estator', { size: 15, fill: C.muted });
  return svgWrap(800, 410, s);
};

// Circuito do estator
figs['aula-1/circuito-estator.png'] = () => {
  const T = 80; const B = 260; let s = '';
  s += comp('ac', 80, T, 80, B, { label: 'V_1', lpos: [-36, 0], lanchor: 'end' });
  s += wire([[80, T], [110, T]]) + comp('R', 110, T, 240, T, { label: 'R_1' }) + comp('L', 240, T, 370, T, { label: 'jX_1' });
  s += wire([[370, T], [440, T]]) + term(446, T) + wire([[80, B], [440, B]]) + term(446, B);
  s += arrow(150, T, 'r', 'I_1', { lpos: [0, 24] });
  s += pol(446, 120, 220, 'E_1', { dx: 34 });
  return svgWrap(540, 320, s);
};

// Circuito do rotor (na frequência de escorregamento)
figs['aula-1/circuito-rotor.png'] = () => {
  const T = 80; const B = 260; let s = '';
  s += comp('ac', 200, T, 200, B, { label: 'E_{2s} = s·E_2', lpos: [-36, 0], lanchor: 'end' });
  s += comp('L', 200, T, 410, T, { label: 'j s X_2' }) + wire([[410, T], [490, T]]);
  s += comp('R', 490, T, 490, B, { label: 'R_2' }) + wire([[200, B], [490, B]]);
  s += arrow(440, T, 'r', 'I_{2s}', { lpos: [0, 24] });
  return svgWrap(600, 320, s);
};

// Montagens de ensaio (vazio e rotor bloqueado)
function montagem(tipo) {
  let s = '';
  const ys = [110, 200, 290]; const fases = ['a', 'b', 'c'];
  s += `<rect x="40" y="70" width="170" height="260" rx="14" fill="${C.light}" stroke="${C.blue}" stroke-width="2.5"/>`;
  s += t(125, 150, 'Fonte', { size: 18, weight: 700, fill: C.blue }) + t(125, 176, 'trifásica', { size: 18, weight: 700, fill: C.blue });
  const sub = tipo === 'vazio' ? ['tensão e frequência', 'nominais'] : ['tensão e frequência', 'reduzidas (≈ 25%)'];
  s += t(125, 232, sub[0], { size: 14, fill: C.muted }) + t(125, 252, sub[1], { size: 14, fill: C.muted });
  ys.forEach((y, k) => {
    s += wire([[210, y], [760, y]]) + t(228, y - 14, fases[k], { size: 15, fill: C.muted });
    s += meter(300, y, 'A');
  });
  // wattímetros (método dos dois wattímetros) nas fases a e c, bobinas de tensão referidas à fase b
  [[ys[0], 'W_1'], [ys[2], 'W_2']].forEach(([y, lab]) => {
    s += `<rect x="400" y="${y - 20}" width="70" height="40" rx="6" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>` + t(435, y + 1, lab, { size: 17, weight: 700 });
    s += wire([[435, y + (y < 200 ? 20 : -20)], [435, 200]], { dash: '6 5', w: 2 }) + dot(435, 200);
  });
  s += wire([[600, ys[0]], [600, 140]]) + meter(600, 155, 'V', 16) + wire([[600, 171], [600, ys[1]]]) + dot(600, ys[0]) + dot(600, ys[1]);
  // motor
  s += `<circle cx="840" cy="200" r="78" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`;
  s += t(840, 186, 'M', { size: 34, weight: 700 }) + t(840, 222, '3~', { size: 22 });
  ys.forEach((y) => { s += wire([[760, y], [790, y === 200 ? 200 : y < 200 ? 155 : 245]]); });
  s += wire([[918, 200], [990, 200]], { w: 7, stroke: C.ironDark });
  if (tipo === 'vazio') {
    s += t(840, 318, 'eixo livre, sem carga', { size: 16, fill: C.muted });
    s += `<path d="M 1000 180 a 26 26 0 1 1 -4 42" fill="none" stroke="${C.sky}" stroke-width="2.5"/>` + arrow(994, 224, 'l', '', { fill: C.sky });
  } else {
    s += `<rect x="985" y="168" width="30" height="64" fill="${C.ironDark}"/>`;
    for (let k = 0; k < 6; k += 1) s += line(1015, 172 + k * 11, 1030, 162 + k * 11, { w: 2 });
    s += t(840, 318, 'rotor travado (s = 1)', { size: 16, fill: C.muted });
  }
  return svgWrap(1080, 360, s);
}
figs['aula-1/figura-2-ensaio-em-vazio.png'] = () => montagem('vazio');
figs['aula-1/figura-3-rotor-bloqueado.png'] = () => montagem('bloqueado');

// Circuito simplificado do ensaio em vazio
figs['aula-1/circuito-ensaio-vazio.png'] = () => {
  const T = 80; const B = 290; let s = '';
  s += term(60, T) + term(60, B);
  s += comp('R', 66, T, 190, T, { label: 'R_1' }) + comp('L', 190, T, 320, T, { label: 'jX_1' }) + wire([[320, T], [400, T]]);
  s += comp('L', 400, T, 400, B, { label: 'jX_M' }) + wire([[66, B], [400, B]]) + dot(400, T) + dot(400, B);
  s += wire([[400, T], [520, T]], { dash: '7 6', stroke: C.muted }) + wire([[520, T], [520, B], [400, B]], { dash: '7 6', stroke: C.muted });
  s += t(540, 170, 'ramo do rotor', { size: 15, anchor: 'start', fill: C.muted }) + t(540, 194, 'R_2 / s → ∞ (s ≈ 0)', { size: 15, anchor: 'start', fill: C.muted }) + t(540, 218, 'circuito aberto', { size: 15, anchor: 'start', fill: C.muted });
  s += pol(60, 130, 240, 'V_{φ,vz}', { dx: 22, anchor: 'start' });
  s += arrow(84, T, 'r', 'I_{vz}', { lpos: [0, 24] });
  return svgWrap(740, 340, s);
};

// Circuito simplificado do ensaio de rotor bloqueado
figs['aula-1/circuito-rotor-bloqueado.png'] = () => {
  const T = 80; const B = 290; let s = '';
  s += term(60, T) + term(60, B);
  s += comp('R', 66, T, 190, T, { label: 'R_1' }) + comp('L', 190, T, 320, T, { label: 'jX_1' }) + wire([[320, T], [380, T]]) + dot(380, T) + dot(380, B);
  s += comp('L', 380, T, 380, B, { label: 'jX_M', lpos: [-16, 0], lanchor: 'end', stroke: C.muted, dash: '7 6' });
  s += comp('L', 380, T, 520, T, { label: 'jX_2' }) + wire([[520, T], [590, T]]) + comp('R', 590, T, 590, B, { label: 'R_2  (s = 1)' });
  s += wire([[66, B], [590, B]]);
  s += t(380, 322, 'X_M ≫ |R_2 + jX_2|: ramo de magnetização desprezado', { size: 15, fill: C.muted });
  s += pol(60, 130, 240, 'V_{φ,bl}', { dx: 22, anchor: 'start' });
  s += arrow(84, T, 'r', 'I_{bl}', { lpos: [0, 24] });
  return svgWrap(780, 350, s);
};

// Rotor gaiola de esquilo (vista em perspectiva)
figs['aula-1/rotor-gaiola-de-esquilo.png'] = () => {
  let s = '';
  const cx1 = 300; const cx2 = 760; const cy = 250; const ry = 150; const rx = 52; const n = 18;
  s += `<defs><linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.copperLight}"/><stop offset="1" stop-color="${C.copper}"/></linearGradient></defs>`;
  s += wire([[150, cy], [cx1, cy]], { w: 14, stroke: C.ironDark }) + wire([[cx2, cy], [930, cy]], { w: 14, stroke: C.ironDark });
  // barras de trás
  for (let k = 0; k < n; k += 1) {
    const a = (2 * Math.PI * k) / n; const y = cy + ry * Math.cos(a); const back = Math.sin(a) < 0;
    if (back) s += line(cx1 + rx * Math.sin(a), y, cx2 + rx * Math.sin(a), y, { stroke: '#d9a06c', w: 7 });
  }
  s += `<ellipse cx="${cx1}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#cu)" stroke-width="20"/>`;
  for (let k = 0; k < n; k += 1) {
    const a = (2 * Math.PI * k) / n; const y = cy + ry * Math.cos(a); const front = Math.sin(a) >= 0;
    if (front) s += line(cx1 + rx * Math.sin(a), y, cx2 + rx * Math.sin(a), y, { stroke: C.copper, w: 9 });
  }
  s += `<ellipse cx="${cx2}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#cu)" stroke-width="20"/>`;
  s += line(820, 90, 790, 125, { w: 1.5 }) + t(830, 80, 'anel de curto-circuito', { size: 17, anchor: 'start' });
  s += line(540, 450, 540, 400, { w: 1.5 }) + t(540, 470, 'barras condutoras (alumínio ou cobre)', { size: 17 });
  s += line(180, 300, 180, 262, { w: 1.5 }) + t(180, 320, 'eixo', { size: 17 });
  s += t(540, 40, 'Gaiola de esquilo (núcleo laminado omitido)', { size: 18, weight: 700, fill: C.blue });
  return svgWrap(1080, 500, s);
};

// Ranhura de barras profundas
function ranhura(x, y, w, h) {
  return `<rect x="${x - w / 2 - 34}" y="${y - 20}" width="${w + 68}" height="${h + 54}" fill="${C.iron}"/>`
    + `<rect x="${x - w / 2 - 6}" y="${y - 20}" width="${w + 12}" height="${h + 26}" fill="#fff"/>`;
}
figs['aula-1/figura-4-barras-profundas.png'] = () => {
  let s = `<defs><linearGradient id="topo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}"/><stop offset="0.35" stop-color="${C.copperLight}"/><stop offset="1" stop-color="#f6e3cf"/></linearGradient></defs>`;
  [[170, '(a) partida: f_r = f_e', 'url(#topo)', 'corrente concentrada no topo'], [440, '(b) operação nominal: f_r pequena', C.copper, 'corrente distribuída na barra']].forEach(([x, tit, fill, sub]) => {
    s += t(x, 40, tit, { size: 17, weight: 700, fill: C.blue });
    s += `<rect x="${x - 110}" y="70" width="220" height="14" fill="#fff" stroke="${C.muted}" stroke-dasharray="4 4"/>` + t(x, 62, 'entreferro', { size: 13, fill: C.muted });
    s += ranhura(x, 104, 36, 230);
    s += `<rect x="${x - 18}" y="96" width="36" height="230" fill="${fill}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let k = 0; k < 3; k += 1) s += `<ellipse cx="${x}" cy="${170 + k * 55}" rx="${34 + k * 3}" ry="${22 + k * 12}" fill="none" stroke="${C.sky}" stroke-width="1.8" stroke-dasharray="5 4"/>`;
    s += t(x, 400, sub, { size: 15, fill: C.muted });
  });
  // (c) circuito em escada
  const x0 = 640; s += t(830, 40, '(c) barra como ramos em paralelo', { size: 17, weight: 700, fill: C.blue });
  s += wire([[x0, 90], [x0, 350]]) + wire([[1020, 90], [1020, 350]]);
  [90, 175, 260, 345].forEach((y, k) => {
    s += comp('L', x0, y, x0 + 190, y, { label: k === 0 ? 'L_{topo} (pequena)' : k === 3 ? 'L_{fundo} (grande)' : '', lsize: 14 });
    s += comp('R', x0 + 190, y, 1020, y, { label: k === 0 ? 'R' : '', lsize: 14 });
    s += dot(x0, y) + dot(1020, y);
  });
  s += t(830, 400, 'quanto mais fundo, maior a indutância de dispersão', { size: 15, fill: C.muted });
  return svgWrap(1080, 430, s);
};

// Ranhura dupla gaiola
figs['aula-1/figura-5-dupla-gaiola.png'] = () => {
  let s = '';
  const x = 260;
  s += `<rect x="40" y="40" width="440" height="22" fill="#fff" stroke="${C.muted}" stroke-dasharray="4 4"/>` + t(x, 30, 'entreferro', { size: 14, fill: C.muted });
  s += `<rect x="60" y="62" width="400" height="430" fill="${C.iron}"/>`;
  s += `<rect x="${x - 26}" y="62" width="52" height="16" fill="#fff"/>`;
  s += `<rect x="${x - 26}" y="78" width="52" height="46" rx="6" fill="${C.red}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<rect x="${x - 6}" y="124" width="12" height="90" fill="#fff"/>`;
  s += `<rect x="${x - 44}" y="214" width="88" height="200" rx="10" fill="${C.copper}" stroke="${C.ink}" stroke-width="2"/>`;
  for (let k = 0; k < 3; k += 1) s += `<ellipse cx="${x}" cy="${300}" rx="${62 + k * 22}" ry="${110 + k * 20}" fill="none" stroke="${C.sky}" stroke-width="1.8" stroke-dasharray="5 4"/>`;
  s += line(x + 30, 100, 520, 100, { w: 1.5 }) + t(530, 92, 'Gaiola externa', { size: 17, anchor: 'start', weight: 700 }) + t(530, 116, 'barra fina: alta resistência, baixa dispersão', { size: 15, anchor: 'start', fill: C.muted }) + t(530, 138, 'domina na partida', { size: 15, anchor: 'start', fill: C.red, weight: 600 });
  s += line(x + 6, 170, 520, 200, { w: 1.5 }) + t(530, 200, 'fenda estreita entre as barras', { size: 15, anchor: 'start', fill: C.muted });
  s += line(x + 48, 320, 520, 320, { w: 1.5 }) + t(530, 312, 'Gaiola interna', { size: 17, anchor: 'start', weight: 700 }) + t(530, 336, 'barra larga: baixa resistência, alta dispersão', { size: 15, anchor: 'start', fill: C.muted }) + t(530, 358, 'domina em operação nominal', { size: 15, anchor: 'start', fill: C.copper, weight: 600 });
  s += t(530, 440, '- - - fluxo de dispersão', { size: 15, anchor: 'start', fill: C.sky });
  return svgWrap(960, 520, s);
};

// ---------- Aula 2 ----------
figs['aula-2/figura-1-conjugado-resistencia-rotor.png'] = () => {
  const cores = [C.blue, C.sky, C.green, C.copper, C.red];
  const series = [1, 2, 3, 4, 6].map((k, i) => ({
    color: cores[i], label: `R_2 × ${k}${k === 1 ? ' (rotor original)' : ''}`,
    pts: curva((s) => [(1 - s) * 1800, CASO.T(s, 0.097 * k)], 1, 0.0005),
  }));
  const s = plot({ x0: 110, y0: 40, w: 820, h: 400, xmin: 0, xmax: 1800, ymin: 0, ymax: 750, xticks: [0, 300, 600, 900, 1200, 1500, 1800], yticks: [0, 150, 300, 450, 600, 750], xlabel: 'Velocidade mecânica (rpm)', ylabel: 'Conjugado induzido (N·m)', series, legend: { x: 955, y: 70 } });
  return svgWrap(1200, 520, s + t(530, 30, 'O pico de conjugado se desloca, mas o valor máximo não muda', { size: 16, weight: 700, fill: C.blue }));
};

figs['aula-2/figura-2a-circuito-simplificado.png'] = () => {
  const T = 80; const B = 300; let s = '';
  s += term(60, T) + term(60, B);
  s += comp('R', 66, T, 190, T, { label: 'R_1' }) + comp('L', 190, T, 320, T, { label: 'jX_1' }) + wire([[320, T], [380, T]]);
  s += comp('L', 380, T, 380, B, { label: 'jX_M' }) + dot(380, T) + dot(380, B);
  s += comp('L', 380, T, 520, T, { label: 'jX_2' }) + wire([[520, T], [600, T]]) + comp('R', 600, T, 600, B, { label: 'R_2 / s' });
  s += wire([[66, B], [600, B]]);
  s += pol(60, 130, 250, 'V_1', { dx: 22, anchor: 'start' });
  s += `<rect x="40" y="40" width="410" height="300" rx="10" fill="none" stroke="${C.sky}" stroke-width="2" stroke-dasharray="8 6"/>` + t(245, 30, 'parte substituída pelo equivalente de Thévenin', { size: 14, fill: C.sky });
  return svgWrap(740, 360, s);
};
figs['aula-2/figura-2b-circuito-thevenin.png'] = () => {
  const T = 80; const B = 300; let s = '';
  s += comp('ac', 80, T, 80, B, { label: 'V_{th}', lpos: [-36, 0], lanchor: 'end' });
  s += wire([[80, T], [110, T]]) + comp('R', 110, T, 230, T, { label: 'R_{th}' }) + comp('L', 230, T, 350, T, { label: 'jX_{th}' });
  s += comp('L', 350, T, 480, T, { label: 'jX_2' }) + wire([[480, T], [560, T]]) + comp('R', 560, T, 560, B, { label: 'R_2 / s' });
  s += wire([[80, B], [560, B]]) + arrow(520, T, 'r', 'I_2', { lpos: [0, 24] });
  return svgWrap(700, 360, s);
};

figs['aula-2/figura-3-modos-de-operacao.png'] = () => {
  const tn = 204; // conjugado nominal (N·m)
  const pts = curva((s) => [(1 - s) * 100, (CASO.T(s) / tn) * 100], 1.6, -0.9, 1200);
  const s = plot({
    x0: 110, y0: 40, w: 860, h: 420, xmin: -60, xmax: 190, ymin: -500, ymax: 400,
    xticks: [-50, 0, 50, 100, 150], yticks: [-400, -200, 0, 200, 400], xfmt: (v) => `${v}%`, yfmt: (v) => `${v}%`,
    xlabel: 'Velocidade (% da velocidade síncrona)   ·   escorregamento s = 1 − n/n_s', ylabel: 'Conjugado (% do nominal)',
    bands: [{ from: -60, to: 0, fill: '#fdecea', label: 'Freio (s > 1)', color: C.red }, { from: 0, to: 100, fill: '#eaf2fb', label: 'Motor (0 < s < 1)', color: C.blue }, { from: 100, to: 190, fill: '#e9f6ee', label: 'Gerador (s < 0)', color: C.green }],
    series: [{ pts, color: C.ink, width: 3.2 }],
    extraX: (sx) => t(sx(0), 482 + 40, '', {}) + line(sx(100), 40, sx(100), 460, { stroke: C.muted, w: 1.5, dash: '6 5' }) + t(sx(100) + 6, 445, 'n_s', { size: 15, anchor: 'start', fill: C.muted }),
  });
  return svgWrap(1010, 540, s);
};

figs['aula-2/figura-4-conjugados-partida-plena-maximo.png'] = () => {
  // motor genérico de catálogo (só para ilustrar os três conjugados)
  const g = motor({ V1: 220, R1: 0.08, R2: 0.18, X1: 0.35, X2: 0.35, Xm: 9, ws: WS });
  const sTn = 0.04; const Tn = g.T(sTn);
  const pts = curva((s) => [(1 - s) * 1800, (g.T(s) / Tn) * 100], 1, 0.0005);
  let best = pts[0]; pts.forEach((p) => { if (p[1] > best[1]) best = p; });
  const s = plot({
    x0: 110, y0: 40, w: 820, h: 400, xmin: 0, xmax: 1800, ymin: 0, ymax: 350, xticks: [0, 300, 600, 900, 1200, 1500, 1800], yticks: [0, 50, 100, 150, 200, 250, 300, 350], yfmt: (v) => `${v}%`,
    xlabel: 'Velocidade mecânica (rpm)', ylabel: 'Conjugado (% do nominal)', series: [{ pts, color: C.blue, width: 3.4 }],
    marks: [
      { x: 0, y: pts[0][1], label: `partida ≈ ${Math.round(pts[0][1])}%`, anchor: 'start', dx: 12, dy: 24 },
      { x: best[0], y: best[1], label: `máximo ≈ ${Math.round(best[1])}%`, color: C.copper, dy: -20 },
      { x: (1 - sTn) * 1800, y: 100, label: 'plena carga = 100%', color: C.green, anchor: 'end', dx: -14, dy: 0, guide: true },
    ],
  });
  return svgWrap(980, 520, s);
};

figs['aula-2/figura-5-torque-velocidade-caso.png'] = () => {
  const pts = curva((s) => [(1 - s) * WS, CASO.T(s)], 1, 0.0005);
  const smax = 0.097 / Math.sqrt(sq(CASO.Rth) + sq(CASO.Xth + 0.249));
  const tmax = CASO.T(smax);
  const s = plot({
    x0: 110, y0: 40, w: 820, h: 400, xmin: 0, xmax: 200, ymin: 0, ymax: 700, xticks: [0, 25, 50, 75, 100, 125, 150, 175, 200], yticks: [0, 100, 200, 300, 400, 500, 600, 700],
    xlabel: 'Velocidade (rad/s)', ylabel: 'Torque (N·m)', series: [{ pts, color: C.blue, width: 3.4 }],
    marks: [
      { x: 0, y: CASO.T(1), label: `partida ≈ ${Math.round(CASO.T(1))} N·m`, anchor: 'start', dx: 12, dy: 24 },
      { x: (1 - smax) * WS, y: tmax, label: `T_{max} ≈ ${fmt(tmax, 0)} N·m em ${fmt((1 - smax) * WS, 1)} rad/s`, color: C.copper, anchor: 'end', dx: -14, dy: -24, guide: true },
    ],
  });
  return svgWrap(980, 520, s);
};

// ---------- Questões ----------
figs['questoes/medicao-resistencia-cc.png'] = () => {
  let s = '';
  // fonte CC (bateria) + amperímetro em série, voltímetro em paralelo
  s += wire([[80, 120], [80, 175]]) + line(60, 175, 100, 175, { w: 3 }) + line(70, 189, 90, 189, { w: 5 }) + wire([[80, 189], [80, 320]]);
  s += t(52, 168, '+', { size: 20, weight: 700 }) + t(118, 182, 'V_{CC}', { size: 18, anchor: 'start' });
  s += wire([[80, 120], [190, 120]]) + meter(210, 120, 'A') + wire([[228, 120], [460, 120]]);
  s += wire([[80, 320], [460, 320]]);
  s += wire([[330, 120], [330, 195]]) + meter(330, 220, 'V') + wire([[330, 238], [330, 320]]) + dot(330, 120) + dot(330, 320);
  // estator em estrela
  const N = [680, 220];
  s += term(466, 120) + term(466, 320) + term(866, 220);
  s += wire([[472, 120], [540, 120]]) + comp('R', 540, 120, N[0], N[1], { label: 'R_1', lpos: [14, -22], lanchor: 'start' });
  s += wire([[472, 320], [540, 320]]) + comp('R', 540, 320, N[0], N[1], { label: 'R_1', lpos: [14, 22], lanchor: 'start' });
  s += comp('R', N[0], N[1], 860, 220, { label: 'R_1' }) + dot(N[0], N[1]);
  s += t(866, 250, 'terminal livre', { size: 14, fill: C.muted });
  s += t(680, 60, 'Estator ligado em estrela (Y)', { size: 16, weight: 700, fill: C.blue });
  s += t(210, 60, 'Fonte CC com medidores', { size: 16, weight: 700, fill: C.blue });
  s += t(500, 440, 'Dois enrolamentos em série:  2·R_1 = V_{CC} / I_{CC}', { size: 18, weight: 600, fill: C.blue });
  return svgWrap(960, 470, s);
};

figs['questoes/diagrama-fasorial-gerador.png'] = () => {
  let s = '';
  const ox = 120; const oy = 330; const vt = 420; const phi = (-36.87 * Math.PI) / 180; const ia = 230;
  const ax = ox + ia * Math.cos(phi); const ay = oy - ia * Math.sin(phi);
  const xs = 210; // |jXs Ia| em pixels
  const ex = ox + vt + xs * Math.cos(phi + Math.PI / 2); const ey = oy - xs * Math.sin(phi + Math.PI / 2);
  const vec = (x1, y1, x2, y2, col, w = 3.5) => {
    const a = Math.atan2(y2 - y1, x2 - x1); const hx = x2 - 16 * Math.cos(a); const hy = y2 - 16 * Math.sin(a);
    return line(x1, y1, hx, hy, { stroke: col, w }) + `<path d="M ${x2} ${y2} L ${hx - 7 * Math.sin(a)} ${hy + 7 * Math.cos(a)} L ${hx + 7 * Math.sin(a)} ${hy - 7 * Math.cos(a)} Z" fill="${col}"/>`;
  };
  s += line(60, oy, 700, oy, { stroke: C.grid, w: 1.5 });
  s += vec(ox, oy, ox + vt, oy, C.ink) + t(ox + vt / 2, oy + 24, 'V_φ', { size: 20 });
  s += vec(ox, oy, ax, ay, C.sky) + t(ax + 14, ay + 18, 'I_a', { size: 20, fill: C.sky, anchor: 'start' });
  s += vec(ox + vt, oy, ex, ey, C.green) + t((ox + vt + ex) / 2 + 18, (oy + ey) / 2 + 6, 'jX_s I_a', { size: 20, fill: C.green, anchor: 'start' });
  s += vec(ox, oy, ex, ey, C.red, 4) + t((ox + ex) / 2 - 20, (oy + ey) / 2 - 16, 'E_A', { size: 22, fill: C.red, weight: 700 });
  const dAng = Math.atan2(oy - ey, ex - ox);
  s += `<path d="M ${ox + 150} ${oy} A 150 150 0 0 0 ${ox + 150 * Math.cos(dAng)} ${oy - 150 * Math.sin(dAng)}" fill="none" stroke="${C.red}" stroke-width="2"/>` + t(ox + 175, oy - 30, 'δ', { size: 20, fill: C.red });
  s += `<path d="M ${ox + 90} ${oy} A 90 90 0 0 1 ${ox + 90 * Math.cos(phi)} ${oy - 90 * Math.sin(phi)}" fill="none" stroke="${C.sky}" stroke-width="2"/>` + t(ox + 108, oy + 34, 'θ', { size: 20, fill: C.sky });
  s += t(380, 40, 'Gerador síncrono, fator de potência atrasado', { size: 17, weight: 700, fill: C.blue });
  return svgWrap(760, 500, s);
};

// ---------- Ilustrações (capa e índice) ----------
figs['aula-1/capa-enrolamento-motor.jpg'] = () => {
  let s = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#021b4a"/><stop offset="0.55" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.sky}"/></linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.5" r="0.45"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <linearGradient id="cu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3c18b"/><stop offset="0.5" stop-color="${C.copper}"/><stop offset="1" stop-color="#8a4a17"/></linearGradient></defs>`;
  s += '<rect width="1600" height="900" fill="url(#bg)"/><rect width="1600" height="900" fill="url(#glow)"/>';
  for (let k = 0; k < 7; k += 1) {
    let d = `M 0 ${640 + k * 26}`;
    for (let x = 0; x <= 1600; x += 20) d += ` L ${x} ${(640 + k * 26 + 34 * Math.sin((x / 1600) * 6 * Math.PI + k * 0.9)).toFixed(1)}`;
    s += `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${0.05 + k * 0.015}" stroke-width="2"/>`;
  }
  const cx = 1150; const cy = 450;
  s += `<circle cx="${cx}" cy="${cy}" r="360" fill="#0b2a5e" stroke="#9fb4d6" stroke-width="6"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="300" fill="#284a80"/>`;
  const n = 36;
  for (let k = 0; k < n; k += 1) {
    const a = (360 * k) / n;
    s += `<g transform="rotate(${a} ${cx} ${cy})"><rect x="${cx - 13}" y="${cy - 345}" width="26" height="92" rx="8" fill="url(#cu)"/><rect x="${cx - 13}" y="${cy - 345}" width="26" height="92" rx="8" fill="none" stroke="#5c2e0c" stroke-opacity="0.5"/></g>`;
  }
  for (let k = 0; k < 12; k += 1) {
    const a = (360 * k) / 12;
    s += `<g transform="rotate(${a} ${cx} ${cy})"><path d="M ${cx - 70} ${cy - 352} Q ${cx} ${cy - 420} ${cx + 70} ${cy - 352}" fill="none" stroke="url(#cu)" stroke-width="16" stroke-linecap="round"/></g>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="230" fill="#0d2350" stroke="#9fb4d6" stroke-width="3"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="210" fill="#5d6f8c"/>`;
  for (let k = 0; k < 28; k += 1) { const a = (360 * k) / 28; s += `<g transform="rotate(${a} ${cx} ${cy})"><rect x="${cx - 7}" y="${cy - 204}" width="14" height="48" rx="5" fill="#d7dee9"/></g>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="70" fill="#2b3a55" stroke="#c9d3e3" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="26" fill="#c9d3e3"/>`;
  s += `<path d="M ${cx - 280} ${cy + 250} A 380 380 0 0 1 ${cx - 330} ${cy - 210}" fill="none" stroke="#7fd3ff" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  return svgWrap(1600, 900, s);
};

figs['aula-1/estudo-bancada.png'] = () => {
  let s = `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4fb"/><stop offset="1" stop-color="#dbe8f6"/></linearGradient></defs>`;
  s += '<rect width="1200" height="900" fill="url(#wall)"/>';
  s += '<rect y="560" width="1200" height="340" fill="#c99a6b"/><rect y="560" width="1200" height="16" fill="#b5875a"/>';
  // notebook
  s += '<rect x="300" y="200" width="560" height="350" rx="18" fill="#2b3a55"/><rect x="322" y="222" width="516" height="306" rx="6" fill="#fff"/>';
  s += '<path d="M 250 552 L 910 552 L 960 600 L 200 600 Z" fill="#9aa7bb"/><rect x="520" y="560" width="120" height="10" rx="4" fill="#7d889b"/>';
  // gráfico na tela
  const gx = 360; const gy = 250; const gw = 440; const gh = 240;
  s += line(gx, gy + gh, gx + gw, gy + gh, { w: 2 }) + line(gx, gy, gx, gy + gh, { w: 2 });
  for (let k = 1; k < 5; k += 1) s += line(gx, gy + (gh * k) / 5, gx + gw, gy + (gh * k) / 5, { stroke: C.grid, w: 1 });
  const pts = curva((sl) => [(1 - sl), CASO.T(sl)], 1, 0.0005, 300).map(([u, v]) => `${(gx + u * gw).toFixed(1)},${(gy + gh - (v / 700) * gh).toFixed(1)}`).join(' ');
  s += `<polyline points="${pts}" fill="none" stroke="${C.blue}" stroke-width="4"/>`;
  // calculadora
  s += '<g transform="rotate(-12 1010 700)"><rect x="940" y="610" width="150" height="210" rx="14" fill="#34495e"/><rect x="958" y="628" width="114" height="40" rx="4" fill="#cfe8d0"/>';
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 3; c += 1) s += `<rect x="${960 + c * 38}" y="${684 + r * 32}" width="30" height="24" rx="5" fill="${r === 3 && c === 2 ? C.copper : '#ecf0f1'}"/>`;
  s += '</g>';
  // caderno e lápis
  s += '<g transform="rotate(8 150 720)"><rect x="40" y="620" width="260" height="200" rx="8" fill="#fff" stroke="#c5cfdc" stroke-width="2"/>';
  for (let k = 0; k < 6; k += 1) s += line(64, 660 + k * 26, 276, 660 + k * 26, { stroke: '#c9d8ee', w: 2 });
  s += t(170, 672, 'T = P / ω', { size: 22, fill: C.blue, italic: true }) + t(170, 724, 's = (n_s − n) / n_s', { size: 20, fill: C.blue, italic: true });
  s += '</g><g transform="rotate(-30 420 780)"><rect x="330" y="770" width="190" height="16" rx="4" fill="#f4c542"/><path d="M 520 770 L 545 778 L 520 786 Z" fill="#e8c9a0"/><rect x="316" y="770" width="16" height="16" fill="#e57373"/></g>';
  // caneca
  s += '<rect x="880" y="470" width="90" height="100" rx="12" fill="#ffffff" stroke="#c5cfdc" stroke-width="3"/><path d="M 970 495 q 40 0 40 30 q 0 30 -40 30" fill="none" stroke="#c5cfdc" stroke-width="10"/><rect x="890" y="480" width="70" height="14" rx="6" fill="#8d5a3b"/>';
  return svgWrap(1200, 900, s);
};

/* ====================== render ====================== */
const fontCss = `@font-face{font-family:'Open Sans';src:url('file://${ROOT}/fonts/open-sans.woff2') format('woff2');font-weight:300 800}`;
const chrome = ['/ms-playwright/chromium-1208/chrome-linux64/chrome', '/ms-playwright/chromium-1205/chrome-linux64/chrome'].find((p) => existsSync(p));
const only = process.argv.slice(2);
for (const [name, fn] of Object.entries(figs)) {
  if (only.length && !only.some((o) => name.includes(o))) continue;
  const svg = fn();
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  const base = name.replace(/[/.]/g, '_');
  const html = join(TMP, `${base}.html`);
  writeFileSync(join(TMP, `${base}.svg`), svg);
  writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}html,body{margin:0;padding:0;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`);
  const png = join(TMP, `${base}.png`);
  execFileSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=${w},${+h + 200}`, `--screenshot=${png}`, '--virtual-time-budget=2000', `file://${html}`], { stdio: 'ignore' });
  const dest = join(OUT, name);
  mkdirSync(dirname(dest), { recursive: true });
  const crop = ['-crop', `${w}x${h}+0+0`, '+repage'];
  if (dest.endsWith('.jpg')) execFileSync('convert', [png, ...crop, '-quality', '84', dest]);
  else execFileSync('convert', [png, ...crop, '-strip', '-define', 'png:compression-level=9', dest]);
  console.log('ok', name, `${w}x${h}`);
}
console.log(readdirSync(TMP).length, 'arquivos temporários em', TMP);
