import type { TurtleState } from '@logo/turtle';
export type Appearance = 'turtle' | 'triangle';
export interface ViewOffset {
  x: number;
  y: number;
}
/** The viewport always spans 600 logical units horizontally; DPR only affects sharpness. */
export function render(
  canvas: HTMLCanvasElement,
  state: TurtleState,
  appearance: Appearance,
  grid = true,
  offset: ViewOffset = { x: 0, y: 0 },
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect(),
    w = rect.width || 600,
    h = rect.height || 480,
    dpr = globalThis.devicePixelRatio || 1;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fcfdfb';
  ctx.fillRect(0, 0, w, h);
  const scale = w / 600;
  ctx.translate(w / 2 + offset.x * scale, h / 2 - offset.y * scale);
  ctx.scale(scale, -scale);
  if (grid) {
    const left = -300 - offset.x,
      right = 300 - offset.x;
    const bottom = -h / scale / 2 - offset.y,
      top = h / scale / 2 - offset.y;
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = '#e7ece6';
    ctx.beginPath();
    for (let x = Math.ceil(left / 25) * 25; x <= right; x += 25) {
      ctx.moveTo(x, bottom);
      ctx.lineTo(x, top);
    }
    for (let y = Math.ceil(bottom / 25) * 25; y <= top; y += 25) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#cbd8ce';
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(right, 0);
    ctx.moveTo(0, bottom);
    ctx.lineTo(0, top);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of state.segments) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(s.from.x, s.from.y);
    ctx.lineTo(s.to.x, s.to.y);
    ctx.stroke();
  }
  if (!state.visible) return;
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate((-state.heading * Math.PI) / 180);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#164d3b';
  ctx.fillStyle = '#50b78b';
  if (appearance === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(-9, -9);
    ctx.lineTo(0, -5);
    ctx.lineTo(9, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    for (const [x, y, r] of [
      [-8, 6, 3],
      [8, 6, 3],
      [-8, -6, 3],
      [8, -6, 3],
      [0, 12, 4],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#23865f';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(6, 3);
    ctx.lineTo(5, -5);
    ctx.lineTo(0, -9);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.strokeStyle = '#95d5ae';
    ctx.stroke();
    ctx.fillStyle = '#143f30';
    for (const x of [-1.5, 1.5]) {
      ctx.beginPath();
      ctx.arc(x, 13, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
