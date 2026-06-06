import type { RasterRenderer, RGBA } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes';
import { PathBezier } from '../lib/shapes';
import { getDeviceCorners, getResizeHandles, getRotateHandle } from './frame';
import { isEditableShape, type EditableShape } from './editableShape';
import type { HandleHit, ResizeHandle } from './types';

const SELECTION_COLOR: RGBA = { r: 59, g: 130, b: 246, a: 255 };
const HANDLE_FILL: RGBA = { r: 255, g: 255, b: 255, a: 255 };
const HANDLE_STROKE: RGBA = { r: 59, g: 130, b: 246, a: 255 };
const ROTATE_COLOR: RGBA = { r: 34, g: 197, b: 94, a: 255 };
const CONTROL_ANCHOR: RGBA = { r: 80, g: 200, b: 255, a: 255 };
const CONTROL_HANDLE: RGBA = { r: 255, g: 90, b: 160, a: 255 };

export function drawSelectionOverlay(
    r: RasterRenderer,
    shape: Shape,
    activeHandle: HandleHit | null,
    activeControlIndex: number | null
) {
    const corners = getDeviceCorners(shape);
    for (let i = 0; i < corners.length; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];
        r.strokeLine(a.x, a.y, b.x, b.y, SELECTION_COLOR, 2);
    }

    const center = shape.getCenter();
    const rotatePt = getRotateHandle(shape);
    r.strokeLine(center.x, center.y, rotatePt.x, rotatePt.y, ROTATE_COLOR, 1);
    const rotActive = activeHandle === 'rotate';
    r.fillCircle(rotatePt.x, rotatePt.y, rotActive ? 8 : 6, rotActive ? { r: 255, g: 220, b: 0, a: 255 } : ROTATE_COLOR);

    for (const { id, point } of getResizeHandles(shape)) {
        const active = activeHandle === id;
        r.fillCircle(point.x, point.y, active ? 7 : 5, HANDLE_FILL);
        r.strokeLine(point.x - 5, point.y, point.x + 5, point.y, HANDLE_STROKE, active ? 2 : 1);
        r.strokeLine(point.x, point.y - 5, point.x, point.y + 5, HANDLE_STROKE, active ? 2 : 1);
    }

    if (isEditableShape(shape)) {
        drawControlPoints(r, shape, activeControlIndex);
    }
}

function drawControlPoints(
    r: RasterRenderer,
    shape: Shape & EditableShape,
    activeIndex: number | null
) {
    const isPath = shape instanceof PathBezier;
    const isQuad = shape.constructor.name === 'QuadraticBezier';
    const isCubic = shape.constructor.name === 'CubicBezier';

    shape.getControlPoints().forEach((pt, index) => {
        const device = shape.transformPointToDevice(pt.x, pt.y);
        const selected = index === activeIndex;
        const isEndpoint =
            isPath ||
            (isQuad && (index === 0 || index === 2)) ||
            (isCubic && (index === 0 || index === 3)) ||
            shape.constructor.name === 'Line' ||
            shape.constructor.name === 'Triangle';

        const fill = selected
            ? { r: 255, g: 180, b: 0, a: 255 }
            : isEndpoint
              ? CONTROL_ANCHOR
              : CONTROL_HANDLE;

        r.fillCircle(device.x, device.y, selected ? 7 : 5, fill);
    });
}

export function hitTestHandle(
    shape: Shape,
    px: number,
    py: number,
    radius = 12
): HandleHit | null {
    const rotate = getRotateHandle(shape);
    if (dist(px, py, rotate.x, rotate.y) <= radius) return 'rotate';

    for (const { id, point } of getResizeHandles(shape)) {
        if (dist(px, py, point.x, point.y) <= radius) return id;
    }

    if (isEditableShape(shape)) {
        const points = shape.getControlPoints();
        for (let i = points.length - 1; i >= 0; i--) {
            const d = shape.transformPointToDevice(points[i].x, points[i].y);
            if (dist(px, py, d.x, d.y) <= radius) return 'control';
        }
    }

    return null;
}

function dist(x1: number, y1: number, x2: number, y2: number) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getControlPointIndex(shape: Shape, px: number, py: number, radius = 12): number | null {
    if (!isEditableShape(shape)) return null;
    const points = shape.getControlPoints();
    for (let i = points.length - 1; i >= 0; i--) {
        const d = shape.transformPointToDevice(points[i].x, points[i].y);
        if (dist(px, py, d.x, d.y) <= radius) return i;
    }
    return null;
}

export function isResizeHandle(hit: HandleHit | null): hit is ResizeHandle {
    return hit !== null && hit !== 'rotate' && hit !== 'control';
}
