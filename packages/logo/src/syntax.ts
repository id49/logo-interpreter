import { defaultOptions, reserved, resolveCommand, suggestion, type Options } from './vocabulary';
export interface Location {
  line: number;
  column: number;
  offset: number;
  end: number;
}
export interface Diagnostic extends Location {
  message: string;
  suggestion?: string;
}
export class LogoError extends Error {
  readonly diagnostic: Diagnostic;
  constructor(
    message: string,
    location: Location,
    hint = 'Confira os argumentos e consulte o guia de comandos.',
  ) {
    super(message);
    this.name = 'LogoError';
    this.diagnostic = { ...location, message, suggestion: hint };
  }
}
export type Value = number | string | boolean | Value[];
export interface Token {
  kind:
    | 'number'
    | 'word'
    | 'quoted'
    | 'variable'
    | 'operator'
    | '['
    | ']'
    | '('
    | ')'
    | 'newline'
    | 'eof';
  text: string;
  loc: Location;
}
export function lex(source: string): Token[] {
  if (source.length > 200000)
    throw new LogoError(
      'Programa excede 200.000 caracteres.',
      { line: 1, column: 1, offset: 0, end: 1 },
      'Divida o programa em arquivos menores.',
    );
  const tokens: Token[] = [];
  let i = 0,
    line = 1,
    column = 1,
    nesting = 0;
  const advance = () => {
    const ch = source[i++];
    if (ch === '\n') {
      line++;
      column = 1;
    } else column++;
    return ch;
  };
  while (i < source.length) {
    const start = i,
      ln = line,
      col = column,
      ch = source[i];
    if (ch === ';') {
      while (i < source.length && source[i] !== '\n') advance();
      continue;
    }
    if (ch !== '\n' && /\s/u.test(ch)) {
      advance();
      continue;
    }
    let kind: Token['kind'],
      text = '';
    if (ch === '\n') {
      kind = 'newline';
      text = advance();
    } else if ('[]()'.includes(ch)) {
      kind = ch as Token['kind'];
      text = advance();
      if (ch === '[' || ch === '(') {
        if (++nesting > 128)
          throw new LogoError('Limite de 128 níveis de delimitadores atingido.', {
            line: ln,
            column: col,
            offset: start,
            end: i,
          });
      } else nesting--;
    } else if (ch === '"' || ch === ':') {
      kind = ch === '"' ? 'quoted' : 'variable';
      advance();
      while (
        i < source.length &&
        !(kind === 'variable' ? /[\s[\]();+*/=<>-]/ : /[\s[\]();]/).test(source[i])
      )
        text += advance();
    } else if (
      /[0-9.]/.test(ch) &&
      /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.test(source.slice(i))
    ) {
      kind = 'number';
      const match = source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)![0];
      for (let n = 0; n < match.length; n++) text += advance();
    } else if ('+-*/=<>'.includes(ch)) {
      kind = 'operator';
      text = advance();
      if ((text === '<' && ['>', '='].includes(source[i])) || (text === '>' && source[i] === '='))
        text += advance();
    } else {
      kind = 'word';
      while (i < source.length && !/[\s[\]();+*/=<>]/.test(source[i])) text += advance();
    }
    tokens.push({ kind, text, loc: { line: ln, column: col, offset: start, end: i } });
  }
  tokens.push({ kind: 'eof', text: '', loc: { line, column, offset: i, end: i } });
  return tokens;
}
export type Expr =
  | { kind: 'value'; value: Value; loc: Location }
  | { kind: 'variable'; name: string; loc: Location }
  | { kind: 'list'; value: Value[]; tokens: Token[]; loc: Location }
  | { kind: 'unary'; op: string; arg: Expr; loc: Location }
  | { kind: 'binary'; op: string; left: Expr; right: Expr; loc: Location }
  | Call;
