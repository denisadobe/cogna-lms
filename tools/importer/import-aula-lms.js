/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import bannerParser from './parsers/banner.js';
import indiceParser from './parsers/indice.js';
import linhaDoTempoParser from './parsers/linha-do-tempo.js';
import sanfonaParser from './parsers/sanfona.js';
import abasParser from './parsers/abas.js';
import blocoDeCodigoParser from './parsers/bloco-de-codigo.js';
import comparadorImagensParser from './parsers/comparador-imagens.js';
import videoParser from './parsers/video.js';
import embedParser from './parsers/embed.js';
import imagemParser from './parsers/imagem.js';
import botaoExpansivelParser from './parsers/botao-expansivel.js';
import citacaoParser from './parsers/citacao.js';
import galeriaParser from './parsers/galeria.js';
import folhaDeCreditosParser from './parsers/folha-de-creditos.js';
import olhoParser from './parsers/olho.js';
import quadroBoxParser from './parsers/quadro-box.js';
import tabelaParser from './parsers/tabela.js';
import formulaParser from './parsers/formula.js';
import questaoParser from './parsers/questao.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/cleanup.js';
import sectionsTransformer from './transformers/sections.js';
import metadataTransformer from './transformers/metadata.js';

// PARSER REGISTRY
const parsers = {
  banner: bannerParser,
  indice: indiceParser,
  'linha-do-tempo': linhaDoTempoParser,
  sanfona: sanfonaParser,
  abas: abasParser,
  'bloco-de-codigo': blocoDeCodigoParser,
  'comparador-imagens': comparadorImagensParser,
  video: videoParser,
  embed: embedParser,
  imagem: imagemParser,
  'botao-expansivel': botaoExpansivelParser,
  citacao: citacaoParser,
  galeria: galeriaParser,
  'folha-de-creditos': folhaDeCreditosParser,
  olho: olhoParser,
  'quadro-box': quadroBoxParser,
  tabela: tabelaParser,
  formula: formulaParser,
  questao: questaoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'aula-lms',
  description: 'Página de aula digital gerada a partir do documento Word da aula',
  blocks: Object.keys(parsers).map((name) => ({
    name,
    instances: [`[data-bloco="${name}"]`],
  })),
  sections: [
    { id: 'secoes', name: 'Seções da página', selector: ['main > section:not([data-bloco])'] },
    { id: 'metadados', name: 'Metadados da aula', selector: ['head meta'] },
  ],
};

// TRANSFORMER REGISTRY (sections before metadata so the metadata block stays last)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
  metadataTransformer,
];

// source documents live under this path on the local preview server
const FONTES_PREFIX = '/tools/importer/fontes';

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Finds block instances in document order so parsers run top to bottom.
 */
function findBlocksOnPage(document, template) {
  const selector = template.blocks.flatMap((b) => b.instances).join(', ');
  return [...document.querySelectorAll(selector)].map((element) => ({
    name: element.dataset.bloco,
    selector: `[data-bloco="${element.dataset.bloco}"]`,
    element,
  }));
}

/**
 * Images hosted by this project (/assets/...) stay root-relative so they resolve
 * both in local preview and on the published site.
 */
function relativizeLocalImages(main, originalURL) {
  const { origin } = new URL(originalURL);
  main.querySelectorAll('img[src]').forEach((img) => {
    if (img.src.startsWith(`${origin}/`)) img.src = img.src.slice(origin.length);
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2-3. parse blocks in document order
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name}:`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (sections, metadata, attribute cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. built-in rules
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    relativizeLocalImages(main, params.originalURL);

    // 6. path: strip the fontes prefix and extension
    const rawPath = new URL(params.originalURL).pathname
      .replace(FONTES_PREFIX, '')
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
