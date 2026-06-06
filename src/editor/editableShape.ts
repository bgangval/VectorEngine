import type { Shape } from '../lib/shapes';
import { PathBezier } from '../lib/shapes';

export interface EditableShape {
    getControlPoints(): { x: number; y: number }[];
    setControlPoint(index: number, point: { x: number; y: number }): void;
}

export function isEditableShape(shape: Shape): shape is Shape & EditableShape {
    const s = shape as unknown as EditableShape;
    return typeof s.getControlPoints === 'function' && typeof s.setControlPoint === 'function';
}

export function getShapeLabel(shape: Shape): string {
    const name = shape.constructor.name;
    if (shape instanceof PathBezier) {
        return `Path (${shape.points.length} pts)`;
    }
    return name;
}
