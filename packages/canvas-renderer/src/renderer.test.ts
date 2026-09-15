import { afterEach, describe, it, expect, vi } from 'vitest';
import { initialState, applyOperation } from '@logo/turtle';
import { render } from './index';
function fakeCanvas(width = 600, height = 480) {
  const calls = new Map<string, ReturnType<typeof vi.fn>>();
  const ctx = new Proxy(
    {},
    {
      get: (_target, key) => {
        const name = String(key);
        if (!calls.has(name)) calls.set(name, vi.fn());
        return calls.get(name);
      },
      set: () => true,
    },
  );
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ width, height }),
  } as unknown as HTMLCanvasElement;
  return { canvas, calls };
}
afterEach(() => vi.unstubAllGlobals());
describe('canvas renderer', () => {
  it('draws logical geometry while leaving all turtle state untouched', () => {
    const { canvas, calls } = fakeCanvas();
    const state = initialState();
    applyOperation(state, { kind: 'forward', value: 30 });
    const before = JSON.stringify(state);
    render(canvas, state, 'turtle');
    expect(calls.get('moveTo')).toHaveBeenCalledWith(0, 0);
    expect(calls.get('lineTo')).toHaveBeenCalledWith(0, 30);
    expect(calls.get('ellipse')).toHaveBeenCalled();
    render(canvas, state, 'triangle');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('accounts for pixel ratio without changing logical coordinates', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const { canvas, calls } = fakeCanvas(300, 400);
    render(canvas, initialState(), 'triangle', false);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(800);
    expect(calls.get('scale')).toHaveBeenCalledWith(0.5, -0.5);
    expect(calls.get('translate')).toHaveBeenCalledWith(150, 200);
  });
  it('hides the turtle but keeps the drawing', () => {
    const { canvas, calls } = fakeCanvas();
    const state = initialState();
    applyOperation(state, { kind: 'forward', value: 10 });
    state.visible = false;
    render(canvas, state, 'turtle', false);
    expect(calls.get('ellipse')).toBeUndefined();
    expect(calls.get('lineTo')).toHaveBeenCalledWith(0, 10);
  });
  it('tolerates missing canvas context', () => {
    expect(() =>
      render(
        { getContext: () => null } as unknown as HTMLCanvasElement,
        initialState(),
        'triangle',
      ),
    ).not.toThrow();
  });
});

it('pans grid, axes and drawing together without changing turtle state', () => {
  const { canvas, calls } = fakeCanvas(600, 480);
  const state = initialState();
  applyOperation(state, { kind: 'forward', value: 30 });
  const saved = JSON.stringify(state);
  render(canvas, state, 'turtle', true, { x: 650, y: -500 });
  expect(calls.get('translate')).toHaveBeenCalledWith(950, 740);
  // Fill the entire visible viewport even when the origin is offscreen.
  expect(calls.get('moveTo')).toHaveBeenCalledWith(-950, 260);
  expect(calls.get('lineTo')).toHaveBeenCalledWith(-350, 725);
  expect(calls.get('lineTo')).toHaveBeenCalledWith(0, 30);
  expect(JSON.stringify(state)).toBe(saved);
});
