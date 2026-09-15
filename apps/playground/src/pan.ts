import type { ViewOffset } from '@logo/canvas-renderer';

/** Camera displacement only: never changes Logo coordinates or turtle state. */
export function attachPan(canvas: HTMLCanvasElement, redraw: () => void) {
  const offset: ViewOffset = { x: 0, y: 0 };
  let drag: { id: number; x: number; y: number } | undefined;
  const move = (dx: number, dy: number) => {
    const scale = (canvas.getBoundingClientRect().width || 600) / 600;
    offset.x += dx / scale;
    offset.y -= dy / scale;
    redraw();
  };
  const reset = () => {
    offset.x = 0;
    offset.y = 0;
    redraw();
  };
  canvas.addEventListener('pointerdown', (event) => {
    if (drag || !event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    move(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  const finish = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = undefined;
    canvas.classList.remove('dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  canvas.addEventListener('keydown', (event) => {
    const movements: Record<string, [number, number]> = {
      ArrowLeft: [-40, 0],
      ArrowRight: [40, 0],
      ArrowUp: [0, -40],
      ArrowDown: [0, 40],
    };
    if (event.key === 'Home') {
      event.preventDefault();
      reset();
    } else if (movements[event.key]) {
      event.preventDefault();
      move(...movements[event.key]);
    }
  });
  return { offset, reset };
}
