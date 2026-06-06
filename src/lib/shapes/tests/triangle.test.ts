import { test, expect } from 'vitest';
import { Triangle, Transform } from '../index';

test('Triangle: center storage — local centroid near origin', () => {
    const tri = new Triangle({ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 150, y: 200 });
    const cx = (tri.points[0].x + tri.points[1].x + tri.points[2].x) / 3;
    const cy = (tri.points[0].y + tri.points[1].y + tri.points[2].y) / 3;
    expect(cx).toBeCloseTo(0, 5);
    expect(cy).toBeCloseTo(0, 5);
});

test('Triangle: hit inside', () => {
    const tri = new Triangle({ x: -100, y: -50 }, { x: 100, y: -50 }, { x: 0, y: 100 });
    expect(tri.hitTestLocal(0, 0)).toBe(true);
});

test('Triangle: hit outside', () => {
    const tri = new Triangle({ x: -100, y: -50 }, { x: 100, y: -50 }, { x: 0, y: 100 });
    expect(tri.hitTestLocal(0, -200)).toBe(false);
});

test('Triangle: hit on edge (boundary)', () => {
    const tri = new Triangle({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 });
    const midX = (tri.points[0].x + tri.points[1].x) / 2;
    const midY = (tri.points[0].y + tri.points[1].y) / 2;
    expect(tri.hitTestLocal(midX, midY)).toBe(true);
});

test('Triangle: getLocalBounds', () => {
    const tri = new Triangle({ x: -50, y: -30 }, { x: 50, y: -30 }, { x: 0, y: 60 });
    const b = tri.getLocalBounds();
    expect(b.minX).toBeCloseTo(-50, 5);
    expect(b.maxX).toBeCloseTo(50, 5);
    expect(b.minY).toBeCloseTo(-30, 5);
    expect(b.maxY).toBeCloseTo(60, 5);
});

test('Triangle: getBounds with transform', () => {
    const tri = new Triangle({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 });
    tri.transform = new Transform({ x: 200, y: 50, rotation: 0, scaleX: 1, scaleY: 1 });
    const b = tri.getBounds();
    expect(b.minX).toBeGreaterThanOrEqual(150);
    expect(b.maxX).toBeLessThanOrEqual(350);
    expect(b.minY).toBeGreaterThanOrEqual(0);
    expect(b.maxY).toBeLessThanOrEqual(200);
});

test('Triangle: clone preserves geometry', () => {
    const tri = new Triangle({ x: 10, y: 20 }, { x: 110, y: 20 }, { x: 60, y: 120 });
    const copy = tri.clone();
    expect(copy.points[0].x).toBeCloseTo(tri.points[0].x);
    expect(copy.points[1].x).toBeCloseTo(tri.points[1].x);
    expect(copy.points[2].x).toBeCloseTo(tri.points[2].x);
});
