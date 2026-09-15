import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
for (const [name, source, limits, message] of [
  ['instructions', 'repeat 1000 [forward 1]', { instructions: 20, recursion: 10 }, 'instruções'],
  [
    'recursion',
    'to forever\nforever\nend\nforever',
    { instructions: 1000, recursion: 10 },
    'recursão',
  ],
  ['empty loop', 'repeat 1000000000 []', { instructions: 20, recursion: 10 }, 'instruções'],
  [
    'reporter recursion',
    'to value\noutput value\nend\nprint value',
    { instructions: 1000, recursion: 10 },
    'recursão',
  ],
] as const)
  test(`real worker enforces ${name} limits with locations`, async ({ page }) => {
    const result = await page.evaluate(
      async ({ source, limits }) => {
        const worker = new Worker('/src/worker.ts', { type: 'module' });
        return await new Promise<{ message: string; line: number; column: number }>((resolve) => {
          worker.onmessage = (e) => {
            if (e.data.type === 'error') {
              resolve(e.data.diagnostic);
              worker.terminate();
            }
          };
          worker.postMessage({
            type: 'start',
            source,
            options: { language: 'en', mode: 'strict' },
            paused: false,
            delay: 0,
            limits,
          });
        });
      },
      { source, limits },
    );
    expect(result.message).toContain(message);
    expect(result.line).toBeGreaterThan(0);
    expect(result.column).toBeGreaterThan(0);
  });
test('worker input does not reset limits and stale input ids do not satisfy requests', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const worker = new Worker('/src/worker.ts', { type: 'module' });
    let reads = 0;
    return new Promise<{ reads: number; message: string }>((resolve) => {
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'input') {
          reads++;
          worker.postMessage({ type: 'input', id: m.id - 1, text: 'stale' });
          worker.postMessage({ type: 'input', id: m.id, text: 'valid' });
        }
        if (m.type === 'error') {
          worker.terminate();
          resolve({ reads, message: m.diagnostic.message });
        }
      };
      worker.postMessage({
        type: 'start',
        source: 'repeat 100 [print readword]',
        options: { language: 'en', mode: 'strict' },
        paused: false,
        delay: 0,
        limits: { instructions: 9, recursion: 10 },
      });
    });
  });
  expect(result.reads).toBe(4);
  expect(result.message).toContain('Limite');
});
test('worker stop message cancels pending input and paused execution', async ({ page }) => {
  for (const source of ['print readword', 'forward 10']) {
    const result = await page.evaluate(async (source) => {
      const worker = new Worker('/src/worker.ts', { type: 'module' });
      return new Promise<string>((resolve) => {
        worker.onmessage = (e) => {
          const m = e.data;
          if (m.type === 'input' || (m.type === 'state' && m.state === 'paused'))
            worker.postMessage({ type: 'stop' });
          if (m.type === 'state' && m.state === 'stopped') {
            worker.terminate();
            resolve(m.state);
          }
        };
        worker.postMessage({
          type: 'start',
          source,
          options: { language: 'en', mode: 'strict' },
          paused: source === 'forward 10',
          delay: 0,
        });
      });
    }, source);
    expect(result).toBe('stopped');
  }
});
test('terminate an unresponsive worker and launch a fresh interpreter', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const stalled = new Worker(
      URL.createObjectURL(new Blob(['while(true){}'], { type: 'text/javascript' })),
    );
    stalled.terminate();
    const worker = new Worker('/src/worker.ts', { type: 'module' });
    return new Promise<string>((resolve) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'write') {
          worker.terminate();
          resolve(e.data.text);
        }
      };
      worker.postMessage({
        type: 'start',
        source: 'print "recovered',
        options: { language: 'en', mode: 'strict' },
        paused: false,
        delay: 0,
      });
    });
  });
  expect(result).toBe('recovered\n');
});
