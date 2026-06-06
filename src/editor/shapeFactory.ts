import {
    Rect,
    Oval,
    Line,
    Triangle,
    QuadraticBezier,
    CubicBezier,
    PathBezier,
    Transform,
    Shape,
} from '../lib/shapes';
import type { EditorTool } from './types';

function defaultStyle(shape: Shape) {
    shape.fillStyle = { r: 100, g: 160, b: 255, a: 255 };
    shape.fillOpacity = 0.65;
    shape.strokeStyle = { r: 30, g: 60, b: 140, a: 255 };
    shape.strokeWidth = 2;
}

export function createShape(tool: EditorTool, sceneX: number, sceneY: number): Shape | null {
    const t = new Transform({ x: sceneX, y: sceneY, rotation: 0, scaleX: 1, scaleY: 1 });

    switch (tool) {
        case 'rect': {
            const s = new Rect(160, 110, t);
            defaultStyle(s);
            return s;
        }
        case 'oval': {
            const s = new Oval(150, 100, t);
            defaultStyle(s);
            return s;
        }
        case 'line': {
            const s = new Line(-90, 0, 90, 0, t);
            s.fillOpacity = 0;
            s.strokeStyle = { r: 40, g: 40, b: 50, a: 255 };
            s.strokeWidth = 3;
            return s;
        }
        case 'triangle': {
            const s = new Triangle({ x: 0, y: -60 }, { x: -70, y: 55 }, { x: 70, y: 55 }, t);
            defaultStyle(s);
            return s;
        }
        case 'quadratic': {
            const s = new QuadraticBezier({ x: -100, y: 0 }, { x: 0, y: -120 }, { x: 100, y: 0 }, t);
            s.fillOpacity = 0;
            s.strokeStyle = { r: 200, g: 80, b: 40, a: 255 };
            s.strokeWidth = 3;
            s.flatness = 0.5;
            return s;
        }
        case 'cubic': {
            const s = new CubicBezier(
                { x: -100, y: 0 },
                { x: -40, y: -110 },
                { x: 40, y: 110 },
                { x: 100, y: 0 },
                t
            );
            s.fillOpacity = 0;
            s.strokeStyle = { r: 180, g: 50, b: 120, a: 255 };
            s.strokeWidth = 3;
            s.flatness = 0.5;
            return s;
        }
        case 'path': {
            const s = new PathBezier(
                [
                    { x: -80, y: -20 },
                    { x: -30, y: -60 },
                    { x: 30, y: -40 },
                    { x: 80, y: -10 },
                ],
                'catmull',
                false,
                t
            );
            s.fillOpacity = 0;
            s.strokeStyle = { r: 50, g: 160, b: 120, a: 255 };
            s.strokeWidth = 3;
            s.flatness = 0.6;
            return s;
        }
        default:
            return null;
    }
}
