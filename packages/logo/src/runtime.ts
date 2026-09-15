import {
  data,
  lex,
  LogoError,
  parse,
  type Call,
  type Expr,
  type Location,
  type Program,
  type Value,
} from './syntax';
import type { Options } from './vocabulary';
export type Operation =
  | { kind: 'forward' | 'back' | 'right' | 'left' | 'setheading' | 'setpensize'; value: number }
  | { kind: 'setxy'; x: number; y: number }
  | { kind: 'setpencolor'; color: string }
  | { kind: 'home' | 'penup' | 'pendown' | 'clean' | 'clearscreen' | 'showturtle' | 'hideturtle' };
export type InputKind = 'readword' | 'readlist' | 'readchar';
export interface RuntimeHooks {
  cooperate?: () => Promise<void>;
  beforeInstruction?: (location: Location) => Promise<void>;
  operation?: (operation: Operation, location: Location) => void;
  write?: (text: string) => void;
  read?: (kind: InputKind, location: Location) => Promise<string>;
  inputError?: (error: LogoError) => void;
  cancelled?: () => boolean;
}
export interface Limits {
  instructions: number;
  recursion: number;
}
export const defaultLimits: Limits = { instructions: 100000, recursion: 128 };
export class Cancelled extends Error {
  constructor() {
    super('Execução cancelada.');
  }
}
class ReturnSignal {
  constructor(readonly value: Value | undefined) {}
}
export function format(value: Value, outer = false): string {
  if (Array.isArray(value)) {
    const text = value.map((x) => format(x, true)).join(' ');
    return outer ? `[${text}]` : text;
  }
  return String(value);
}
const colors: Record<string, string> = {
  black: '#172b35',
  preto: '#172b35',
  white: '#ffffff',
  branco: '#ffffff',
  red: '#e5484d',
  vermelho: '#e5484d',
  green: '#26845b',
  verde: '#26845b',
  blue: '#2479c7',
  azul: '#2479c7',
  yellow: '#f0c64a',
  amarelo: '#f0c64a',
  orange: '#e88438',
  laranja: '#e88438',
  purple: '#9163cb',
  roxo: '#9163cb',
  pink: '#dc6b9b',
  rosa: '#dc6b9b',
  gray: '#788692',
  cinza: '#788692',
};
export class Interpreter {
  readonly globals = new Map<string, Value>();
  instructions = 0;
  private frames: Map<string, Value>[] = [];
  private program: Program;
  constructor(
    source: string,
    options: Options,
    private hooks: RuntimeHooks = {},
    private limits: Limits = defaultLimits,
  ) {
    this.program = parse(source, options);
  }
  async run(): Promise<void> {
    await this.execute(this.program.body);
  }
  private fail(message: string, loc: Location, hint?: string): never {
    throw new LogoError(message, loc, hint);
  }
  private check(loc: Location) {
    if (this.hooks.cancelled?.()) throw new Cancelled();
    if (++this.instructions > this.limits.instructions)
      this.fail(
        `Limite de ${this.limits.instructions} instruções atingido.`,
        loc,
        'Reduza repetições ou revise a condição de parada.',
      );
  }
  private number(v: Value, loc: Location): number {
    if (typeof v !== 'number' || !Number.isFinite(v))
      this.fail('Esperado número finito, sem conversão automática.', loc, 'Use 10 em vez de "10.');
    return v;
  }
  private integer(v: Value, loc: Location, min = 0) {
    const n = this.number(v, loc);
    if (!Number.isInteger(n) || n < min)
      this.fail(`Esperado inteiro maior ou igual a ${min}.`, loc);
    return n;
  }
  private bool(v: Value, loc: Location) {
    if (typeof v !== 'boolean')
      this.fail(
        'Esperado booleano produzido por comparação ou operação lógica.',
        loc,
        'Use, por exemplo, :x > 0.',
      );
    return v;
  }
  private word(v: Value, loc: Location) {
    if (typeof v !== 'string')
      this.fail(
        'Esperada palavra, sem conversão automática.',
        loc,
        'Use "nome para um nome de variável.',
      );
    return v;
  }
  private sequence(v: Value, loc: Location): Value[] | string[] {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return Array.from(v);
    return this.fail('Esperada palavra ou lista.', loc);
  }
  private lookup(name: string, loc: Location): Value {
    for (const frame of [...this.frames].reverse()) if (frame.has(name)) return frame.get(name)!;
    if (this.globals.has(name)) return this.globals.get(name)!;
    return this.fail(
      `Variável não atribuída: ${name}.`,
      loc,
      `Atribua com make/atribua "${name} valor antes de ler.`,
    );
  }
  private async execute(body: Call[], argument = false): Promise<void> {
    for (const call of body) {
      if (!argument) await this.hooks.beforeInstruction?.(call.loc);
      this.check(call.loc);
      if (this.instructions % 64 === 0) await this.hooks.cooperate?.();
      if (this.hooks.cancelled?.()) throw new Cancelled();
      const result = await this.call(call, argument);
      if (result !== undefined)
        this.fail(
          `O procedimento ${call.name} retornou um valor que não foi usado.`,
          call.loc,
          'Use o resultado como argumento de outra instrução.',
        );
    }
  }
  private bounded(value: Value, loc: Location): Value {
    let size = 0;
    const stack: { v: Value; depth: number }[] = [{ v: value, depth: 0 }];
    while (stack.length) {
      const { v, depth } = stack.pop()!;
      size += typeof v === 'string' ? Math.max(1, v.length) : 1;
      if (size > 10000 || depth > 128)
        this.fail(
          'Dado excede o limite de 10.000 unidades ou 128 níveis.',
          loc,
          'Reduza o tamanho das palavras ou listas.',
        );
      if (Array.isArray(v)) for (const item of v) stack.push({ v: item, depth: depth + 1 });
    }
    return value;
  }
  private async evaluate(expr: Expr): Promise<Value> {
    if (expr.kind === 'value' || expr.kind === 'list') return this.bounded(expr.value, expr.loc);
    if (expr.kind === 'variable') return this.lookup(expr.name, expr.loc);
    if (expr.kind === 'call') {
      this.check(expr.loc);
      if (this.instructions % 64 === 0) await this.hooks.cooperate?.();
      const value = await this.call(expr, true);
      if (value === undefined)
        this.fail(
          `O procedimento ${expr.name} não retornou valor.`,
          expr.loc,
          'Use output/retorne em todos os caminhos usados como expressão.',
        );
      return value;
    }
    if (expr.kind === 'unary') {
      const n = this.number(await this.evaluate(expr.arg), expr.loc);
      return expr.op === '-' ? -n : n;
    }
    const a = await this.evaluate(expr.left),
      b = await this.evaluate(expr.right);
    if (expr.op === '=' || expr.op === '<>') {
      if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b))
        this.fail('Comparação exige valores do mesmo tipo.', expr.loc);
      const equal = JSON.stringify(a) === JSON.stringify(b);
      return expr.op === '=' ? equal : !equal;
    }
    const x = this.number(a, expr.loc),
      y = this.number(b, expr.loc);
    switch (expr.op) {
      case '<':
        return x < y;
      case '>':
        return x > y;
      case '<=':
        return x <= y;
      case '>=':
        return x >= y;
      case '+':
        return this.number(x + y, expr.loc);
      case '-':
        return this.number(x - y, expr.loc);
      case '*':
        return this.number(x * y, expr.loc);
      case '/':
        if (y === 0)
          this.fail('Divisão por zero.', expr.loc, 'O divisor deve ser diferente de zero.');
        return this.number(x / y, expr.loc);
      default:
        return this.fail('Operador desconhecido.', expr.loc);
    }
  }
  private async call(call: Call, argument: boolean): Promise<Value | undefined> {
    const args: Value[] = [];
    for (let i = 0; i < call.args.length; i++)
      args.push(call.blocks.has(i) ? [] : await this.evaluate(call.args[i]));
    const loc = call.loc,
      emit = (operation: Operation) => this.hooks.operation?.(operation, loc),
      a = args[0],
      b = args[1];
    if (!call.builtin) {
      const proc = this.program.procedures.get(call.name)!;
      if (this.frames.length >= this.limits.recursion)
        this.fail(
          `Limite de recursão (${this.limits.recursion}) atingido.`,
          loc,
          'Revise a condição de parada do procedimento.',
        );
      this.frames.push(new Map(proc.params.map((p, i) => [p, args[i]])));
      try {
        await this.execute(proc.body, argument);
      } catch (error) {
        if (error instanceof ReturnSignal) return error.value;
        throw error;
      } finally {
        this.frames.pop();
      }
      return;
    }
    switch (call.name) {
      case 'forward':
      case 'back':
      case 'right':
      case 'left':
      case 'setheading':
        emit({ kind: call.name, value: this.number(a, loc) });
        return;
      case 'setpensize': {
        const value = this.number(a, loc);
        if (value <= 0)
          this.fail('Espessura deve ser positiva.', loc, 'Use um número maior que zero.');
        emit({ kind: 'setpensize', value });
        return;
      }
      case 'setxy':
        emit({ kind: 'setxy', x: this.number(a, loc), y: this.number(b, loc) });
        return;
      case 'setpencolor': {
        let color: string | undefined;
        if (typeof a === 'string')
          color = colors[a.toLowerCase()] ?? (/^#[\da-f]{6}$/i.test(a) ? a : undefined);
        else if (Array.isArray(a) && a.length === 3) {
          const rgb = a.map((x) => this.integer(x, loc));
          if (rgb.every((x) => x <= 255)) color = `rgb(${rgb.join(',')})`;
        }
        if (!color)
          this.fail(
            'Cor inválida.',
            loc,
            'Use blue/azul, #RRGGBB ou [r g b] com inteiros de 0 a 255.',
          );
        emit({ kind: 'setpencolor', color });
        return;
      }
      case 'home':
      case 'penup':
      case 'pendown':
      case 'clean':
      case 'clearscreen':
      case 'showturtle':
      case 'hideturtle':
        emit({ kind: call.name });
        return;
      case 'print':
      case 'show':
      case 'type':
        this.hooks.write?.(format(a, call.name === 'show') + (call.name === 'type' ? '' : '\n'));
        return;
      case 'readword':
      case 'readlist':
      case 'readchar': {
        if (!this.hooks.read) this.fail('Entrada não disponível neste ambiente.', loc);
        while (true) {
          if (this.hooks.cancelled?.()) throw new Cancelled();
          const text = await this.hooks.read(call.name, loc);
          if (this.hooks.cancelled?.()) throw new Cancelled();
          try {
            if (call.name === 'readchar') {
              if (Array.from(text).length !== 1)
                this.fail('Digite exatamente um caractere Unicode.', loc);
              return text;
            }
            if (call.name === 'readlist') return this.bounded(data(lex(text)), loc);
            return this.bounded(text, loc);
          } catch (error) {
            if (!(error instanceof LogoError) || !this.hooks.inputError) throw error;
            this.hooks.inputError(
              new LogoError(error.message, loc, 'Corrija a entrada no console.'),
            );
          }
        }
      }
      case 'make':
      case 'localmake': {
        const name = this.word(a, loc).toLowerCase();
        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(name)) this.fail('Nome de variável inválido.', loc);
        if (call.name === 'localmake') {
          if (!this.frames.length)
            this.fail('localmake/atribualocal exige um procedimento em execução.', loc);
          this.frames[this.frames.length - 1].set(name, b);
        } else {
          const frame = [...this.frames].reverse().find((frame) => frame.has(name)) ?? this.globals;
          frame.set(name, b);
        }
        return;
      }
      case 'repeat': {
        const n = this.integer(a, loc);
        for (let i = 0; i < n; i++) {
          if (call.blocks.get(1)!.length === 0) {
            this.check(loc);
            if (this.instructions % 64 === 0) await this.hooks.cooperate?.();
          } else await this.execute(call.blocks.get(1)!, argument);
        }
        return;
      }
      case 'if':
        if (this.bool(a, loc)) await this.execute(call.blocks.get(1)!, argument);
        return;
      case 'ifelse':
        await this.execute(call.blocks.get(this.bool(a, loc) ? 1 : 2)!, argument);
        return;
      case 'output':
        if (!this.frames.length)
          this.fail('output/retorne exige um procedimento em execução.', loc);
        throw new ReturnSignal(a);
      case 'stop':
        if (!this.frames.length) this.fail('stop/pare exige um procedimento em execução.', loc);
        throw new ReturnSignal(undefined);
      case 'and': {
        const x = this.bool(a, loc),
          y = this.bool(b, loc);
        return x && y;
      }
      case 'or': {
        const x = this.bool(a, loc),
          y = this.bool(b, loc);
        return x || y;
      }
      case 'not':
        return !this.bool(a, loc);
      case 'list':
        return this.bounded([a, b], loc);
      case 'sentence':
        return this.bounded(
          [...(Array.isArray(a) ? a : [a]), ...(Array.isArray(b) ? b : [b])],
          loc,
        );
      case 'count':
        return this.sequence(a, loc).length;
      case 'item': {
        const index = this.integer(a, loc, 1),
          seq = this.sequence(b, loc);
        if (index > seq.length) this.fail('Posição fora dos limites do dado.', loc);
        return seq[index - 1];
      }
      case 'first':
      case 'last':
      case 'butfirst':
      case 'butlast': {
        const seq = this.sequence(a, loc);
        if (!seq.length) this.fail('Este comando exige palavra ou lista não vazia.', loc);
        if (call.name === 'first') return seq[0];
        if (call.name === 'last') return seq[seq.length - 1];
        const result = call.name === 'butfirst' ? seq.slice(1) : seq.slice(0, -1);
        return typeof a === 'string' ? result.join('') : result;
      }
      default:
        this.fail(`Comando não implementado: ${call.name}`, loc);
    }
  }
}
