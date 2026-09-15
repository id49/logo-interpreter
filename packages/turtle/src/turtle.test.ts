import { describe, it, expect } from 'vitest';
import { applyOperation, initialState, normalize } from './index';
describe('turtle geometry', () => {
  it('starts at origin, north and pen down', () => {
    expect(initialState()).toMatchObject({
      x: 0,
      y: 0,
      heading: 0,
      penDown: true,
      visible: true,
      segments: [],
    });
  });
  it('closes a square and preserves segment styles', () => {
    const s = initialState();
    applyOperation(s, { kind: 'setpencolor', color: '#ff0000' });
    applyOperation(s, { kind: 'setpensize', value: 3 });
    for (let i = 0; i < 4; i++) {
      applyOperation(s, { kind: 'forward', value: 50 });
      applyOperation(s, { kind: 'right', value: 90 });
    }
    expect(s.x).toBeCloseTo(0);
    expect(s.y).toBeCloseTo(0);
    expect(s.heading).toBe(0);
    expect(s.segments).toHaveLength(4);
    expect(s.segments[0]).toMatchObject({ color: '#ff0000', width: 3, to: { x: 0, y: 50 } });
  });
  it('supports back, left, home, setxy, visibility and pen', () => {
    const s = initialState();
    applyOperation(s, { kind: 'penup' });
    applyOperation(s, { kind: 'setxy', x: 100, y: -20 });
    applyOperation(s, { kind: 'setheading', value: 90 });
    applyOperation(s, { kind: 'back', value: 30 });
    expect(s.x).toBeCloseTo(70);
    applyOperation(s, { kind: 'left', value: 450 });
    expect(s.heading).toBe(0);
    expect(s.segments).toHaveLength(0);
    applyOperation(s, { kind: 'pendown' });
    applyOperation(s, { kind: 'home' });
    expect(s).toMatchObject({ x: 0, y: 0, heading: 0 });
    expect(s.segments).toHaveLength(1);
    applyOperation(s, { kind: 'hideturtle' });
    expect(s.visible).toBe(false);
    applyOperation(s, { kind: 'showturtle' });
    expect(s.visible).toBe(true);
  });
  it('clean preserves all turtle properties; clearscreen resets only pose and drawing', () => {
    const s = initialState();
    applyOperation(s, { kind: 'forward', value: 20 });
    applyOperation(s, { kind: 'right', value: 30 });
    applyOperation(s, { kind: 'clean' });
    expect(s).toMatchObject({ x: 0, y: 20, heading: 30, segments: [] });
    applyOperation(s, { kind: 'penup' });
    applyOperation(s, { kind: 'setpensize', value: 4 });
    applyOperation(s, { kind: 'clearscreen' });
    expect(s).toMatchObject({ x: 0, y: 0, heading: 0, penDown: false, width: 4, segments: [] });
  });
  it('never wraps and can return from far outside the viewport', () => {
    const s = initialState();
    applyOperation(s, { kind: 'forward', value: 100000 });
    expect(s.y).toBe(100000);
    applyOperation(s, { kind: 'back', value: 100000 });
    expect(s.y).toBe(0);
  });
  it('movement inverse and heading periodicity hold across angles', () => {
    for (let angle = -720; angle <= 720; angle += 7) {
      const s = initialState();
      applyOperation(s, { kind: 'setheading', value: angle });
      applyOperation(s, { kind: 'forward', value: 137 });
      applyOperation(s, { kind: 'back', value: 137 });
      expect(s.x).toBeCloseTo(0);
      expect(s.y).toBeCloseTo(0);
      expect(s.heading).toBe(normalize(angle + 360));
    }
  });
  it('rejects overflowing coordinates', () => {
    const s = initialState();
    applyOperation(s, { kind: 'setxy', x: 0, y: 1e308 });
    expect(() => applyOperation(s, { kind: 'forward', value: 1e308 })).toThrow(/Coordenadas/);
  });
});
