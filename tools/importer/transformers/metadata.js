/* eslint-disable */
/* global WebImporter */

// metadados de aula lidos de <meta name="..."> na fonte
// (chaves em minúsculas: é como o EDS as expõe em <meta name>)
const CAMPOS = {
  description: 'description',
  nav: 'nav',
  theme: 'theme',
  template: 'template',
  navegacao: 'navegacao',
  disciplina: 'disciplina',
  unidade: 'unidade',
  aula: 'aula',
  secao: 'secao',
  ordem: 'ordem',
  autor: 'autor',
  'palavras-chave': 'keywords',
};

/**
 * Metadata: cria o bloco Metadata ao final da página com título e metadados da aula
 * (disciplina, unidade, aula, seção e ordem ajudam o LMS a montar o passo a passo).
 */
export default function transform(hookName, element, { document }) {
  if (hookName !== 'afterTransform') return;
  const meta = {};
  const title = document.querySelector('title');
  if (title) meta.title = title.textContent.trim();
  Object.entries(CAMPOS).forEach(([name, label]) => {
    const tag = document.querySelector(`meta[name="${name}"]`);
    if (tag && tag.content) meta[label] = tag.content;
  });
  const main = element.querySelector('main') || element;
  main.append(document.createElement('hr'));
  main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
}
