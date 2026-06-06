import { test, expect } from 'vitest';
import { Line } from '../index';

test('Line: getControlPoints and setControlPoint', () => {
    const line = new Line(0, 0, 100, 0);
    const pts = line.getControlPoints();
    expect(pts).toHaveLength(2);
    line.setControlPoint(1, { x: 200, y: 50 });
    expect(line.x2).toBe(200);
    expect(line.y2).toBe(50);
});
