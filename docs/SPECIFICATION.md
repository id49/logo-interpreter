# Especificação v1 e decisões

## Objetivo e escopo aprovado

Ambiente de aprendizagem Logo para uma tartaruga, com programação textual, dados, procedimentos e controle observável de execução. A implementação usa TypeScript e Turborepo. Não requer publicar o site nem criar repositório remoto. A pasta estava vazia na inspeção inicial; nenhum arquivo `sources/` foi criado ou alterado. O nome de interface escolhido é Ateliê Logo; “Fabiana” não foi tratado como requisito.

Fora da v1: múltiplas tartarugas, objetos, eventos de mouse, concorrência da linguagem, som, rede, arquivos acessados pelo programa, avaliação dinâmica de listas e compatibilidade integral Berkeley/SuperLogo. Também não há animação contínua dentro de um movimento: cada operação é discreta.

## Dados e sintaxe

- Números são valores finitos IEEE-754. Decimais, notação exponencial e sinais são aceitos. Divisão por zero e resultados não finitos são erros.
- `"palavra` é uma palavra literal, sem aspas de fechamento; `"` sozinho é a palavra vazia. Espaços delimitam palavras no código. `readword` pode produzir uma palavra com espaços.
- `:nome` lê uma variável. Nomes de variáveis começam com letra Unicode ou `_`, seguidos de letras, números e `_`. Procedimentos podem também conter hífen. Variáveis são insensíveis a caixa em todos os modos. No modo Flexível, nomes e chamadas de procedimentos também são insensíveis a caixa. Nos modos estritos, nomes e chamadas de procedimentos precisam estar em minúsculas, assim como os comandos e delimitadores do vocabulário.
- `[um 2 [três quatro]]` é uma lista de dados; palavras não são executadas, variáveis não são consultadas dentro de listas literais. `[:x "a]` contém as palavras `:x` e `"a`, preservando seus prefixos. Pontuação adjacente permanece parte da palavra: `[1+2 :x-2]` contém duas palavras. Números completos continuam números. As listas podem ser aninhadas e são tratadas como valores imutáveis pelo programa.
- `;` inicia comentário até o fim da linha, inclusive dentro de listas. BOM UTF-8 inicial e CRLF são aceitos. Posição do diagnóstico usa linha/coluna começando em 1 e offsets UTF-16, como o editor.
- Aritmética infixa: `+ - * /`. Precedência: sinais unários, multiplicação/divisão, adição/subtração, comparações. Operadores de mesma precedência associam à esquerda. Parênteses agrupam uma expressão; não alteram aridade de comandos.
- Sinais colados ao operando e separados do valor anterior iniciam outro argumento: `setxy -10 -20`. Para subtração infixa, use `10 - 2` ou `10-2`; `10 -2` são dois valores. A mesma regra vale para `+`. Isto evita adivinhar a intenção entre coordenadas negativas e subtração.
- Comparações: `= <> < > <= >=`. Igualdade/desigualdade exigem o mesmo tipo externo e comparam listas estruturalmente. Comparações de ordem exigem números. Não há conversão entre número, palavra, lista e booleano.
- Booleanos são produzidos pelas comparações e por `and/e`, `or/ou`, `not/nao`; não há literais booleanos especiais. Essas três operações são prefixas: `and :x > 0 :y > 0`. `and/or` avaliam os dois argumentos da esquerda para a direita (sem curto-circuito).
- `list/lista` e `sentence/frase` recebem exatamente dois argumentos; não há aridade variável nesta versão. `sentence` expande listas em apenas um nível. `item` indexa a partir de 1. Palavras são sequências de pontos de código Unicode, não de grafemas; um emoji composto pode ter mais de um caractere.
- Um valor solto é erro. Um comando desconhecido, aridade insuficiente/excedente, bloco não literal ou delimitador desbalanceado é erro em qualquer modo, mesmo dentro de um ramo não executado.

## Procedimentos e variáveis

```logo
to factorial :n
  if :n = 0 [output 1]
  output :n * factorial (:n-1)
end
print factorial 5
```

`to/aprenda nome :arg ...` ocupa uma linha de cabeçalho. O corpo termina em `end/fim` no nível superior. Definições só aparecem fora de blocos; são coletadas antes de analisar os corpos, permitindo chamadas anteriores à definição e recursão mútua. Definição repetida, argumento repetido e nome em qualquer vocabulário reservado são erros. Nomes completos e todas as abreviações dos dois idiomas ficam reservados para procedimentos, mesmo em modo estrito de um só idioma.

O escopo é **dinâmico**: ao ler uma variável, busca-se do procedimento atual para seus chamadores e, por último, no ambiente global. Parâmetros pertencem ao quadro local da chamada.

- `make/atribua "nome valor` atualiza a variável existente mais próxima; se não existir, cria uma global.
- `localmake/atribualocal "nome valor` cria ou atualiza no procedimento atual, podendo sombrear uma global. Fora de procedimento é erro.
- Ler variável nunca atribuída é erro localizado. Não se assume zero, palavra vazia ou valor padrão.
- `output/retorne valor` encerra o procedimento atual e produz um valor. O chamador precisa usar esse resultado. Usar como expressão um procedimento que termina sem resultado é erro.
- `stop/pare` encerra apenas o procedimento atual, inclusive de dentro de repetições. Na raiz, `stop` e `output` são erros. O botão Parar é o cancelamento de todo o programa.
- `repeat/repita` exige inteiro não negativo; `if/se` e `ifelse/senao` exigem booleano. Seus blocos precisam estar escritos entre colchetes no código. Uma lista em variável não pode ser executada.

