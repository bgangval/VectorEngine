import type { Shape } from '../lib/shapes';

export function findTopShapeAt(shapes: Shape[], x: number, y: number): Shape | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapes[i].hitTest(x, y)) return shapes[i];
    }
    return null;
}

export function findShapeIndex(shapes: Shape[], id: string): number {
    return shapes.findIndex((s) => s.id === id);
}

export function moveLayerUp(shapes: Shape[], id: string): boolean {
    const i = findShapeIndex(shapes, id);
    if (i < 0 || i >= shapes.length - 1) return false;
    [shapes[i], shapes[i + 1]] = [shapes[i + 1], shapes[i]];
    return true;
}

export function moveLayerDown(shapes: Shape[], id: string): boolean {
    const i = findShapeIndex(shapes, id);
    if (i <= 0) return false;
    [shapes[i], shapes[i - 1]] = [shapes[i - 1], shapes[i]];
    return true;
}

export function moveLayerToFront(shapes: Shape[], id: string): boolean {
    const i = findShapeIndex(shapes, id);
    if (i < 0 || i === shapes.length - 1) return false;
    const [s] = shapes.splice(i, 1);
    shapes.push(s);
    return true;
}

export function moveLayerToBack(shapes: Shape[], id: string): boolean {
    const i = findShapeIndex(shapes, id);
    if (i <= 0) return false;
    const [s] = shapes.splice(i, 1);
    shapes.unshift(s);
    return true;
}

export function removeShape(shapes: Shape[], id: string): boolean {
    const i = findShapeIndex(shapes, id);
    if (i < 0) return false;
    shapes.splice(i, 1);
    return true;
}
