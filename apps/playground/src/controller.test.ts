import { afterEach, describe, it, expect, vi } from 'vitest';
import { Controller } from './controller';
import { Interpreter } from '@logo/logo';
const loc = { line: 1, column: 1, offset: 0, end: 1 };
afterEach(() => vi.useRealTimers());
describe('instruction controller', () => {
  it('keeps one step inside repeat and procedure arguments', async () => {
    vi.useFakeTimers();
    const c = new Controller(true),
      ops: unknown[] = [];
    const runtime = new Interpreter(
      'to value\noutput 4\nend\nrepeat 2 [forward value right 90]',
      { language: 'en', mode: 'strict' },
      { beforeInstruction: (l) => c.before(l), operation: (op) => ops.push(op) },
    );
    const done = runtime.run();
    await vi.advanceTimersByTimeAsync(1000);
    expect(ops).toHaveLength(0);
    c.step();
    await vi.advanceTimersByTimeAsync(1);
    expect(ops).toHaveLength(0);
    c.step();
    await vi.advanceTimersByTimeAsync(1);
    expect(ops).toEqual([{ kind: 'forward', value: 4 }]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(ops).toHaveLength(1);
    c.resume();
    c.setDelay(0);
    await vi.runAllTimersAsync();
    await done;
    expect(ops).toHaveLength(4);
  });
  it('changes delay during execution, excludes paused time and resumes state', async () => {
    vi.useFakeTimers();
    const c = new Controller();
    c.setDelay(1000);
    let count = 0;
    const task = c.before(loc).then(() => count++);
    await vi.advanceTimersByTimeAsync(200);
    expect(count).toBe(0);
    c.setDelay(100);
    await vi.advanceTimersByTimeAsync(1);
    await task;
    expect(count).toBe(1);
    c.pause();
    const second = c.before(loc).then(() => count++);
    await vi.advanceTimersByTimeAsync(10000);
    expect(count).toBe(1);
    c.resume();
    c.setDelay(0);
    await vi.runAllTimersAsync();
    await second;
    expect(count).toBe(2);
  });
  it('stop releases paused execution', async () => {
    const c = new Controller(true);
    const task = c.before(loc);
    const assertion = expect(task).rejects.toThrow(/cancelada/);
    c.stop();
    await assertion;
  });
  it('pause while waiting on input blocks completion until resume', async () => {
    vi.useFakeTimers();
    const c = new Controller();
    c.setDelay(0);
    const before = c.before(loc);
    await vi.runAllTimersAsync();
    await before;
    c.pause();
    let finished = false;
    const wait = c.afterInput().then(() => {
      finished = true;
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(finished).toBe(false);
    c.resume();
    await wait;
    expect(finished).toBe(true);
  });
  it('a step that requests input completes its instruction when input arrives', async () => {
    vi.useFakeTimers();
    const c = new Controller(true);
    c.step();
    const before = c.before(loc);
    await vi.runAllTimersAsync();
    await before;
    await c.afterInput();
    expect(c.paused).toBe(true);
  });
  it('explicit pause during step input requires a new permit', async () => {
    vi.useFakeTimers();
    const c = new Controller(true);
    c.step();
    const before = c.before(loc);
    await vi.runAllTimersAsync();
    await before;
    c.pause();
    let done = false;
    const after = c.afterInput().then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(done).toBe(false);
    c.step();
    await after;
    expect(done).toBe(true);
  });
});
it('keeps an extra step queued during a stepped input for the next instruction', async () => {
  vi.useFakeTimers();
  const c = new Controller(true);
  c.step();
  const first = c.before(loc);
  await vi.runAllTimersAsync();
  await first;
  c.step();
  await c.afterInput();
  let done = false;
  const next = c.before(loc).then(() => {
    done = true;
  });
  await vi.runAllTimersAsync();
  await next;
  expect(done).toBe(true);
});
it('explicit pause discards queued step permits', async () => {
  vi.useFakeTimers();
  const c = new Controller(true);
  c.step();
  c.step();
  c.pause();
  let done = false;
  const pending = c.before(loc).then(() => {
    done = true;
  });
  await vi.advanceTimersByTimeAsync(1000);
  expect(done).toBe(false);
  c.resume();
  c.setDelay(0);
  await vi.runAllTimersAsync();
  await pending;
});
