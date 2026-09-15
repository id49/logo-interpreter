import { expect, it, vi } from 'vitest';
import { attachPan } from './pan';

function setup() {
  const captures = new Set<number>();
  const target = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ width: 300 }),
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => captures.delete(id),
    classList: { add: vi.fn(), remove: vi.fn() },
  });
  const redraw = vi.fn();
  const view = attachPan(target as unknown as HTMLCanvasElement, redraw);
  const pointer = (type: string, x: number, y: number, id = 1, button = 0) => {
    target.dispatchEvent(
      Object.assign(new Event(type), {
        clientX: x,
        clientY: y,
        pointerId: id,
        button,
        isPrimary: true,
      }),
    );
  };
  return { target, view, pointer, captures, redraw };
}
it('converts drag pixels to logical view displacement and captures the pointer', () => {
  const { view, pointer, captures } = setup();
  pointer('pointerdown', 10, 20);
  expect(captures.has(1)).toBe(true);
  pointer('pointermove', 60, 45);
  expect(view.offset).toEqual({ x: 100, y: -50 });
  pointer('pointerup', 60, 45);
  expect(captures.size).toBe(0);
  pointer('pointermove', 100, 100);
  expect(view.offset).toEqual({ x: 100, y: -50 });
  view.reset();
  expect(view.offset).toEqual({ x: 0, y: 0 });
});
it('ignores secondary buttons and unrelated pointers; cancellation ends the drag', () => {
  const { view, pointer } = setup();
  pointer('pointerdown', 0, 0, 1, 2);
  pointer('pointermove', 20, 20);
  expect(view.offset).toEqual({ x: 0, y: 0 });
  pointer('pointerdown', 0, 0);
  pointer('pointermove', 20, 20, 2);
  expect(view.offset).toEqual({ x: 0, y: 0 });
  pointer('pointercancel', 0, 0);
  pointer('pointermove', 20, 20);
  expect(view.offset).toEqual({ x: 0, y: 0 });
});
it('supports arrow-key navigation and Home to reset', () => {
  const { view, target } = setup();
  target.dispatchEvent(
    Object.assign(new Event('keydown', { cancelable: true }), { key: 'ArrowRight' }),
  );
  expect(view.offset).toEqual({ x: 80, y: 0 });
  target.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: 'Home' }));
  expect(view.offset).toEqual({ x: 0, y: 0 });
});
