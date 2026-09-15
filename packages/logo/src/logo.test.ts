import { describe, it, expect } from 'vitest';
import {
  commands,
  defaultOptions,
  resolveCommand,
  type Options,
  type Language,
  type Mode,
} from './vocabulary';
import { data, lex, LogoError, parse } from './syntax';
import { Cancelled, Interpreter, type Limits, type Operation } from './runtime';
const en: Options = { language: 'en', mode: 'strict' };
async function run(source: string, options = en, inputs: string[] = [], limits?: Limits) {
  const operations: Operation[] = [],
    writes: string[] = [],
    locations: number[] = [];
  const vm = new Interpreter(
    source,
    options,
    {
      operation: (op) => operations.push(op),
      write: (text) => writes.push(text),
      beforeInstruction: async (loc) => {
        locations.push(loc.line);
      },
      read: async () => {
        if (!inputs.length) throw new Error('No test input');
        return inputs.shift()!;
      },
    },
    limits,
  );
  await vm.run();
  return { vm, operations, output: writes.join(''), locations };
}
describe('vocabulary and modes', () => {
  it('has no ambiguous aliases across either language', () => {
    const seen = new Map<string, string>();
    for (const c of commands)
      for (const alias of [c.name, c.pt, ...c.enShort, ...c.ptShort]) {
        expect(seen.get(alias) ?? c.name).toBe(c.name);
        seen.set(alias, c.name);
      }
  });
  for (const mode of ['flexible', 'strict', 'strict-abbreviations'] as Mode[])
    for (const language of ['en', 'pt'] as Language[]) {
      it(`${mode}/${language} validates the complete vocabulary`, () => {
        const options = { mode, language };
        for (const c of commands) {
          const name = language === 'en' ? c.name : c.pt,
            other = language === 'en' ? c.pt : c.name;
          expect(resolveCommand(name, options)?.name).toBe(c.name);
          expect(!!resolveCommand(name.toUpperCase(), options)).toBe(mode === 'flexible');
          expect(!!resolveCommand(other, options)).toBe(mode === 'flexible');
          for (const short of c[language === 'en' ? 'enShort' : 'ptShort'])
            expect(!!resolveCommand(short, options)).toBe(mode !== 'strict');
          for (const short of c[language === 'en' ? 'ptShort' : 'enShort'])
            expect(!!resolveCommand(short, options)).toBe(
              mode === 'flexible' ||
                (c.enShort.includes(short) &&
                  c.ptShort.includes(short) &&
                  mode === 'strict-abbreviations'),
            );
        }
      });
    }
  it('accepts mixed case, languages and official shortcuts in flexible mode', async () => {
    expect((await run('FD 10 pd 90 PF 10 rt 90', defaultOptions)).operations).toHaveLength(4);
  });
  it('equivalent scripts emit identical operations and output', async () => {
    const a = await run(
      'to square :size\nrepeat 4 [forward :size right 90]\nend\nsquare 20 print count [a b]',
    );
    const b = await run(
      'aprenda quadrado :lado\nrepita 4 [parafrente :lado paradireita 90]\nfim\nquadrado 20 escreva conte [a b]',
      { language: 'pt', mode: 'strict' },
    );
    expect(a.operations).toEqual(b.operations);
    expect(a.output).toEqual(b.output);
  });
  for (const c of commands)
    it(`executes documentation: ${c.name}`, async () => {
      await expect(
        run(
          c.example,
          en,
          ['hello', '1 2 3', 'x'].slice(c.name === 'readchar' ? 2 : c.name === 'readlist' ? 1 : 0),
        ),
      ).resolves.toBeDefined();
    });
  it('rejects prefixes, disallowed case/language/shortcuts and reserved procedure names', () => {
    for (const s of [
      'forw 2',
      'FORWARD 2',
      'parafrente 2',
      'fd 2',
      'to pf\nend',
      'to e\nend',
      'to FORWARD\nend',
    ])
      expect(() => parse(s, en)).toThrow(LogoError);
    try {
      parse('forwad 2', en);
    } catch (e) {
      expect((e as LogoError).diagnostic.suggestion).toContain('forward');
    }
  });
  it('validates complete syntax in every mode', () => {
    for (const mode of ['flexible', 'strict', 'strict-abbreviations'] as Mode[])
      for (const s of [
        'forward',
        'forward 2 3',
        'repeat 2 [forward 1',
        'print (1+2',
        'forward 2 ]',
      ])
        expect(() => parse(s, { language: 'en', mode })).toThrow(LogoError);
  });
});
describe('lexer, parser and data', () => {
  it('tracks lines and columns including comments and CRLF', () => {
    const tokens = lex('; hey\r\n  forward 10');
    expect(tokens[1].loc).toMatchObject({ line: 2, column: 3, offset: 9 });
  });
  it('supports precedence, parentheses, negatives, decimals, exponents and adjacent operators', async () => {
    expect(
      (await run('make "x 8 print :x-2*3 print (2+3)*4 print -2*3 print 1e2/4 print .5+1.5'))
        .output,
    ).toBe('2\n20\n-6\n25\n2\n');
  });
  it('preserves literal nested lists, words and quoted/variable tokens as data', async () => {
    expect(data(lex('a [2 :x "word] -3'))).toEqual(['a', [2, ':x', '"word'], -3]);
    expect((await run('show [a [2 3]] print [a [2 3]] type "x type "y')).output).toBe(
      '[a [2 3]]\na [2 3]\nxy',
    );
  });
  it('uses unicode code points for word operations', async () => {
    expect(
      (
        await run(
          'print count "🐢a show first "🐢a show last "a🐢 show butfirst "🐢a show butlast "a🐢',
        )
      ).output,
    ).toBe('2\n🐢\n🐢\na\na\n');
  });
  it('implements all data reporters without coercion', async () => {
    expect(
      (
        await run(
          'show first [a b] show last [a b] show butfirst [a b] show butlast [a b] show item 2 [a [b]] show list 1 [2] show sentence 1 [2 3]',
        )
      ).output,
    ).toBe('a\nb\n[b]\n[a]\n[b]\n[1 [2]]\n[1 2 3]\n');
  });
  it('implements comparisons and boolean operations', async () => {
    expect(
      (
        await run(
          'show 1=1 show 1<>2 show 1<2 show 2>1 show 1<=1 show 2>=2 show and 1=1 2=2 show or 1=2 2=2 show not 1=2 show [a]=[a]',
        )
      ).output,
    ).toBe('true\n'.repeat(10));
  });
  it.each([
    'print 1/0',
    'forward "10',
    'print 1+"2',
    'print "1 = 1',
    'print "a < "b',
    'print not 1',
    'print and 1=1 2',
    'print or 1 2=2',
    'print :unknown',
    'print 1e999',
    'print 1e308*1e308',
    'print item 0 [a]',
    'print item 2 [a]',
    'print item 1.5 [a]',
    'print first []',
    'print last "',
    'print butfirst []',
    'print butlast "',
    'print count 1',
    'print first 2',
    'print item 1 2',
    'setpensize 0',
    'setpencolor [1 2]',
    'setpencolor [1 2 256]',
    'setpencolor [1 2 2.5]',
    'setpencolor "invalid',
    'repeat -1 []',
    'repeat 1.5 []',
    'if 1 []',
    'ifelse "true [] []',
    'make 1 2',
    'localmake "x 1',
    'output 1',
    'stop',
  ])('reports typed errors: %s', async (source) => {
    await expect(run(source)).rejects.toBeInstanceOf(LogoError);
  });
  it.each([
    'print (1 2)',
    'repeat 1 :x',
    'to a :x :x\nend',
    'to a print 1\nend',
    'to a\nprint 1',
    'end',
    'repeat 2 [to a\nend]',
    'print [a',
    'print )',
    'make : 1',
  ])('rejects malformed syntax: %s', (source) => {
    expect(() => parse(source, en)).toThrow(LogoError);
  });
  it('bounds deeply nested syntax and source before overflowing the stack', () => {
    for (const source of [
      'print ' + '['.repeat(200) + '0' + ']'.repeat(200),
      'print ' + 'count '.repeat(200) + '[]',
      ' '.repeat(200001),
    ])
      expect(() => parse(source, en)).toThrow(LogoError);
  });
  it('does not parse literal list contents as commands', async () => {
    expect((await run('show [nonsense forward to end]')).output).toBe(
      '[nonsense forward to end]\n',
    );
  });
});
describe('procedures, scope, control and limits', () => {
  it('supports forward definitions, recursion and return as an argument', async () => {
    expect(
      (await run('print fact 5\nto fact :n\nif :n=0 [output 1]\noutput :n * fact (:n-1)\nend'))
        .output,
    ).toBe('120\n');
  });
  it('uses dynamic scope, local shadowing and nearest existing assignment', async () => {
    const { vm, output } = await run(
      'make "x 1\nto inner\nmake "x :x+1\nmake "global 7\nend\nto outer :x\nlocalmake "y 3\ninner\nprint :x\nprint :y\nend\nouter 10\nprint :x\nprint :global',
    );
    expect(output).toBe('11\n3\n1\n7\n');
    expect(vm.globals.has('y')).toBe(false);
  });
  it('localmake shadows rather than changes a global', async () => {
    expect((await run('make "x 1\nto f\nlocalmake "x 2\nprint :x\nend\nf print :x')).output).toBe(
      '2\n1\n',
    );
  });
  it('stop only exits its current procedure and unwinds nested repeat', async () => {
    expect(
      (await run('to f\nrepeat 5 [print "once stop]\nprint "never\nend\nrepeat 2 [f] print "after'))
        .output,
    ).toBe('once\nonce\nafter\n');
  });
  it('branches and repeat select only intended instructions', async () => {
    expect(
      (
        await run(
          'repeat 0 [print "no] if 1=2 [print "no] ifelse 1=1 [print "yes] [print "no] ifelse 1=2 [print "no] [print "yes]',
        )
      ).output,
    ).toBe('yes\nyes\n');
  });
  it('arguments execute within the calling instruction, and body steps remain visible', async () => {
    const result = await run(
      'to double :x\noutput :x*2\nend\nrepeat 2 [\nforward double 5\nright 90\n]',
    );
    expect(result.locations).toEqual([4, 5, 6, 5, 6]);
  });
  it.each(['to f\nprint 1\nend\nprint f', 'to f\noutput 1\nend\nf', 'to a\nend\nto a\nend'])(
    'diagnoses procedure misuse: %s',
    async (source) => {
      await expect(run(source)).rejects.toBeInstanceOf(LogoError);
    },
  );
  it('limits empty loops, ordinary loops, recursion and recursive reporters', async () => {
    for (const source of [
      'repeat 1000 []',
      'repeat 1000 [right 1]',
      'to f\nf\nend\nf',
      'to f\noutput f\nend\nprint f',
    ])
      await expect(run(source, en, [], { instructions: 40, recursion: 10 })).rejects.toThrow(
        /Limite/,
      );
  });
  it('limits data expansion', async () => {
    await expect(run('make "x [a] repeat 20 [make "x list :x :x]')).rejects.toThrow(/Dado excede/);
  });
  it('cancels execution and starts with fresh globals', async () => {
    let count = 0;
    const vm = new Interpreter('repeat 100 [forward 1]', en, {
      beforeInstruction: async () => {
        count++;
      },
      cancelled: () => count >= 3,
    });
    await expect(vm.run()).rejects.toBeInstanceOf(Cancelled);
    await expect(run('print :x')).rejects.toThrow(/não atribuída/);
  });
});
describe('input port', () => {
  it('reads consecutive word/list/character values', async () => {
    expect(
      (await run('show readword show readlist show readchar', en, ['hello world', '1 [a b]', '🐢']))
        .output,
    ).toBe('hello world\n[1 [a b]]\n🐢\n');
  });
  it('retries invalid input with the same interpreter state', async () => {
    const inputs = ['ab', 'x', '[broken', '1 2'],
      errors: string[] = [],
      output: string[] = [];
    const vm = new Interpreter('make "x 9 print readchar print :x show readlist', en, {
      read: async () => inputs.shift()!,
      inputError: (e) => errors.push(e.message),
      write: (text) => output.push(text),
    });
    await vm.run();
    expect(errors).toHaveLength(2);
    expect(output.join('')).toBe('x\n9\n[1 2]\n');
  });
  it('does not reset budget after input', async () => {
    await expect(
      run('repeat 20 [print readword]', en, Array(20).fill('x'), {
        instructions: 8,
        recursion: 10,
      }),
    ).rejects.toThrow(/Limite/);
  });
  it('cancels pending input on return', async () => {
    let cancelled = false;
    const vm = new Interpreter('print readword', en, {
      read: async () => {
        cancelled = true;
        return 'x';
      },
      cancelled: () => cancelled,
    });
    await expect(vm.run()).rejects.toBeInstanceOf(Cancelled);
  });
  it('errors when no input port is provided', async () => {
    await expect(new Interpreter('print readword', en).run()).rejects.toThrow(
      /Entrada não disponível/,
    );
  });
});
describe('complete command contract', () => {
  for (const command of commands) {
    if (command.name !== 'to' && command.name !== 'end')
      it(`${command.name} rejects missing or surplus inputs`, () => {
        if (command.arity > 0) expect(() => parse(command.name, en)).toThrow(LogoError);
        const source = command.example + '\n123';
        expect(() => parse(source, en)).toThrow(LogoError);
      });
    it(`${command.name} executes its equivalent Portuguese example`, async () => {
      const source = lex(command.example)
        .filter((t) => t.kind === 'word')
        .reverse()
        .reduce((source, t) => {
          const c = resolveCommand(t.text, { language: 'en', mode: 'strict' });
          return c ? source.slice(0, t.loc.offset) + c.pt + source.slice(t.loc.end) : source;
        }, command.example);
      await expect(
        run(
          source,
          { language: 'pt', mode: 'strict' },
          command.name === 'readchar' ? ['x'] : ['1 2 3'],
        ),
      ).resolves.toBeDefined();
    });
  }
  it('checks all numeric turtle arguments and preserves error locations', async () => {
    for (const cmd of ['forward', 'back', 'right', 'left', 'setheading', 'setpensize', 'setxy']) {
      await expect(run(`\n  ${cmd} "bad${cmd === 'setxy' ? ' 1' : ''}`)).rejects.toMatchObject({
        diagnostic: { line: 2, column: 3 },
      });
    }
  });
  it('executes all supported color representations', async () => {
    const result = await run(
      'setpencolor "red setpencolor "azul setpencolor "#123aBC setpencolor [0 128 255]',
    );
    expect(result.operations).toEqual([
      { kind: 'setpencolor', color: '#e5484d' },
      { kind: 'setpencolor', color: '#2479c7' },
      { kind: 'setpencolor', color: '#123aBC' },
      { kind: 'setpencolor', color: 'rgb(0,128,255)' },
    ]);
  });
  it('an empty repeat has no synthetic step instructions', async () => {
    expect((await run('repeat 3 [] forward 1')).locations).toEqual([1, 1]);
  });
  it('accepts a UTF-8 BOM as whitespace', async () => {
    expect((await run('\uFEFFprint "hello')).output).toBe('hello\n');
  });
});

