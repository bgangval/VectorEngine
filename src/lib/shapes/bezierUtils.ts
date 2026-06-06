import { Bounds } from './Bounds';

export interface Point2D {
    x: number;
    y: number;
}

export interface CubicSegment {
    p0: Point2D;
    p1: Point2D;
    p2: Point2D;
    p3: Point2D;
}

export const DEFAULT_FLATNESS = 1;
export const DEFAULT_HIT_THRESHOLD_PX = 8;

export function evalQuadratic(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
    const mt = 1 - t;
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    };
}

export function evalCubic(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
        x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
        y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
    };
}

function linePointDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) {
        const ox = px - x1;
        const oy = py - y1;
        return Math.sqrt(ox * ox + oy * oy);
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distX = px - projX;
    const distY = py - projY;
    return Math.sqrt(distX * distX + distY * distY);
}

function pointLineDistance(p: Point2D, a: Point2D, b: Point2D): number {
    return linePointDistance(p.x, p.y, a.x, a.y, b.x, b.y);
}

function subdivideQuadratic(p0: Point2D, p1: Point2D, p2: Point2D): [Point2D, Point2D, Point2D, Point2D, Point2D, Point2D] {
    const m01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const m12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const m012 = { x: (m01.x + m12.x) / 2, y: (m01.y + m12.y) / 2 };
    return [p0, m01, m012, m012, m12, p2];
}

function subdivideCubic(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): [Point2D, Point2D, Point2D, Point2D, Point2D, Point2D, Point2D, Point2D] {
    const m01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const m12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const m23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
    const m012 = { x: (m01.x + m12.x) / 2, y: (m01.y + m12.y) / 2 };
    const m123 = { x: (m12.x + m23.x) / 2, y: (m12.y + m23.y) / 2 };
    const m0123 = { x: (m012.x + m123.x) / 2, y: (m012.y + m123.y) / 2 };
    return [p0, m01, m012, m0123, m0123, m123, m23, p3];
}

function flattenQuadraticRecursive(p0: Point2D, p1: Point2D, p2: Point2D, flatness: number, out: Point2D[]): void {
    const deviation = pointLineDistance(p1, p0, p2);
    if (deviation <= flatness) {
        const last = out[out.length - 1];
        if (!last || last.x !== p2.x || last.y !== p2.y) {
            out.push({ x: p2.x, y: p2.y });
        }
        return;
    }
    const [l0, l1, l2, r0, r1, r2] = subdivideQuadratic(p0, p1, p2);
    flattenQuadraticRecursive(l0, l1, l2, flatness, out);
    flattenQuadraticRecursive(r0, r1, r2, flatness, out);
}

function flattenCubicRecursive(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, flatness: number, out: Point2D[]): void {
    const d1 = pointLineDistance(p1, p0, p3);
    const d2 = pointLineDistance(p2, p0, p3);
    const deviation = Math.max(d1, d2);
    if (deviation <= flatness) {
        const last = out[out.length - 1];
        if (!last || last.x !== p3.x || last.y !== p3.y) {
            out.push({ x: p3.x, y: p3.y });
        }
        return;
    }
    const [l0, l1, l2, l3, r0, r1, r2, r3] = subdivideCubic(p0, p1, p2, p3);
    flattenCubicRecursive(l0, l1, l2, l3, flatness, out);
    flattenCubicRecursive(r0, r1, r2, r3, flatness, out);
}

export function flattenQuadraticLocal(p0: Point2D, p1: Point2D, p2: Point2D, flatness: number = DEFAULT_FLATNESS): Point2D[] {
    const out: Point2D[] = [{ x: p0.x, y: p0.y }];
    flattenQuadraticRecursive(p0, p1, p2, flatness, out);
    return out;
}

export function flattenCubicLocal(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, flatness: number = DEFAULT_FLATNESS): Point2D[] {
    const out: Point2D[] = [{ x: p0.x, y: p0.y }];
    flattenCubicRecursive(p0, p1, p2, p3, flatness, out);
    return out;
}

export function flattenPolylineLocal(points: Point2D[], closed: boolean): Point2D[] {
    const result = points.map((p) => ({ x: p.x, y: p.y }));
    if (closed && result.length > 0) {
        result.push({ x: result[0].x, y: result[0].y });
    }
    return result;
}

export function catmullToBeziers(anchors: Point2D[], closed: boolean): CubicSegment[] {
    if (anchors.length < 2) return [];

    const extended: Point2D[] = [...anchors];
    if (closed) {
        extended.unshift(anchors[anchors.length - 1]);
        extended.push(anchors[0], anchors[1]);
    } else {
        extended.unshift(anchors[0]);
        extended.push(anchors[anchors.length - 1]);
    }

    const segments: CubicSegment[] = [];
    const end = closed ? anchors.length : anchors.length - 1;

    for (let i = 1; i <= end; i++) {
        const p0 = extended[i - 1];
        const p1 = extended[i];
        const p2 = extended[i + 1];
        const p3 = extended[i + 2];
        segments.push({
            p0: { x: p1.x, y: p1.y },
            p1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
            p2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
            p3: { x: p2.x, y: p2.y },
        });
    }

    return segments;
}

export function flattenBezierSegmentsLocal(segments: CubicSegment[], flatness: number): Point2D[] {
    const result: Point2D[] = [];
    for (const seg of segments) {
        const part = flattenCubicLocal(seg.p0, seg.p1, seg.p2, seg.p3, flatness);
        if (result.length > 0) {
            part.shift();
        }
        result.push(...part);
    }
    return result;
}

export function boundsFromPoints(points: Point2D[]): Bounds {
    if (points.length === 0) {
        return new Bounds(0, 0, 0, 0);
    }
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return new Bounds(minX, minY, maxX, maxY);
}

export function hitTestPolyline(
    px: number,
    py: number,
    points: Point2D[],
    threshold: number
): boolean {
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (linePointDistance(px, py, p1.x, p1.y, p2.x, p2.y) <= threshold) {
            return true;
        }
    }
    return false;
}

export function mapPointsToDevice(
    localPoints: Point2D[],
    toDevice: (x: number, y: number) => { x: number; y: number }
): Point2D[] {
    return localPoints.map((p) => toDevice(p.x, p.y));
}
