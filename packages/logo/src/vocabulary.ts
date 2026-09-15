export type Language = 'en' | 'pt';
export type Mode = 'flexible' | 'strict' | 'strict-abbreviations';
export interface Options {
  language: Language;
  mode: Mode;
}
export interface Command {
  name: string;
  pt: string;
  arity: number;
  reporter: boolean;
  enShort: string[];
  ptShort: string[];
  help: string;
  example: string;
}
const c = (
  name: string,
  pt: string,
  arity: number,
  reporter: boolean,
  en: string,
  br: string,
  help: string,
  example: string,
): Command => ({
  name,
  pt,
  arity,
  reporter,
  enShort: en ? en.split(' ') : [],
  ptShort: br ? br.split(' ') : [],
  help,
  example,
});
export const commands: Command[] = [
  c('forward', 'parafrente', 1, false, 'fd', 'pf', 'Avança a distância informada.', 'forward 80'),
  c('back', 'paratras', 1, false, 'bk', 'pt', 'Recua a distância informada.', 'back 40'),
  c('right', 'paradireita', 1, false, 'rt', 'pd', 'Gira para a direita em graus.', 'right 90'),
  c('left', 'paraesquerda', 1, false, 'lt', 'pe', 'Gira para a esquerda em graus.', 'left 90'),
  c(
    'home',
    'centro',
    0,
    false,
    '',
    '',
    'Vai à origem e aponta para cima; desenha se a caneta estiver baixa.',
    'forward 50 home',
  ),
  c('setxy', 'mudexy', 2, false, '', '', 'Vai às coordenadas x e y.', 'setxy 40 70'),
  c(
    'setheading',
    'mudedirecao',
    1,
    false,
    'seth',
    '',
    'Define direção: 0 para cima, 90 para a direita.',
    'setheading 45',
  ),
  c('penup', 'levantecaneta', 0, false, 'pu', 'lc', 'Levanta a caneta.', 'penup forward 50'),
  c(
    'pendown',
    'baixecaneta',
    0,
    false,
    '',
    'bc',
    'Baixa a caneta.',
    'penup forward 30 pendown forward 30',
  ),
  c(
    'setpencolor',
    'mudecorcaneta',
    1,
    false,
    'setpc',
    'mcc',
    'Define cor por nome, #RRGGBB ou lista RGB de 0 a 255.',
    'setpencolor [30 120 200] forward 80',
  ),
  c(
    'setpensize',
    'mudeespessura',
    1,
    false,
    'setps',
    'me',
    'Define espessura positiva em unidades lógicas.',
    'setpensize 3 forward 80',
  ),
  c('clean', 'limpe', 0, false, '', '', 'Apaga somente o desenho.', 'forward 50 clean'),
  c(
    'clearscreen',
    'limpetela',
    0,
    false,
    'cs',
    '',
    'Apaga desenho e restaura posição e direção.',
    'forward 50 clearscreen',
  ),
  c('showturtle', 'mostretartaruga', 0, false, 'st', 'mt', 'Mostra a tartaruga.', 'showturtle'),
  c('hideturtle', 'ocultetartaruga', 0, false, 'ht', 'ot', 'Oculta a tartaruga.', 'hideturtle'),
  c(
    'print',
    'escreva',
    1,
    false,
    'pr',
    'esc',
    'Escreve um valor e termina a linha; listas sem colchetes externos.',
    'print [Olá mundo]',
  ),
  c(
    'show',
    'mostre',
    1,
    false,
    '',
    '',
    'Escreve um valor e termina a linha; listas com colchetes.',
    'show [Olá [mundo]]',
  ),
  c('type', 'digite', 1, false, '', '', 'Escreve sem terminar a linha.', 'type "Olá type "!'),
  c(
    'readword',
    'leiapalavra',
    0,
    true,
    'rw',
    '',
    'Lê uma linha como palavra (pode conter espaços).',
    'print readword',
  ),
  c(
    'readlist',
    'leialista',
    0,
    true,
    'rl',
    '',
    'Lê uma linha como lista de dados, sem colchetes externos.',
    'show readlist',
  ),
  c(
    'readchar',
    'leiacaractere',
    0,
    true,
    'rc',
    '',
    'Lê exatamente um caractere Unicode.',
    'show readchar',
  ),
  c(
    'make',
    'atribua',
    2,
    false,
    '',
    '',
    'Atribui à variável existente mais próxima, ou cria global.',
    'make "lado 80 forward :lado',
  ),
  c(
    'localmake',
    'atribualocal',
    2,
    false,
    '',
    '',
    'Cria ou atualiza variável no procedimento atual.',
    'to demo\nlocalmake "x 10\nprint :x\nend\ndemo',
  ),
  c(
    'repeat',
    'repita',
    2,
    false,
    'rep',
    'rep',
    'Repete um bloco um número inteiro não negativo de vezes.',
    'repeat 4 [forward 60 right 90]',
  ),
  c(
    'if',
    'se',
    2,
    false,
    '',
    '',
    'Executa bloco se a condição for verdadeira.',
    'if 2 < 3 [forward 50]',
  ),
  c(
    'ifelse',
    'senao',
    3,
    false,
    '',
    '',
    'Escolhe entre dois blocos.',
    'ifelse 2 = 3 [print "sim] [print "não]',
  ),
  c(
    'to',
    'aprenda',
    -1,
    false,
    '',
    '',
    'Define procedimento; argumentos seguem o nome na mesma linha.',
    'to quadrado :lado\nrepeat 4 [forward :lado right 90]\nend\nquadrado 40',
  ),
  c(
    'end',
    'fim',
    0,
    false,
    '',
    '',
    'Termina definição de procedimento.',
    'to exemplo\nprint "Olá\nend\nexemplo',
  ),
  c(
    'output',
    'retorne',
    1,
    false,
    'op',
    '',
    'Retorna um valor do procedimento atual.',
    'to dobro :n\noutput :n * 2\nend\nprint dobro 4',
  ),
  c(
    'stop',
    'pare',
    0,
    false,
    '',
    '',
    'Encerra o procedimento atual sem retornar valor.',
    'to exemplo\nprint "fim\nstop\nend\nexemplo',
  ),
  c(
    'first',
    'primeiro',
    1,
    true,
    '',
    '',
    'Primeiro elemento da lista ou caractere da palavra não vazia.',
    'show first [a b]',
  ),
  c(
    'last',
    'ultimo',
    1,
    true,
    '',
    '',
    'Último elemento da lista ou caractere da palavra não vazia.',
    'show last "abc',
  ),
  c(
    'butfirst',
    'menosprimeiro',
    1,
    true,
    'bf',
    'mp',
    'Remove primeiro elemento ou caractere; exige dado não vazio.',
    'show butfirst [a b]',
  ),
  c(
    'butlast',
    'menosultimo',
    1,
    true,
    'bl',
    'mu',
    'Remove último elemento ou caractere; exige dado não vazio.',
    'show butlast "abc',
  ),
  c(
    'count',
    'conte',
    1,
    true,
    '',
    '',
    'Conta elementos da lista ou caracteres Unicode da palavra.',
    'print count [a b c]',
  ),
  c(
    'item',
    'elemento',
    2,
    true,
    '',
    '',
    'Elemento na posição inteira, começando em 1.',
    'show item 2 [a b c]',
  ),
  c(
    'list',
    'lista',
    2,
    true,
    '',
    '',
    'Cria lista com exatamente dois valores.',
    'show list "a [b c]',
  ),
  c(
    'sentence',
    'frase',
    2,
    true,
    '',
    '',
    'Concatena dois dados, expandindo listas em um nível.',
    'show sentence [a b] [c d]',
  ),
  c(
    'and',
    'e',
    2,
    true,
    '',
    '',
    'Conjunção de dois booleanos, avaliados da esquerda para a direita.',
    'print and 2 < 3 4 > 1',
  ),
  c(
    'or',
    'ou',
    2,
    true,
    '',
    '',
    'Disjunção de dois booleanos; ambos são avaliados.',
    'print or 2 = 3 4 > 1',
  ),
  c('not', 'nao', 1, true, '', '', 'Negação de um booleano.', 'print not 2 = 3'),
];
// Abbreviations are unique across languages: pd always means paradireita.
export const defaultOptions: Options = { language: 'pt', mode: 'flexible' };
export const reserved = new Set(
  commands.flatMap((c) => [c.name, c.pt, ...c.enShort, ...c.ptShort]),
);
export function resolveCommand(word: string, options: Options): Command | undefined {
  const key = options.mode === 'flexible' ? word.toLowerCase() : word;
  return commands.find((c) =>
    options.mode === 'flexible'
      ? [c.name, c.pt, ...c.enShort, ...c.ptShort].includes(key)
      : [
          c[options.language === 'en' ? 'name' : 'pt'],
          ...(options.mode === 'strict-abbreviations'
            ? c[options.language === 'en' ? 'enShort' : 'ptShort']
            : []),
        ].includes(key),
  );
}
export function suggestion(word: string, options: Options): string {
  if (word.length > 64) return 'Confira o nome, o idioma e o modo selecionados.';
  const known = commands.find((c) =>
    [c.name, c.pt, ...c.enShort, ...c.ptShort].includes(word.toLowerCase()),
  );
  const names = commands.map((c) => c[options.language === 'en' ? 'name' : 'pt']);
  const distance = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const old = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = old;
      }
    }
    return row[b.length];
  };
  const nearest = names.sort(
    (a, b) => distance(word.toLowerCase(), a) - distance(word.toLowerCase(), b),
  )[0];
  return known
    ? `Use ${known[options.language === 'en' ? 'name' : 'pt']} neste modo.`
    : distance(word.toLowerCase(), nearest) <= 3
      ? `Talvez você queira ${nearest}.`
      : 'Confira o nome, o idioma e o modo selecionados.';
}
export const helpEnglish: Record<string, string> = {
  forward: 'Moves forward by the given distance.',
  back: 'Moves backward by the given distance.',
  right: 'Turns clockwise in degrees.',
  left: 'Turns counterclockwise in degrees.',
  home: 'Moves to the origin and faces up; draws if the pen is down.',
  setxy: 'Moves to logical coordinates x and y.',
  setheading: 'Sets the heading: 0 is up and 90 is right.',
  penup: 'Lifts the pen.',
  pendown: 'Lowers the pen.',
  setpencolor: 'Sets a named color, #RRGGBB, or an RGB list with integers from 0 to 255.',
  setpensize: 'Sets a positive pen width in logical units.',
  clean: 'Erases the drawing only.',
  clearscreen: 'Erases the drawing and resets position and heading.',
  showturtle: 'Shows the turtle.',
  hideturtle: 'Hides the turtle.',
  print: 'Writes a value followed by a newline, without outer list brackets.',
  show: 'Writes a value followed by a newline, including list brackets.',
  type: 'Writes without a newline.',
  readword: 'Reads one line as a word; spaces are preserved.',
  readlist: 'Reads one line as a data list, without outer brackets.',
  readchar: 'Reads exactly one Unicode code point.',
  make: 'Updates the nearest existing variable or creates a global variable.',
  localmake: 'Creates or updates a variable in the current procedure.',
  repeat: 'Repeats a literal instruction block a nonnegative integer number of times.',
  if: 'Runs a block when its condition is true.',
  ifelse: 'Chooses between two blocks using a boolean condition.',
  to: 'Defines a procedure; its parameters follow its name on the same line.',
  end: 'Ends a procedure definition.',
  output: 'Returns a value from the current procedure.',
  stop: 'Exits the current procedure without a value.',
  first: 'Returns the first list item or word character; input must not be empty.',
  last: 'Returns the last list item or word character; input must not be empty.',
  butfirst: 'Removes the first list item or word character; input must not be empty.',
  butlast: 'Removes the last list item or word character; input must not be empty.',
  count: 'Counts list items or Unicode code points in a word.',
  item: 'Returns the item at an integer position starting at 1.',
  list: 'Creates a list containing exactly two values.',
  sentence: 'Joins two values, flattening input lists by one level.',
  and: 'Returns the conjunction of two booleans; both arguments are evaluated.',
  or: 'Returns the disjunction of two booleans; both arguments are evaluated.',
  not: 'Negates a boolean.',
};
