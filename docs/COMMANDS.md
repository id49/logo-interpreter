# Referência de comandos / Command reference

Gerado por `npm run docs`. As abreviações abaixo são o vocabulário oficial **deste dialeto**. Todas as entradas possuem exemplos executados nos testes em inglês e português. Para executar os exemplos em inglês, selecione Flexível ou comandos English.

## forward / parafrente

Avança a distância informada.

Moves forward by the given distance.

- Argumentos: 1.
- Abreviações EN: fd. PT: pf.
- Instrução ou delimitador estrutural.

```logo
forward 80
```

## back / paratras

Recua a distância informada.

Moves backward by the given distance.

- Argumentos: 1.
- Abreviações EN: bk. PT: pt.
- Instrução ou delimitador estrutural.

```logo
back 40
```

## right / paradireita

Gira para a direita em graus.

Turns clockwise in degrees.

- Argumentos: 1.
- Abreviações EN: rt. PT: pd.
- Instrução ou delimitador estrutural.

```logo
right 90
```

## left / paraesquerda

Gira para a esquerda em graus.

Turns counterclockwise in degrees.

- Argumentos: 1.
- Abreviações EN: lt. PT: pe.
- Instrução ou delimitador estrutural.

```logo
left 90
```

## home / centro

Vai à origem e aponta para cima; desenha se a caneta estiver baixa.

Moves to the origin and faces up; draws if the pen is down.

- Argumentos: 0.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
forward 50 home
```

## setxy / mudexy

Vai às coordenadas x e y.

Moves to logical coordinates x and y.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
setxy 40 70
```

## setheading / mudedirecao

Define direção: 0 para cima, 90 para a direita.

Sets the heading: 0 is up and 90 is right.

- Argumentos: 1.
- Abreviações EN: seth. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
setheading 45
```

## penup / levantecaneta

Levanta a caneta.

Lifts the pen.

- Argumentos: 0.
- Abreviações EN: pu. PT: lc.
- Instrução ou delimitador estrutural.

```logo
penup forward 50
```

## pendown / baixecaneta

Baixa a caneta.

Lowers the pen.

- Argumentos: 0.
- Abreviações EN: nenhuma. PT: bc.
- Instrução ou delimitador estrutural.

```logo
penup forward 30 pendown forward 30
```

## setpencolor / mudecorcaneta

Define cor por nome, #RRGGBB ou lista RGB de 0 a 255.

Sets a named color, #RRGGBB, or an RGB list with integers from 0 to 255.

- Argumentos: 1.
- Abreviações EN: setpc. PT: mcc.
- Instrução ou delimitador estrutural.

```logo
setpencolor [30 120 200] forward 80
```

## setpensize / mudeespessura

Define espessura positiva em unidades lógicas.

Sets a positive pen width in logical units.

- Argumentos: 1.
- Abreviações EN: setps. PT: me.
- Instrução ou delimitador estrutural.

```logo
setpensize 3 forward 80
```

## clean / limpe

Apaga somente o desenho.

Erases the drawing only.

- Argumentos: 0.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
forward 50 clean
```

## clearscreen / limpetela

Apaga desenho e restaura posição e direção.

Erases the drawing and resets position and heading.

- Argumentos: 0.
- Abreviações EN: cs. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
forward 50 clearscreen
```

## showturtle / mostretartaruga

Mostra a tartaruga.

Shows the turtle.

- Argumentos: 0.
- Abreviações EN: st. PT: mt.
- Instrução ou delimitador estrutural.

```logo
showturtle
```

## hideturtle / ocultetartaruga

Oculta a tartaruga.

Hides the turtle.

- Argumentos: 0.
- Abreviações EN: ht. PT: ot.
- Instrução ou delimitador estrutural.

```logo
hideturtle
```

## print / escreva

Escreve um valor e termina a linha; listas sem colchetes externos.

Writes a value followed by a newline, without outer list brackets.

- Argumentos: 1.
- Abreviações EN: pr. PT: esc.
- Instrução ou delimitador estrutural.

```logo
print [Olá mundo]
```

## show / mostre

Escreve um valor e termina a linha; listas com colchetes.

Writes a value followed by a newline, including list brackets.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
show [Olá [mundo]]
```

## type / digite

Escreve sem terminar a linha.

