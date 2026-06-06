import { Rect, Oval, Line, Triangle, QuadraticBezier, CubicBezier, PathBezier, Transform } from './shapes';
import type { Shape, PathMode } from './shapes';

type PointJSON = { x: number; y: number };
type ShapeJSON = Record<string, unknown>;

function point(value: unknown): PointJSON | null {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.x === 'number' && typeof candidate.y === 'number'
        ? { x: candidate.x, y: candidate.y }
        : null;
}

function points(value: unknown): PointJSON[] | null {
    if (!Array.isArray(value)) return null;
    const parsed = value.map(point);
    return parsed.every((p): p is PointJSON => p !== null) ? parsed : null;
}

function numberValue(value: unknown, fallback = 0): number {
    return typeof value === 'number' ? value : fallback;
}

export function shapeFromJSON(data: unknown): Shape | null {
    if (!data || typeof data !== 'object') return null;
    const json = data as ShapeJSON;
    const transformJSON = json.transform && typeof json.transform === 'object'
        ? json.transform as ShapeJSON
        : {};
    const transform = new Transform({
        x: numberValue(transformJSON.x),
        y: numberValue(transformJSON.y),
        rotation: numberValue(transformJSON.rotation),
        scaleX: numberValue(transformJSON.scaleX, 1),
        scaleY: numberValue(transformJSON.scaleY, 1)
    });

    let shape: Shape;

    switch (json.type) {
        case 'Rect':
            shape = new Rect(numberValue(json.width), numberValue(json.height), transform);
            break;
        case 'Oval':
            shape = new Oval(numberValue(json.radiusX), numberValue(json.radiusY), transform);
            break;
        case 'Line':
            shape = new Line(
                numberValue(json.x1),
                numberValue(json.y1),
                numberValue(json.x2),
                numberValue(json.y2),
                transform
            );
            break;
        case 'Triangle': {
            const parsed = points(json.points);
            if (!parsed || parsed.length !== 3) return null;
            shape = new Triangle(parsed[0], parsed[1], parsed[2], transform);
            break;
        }
        case 'QuadraticBezier': {
            const p0 = point(json.p0);
            const p1 = point(json.p1);
            const p2 = point(json.p2);
            if (!p0 || !p1 || !p2) return null;
            const bezier = new QuadraticBezier(p0, p1, p2, transform);
            if (typeof json.flatness === 'number') bezier.flatness = json.flatness;
            shape = bezier;
            break;
        }
        case 'CubicBezier': {
            const p0 = point(json.p0);
            const p1 = point(json.p1);
            const p2 = point(json.p2);
            const p3 = point(json.p3);
            if (!p0 || !p1 || !p2 || !p3) return null;
            const bezier = new CubicBezier(p0, p1, p2, p3, transform);
            if (typeof json.flatness === 'number') bezier.flatness = json.flatness;
            shape = bezier;
            break;
        }
        case 'PathBezier': {
            const parsed = points(json.points);
            if (!parsed) return null;
            const mode = json.mode === 'bezier' || json.mode === 'catmull' ? json.mode : 'polyline';
            const path = new PathBezier(parsed, mode as PathMode, Boolean(json.closed), transform);
            if (typeof json.flatness === 'number') path.flatness = json.flatness;
            shape = path;
            break;
        }
        default:
            return null;
    }

    if (json.fillStyle && typeof json.fillStyle === 'object') {
        shape.fillStyle = json.fillStyle as Shape['fillStyle'];
    }
    if (typeof json.fillOpacity === 'number') shape.fillOpacity = json.fillOpacity;
    if (json.strokeStyle && typeof json.strokeStyle === 'object') {
        shape.strokeStyle = json.strokeStyle as Shape['strokeStyle'];
    }
    if (typeof json.strokeWidth === 'number') shape.strokeWidth = json.strokeWidth;
    if (typeof json.strokeOpacity === 'number') shape.strokeOpacity = json.strokeOpacity;

    return shape;
}

export function shapesFromJSON(shapesData: unknown): Shape[] {
    if (!Array.isArray(shapesData)) return [];
    const shapes: Shape[] = [];
    for (const data of shapesData) {
        const shape = shapeFromJSON(data);
        if (shape) {
            shapes.push(shape);
        }
    }
    return shapes;
}