## Idiomas e abreviações

O vocabulário completo, inclusive aliases portugueses acordados, é enumerado em [COMMANDS.md](COMMANDS.md). Os conjuntos são disjuntos quando o significado seria diferente. `fd/rt` e `pf/pd` são oficiais neste dialeto. `pd` significa **sempre paradireita**; não é abreviação de pendown. Para baixar a caneta use `pendown`, `baixecaneta` ou `bc`. Não adotamos `lt` para limpetela nem `se` para sentence, pois já significam left e if, respectivamente. Abreviações históricas não enumeradas não são aceitas.

Flexível aceita ambos os idiomas, abreviações enumeradas e qualquer caixa. Strict aceita somente nomes completos minúsculos do idioma selecionado. Strict + abreviações aceita também os atalhos desse idioma. Não há reescrita ou correção silenciosa. Sugestões são apenas diagnósticos. Palavras literais, nomes de cores e identificadores de usuário não são traduzidos. A interface tem seletor próprio; a linguagem do programa continua a mesma quando a interface muda.

## Tartaruga

Estado inicial: `(0, 0)`, direção `0°` para cima, caneta baixa, azul, espessura 2 e tartaruga visível. `90°` aponta à direita. `x` cresce à direita e `y` para cima. Direções são normalizadas em `[0,360)`. `home` move até a origem com as regras normais da caneta e aponta para cima.

Uma posição lógica não depende de pixels nem do dispositivo. O viewport mostra 600 unidades lógicas de largura, com altura proporcional à área disponível. A razão de pixels do dispositivo altera somente a nitidez. A tartaruga pode sair da área visível e voltar; não há quebra, rebatimento ou clipping do estado. O canvas naturalmente recorta a apresentação. A vista pode ser arrastada com mouse ou toque; o deslocamento da câmera é independente do estado Logo e se mantém ao executar novamente ou trocar a aparência. O botão Centralizar vista e a tecla Home zeram esse deslocamento. As setas movem a vista quando o canvas tem foco.

`clean/limpe` elimina segmentos, preservando o estado da tartaruga. `clearscreen/limpetela` também restaura posição e direção; preserva cor, espessura, caneta e visibilidade. Nova execução reinicializa tudo, inclusive variáveis. Parar preserva os segmentos já recebidos. Aparência ilustrada ou triângulo é apenas uma decisão de renderização.

Cores aceitas: black/preto, white/branco, red/vermelho, green/verde, blue/azul, yellow/amarelo, orange/laranja, purple/roxo, pink/rosa e gray/cinza; `#RRGGBB`; ou três inteiros RGB em `[0,255]`. Não se aceita CSS arbitrário. Espessura precisa ser finita e positiva.

## Execução e entrada

O programa executa em Worker novo, sem `eval`, com operações e I/O desacoplados do DOM. Uma instrução de comando pode ser chamada de movimento, atribuição, impressão, controle ou procedimento. `repeat/if/ifelse` e chamadas de procedimentos recebem seu próprio passo; em seguida, os comandos de seus corpos recebem passos individuais. Definições não são passos.

Argumentos são avaliados dentro do passo da instrução externa. Um procedimento usado para calcular um argumento pode executar seu corpo inteiro nesse passo; há checkpoints cooperativos e limites também nesse caso. Um repeat de corpo vazio não inventa instruções visíveis para cada iteração, mas consome orçamento de proteção.

Pausar interrompe antes da próxima instrução. O realce amarelo indica a instrução atual ou a próxima aguardando permissão. Passo libera uma instrução; Continuar mantém o estado e libera as próximas. Atraso pedagógico varia de 1.000 ms até zero. Alterar velocidade afeta uma espera em andamento. Em modo instantâneo há cessão ao event loop a cada bloco de no máximo 32 instruções; em argumentos/corpos vazios há checkpoint a cada 64 unidades de trabalho.

`readword` lê a linha exatamente como palavra; `readlist` lê uma lista a partir da linha **sem** colchetes externos (colchetes internos formam sublistas); `readchar` exige exatamente um ponto de código. A entrada usa uma porta assíncrona injetável e IDs de solicitação. Erros de entrada mantêm estado e permitem tentar novamente. IDs antigos são ignorados. Parar rejeita a espera e o aplicativo pode terminar o Worker imediatamente.

Quando um passo pede entrada, a resposta completa aquele mesmo passo. Se houver um Pausar explícito durante a espera, a resposta fica retida até Continuar ou um novo Passo. Programas não recebem uma entrada pela interface de `prompt` do navegador.

### Limites

- 100.000 unidades de instrução: comandos, chamadas de reporters e iterações vazias. O contador é acumulado por execução e não é zerado por entrada.
- Profundidade máxima de 128 chamadas de procedimento.
- Código até 200.000 unidades UTF-16; delimitadores e expressões até 128 níveis.
- Um dado até 10.000 unidades (caracteres UTF-16 de palavras mais nós da lista), e até 128 níveis.
- Console visível limitado a aproximadamente 100.000 caracteres, descartando o começo com marcador `[…]`.

Limites de instruções/recursão são configuráveis pela API para testes. Não se usa timeout de relógio para avaliar custo de processamento: pausa, espera de entrada e atraso de velocidade não consomem orçamento. Não se promete identificar todos os loops antes de executar; o limite de trabalho e o cancelamento impedem execução ilimitada. Precisão numérica é a de JavaScript; geometria que ultrapasse valores finitos é rejeitada.
