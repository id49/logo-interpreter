# Auditoria de requisitos e validação

Data da auditoria: 15/09/2026. Implementação local em `/Users/tulio/Projects/logo-interpreter`. A pasta foi inspecionada vazia antes das alterações. Nenhum conteúdo prévio ou arquivo `sources/` foi modificado.

## Resultado

A v1 implementa o escopo aprovado. As escolhas que precisavam de semântica explícita estão em [SPECIFICATION.md](SPECIFICATION.md): escopo dinâmico, variáveis não atribuídas como erro, sinais numéricos, aridade fixa, listas literais, aliases sem colisão, limites e definição de passo. Não há compatibilidade integral declarada nem redução do escopo para acomodar testes.

## Matriz de aceite

| Requisito                                             | Implementação e evidência                                                                                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript, Turborepo e cinco diretórios aprovados    | Workspaces npm; configuração compartilhada; `npm run typecheck` e build passam em todos os pacotes.                                                                           |
| Interpretador independente do navegador, sem eval     | `packages/logo`: AST, escopos e portas de I/O. Testes rodam em Node, sem DOM. Worker separado no bundle.                                                                      |
| Números, palavras, listas, comentários e localização  | Testes de tokens, Unicode, BOM, CRLF, pontuação literal, listas aninhadas, sinais e delimitadores.                                                                            |
| Aritmética, comparações, parênteses e lógica          | Testes de precedência e cada operador; erros de tipo, divisão por zero, overflow, booleanos e ausência de coerção.                                                            |
| Procedimentos, argumentos, locais, recursão e retorno | Testes de definição anterior/posterior à chamada, fatorial, escopo dinâmico, sombreamento, saída e retorno ausente/não utilizado.                                             |
| Todos os comandos e aliases acordados                 | Registro com 41 nomes ingleses e 41 nomes portugueses, aliases e aridades. Exemplos de cada entrada executados em EN e PT; contratos de argumentos e erros por comportamento. |
| and/or/not em português e abreviações oficiais        | `e/ou/nao`, `fd/rt`, `pf/pd` e lista completa documentada; teste exige que um alias nunca tenha dois significados.                                                            |
| Três modos × dois idiomas                             | Matriz de todo o vocabulário: nomes completos, abreviações, caixa e idioma não permitido; scripts equivalentes emitem resultados idênticos.                                   |
| Sem reescrita, sem prefixos adivinhados               | Testes de rejeição, sugestões e UI alterando seletores sem modificar conteúdo.                                                                                                |
| Colisões e indentação                                 | Vocabulários dos dois idiomas reservados; nomes duplicados/parâmetros duplicados diagnosticados; espaços não bloqueiam sintaxe, inclusive Unicode.                            |
| Editor com syntax highlight, erros e instrução        | CodeMirror com cores, gutter, diagnóstico localizado e linha em execução; testes de UI e execução em passos; acompanhamento por rolagem.                                      |
| Novo, Abrir, Salvar, proteção contra perda            | Testes reais de upload/download, editar/salvar/reabrir/executar, Unicode+BOM+CRLF, recusar e aceitar substituição de arquivos e exemplos.                                     |
| Exemplos e guia                                       | Quinze exemplos na interface, organizados em três níveis de complexidade; 41 arquivos `.logo` e referência curta gerados do mesmo registro do interpretador.                  |
| Interface e comando independentes                     | Interface PT/EN, guia e diagnósticos localizados; testes de seletores independentes.                                                                                          |
| Responsividade e acessibilidade básica                | Desktop e viewport 390×844 revisados; sem overflow horizontal; controles rotulados, foco visível, regiões de estado/erro/console.                                             |
| Tartaruga central, norte e coordenadas lógicas        | Testes de estado inicial, quadrado, inversão de movimento, normalização angular e independência do DPR.                                                                       |
| Sair e voltar sem wrap                                | Teste de movimento para 100.000 unidades e retorno.                                                                                                                           |
| Caneta, cores, espessura, home e visibilidade         | Testes de operações, propriedades de segmentos, todos os formatos de cor válidos e erros numéricos/cor/espessura.                                                             |
| Clean, clearscreen e nova execução                    | Testes de distinção de estados, reinício de execução e desenho preservado após Parar.                                                                                         |
| Aparência ilustrada/triângulo sem alterar estado      | Testes de imutabilidade do renderer e comparação de snapshots PNG nas duas aparências; alternar e voltar preserva imagem.                                                     |
| Worker, comunicação e recuperação                     | Playwright com Worker real, input IDs, erros, stop, término forçado de Worker ocupado e nova VM.                                                                              |
| Executar/Pausar/Continuar/Passo/Parar                 | Controller testado com relógio simulado e UI real; corpo de repeat/procedimento, argumentos dentro do passo, créditos e pausa explícita.                                      |
| Velocidade mutável até instantânea                    | Testes alteram atraso já em andamento e velocidade durante pausa; checkpoints em blocos e teste de saída intensa cancelável.                                                  |
| Limites localizados e loops sem travar UI             | Limites de instrução, recursão, reporter recursivo, repetição vazia e expansão de dados; botão continua utilizável em loop com console intenso.                               |
| Pausas/entrada/atrasos fora do custo                  | Orçamento mede trabalho, sem timeout de relógio; testes com esperas longas simuladas e contador preservado após múltiplas leituras.                                           |
| readword/readlist/readchar                            | Leituras válidas consecutivas, Unicode, input inválido com correção, pausa durante entrada, passos, stop e retomada em UI e portas simuladas.                                 |
| Bundle real                                           | Teste separado serve `dist` com Vite preview, verifica URL do Worker em `/assets/` e executa procedimento, desenho e entrada.                                                 |
| CI com lint, tipos, testes e build                    | `.github/workflows/ci.yml` executa verificação completa, Chromium, E2E, smoke de produção e formatação.                                                                       |
| Documentação, decisões e auditoria                    | README, SPECIFICATION, ARCHITECTURE, COMMANDS, exemplos e este documento.                                                                                                     |

