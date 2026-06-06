import { test, expect } from 'vitest';
import { QuadraticBezier, CubicBezier, Transform } from '../index';

test('QuadraticBezier: evalLocal at t=0', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    const p = bezier.evalLocal(0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
});

test('QuadraticBezier: evalLocal at t=1', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    const p = bezier.evalLocal(1);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
});

test('QuadraticBezier: evalLocal at t=0.5', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    const p = bezier.evalLocal(0.5);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(50);
});

test('CubicBezier: evalLocal at t=0', () => {
    const bezier = new CubicBezier({ x: 0, y: 0 }, { x: 30, y: 100 }, { x: 70, y: -100 }, { x: 100, y: 0 });
    const p = bezier.evalLocal(0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
});

test('CubicBezier: evalLocal at t=1', () => {
    const bezier = new CubicBezier({ x: 0, y: 0 }, { x: 30, y: 100 }, { x: 70, y: -100 }, { x: 100, y: 0 });
    const p = bezier.evalLocal(1);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
});

test('QuadraticBezier: getControlPoints', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    const points = bezier.getControlPoints();
    expect(points.length).toBe(3);
    expect(points[0].x).toBe(0);
    expect(points[1].x).toBe(50);
    expect(points[2].x).toBe(100);
});

test('QuadraticBezier: setControlPoint updates curve', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    bezier.setControlPoint(1, { x: 80, y: 120 });
    const mid = bezier.evalLocal(0.5);
    expect(mid.y).toBeGreaterThan(50);
});

test('QuadraticBezier: flattenDevicePoints with transform', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    bezier.transform = new Transform({ x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 });
    const pts = bezier.flattenDevicePoints();
    expect(pts[0].x).toBeCloseTo(100);
    expect(pts[0].y).toBeCloseTo(200);
    expect(pts[pts.length - 1].x).toBeCloseTo(110);
});

test('QuadraticBezier: hitTest device — near curve in screen space', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    bezier.transform = new Transform({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    bezier.strokeWidth = 4;
    expect(bezier.hitTest(50, 48)).toBe(true);
    expect(bezier.hitTest(50, -100)).toBe(false);
});

test('QuadraticBezier: smaller flatness yields more segments', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 200 }, { x: 100, y: 0 });
    bezier.flatness = 10;
    const coarse = bezier.getFlattenedPoints().length;
    bezier.flatness = 0.25;
    const fine = bezier.getFlattenedPoints().length;
    expect(fine).toBeGreaterThan(coarse);
});

test('QuadraticBezier: getBounds after transform', () => {
    const bezier = new QuadraticBezier({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 });
    bezier.transform = new Transform({ x: 1000, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    const b = bezier.getBounds();
    expect(b.minX).toBeGreaterThanOrEqual(1000);
    expect(b.maxX).toBeLessThanOrEqual(1100);
});

test('CubicBezier: flattenDevicePoints endpoints', () => {
    const bezier = new CubicBezier({ x: 0, y: 0 }, { x: 0, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 0 });
    const pts = bezier.flattenDevicePoints();
    expect(pts[0].x).toBeCloseTo(0);
    expect(pts[pts.length - 1].x).toBeCloseTo(50);
    expect(pts[pts.length - 1].y).toBeCloseTo(0);
});
