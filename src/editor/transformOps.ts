import type { Shape } from '../lib/shapes';
import { Transform } from '../lib/shapes/Transform';
import type { Point2D, ResizeHandle, ResizeSession } from './types';
import { anchorForHandle } from './frame';

const MIN_LOCAL_SIZE = 24;

function clampLocalBounds(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    handle: ResizeHandle
): { minX: number; minY: number; maxX: number; maxY: number } {
    let a = minX;
    let b = maxX;
    let c = minY;
    let d = maxY;
    if (b - a < MIN_LOCAL_SIZE) {
        if (handle.includes('w')) a = b - MIN_LOCAL_SIZE;
        else b = a + MIN_LOCAL_SIZE;
    }
    if (d - c < MIN_LOCAL_SIZE) {
        if (handle.includes('n')) c = d - MIN_LOCAL_SIZE;
        else d = c + MIN_LOCAL_SIZE;
    }
    return { minX: a, minY: c, maxX: b, maxY: d };
}

export function applyMove(
    shape: Shape,
    startPointer: Point2D,
    startTransform: Transform,
    pointer: Point2D
) {
    shape.transform.x = startTransform.x + (pointer.x - startPointer.x);
    shape.transform.y = startTransform.y + (pointer.y - startPointer.y);
}

export function applyRotate(
    shape: Shape,
    center: Point2D,
    startAngle: number,
    startRotation: number,
    pointer: Point2D
) {
    const angle = Math.atan2(pointer.y - center.y, pointer.x - center.x);
    shape.transform.rotation = startRotation + (angle - startAngle);
}

export function applyResize(session: ResizeSession, pointerDevice: Point2D) {
    const { shape, handle, startTransform, startLocalBounds, anchorLocal } = session;
    const local = shape.transformPointToLocal(pointerDevice.x, pointerDevice.y);
    if (!local) return;

    const b = startLocalBounds;
    let minX = b.minX;
    let maxX = b.maxX;
    let minY = b.minY;
    let maxY = b.maxY;

    if (handle.includes('e') || handle === 'se' || handle === 'ne') maxX = local.x;
    if (handle.includes('w') || handle === 'sw' || handle === 'nw') minX = local.x;
    if (handle.includes('s') || handle === 'se' || handle === 'sw') maxY = local.y;
    if (handle.includes('n') || handle === 'ne' || handle === 'nw') minY = local.y;

    if (minX > maxX) [minX, maxX] = [maxX, minX];
    if (minY > maxY) [minY, maxY] = [maxY, minY];

    ({ minX, minY, maxX, maxY } = clampLocalBounds(minX, minY, maxX, maxY, handle));

    const oldW = b.width;
    const oldH = b.height;
    const newW = maxX - minX;
    const newH = maxY - minY;
    if (oldW <= 0 || oldH <= 0) return;

    const anchorDevice = matTransformPoint(startTransform, anchorLocal.x, anchorLocal.y);

    shape.transform.rotation = startTransform.rotation;
    shape.transform.scaleX = startTransform.scaleX * (newW / oldW);
    shape.transform.scaleY = startTransform.scaleY * (newH / oldH);
    shape.transform.x = startTransform.x;
    shape.transform.y = startTransform.y;

    const newAnchorDevice = shape.transformPointToDevice(anchorLocal.x, anchorLocal.y);
    shape.transform.x += anchorDevice.x - newAnchorDevice.x;
    shape.transform.y += anchorDevice.y - newAnchorDevice.y;
}

function matTransformPoint(t: Transform, lx: number, ly: number): Point2D {
    const m = t.getMatrix();
    return {
        x: m[0] * lx + m[1] * ly + m[2],
        y: m[3] * lx + m[4] * ly + m[5],
    };
}

export function createResizeSession(
    shape: Shape,
    handle: ResizeHandle,
    pointerDevice: Point2D
): ResizeSession | null {
    const local = shape.transformPointToLocal(pointerDevice.x, pointerDevice.y);
    if (!local) return null;
    const startLocalBounds = shape.getLocalBounds();
    return {
        kind: 'resize',
        shape,
        handle,
        startPointerLocal: local,
        startTransform: shape.transform.clone(),
        startLocalBounds,
        anchorLocal: anchorForHandle(handle, startLocalBounds),
    };
}
