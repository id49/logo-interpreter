import type { Operation } from '@logo/logo';
export interface Point {
  x: number;
  y: number;
}
export interface Segment {
  from: Point;
  to: Point;
  color: string;
  width: number;
}
export interface TurtleState extends Point {
  heading: number;
  penDown: boolean;
  color: string;
  width: number;
  visible: boolean;
  segments: Segment[];
}
export const initialState = (): TurtleState => ({
  x: 0,
  y: 0,
  heading: 0,
  penDown: true,
  color: '#2479c7',
  width: 2,
  visible: true,
  segments: [],
});
export const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;
/** Mutates one turtle; segments use logical Cartesian coordinates and never wrap. */
export function applyOperation(state: TurtleState, op: Operation): void {
  const move = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('Coordenadas excedem o intervalo numérico.');
    if (state.penDown && (x !== state.x || y !== state.y))
      state.segments.push({
        from: { x: state.x, y: state.y },
        to: { x, y },
        color: state.color,
        width: state.width,
      });
    state.x = x;
    state.y = y;
  };
  switch (op.kind) {
    case 'forward':
    case 'back': {
      const d = op.value * (op.kind === 'back' ? -1 : 1),
        angle = (state.heading * Math.PI) / 180;
      move(state.x + Math.sin(angle) * d, state.y + Math.cos(angle) * d);
      break;
    }
    case 'right':
      state.heading = normalize(state.heading + op.value);
      break;
    case 'left':
      state.heading = normalize(state.heading - op.value);
      break;
    case 'setheading':
      state.heading = normalize(op.value);
      break;
    case 'setxy':
      move(op.x, op.y);
      break;
    case 'home':
      move(0, 0);
      state.heading = 0;
      break;
    case 'penup':
      state.penDown = false;
      break;
    case 'pendown':
      state.penDown = true;
      break;
    case 'setpencolor':
      state.color = op.color;
      break;
    case 'setpensize':
      state.width = op.value;
      break;
    case 'clean':
      state.segments = [];
      break;
    case 'clearscreen':
      state.segments = [];
      state.x = 0;
      state.y = 0;
      state.heading = 0;
      break;
    case 'showturtle':
      state.visible = true;
      break;
    case 'hideturtle':
      state.visible = false;
      break;
  }
}