export interface Call {
  kind: 'call';
  name: string;
  builtin: boolean;
  args: Expr[];
  blocks: Map<number, Call[]>;
  loc: Location;
}
export interface Procedure {
  name: string;
  params: string[];
  body: Call[];
  loc: Location;
}
export interface Program {
  body: Call[];
  procedures: Map<string, Procedure>;
  options: Options;
}
const precedence: Record<string, number> = {
  '=': 1,
  '<>': 1,
  '<': 1,
  '>': 1,
  '<=': 1,
  '>=': 1,
  '+': 2,
  '-': 2,
  '*': 3,
  '/': 3,
};
export function data(tokens: Token[]): Value[] {
  let i = 0;
  const read = (nested: boolean): Value[] => {
    const values: Value[] = [];
    while (i < tokens.length) {
      const t = tokens[i++];
      if (t.kind === 'newline' || t.kind === 'eof') continue;
      if (t.kind === ']') {
        if (nested) return values;
        throw new LogoError(
          'Colchete de fechamento inesperado.',
          t.loc,
          'Remova ] ou abra uma lista com [.',
        );
      }
      if (t.kind === '[') {
        values.push(read(true));
        continue;
      }
      const spelling = (token: Token) =>
        (token.kind === 'variable' ? ':' : token.kind === 'quoted' ? '"' : '') + token.text;
      let word = spelling(t),
        end = t.loc.end;
      // Data words preserve adjacent punctuation; executable blocks use the original tokens.
      while (
        i < tokens.length &&
        !['[', ']', 'newline', 'eof'].includes(tokens[i].kind) &&
        tokens[i].loc.offset === end
      ) {
        word += spelling(tokens[i]);
        end = tokens[i++].loc.end;
      }
      if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(word)) {
        const number = Number(word);
        if (!Number.isFinite(number)) throw new LogoError('Número deve ser finito.', t.loc);
        values.push(number);
      } else values.push(word);
    }
    if (nested)
      throw new LogoError('Lista sem fechamento.', tokens[Math.max(0, i - 1)].loc, 'Adicione ].');
    return values;
  };
  return read(false);
}
export function parse(source: string, options: Options = defaultOptions): Program {
  const tokens = lex(source),
    procedures = new Map<string, Procedure>(),
    top: Token[] = [],
    definitions: { procedure: Procedure; tokens: Token[] }[] = [];
  let i = 0,
    depth = 0;
  while (tokens[i].kind !== 'eof') {
    const t = tokens[i];
    if (depth === 0 && t.kind === 'word' && resolveCommand(t.text, options)?.name === 'to') {
      i++;
      const name = tokens[i++];
      if (name.kind !== 'word' || !/^[\p{L}_][\p{L}\p{N}_-]*$/u.test(name.text))
        throw new LogoError(
          'Nome de procedimento inválido.',
          name.loc,
          'Use um nome começando com uma letra.',
        );
      const key = name.text.toLowerCase();
      if (options.mode !== 'flexible' && name.text !== key)
        throw new LogoError(
          'Nome de procedimento deve estar em minúsculas neste modo.',
          name.loc,
          `Use ${key} neste modo.`,
        );
      if (reserved.has(key) || procedures.has(key))
        throw new LogoError(
          `Nome reservado ou duplicado: ${name.text}.`,
          name.loc,
          'Escolha outro nome de procedimento.',
        );
      const params: string[] = [];
      while (tokens[i].kind === 'variable') {
        const p = tokens[i++];
        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(p.text))
          throw new LogoError('Nome de variável inválido.', p.loc);
        if (params.includes(p.text.toLowerCase()))
          throw new LogoError('Argumento duplicado.', p.loc);
        params.push(p.text.toLowerCase());
      }
      if (tokens[i].kind !== 'newline')
        throw new LogoError(
          'Cabeçalho de procedimento deve terminar com uma nova linha.',
          tokens[i].loc,
          'Use to nome :argumento, uma nova linha e o corpo.',
        );
      i++;
      const body: Token[] = [];
      let nesting = 0;
      while (tokens[i].kind !== 'eof') {
        const current = tokens[i];
        if (
          nesting === 0 &&
          current.kind === 'word' &&
          resolveCommand(current.text, options)?.name === 'end'
        )
          break;
        if (current.kind === '[') nesting++;
        if (current.kind === ']') nesting--;
        body.push(tokens[i++]);
      }
      if (tokens[i].kind === 'eof')
        throw new LogoError(
          'Procedimento sem end/fim válido neste modo.',
          t.loc,
          `Feche com ${options.language === 'pt' ? 'fim' : 'end'} em minúsculas.`,
        );
      i++;
      const procedure = { name: key, params, body: [], loc: name.loc };
      procedures.set(key, procedure);
      definitions.push({ procedure, tokens: body });
    } else {
      if (t.kind === '[') depth++;
      if (t.kind === ']') depth--;
      top.push(tokens[i++]);
    }
  }
  const parseBody = (input: Token[]): Call[] =>
    new Parser(
      [...input, { ...tokens[tokens.length - 1], kind: 'eof' }],
      options,
      procedures,
      parseBody,
    ).body();
  for (const def of definitions) def.procedure.body = parseBody(def.tokens);
  return { body: parseBody(top), procedures, options };
}
class Parser {
  private i = 0;
  private expressionDepth = 0;
  private nodeDepth = new WeakMap<Expr, number>();
  private limitNode(expr: Expr): Expr {
    const children =
      expr.kind === 'binary'
        ? [expr.left, expr.right]
        : expr.kind === 'unary'
          ? [expr.arg]
          : expr.kind === 'call'
            ? expr.args
            : [];
    const depth = 1 + Math.max(0, ...children.map((child) => this.nodeDepth.get(child) ?? 1));
    if (depth > 128) throw new LogoError('Limite de 128 níveis de expressões atingido.', expr.loc);
    this.nodeDepth.set(expr, depth);
    return expr;
  }
  constructor(
    private tokens: Token[],
    private options: Options,
    private procedures: Map<string, Procedure>,
    private parseBody: (tokens: Token[]) => Call[],
  ) {}
  private peek() {
    while (this.tokens[this.i].kind === 'newline') this.i++;
    return this.tokens[this.i];
  }
  private take() {
    const t = this.peek();
    this.i++;
    return t;
  }
  body(): Call[] {
    const result: Call[] = [];
    while (this.peek().kind !== 'eof') {
      const t = this.take();
      if (t.kind !== 'word')
        throw new LogoError(
          'Esperado um comando; valor ou delimitador excedente.',
          t.loc,
          'Confira o número de argumentos da instrução anterior.',
        );
      const call = this.call(t);
      const command = resolveCommand(t.text, this.options);
      if (command?.reporter)
        throw new LogoError(
          `O resultado de ${t.text} precisa ser usado.`,
          t.loc,
          'Use print/escreva ou passe o resultado como argumento.',
        );
      result.push(call);
    }
    return result;
  }
  private call(t: Token): Call {
    const command = resolveCommand(t.text, this.options),
      proc = this.procedures.get(t.text.toLowerCase());
    if (proc && this.options.mode !== 'flexible' && t.text !== t.text.toLowerCase())
      throw new LogoError(
        'Nome de procedimento deve estar em minúsculas neste modo.',
        t.loc,
        `Use ${t.text.toLowerCase()} neste modo.`,
      );
    if (!command && !proc)
      throw new LogoError(
        `Comando desconhecido ou não permitido: ${t.text}.`,
        t.loc,
        suggestion(t.text, this.options),
      );
    if (command && ['to', 'end'].includes(command.name))
      throw new LogoError(
        'Definição de procedimento fora do nível superior ou terminador inesperado.',
        t.loc,
        'Defina procedimentos fora de blocos.',
      );
    const arity = command?.arity ?? proc!.params.length;
    const call: Call = {
      kind: 'call',
      name: command?.name ?? proc!.name,
      builtin: !!command,
      args: [],
      blocks: new Map(),
      loc: t.loc,
    };
    for (let n = 0; n < arity; n++) {
      if (['eof', ']', ')'].includes(this.peek().kind))
        throw new LogoError(
          `${t.text} precisa de ${arity} argumento(s); recebeu ${n}.`,
          t.loc,
          'Complete os argumentos antes de fechar o bloco.',
        );
      const expr = this.expression();
      call.args.push(expr);
      const block =
        (command?.name === 'repeat' && n === 1) ||
        (command?.name === 'if' && n === 1) ||
        (command?.name === 'ifelse' && n > 0);
      if (block) {
        if (expr.kind !== 'list')
          throw new LogoError(
            'Bloco executável deve estar escrito entre colchetes.',
            expr.loc,
            'Listas guardadas em variáveis não são executáveis nesta versão.',
          );
        call.blocks.set(n, this.parseBody(expr.tokens));
      }
    }
    return call;
  }
  private expression(min = 0): Expr {
    if (++this.expressionDepth > 128)
      throw new LogoError('Limite de 128 níveis de expressões atingido.', this.peek().loc);
    try {
      return this.expressionInner(min);
    } finally {
      this.expressionDepth--;
    }
  }
  private expressionInner(min: number): Expr {
    const t = this.take();
    let left: Expr;
    if (t.kind === 'number') {
      const value = Number(t.text);
      if (!Number.isFinite(value)) throw new LogoError('Número deve ser finito.', t.loc);
      left = { kind: 'value', value, loc: t.loc };
    } else if (t.kind === 'quoted') left = { kind: 'value', value: t.text, loc: t.loc };
    else if (t.kind === 'variable') {
      if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(t.text))
        throw new LogoError('Nome de variável inválido.', t.loc);
      left = { kind: 'variable', name: t.text.toLowerCase(), loc: t.loc };
    } else if (t.kind === 'operator' && (t.text === '-' || t.text === '+'))
      left = { kind: 'unary', op: t.text, arg: this.expression(4), loc: t.loc };
    else if (t.kind === '(') {
      left = this.expression();
      if (this.take().kind !== ')')
        throw new LogoError(
          'Parêntese sem fechamento ou argumentos excedentes.',
          t.loc,
          'Feche a expressão com ).',
        );
    } else if (t.kind === '[') {
      const content: Token[] = [];
      let depth = 1;
      while (depth > 0) {
        const current = this.tokens[this.i++];
        if (!current || current.kind === 'eof')
          throw new LogoError('Lista sem fechamento.', t.loc, 'Adicione ].');
        if (current.kind === '[') depth++;
        if (current.kind === ']') depth--;
        if (depth > 0) content.push(current);
      }
      left = { kind: 'list', tokens: content, value: data(content), loc: t.loc };
    } else if (t.kind === 'word') {
      const command = resolveCommand(t.text, this.options);
      if (command && !command.reporter)
        throw new LogoError(
          `${t.text} é uma instrução, não um valor.`,
          t.loc,
          'Confira os argumentos da instrução anterior.',
        );
      left = this.call(t);
    } else
      throw new LogoError(
        'Esperado um valor.',
        t.loc,
        'Use número, "palavra, :variável, lista ou expressão.',
      );
    left = this.limitNode(left);
    while (this.peek().kind === 'operator' && (precedence[this.peek().text] ?? -1) >= min) {
      const next = this.peek(),
        previous = this.tokens[this.i - 1],
        following = this.tokens[this.i + 1];
      if (
        ['+', '-'].includes(next.text) &&
        previous &&
        previous.loc.end < next.loc.offset &&
        following &&
        next.loc.end === following.loc.offset
      )
        break;
      const op = this.take(),
        right = this.expression(precedence[op.text] + 1);
      left = this.limitNode({ kind: 'binary', op: op.text, left, right, loc: op.loc });
    }
    return left;
  }
}
