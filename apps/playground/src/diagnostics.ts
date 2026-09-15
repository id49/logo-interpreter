import type { Diagnostic } from '@logo/logo';
const messages: Record<string, string> = {
  'Coordenadas excedem o intervalo numérico.': 'Coordinates exceed the finite numeric range.',
  'Esperado número finito, sem conversão automática.':
    'Expected a finite number; automatic conversions are not performed.',
  'Esperado booleano produzido por comparação ou operação lógica.':
    'Expected a boolean produced by a comparison or logical operation.',
  'Esperada palavra, sem conversão automática.':
    'Expected a word; automatic conversions are not performed.',
  'Esperada palavra ou lista.': 'Expected a word or list.',
  'Divisão por zero.': 'Division by zero.',
  'Comparação exige valores do mesmo tipo.': 'Comparison requires values of the same type.',
  'Espessura deve ser positiva.': 'Pen width must be positive.',
  'Cor inválida.': 'Invalid pen color.',
  'Nome de variável inválido.': 'Invalid variable name.',
  'Nome de variável ausente.': 'Missing variable name.',
  'Nome de procedimento deve estar em minúsculas neste modo.':
    'Procedure names must be lowercase in this mode.',
  'Nome de procedimento inválido.': 'Invalid procedure name.',
  'Argumento duplicado.': 'Duplicate parameter.',
  'Número deve ser finito.': 'Numbers must be finite.',
  'Lista sem fechamento.': 'Unclosed list.',
  'Colchete de fechamento inesperado.': 'Unexpected closing bracket.',
  'Esperado um valor.': 'Expected a value.',
  'Esperado um comando; valor ou delimitador excedente.':
    'Expected a command; extra value or delimiter found.',
  'Parêntese sem fechamento ou argumentos excedentes.': 'Unclosed parenthesis or extra arguments.',
  'Cabeçalho de procedimento deve terminar com uma nova linha.':
    'A procedure header must end with a newline.',
  'Procedimento sem end/fim válido neste modo.': 'Procedure has no end/fim allowed in this mode.',
  'Definição de procedimento fora do nível superior ou terminador inesperado.':
    'Procedure definition outside the top level or unexpected terminator.',
  'Bloco executável deve estar escrito entre colchetes.':
    'Executable blocks must be written literally in brackets.',
  'Entrada não disponível neste ambiente.': 'Input is not available in this environment.',
  'Digite exatamente um caractere Unicode.': 'Enter exactly one Unicode code point.',
  'localmake/atribualocal exige um procedimento em execução.':
    'localmake/atribualocal requires a running procedure.',
  'output/retorne exige um procedimento em execução.':
    'output/retorne requires a running procedure.',
  'stop/pare exige um procedimento em execução.': 'stop/pare requires a running procedure.',
  'Posição fora dos limites do dado.': 'Item position is out of bounds.',
  'Este comando exige palavra ou lista não vazia.':
    'This command requires a nonempty word or list.',
  'Dado excede o limite de 10.000 unidades ou 128 níveis.':
    'Data exceeds 10,000 units or 128 nesting levels.',
  'Programa excede 200.000 caracteres.': 'Program exceeds 200,000 characters.',
  'Limite de 128 níveis de delimitadores atingido.': 'Delimiter nesting limit of 128 reached.',
  'Limite de 128 níveis de expressões atingido.': 'Expression nesting limit of 128 reached.',
};
export function localizeDiagnostic(d: Diagnostic, language: 'en' | 'pt'): Diagnostic {
  if (language === 'pt') return d;
  let message = messages[d.message];
  if (!message) {
    message = d.message
      .replace(
        /^Comando desconhecido ou não permitido: (.+)\.$/,
        'Unknown or disallowed command: $1.',
      )
      .replace(/^Nome reservado ou duplicado: (.+)\.$/, 'Reserved or duplicate name: $1.')
      .replace(/^Variável não atribuída: (.+)\.$/, 'Unassigned variable: $1.')
      .replace(/^Limite de (\d+) instruções atingido\.$/, 'Instruction limit ($1) reached.')
      .replace(/^Limite de recursão \((\d+)\) atingido\.$/, 'Recursion limit ($1) reached.')
      .replace(
        /^Esperado inteiro maior ou igual a (\d+)\.$/,
        'Expected an integer greater than or equal to $1.',
      )
      .replace(
        /^(.+) precisa de (\d+) argumento\(s\); recebeu (\d+)\.$/,
        '$1 requires $2 argument(s); received $3.',
      )
      .replace(/^(.+) é uma instrução, não um valor\.$/, '$1 is a statement, not a value.')
      .replace(/^O resultado de (.+) precisa ser usado\.$/, 'The result of $1 must be used.')
      .replace(
        /^O procedimento (.+) retornou um valor que não foi usado\.$/,
        'Procedure $1 returned an unused value.',
      )
      .replace(
        /^O procedimento (.+) não retornou valor\.$/,
        'Procedure $1 did not return a value.',
      );
  }
  let suggestion = d.suggestion
    ? 'Check the command guide, input types, language, and selected mode.'
    : undefined;
  const use = d.suggestion?.match(/^Use (\S+) neste modo\.$/);
  if (use) suggestion = `Use ${use[1]} in this mode.`;
  const maybe = d.suggestion?.match(/^Talvez você queira (\S+)\.$/);
  if (maybe) suggestion = `Did you mean ${maybe[1]}?`;
  return { ...d, message, suggestion };
}
