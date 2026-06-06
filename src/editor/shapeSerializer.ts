import {
    Shape,
    Rect,
    Oval,
    Line,
    Triangle,
    QuadraticBezier,
    CubicBezier,
    PathBezier,
    Transform,
    type PathMode,
} from '../lib/shapes';
import type { RGBA } from '../lib/raster/RasterRenderer';

interface TransformJSON {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

interface ShapeJSONBase {
    type: string;
    id?: string;
    transform: TransformJSON;
    fillStyle?: RGBA;
    fillOpacity?: number;
    strokeStyle?: RGBA;
    strokeWidth?: number;
    strokeOpacity?: number;
}

function transformFromJSON(t: TransformJSON): Transform {
    return new Transform(t);
}

function shapeParams(json: ShapeJSONBase): Transform {
    return transformFromJSON(json.transform);
}

function applyStyle(shape: Shape, json: ShapeJSONBase) {
    if (json.fillStyle) shape.fillStyle = { ...json.fillStyle };
    if (json.fillOpacity !== undefined) shape.fillOpacity = json.fillOpacity;
    if (json.strokeStyle) shape.strokeStyle = { ...json.strokeStyle };
    if (json.strokeWidth !== undefined) shape.strokeWidth = json.strokeWidth;
    if (json.strokeOpacity !== undefined) shape.strokeOpacity = json.strokeOpacity;
}

export function serializeShapes(shapes: Shape[]): object[] {
    return shapes.map((s) => s.toJSON());
}

export function shapeFromJSON(raw: unknown): Shape | null {
    if (!raw || typeof raw !== 'object') return null;
    const json = raw as ShapeJSONBase & Record<string, unknown>;
    if (!json.type || !json.transform) return null;

    const transform = shapeParams(json);
    let shape: Shape | null = null;

    switch (json.type) {
        case 'Rect':
            shape = new Rect(json.width as number, json.height as number, transform);
            break;
        case 'Oval':
            shape = new Oval(json.radiusX as number, json.radiusY as number, transform);
            break;
        case 'Line':
            shape = new Line(
                json.x1 as number,
                json.y1 as number,
                json.x2 as number,
                json.y2 as number,
                transform
            );
            break;
        case 'Triangle': {
            const points = json.points as { x: number; y: number }[];
            if (!points || points.length !== 3) return null;
            shape = new Triangle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, transform);
            (shape as Triangle).points = points.map((p) => ({ ...p }));
            break;
        }
        case 'QuadraticBezier':
            shape = new QuadraticBezier(
                json.p0 as { x: number; y: number },
                json.p1 as { x: number; y: number },
                json.p2 as { x: number; y: number },
                transform
            );
            if (json.flatness !== undefined) (shape as QuadraticBezier).flatness = json.flatness as number;
            break;
        case 'CubicBezier':
            shape = new CubicBezier(
                json.p0 as { x: number; y: number },
                json.p1 as { x: number; y: number },
                json.p2 as { x: number; y: number },
                json.p3 as { x: number; y: number },
                transform
            );
            if (json.flatness !== undefined) (shape as CubicBezier).flatness = json.flatness as number;
            break;
        case 'PathBezier':
            shape = new PathBezier(
                (json.points as { x: number; y: number }[]) ?? [],
                (json.mode as PathMode) ?? 'polyline',
                Boolean(json.closed),
                transform
            );
            if (json.flatness !== undefined) (shape as PathBezier).flatness = json.flatness as number;
            break;
        default:
            return null;
    }

    applyStyle(shape, json);
    return shape;
}

export function deserializeShapes(data: unknown): Shape[] {
    if (!Array.isArray(data)) return [];
    const shapes: Shape[] = [];
    for (const item of data) {
        const shape = shapeFromJSON(item);
        if (shape) shapes.push(shape);
    }
    return shapes;
}
