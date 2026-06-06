import { test, expect } from 'vitest';
import { PathBezier } from '../index';

test('PathBezier: polyline mode creates points', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 'polyline');
    const bounds = path.getLocalBounds();
    expect(bounds.minX).toBe(0);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(100);
});

test('PathBezier: addPointLocal', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }], 'polyline');
    path.addPointLocal({ x: 100, y: 100 });
    const points = path.getControlPoints();
    expect(points.length).toBe(3);
    expect(points[2].x).toBe(100);
    expect(points[2].y).toBe(100);
});

test('PathBezier: removePoint', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 'polyline');
    path.removePoint(1);
    const points = path.getControlPoints();
    expect(points.length).toBe(2);
    expect(points[1].x).toBe(100);
    expect(points[1].y).toBe(100);
});

test('PathBezier: setControlPoint', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }], 'polyline');
    path.setControlPoint(1, { x: 200, y: 50 });
    const points = path.getControlPoints();
    expect(points[1].x).toBe(200);
    expect(points[1].y).toBe(50);
});

test('PathBezier: change mode to catmull', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }], 'polyline');
    path.setMode('catmull');
    expect(path.mode).toBe('catmull');
    expect(path.getFlattenedPoints().length).toBeGreaterThan(2);
});

test('PathBezier: catmullToBeziers returns cubic segments', () => {
    const path = new PathBezier(
        [{ x: 0, y: 0 }, { x: 50, y: 80 }, { x: 100, y: 0 }, { x: 150, y: 60 }],
        'catmull',
        false
    );
    const segments = path.catmullToBeziers();
    expect(segments.length).toBe(3);
    expect(segments[0].p0.x).toBe(0);
    expect(segments[0].p3.x).toBe(50);
});

test('PathBezier: closed path adds closing segment in polyline', () => {
    const path = new PathBezier(
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
        'polyline',
        true
    );
    expect(path.closed).toBe(true);
    const flat = path.getFlattenedPoints();
    expect(flat[flat.length - 1].x).toBe(flat[0].x);
    expect(flat[flat.length - 1].y).toBe(flat[0].y);
});

test('PathBezier: hitTest on polyline — on segment', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }], 'polyline');
    path.strokeWidth = 10;
    expect(path.hitTestLocal(50, 3)).toBe(true);
});

test('PathBezier: hitTest outside polyline', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 100, y: 0 }], 'polyline');
    expect(path.hitTestLocal(50, 500)).toBe(false);
});

test('PathBezier: flattenDevicePoints', () => {
    const path = new PathBezier([{ x: 0, y: 0 }, { x: 10, y: 0 }], 'polyline');
    path.transform.x = 50;
    const pts = path.flattenDevicePoints();
    expect(pts[0].x).toBeCloseTo(50);
    expect(pts[1].x).toBeCloseTo(60);
});

test('PathBezier: flatness affects catmull approximation density', () => {
    const path = new PathBezier(
        [{ x: 0, y: 0 }, { x: 40, y: 120 }, { x: 80, y: -80 }, { x: 120, y: 0 }],
        'catmull',
        false
    );
    path.flatness = 8;
    const coarse = path.getFlattenedPoints().length;
    path.flatness = 0.2;
    const fine = path.getFlattenedPoints().length;
    expect(fine).toBeGreaterThan(coarse);
});
