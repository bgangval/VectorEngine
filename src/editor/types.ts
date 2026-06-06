import type { Shape } from '../lib/shapes';
import type { Transform } from '../lib/shapes/Transform';
import type { Bounds } from '../lib/shapes/Bounds';

export type EditorTool =
    | 'select'
    | 'rect'
    | 'oval'
    | 'line'
    | 'triangle'
    | 'quadratic'
    | 'cubic'
    | 'path';

export type InteractionMode =
    | 'idle'
    | 'move'
    | 'resize'
    | 'rotate'
    | 'control-point';

export type ResizeHandle =
    | 'nw'
    | 'n'
    | 'ne'
    | 'e'
    | 'se'
    | 's'
    | 'sw'
    | 'w';

export type HandleHit = ResizeHandle | 'rotate' | 'control';

export interface Point2D {
    x: number;
    y: number;
}

export interface MoveSession {
    kind: 'move';
    shape: Shape;
    startPointer: Point2D;
    startTransform: Transform;
}

export interface ResizeSession {
    kind: 'resize';
    shape: Shape;
    handle: ResizeHandle;
    startPointerLocal: Point2D;
    startTransform: Transform;
    startLocalBounds: Bounds;
    anchorLocal: Point2D;
}

export interface RotateSession {
    kind: 'rotate';
    shape: Shape;
    startAngle: number;
    startRotation: number;
    center: Point2D;
}

export interface ControlPointSession {
    kind: 'control-point';
    shape: Shape;
    pointIndex: number;
}

export type InteractionSession =
    | MoveSession
    | ResizeSession
    | RotateSession
    | ControlPointSession;