Writes without a newline.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
type "Olá type "!
```

## readword / leiapalavra

Lê uma linha como palavra (pode conter espaços).

Reads one line as a word; spaces are preserved.

- Argumentos: 0.
- Abreviações EN: rw. PT: nenhuma.
- Produz um valor.

```logo
print readword
```

## readlist / leialista

Lê uma linha como lista de dados, sem colchetes externos.

Reads one line as a data list, without outer brackets.

- Argumentos: 0.
- Abreviações EN: rl. PT: nenhuma.
- Produz um valor.

```logo
show readlist
```

## readchar / leiacaractere

Lê exatamente um caractere Unicode.

Reads exactly one Unicode code point.

- Argumentos: 0.
- Abreviações EN: rc. PT: nenhuma.
- Produz um valor.

```logo
show readchar
```

## make / atribua

Atribui à variável existente mais próxima, ou cria global.

Updates the nearest existing variable or creates a global variable.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
make "lado 80 forward :lado
```

## localmake / atribualocal

Cria ou atualiza variável no procedimento atual.

Creates or updates a variable in the current procedure.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
to demo
localmake "x 10
print :x
end
demo
```

## repeat / repita

Repete um bloco um número inteiro não negativo de vezes.

Repeats a literal instruction block a nonnegative integer number of times.

- Argumentos: 2.
- Abreviações EN: rep. PT: rep.
- Instrução ou delimitador estrutural.

```logo
repeat 4 [forward 60 right 90]
```

## if / se

Executa bloco se a condição for verdadeira.

Runs a block when its condition is true.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
if 2 < 3 [forward 50]
```

## ifelse / senao

Escolhe entre dois blocos.

Chooses between two blocks using a boolean condition.

- Argumentos: 3.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
ifelse 2 = 3 [print "sim] [print "não]
```

## to / aprenda

Define procedimento; argumentos seguem o nome na mesma linha.

Defines a procedure; its parameters follow its name on the same line.

- Argumentos: cabeçalho: nome e zero ou mais parâmetros.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
to quadrado :lado
repeat 4 [forward :lado right 90]
end
quadrado 40
```

## end / fim

Termina definição de procedimento.

Ends a procedure definition.

- Argumentos: 0.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
to exemplo
print "Olá
end
exemplo
```

## output / retorne

Retorna um valor do procedimento atual.

Returns a value from the current procedure.

- Argumentos: 1.
- Abreviações EN: op. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
to dobro :n
output :n * 2
end
print dobro 4
```

## stop / pare

Encerra o procedimento atual sem retornar valor.

Exits the current procedure without a value.

- Argumentos: 0.
- Abreviações EN: nenhuma. PT: nenhuma.
- Instrução ou delimitador estrutural.

```logo
to exemplo
print "fim
stop
end
exemplo
```

## first / primeiro

Primeiro elemento da lista ou caractere da palavra não vazia.

Returns the first list item or word character; input must not be empty.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
show first [a b]
```

## last / ultimo

Último elemento da lista ou caractere da palavra não vazia.

Returns the last list item or word character; input must not be empty.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
show last "abc
```

## butfirst / menosprimeiro

Remove primeiro elemento ou caractere; exige dado não vazio.

Removes the first list item or word character; input must not be empty.

- Argumentos: 1.
- Abreviações EN: bf. PT: mp.
- Produz um valor.

```logo
show butfirst [a b]
```

## butlast / menosultimo

Remove último elemento ou caractere; exige dado não vazio.

Removes the last list item or word character; input must not be empty.

- Argumentos: 1.
- Abreviações EN: bl. PT: mu.
- Produz um valor.

```logo
show butlast "abc
```

## count / conte

Conta elementos da lista ou caracteres Unicode da palavra.

Counts list items or Unicode code points in a word.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
print count [a b c]
```

## item / elemento

Elemento na posição inteira, começando em 1.

Returns the item at an integer position starting at 1.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
show item 2 [a b c]
```

## list / lista

Cria lista com exatamente dois valores.

Creates a list containing exactly two values.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
show list "a [b c]
```

## sentence / frase

Concatena dois dados, expandindo listas em um nível.

Joins two values, flattening input lists by one level.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
show sentence [a b] [c d]
```

## and / e

Conjunção de dois booleanos, avaliados da esquerda para a direita.

Returns the conjunction of two booleans; both arguments are evaluated.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
print and 2 < 3 4 > 1
```

## or / ou

Disjunção de dois booleanos; ambos são avaliados.

Returns the disjunction of two booleans; both arguments are evaluated.

- Argumentos: 2.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
print or 2 = 3 4 > 1
```

## not / nao

Negação de um booleano.

Negates a boolean.

- Argumentos: 1.
- Abreviações EN: nenhuma. PT: nenhuma.
- Produz um valor.

```logo
print not 2 = 3
```
