import { describe, expect, it } from 'vitest';
import { Interpreter, type Operation } from '@logo/logo';
import { complexityLevels, examples } from './examples';

describe('educational examples', () => {
  it('offers five distinct examples per complexity level', () => {
    expect(new Set(examples.map((example) => example.name.pt)).size).toBe(examples.length);
    for (const level of complexityLevels) {
      expect(examples.filter((example) => example.level === level.id)).toHaveLength(5);
    }
  });
  for (const example of examples) {
    it(`${example.name.en} runs in both strict languages with equivalent drawings`, async () => {
      const drawings: Operation[][] = [];
      for (const language of ['pt', 'en'] as const) {
        const operations: Operation[] = [];
        const inputs = ['Ada', '20 140 100'];
        const interpreter = new Interpreter(
          example.code[language],
          { mode: 'strict', language },
          {
            operation: (operation) => operations.push(operation),
            read: async () => {
              const input = inputs.shift();
              if (input === undefined) throw new Error('Unexpected additional input request');
              return input;
            },
          },
        );
        await interpreter.run();
        expect(operations.length).toBeGreaterThan(0);
        drawings.push(operations);
      }
      expect(drawings[0]).toEqual(drawings[1]);
    });
  }
});