it('distinguishes signed inputs from infix subtraction', async () => {
  const r = await run('setxy -10 -20 forward 10 - 2 back 10-2');
  expect(r.operations).toEqual([
    { kind: 'setxy', x: -10, y: -20 },
    { kind: 'forward', value: 8 },
    { kind: 'back', value: 8 },
  ]);
});
it('handles pasted Unicode whitespace and preserves punctuation inside data', async () => {
  expect((await run('print\u00a0count\t[a]\u000bprint\u000c2')).output).toBe('1\n2\n');
  expect(data(lex(':x-2 :? 1+2 (a) -3 +4'))).toEqual([':x-2', ':?', '1+2', '(a)', -3, 4]);
  await expect(run('show [-1e999]')).rejects.toBeInstanceOf(LogoError);
  expect(() => parse('print ' + '1+'.repeat(5000) + '1', en)).toThrow(LogoError);
});
it('rejects malformed input with Logo diagnostics rather than internal exceptions', () => {
  let seed = 17;
  const alphabet = '[]():;" +-*/abcdef0123\n\t';
  for (let i = 0; i < 500; i++) {
    let text = '';
    for (let j = 0; j < 40; j++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      text += alphabet[seed % alphabet.length];
    }
    try {
      parse(text, en);
    } catch (error) {
      expect(error).toBeInstanceOf(LogoError);
    }
  }
});
it('strict modes require lowercase user procedure names and calls too', async () => {
  await expect(
    run('to Draw\nforward 1\nend\nDRAW', { language: 'en', mode: 'flexible' }),
  ).resolves.toBeDefined();
  for (const mode of ['strict', 'strict-abbreviations'] as Mode[]) {
    for (const source of ['to Draw\nend', 'to draw\nend\nDRAW'])
      expect(() => parse(source, { language: 'en', mode })).toThrow(/minúsculas/);
  }
});
