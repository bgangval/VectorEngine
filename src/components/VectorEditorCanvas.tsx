import { useRef, useEffect, useCallback } from 'react';
import { RasterRenderer } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes';
import { PathBezier } from '../lib/shapes';
import type { EditorTool, InteractionMode, InteractionSession, HandleHit } from '../editor/types';
import { createShape } from '../editor/shapeFactory';
import { isEditableShape } from '../editor/editableShape';
import {
    drawSelectionOverlay,
    hitTestHandle,
    getControlPointIndex,
    isResizeHandle,
} from '../editor/selectionOverlay';
import { applyMove, applyRotate, applyResize, createResizeSession } from '../editor/transformOps';
import { findTopShapeAt, removeShape } from '../editor/layers';

export interface VectorEditorCanvasProps {
    activeTool: EditorTool;
    shapes: Shape[];
    selectedId: string | null;
    onShapesChange: () => void;
    onSelect: (id: string | null) => void;
    onToolChange: (tool: EditorTool) => void;
}

function getCanvasCoords(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
}

export function VectorEditorCanvas({
    activeTool,
    shapes,
    selectedId,
    onShapesChange,
    onSelect,
    onToolChange,
}: VectorEditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const modeRef = useRef<InteractionMode>('idle');
    const sessionRef = useRef<InteractionSession | null>(null);
    const activeHandleRef = useRef<HandleHit | null>(null);
    const activeControlRef = useRef<number | null>(null);
    const shapesRef = useRef(shapes);
    const captureIdRef = useRef<number | null>(null);

    const selectedIdRef = useRef(selectedId);
    const activeToolRef = useRef(activeTool);
    const onToolChangeRef = useRef(onToolChange);

    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    useEffect(() => {
        onToolChangeRef.current = onToolChange;
    }, [onToolChange]);

    const notifyChange = useCallback(() => {
        onShapesChange();
    }, [onShapesChange]);

    const getSelected = useCallback(() => {
        const id = selectedIdRef.current;
        if (!id) return null;
        return shapesRef.current.find((s) => s.id === id) ?? null;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onPointerDown = (e: PointerEvent) => {
            captureIdRef.current = e.pointerId;
            canvas.setPointerCapture(e.pointerId);
            const pointer = getCanvasCoords(canvas, e.clientX, e.clientY);
            const list = shapesRef.current;

            if (activeToolRef.current !== 'select') {
                const created = createShape(activeToolRef.current, pointer.x, pointer.y);
                if (created) {
                    list.push(created);
                    onSelect(created.id);
                    onToolChangeRef.current('select');
                    notifyChange();
                    modeRef.current = 'move';
                    sessionRef.current = {
                        kind: 'move',
                        shape: created,
                        startPointer: pointer,
                        startTransform: created.transform.clone(),
                    };
                }
                return;
            }

            const selected = getSelected();
            if (selected) {
                const cpIndex = getControlPointIndex(selected, pointer.x, pointer.y);
                if (cpIndex !== null) {
                    modeRef.current = 'control-point';
                    activeControlRef.current = cpIndex;
                    sessionRef.current = {
                        kind: 'control-point',
                        shape: selected,
                        pointIndex: cpIndex,
                    };
                    return;
                }

                const handle = hitTestHandle(selected, pointer.x, pointer.y);
                if (handle === 'rotate') {
                    const center = selected.getCenter();
                    modeRef.current = 'rotate';
                    activeHandleRef.current = 'rotate';
                    sessionRef.current = {
                        kind: 'rotate',
                        shape: selected,
                        center,
                        startAngle: Math.atan2(pointer.y - center.y, pointer.x - center.x),
                        startRotation: selected.transform.rotation,
                    };
                    return;
                }

                if (handle && isResizeHandle(handle)) {
                    const session = createResizeSession(selected, handle, pointer);
                    if (session) {
                        modeRef.current = 'resize';
                        activeHandleRef.current = handle;
                        sessionRef.current = session;
                        return;
                    }
                }
            }

            const hit = findTopShapeAt(list, pointer.x, pointer.y);
            if (hit) {
                onSelect(hit.id);
                if (hit.hitTest(pointer.x, pointer.y)) {
                    modeRef.current = 'move';
                    sessionRef.current = {
                        kind: 'move',
                        shape: hit,
                        startPointer: pointer,
                        startTransform: hit.transform.clone(),
                    };
                }
                return;
            }

            onSelect(null);
            modeRef.current = 'idle';
            sessionRef.current = null;
        };

        const onPointerMove = (e: PointerEvent) => {
            const pointer = getCanvasCoords(canvas, e.clientX, e.clientY);
            const session = sessionRef.current;
            if (!session) return;

            if (session.kind === 'move') {
                applyMove(session.shape, session.startPointer, session.startTransform, pointer);
            } else if (session.kind === 'resize') {
                applyResize(session, pointer);
            } else if (session.kind === 'rotate') {
                applyRotate(
                    session.shape,
                    session.center,
                    session.startAngle,
                    session.startRotation,
                    pointer
                );
            } else if (session.kind === 'control-point' && isEditableShape(session.shape)) {
                const local = session.shape.transformPointToLocal(pointer.x, pointer.y);
                if (local) {
                    session.shape.setControlPoint(session.pointIndex, local);
                }
            }
        };

        const onPointerUp = () => {
            if (modeRef.current !== 'idle') {
                notifyChange();
            }
            modeRef.current = 'idle';
            sessionRef.current = null;
            activeHandleRef.current = null;
            activeControlRef.current = null;
            if (captureIdRef.current !== null) {
                try {
                    canvas.releasePointerCapture(captureIdRef.current);
                } catch {
                    /* already released */
                }
                captureIdRef.current = null;
            }
        };

        const onDblClick = (e: MouseEvent) => {
            const selected = getSelected();
            if (!(selected instanceof PathBezier)) return;
            const pointer = getCanvasCoords(canvas, e.clientX, e.clientY);
            const local = selected.transformPointToLocal(pointer.x, pointer.y);
            if (local) {
                selected.addPointLocal(local);
                notifyChange();
            }
        };

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);
        canvas.addEventListener('dblclick', onDblClick);
        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
            canvas.removeEventListener('dblclick', onDblClick);
        };
    }, [getSelected, notifyChange, onSelect]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            const id = selectedIdRef.current;
            if (!id) return;
            if (removeShape(shapesRef.current, id)) {
                onSelect(null);
                notifyChange();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [notifyChange, onSelect]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        rendererRef.current = renderer;

        const resizeObserver = new ResizeObserver(() => renderer.resize());
        resizeObserver.observe(canvas);

        let rafId = 0;
        const frame = () => {
            const r = rendererRef.current;
            if (r && r.width > 0 && r.height > 0) {
                r.beginFrame(true);
                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }
                const selected = getSelected();
                if (selected) {
                    drawSelectionOverlay(
                        r,
                        selected,
                        activeHandleRef.current,
                        activeControlRef.current
                    );
                }
                r.commit();
            }
            rafId = requestAnimationFrame(frame);
        };
        frame();

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            renderer.dispose();
        };
    }, [getSelected]);

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-full touch-none"
            style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        />
    );
}
