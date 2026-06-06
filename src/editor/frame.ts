import type { Shape } from '../lib/shapes';
import type { Bounds } from '../lib/shapes/Bounds';
import type { Point2D, ResizeHandle } from './types';

export function getLocalBoundsCorners(bounds: Bounds): Point2D[] {
    return [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
        { x: bounds.minX, y: bounds.maxY },
    ];
}

export function getDeviceCorners(shape: Shape): Point2D[] {
    const b = shape.getLocalBounds();
    return getLocalBoundsCorners(b).map((p) => shape.transformPointToDevice(p.x, p.y));
}

export function getResizeHandles(shape: Shape): { id: ResizeHandle; point: Point2D }[] {
    const b = shape.getLocalBounds();
    const nw = shape.transformPointToDevice(b.minX, b.minY);
    const ne = shape.transformPointToDevice(b.maxX, b.minY);
    const se = shape.transformPointToDevice(b.maxX, b.maxY);
    const sw = shape.transformPointToDevice(b.minX, b.maxY);

    const n = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
    const e = { x: (ne.x + se.x) / 2, y: (ne.y + se.y) / 2 };
    const s = { x: (se.x + sw.x) / 2, y: (se.y + sw.y) / 2 };
    const w = { x: (sw.x + nw.x) / 2, y: (sw.y + nw.y) / 2 };

    return [
        { id: 'nw', point: nw },
        { id: 'n', point: n },
        { id: 'ne', point: ne },
        { id: 'e', point: e },
        { id: 'se', point: se },
        { id: 's', point: s },
        { id: 'sw', point: sw },
        { id: 'w', point: w },
    ];
}

export function getRotateHandle(shape: Shape, offset = 36): Point2D {
    const b = shape.getLocalBounds();
    const topMid = shape.transformPointToDevice((b.minX + b.maxX) / 2, b.minY);
    const center = shape.getCenter();
    const dx = topMid.x - center.x;
    const dy = topMid.y - center.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
        x: topMid.x + (dx / len) * offset,
        y: topMid.y + (dy / len) * offset,
    };
}

export function anchorForHandle(handle: ResizeHandle, bounds: Bounds): Point2D {
    switch (handle) {
        case 'nw':
            return { x: bounds.maxX, y: bounds.maxY };
        case 'n':
            return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY };
        case 'ne':
            return { x: bounds.minX, y: bounds.maxY };
        case 'e':
            return { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 };
        case 'se':
            return { x: bounds.minX, y: bounds.minY };
        case 's':
            return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY };
        case 'sw':
            return { x: bounds.maxX, y: bounds.minY };
        case 'w':
            return { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 };
    }
}