## Verificações locais

- `npm run check`: lint, tipos (incluindo testes E2E), **244 testes de unidade/contrato**, build de todos os pacotes e bundle Vite.
- `npm run test:e2e`: **19 testes Chromium**, incluindo snapshots de ambas as aparências, arquivos, controles, entrada e Workers reais.
- `npm run test:production`: **1 teste Chromium** contra o bundle compilado.
- `npm run format:check`: arquivos de código, configuração e documentação formatados.
- `npm audit`: nenhuma vulnerabilidade reportada no lockfile instalado na revisão.
- Referências visuais: `tests/visual/turtle-square.png` e `tests/visual/triangle-square.png`, viewport fixo e DPR 1; sem texto rasterizado para reduzir diferenças de sistema operacional.
- Além dos exemplos por comando, o parser recebeu 500 entradas pseudoaleatórias determinísticas e casos de profundidade, espaços Unicode e expressões extensas; erros permanecem diagnósticos Logo.

As contagens refletem casos de comportamento e de erro, não metas de porcentagem de cobertura.

## Limitações e verificações não realizadas

- A CI está configurada, mas não foi executada em GitHub Actions: não foi solicitado criar repositório remoto. Foram executados localmente os comandos equivalentes.
- Automação de navegador executada em Chromium/macOS. Firefox, Safari, leitores de tela e dispositivos físicos não foram validados nesta entrega. A responsividade foi verificada por viewport móvel em Chromium.
- O dialeto tem limites explícitos de código, dados, instruções e recursão; precisão numérica é IEEE-754. Ele não detecta previamente todos os loops.
- O Worker produz movimentos discretos, conforme escopo; a tartaruga não anima dentro de um segmento. No modo instantâneo, o realce intermediário é amostrado para preservar responsividade.
- Arquivos modificados são salvos em UTF-8 com LF; o conteúdo bruto de arquivos não editados é preservado. O produto não persiste automaticamente código entre sessões.
- A validação visual é controlada para Canvas 2D e as duas aparências. Não se declara equivalência de rasterização entre todos os navegadores.

## Etapas realizadas

1. Base de workspaces, TypeScript, Turborepo e CI.
2. Operações da tartaruga e quadrado ponta a ponta.
3. Linguagem completa do escopo, procedimentos, idiomas e modos.
4. Editor, arquivos, console, exemplos, tradução da interface e aparência.
5. Limites, cancelamento, testes de Worker/produção, regressões visuais e esta auditoria.

## Ampliação dos exemplos

O catálogo passou de 4 para 15 programas, cinco por nível (Iniciante, Intermediário e Avançado). Testes executam todos os exemplos nos dois idiomas em modo Strict e comparam as operações de desenho. `npm run check` passou com 244 testes. A validação de navegador desta alteração executou os dois testes selecionados por `--grep examples`, cobrindo grupos, idiomas, execução de árvore/Koch e proteção de alterações não salvas. Os 19 testes completos e o teste de produção acima descrevem a validação da entrega inicial.

## Navegação pelo grid

Arraste com captura de ponteiro para mouse/toque, botão Centralizar vista e atalhos de teclado implementados. O renderer reposiciona desenho, eixos e linhas do grid juntos, cobrindo a área visível mesmo com a origem fora da tela. Testes verificam transformação, preservação do estado Logo, captura/liberação, cancelamento, botões secundários e teclado. `npm run check` passou com 248 testes. Arraste e centralização foram verificados visualmente na prévia aberta, com o desenho preservado e coordenadas inalteradas. Toque foi implementado com Pointer Events; não foi testado em dispositivo físico.
