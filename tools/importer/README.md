# Aulas digitais: do Word para páginas

Fluxo: **documento Word da aula → fonte HTML estruturada (`fontes/`) → script de importação → páginas (`content/`)**.

O agente lê o Word, escreve uma fonte por página (uma por seção da aula) e roda a importação.
`tools/` está no `.hlxignore`: nada daqui é publicado.

## Estrutura das páginas

```
/<disciplina>/unidade-N/aula-N/nav                      sumário da aula (ordem das seções, lido pelo cabeçalho/rodapé)
/<disciplina>/unidade-N/aula-N/<titulo-da-aula>         abertura (banner, videoaula, índice, informações)
/<disciplina>/unidade-N/aula-N/ponto-de-partida
/<disciplina>/unidade-N/aula-N/vamos-comecar
/<disciplina>/unidade-N/aula-N/siga-em-frente
/<disciplina>/unidade-N/aula-N/vamos-exercitar
/<disciplina>/unidade-N/aula-N/saiba-mais
/<disciplina>/unidade-N/aula-N/teste-seus-conhecimentos questões pós-aula do banco
/<disciplina>/unidade-N/aula-N/referencias
```

O caminho da página é o caminho da fonte sem o prefixo `/tools/importer/fontes` e sem `.html`.

## Metadados (`<head>` da fonte)

| `<meta name>` | Uso |
|---|---|
| `description` | descrição da página |
| `nav` | caminho do sumário da aula (ativa cabeçalho com progresso e Anterior/Próxima) |
| `disciplina`, `unidade`, `aula`, `secao`, `ordem`, `autor`, `palavras-chave` | dados para o LMS montar o passo a passo |
| `theme` | `editora` para o tema azul; vazio = tema Cogna (roxo) |
| `navegacao` | `off` esconde cabeçalho/rodapé (a página também aceita `?lms` na URL) |

## Seções

Cada `<section>` de primeiro nível vira uma seção da página. `data-estilo="light"` (ou `dark`) aplica fundo.

## Componentes

Marque o elemento com `data-bloco="<nome>"` e, se quiser, `data-variante="a, b"`.
Formato padrão: filhos diretos são **linhas** (`<div>`), filhos das linhas são **células** (`<div>`).

| Word | Componente | Fonte |
|---|---|---|
| Título da aula / da seção | `banner` | `<header data-bloco="banner"><p>rótulo</p><h1>título</h1><p><em>chamada</em></p><img></header>` |
| "Figura N \| …" + imagem + "Fonte: …" | `imagem` (`pequena`, `sem-borda`) | `<figure data-bloco="imagem"><figcaption>…</figcaption><img alt><p>Fonte: …</p></figure>` |
| "Tabela N \| …" + tabela + "Fonte: …" | `tabela` (`centralizada`, `primeira-coluna`, `sem-cabecalho`) | `<figure data-bloco="tabela"><figcaption>…</figcaption><table>…</table><p>Fonte: …</p></figure>` |
| Equação | `formula` (`destaque`, `esquerda`) | `<div data-bloco="formula"><p data-rotulo="(1)">LaTeX</p></div>` |
| Passo a passo / procedimento | `linha-do-tempo` (`etapas`, `alternada`) | linhas: marco \| conteúdo |
| TEXTO: Videoaula | `video` | `<div data-bloco="video"><p><a href>URL</a></p><img capa><p>título</p></div>` |
| Questões do banco | `questao` | ver abaixo |
| Destaques (atenção, dica, exemplo…) | `quadro-box` (`atencao`, `importante`, `dica`, `exemplo`, `reflita`, `saiba-mais`) | uma linha por quadro (uma célula cada) |
| Pergunta provocativa / ideia-chave | `olho` | linhas: título \| texto |
| Conteúdo expansível | `sanfona` (`multipla`) | linhas: título \| conteúdo |
| Conteúdos paralelos | `abas` | linhas: título \| conteúdo |
| Complemento em janela | `botao-expansivel` | linhas: rótulo do botão \| conteúdo |
| Sequência de imagens | `galeria` (`foto`) | linhas: imagem \| legenda |
| Antes × depois | `comparador-imagens` (`diagrama`) | linha 1: imagem \| imagem; linha 2: rótulo \| rótulo |
| Citação | `citacao` | linhas: texto \| autor |
| Código | `bloco-de-codigo` | linhas: `<pre><code>` \| linguagem |
| Simulador / conteúdo externo | `embed` (`alto`, `quadrado`) | `<p><a href>URL</a></p><p>título</p>` |
| Lista de tópicos | `indice` | título + lista de links (sem links: gera a partir dos h2) |
| Créditos editoriais | `folha-de-creditos` | 1ª linha: título; demais: rótulo \| texto (nota centralizada: rótulo vazio) |

A tabela é gravada como legenda | tabela inteira numa célula | fonte, formato editável no Universal Editor.
Os campos da questão são gravados com nomes sem acento (`texto-base`, `referencia`, `resolucao`, `a`…`e`, `gabarito`).
Os modelos do Universal Editor ficam em `ue/models` (veja `ue/README.md`).

Fórmulas no meio do texto: `\( ... \)`. Equação isolada dentro de outro componente: parágrafo `\[ ... \]`.

### Questão

```html
<section data-bloco="questao">
  <div data-campo="Tipo">Múltipla escolha simples | Múltipla escolha complexa | Asserção-razão | Discursiva</div>
  <div data-campo="Dificuldade">Intermediário</div>
  <div data-campo="Bloom">Análise</div>
  <div data-campo="Texto-base"><p>…</p><p>I. …</p><p>PORQUE</p><p>II. …</p></div>
  <div data-campo="Referência"><p>…</p></div>
  <div data-campo="Enunciado"><p>…</p></div>
  <div data-campo="A"><p>…</p></div> … <div data-campo="E"><p>…</p></div>
  <div data-campo="Gabarito"><p>A) …</p></div>          <!-- discursiva: "Resposta esperada" -->
  <div data-campo="Resolução"><p>…</p><p>\[ LaTeX \]</p></div>
</section>
```

Ao responder, a página dispara o evento `questao:respondida` e envia `postMessage` ao LMS (quando a aula está em iframe).

## Rodar a importação

1. Liste as URLs das fontes (servidas pela pré-visualização local) em `urls-aula-lms.txt`.
2. Gere o bundle de `import-aula-lms.js` e rode a importação em lote com `--force` para regravar páginas.
3. As imagens ficam em `/assets/aulas/<disciplina>/unidade-N/...` e são referenciadas por caminho absoluto do site.
