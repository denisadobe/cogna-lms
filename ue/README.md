# Universal Editor

As páginas são editadas no Universal Editor (UE) sobre o conteúdo do Document Authoring
(`*.ue.da.live`). A instrumentação segue o padrão do `aemsites/da-block-collection`.

## Arquivos

- `ue/models/blocks/<bloco>.json`: definição (`definitions`), campos do painel (`models`) e itens permitidos (`filters`) de cada bloco.
- `ue/models/section.json`: estilos de seção e lista de componentes que podem ser adicionados.
- `ue/models/page.json`: metadados da página (título, sumário da aula, tema, navegação, dados para o LMS).
- `component-definition.json`, `component-models.json`, `component-filters.json` (raiz): gerados. **Não editar à mão.**

Depois de alterar qualquer arquivo em `ue/models`, rode:

```sh
npm run build:json
```

## Tipos de bloco

| Tipo | Blocos |
|---|---|
| Simples (campos fixos) | banner, imagem, tabela, video, embed, indice, bloco-de-codigo, comparador-imagens, citacao, olho |
| Contêiner (itens com +) | sanfona, abas, linha-do-tempo, galeria, botao-expansivel, quadro-box, formula, folha-de-creditos |
| Chave-valor | questao |

Variações de bloco usam o campo `classes` (multiselect).

## Regras para os blocos

- Ao reconstruir o DOM, mova a instrumentação com `moveInstrumentation(de, para)` de `scripts/ue-utils.js`:
  bloco → mantém o próprio elemento; linha (item) → novo elemento do item; célula (campo) → elemento que exibe o campo.
- Campos cujo conteúdo é transformado (LaTeX da fórmula, link do vídeo/embed, título da aba, gabarito) são editados pelo painel de propriedades.
- `ue/scripts/ue.js` roda só no editor: mostra a aba/sanfona/slide/janela selecionada e deixa a resolução das questões visível.

## Teste local

`tools/ue-teste/simular-instrumentacao.js` aplica a instrumentação com os seletores dos modelos
e verifica se ela sobrevive à decoração dos blocos (instruções no próprio arquivo).
