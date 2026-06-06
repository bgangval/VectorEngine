import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RasterRenderer, type LineAlg, type RGBA } from '../lib/raster/RasterRenderer';
import {
    Rect,
    Oval,
    Line,
    Transform,
    Triangle,
    QuadraticBezier,
    CubicBezier,
    PathBezier,
    Shape,
    PathBezier as PathBezierClass,
} from '../lib/shapes';

interface CanvasTestProps {
    lineAlg: LineAlg;
    onLineAlgChange: (alg: LineAlg) => void;
}

interface EditableShape {
    getControlPoints(): { x: number; y: number }[];
    setControlPoint(index: number, point: { x: number; y: number }): void;
}

function isEditableShape(shape: Shape): shape is Shape & EditableShape {
    const s = shape as unknown as EditableShape;
    return typeof s.getControlPoints === 'function' && typeof s.setControlPoint === 'function';
}

const CONTROL_HIT_RADIUS = 12;

function createDemoShapes(): Shape[] {
    const curveX = 720;

    const rect = new Rect(200, 140, new Transform({ x: 130, y: 130, rotation: 0.12, scaleX: 1, scaleY: 1 }));
    rect.fillStyle = { r: 255, g: 100, b: 100, a: 255 };
    rect.fillOpacity = 0.75;
    rect.strokeStyle = { r: 180, g: 0, b: 0, a: 255 };
    rect.strokeWidth = 2;

    const oval = new Oval(180, 120, new Transform({ x: 130, y: 320, rotation: 0, scaleX: 1, scaleY: 1 }));
    oval.fillStyle = { r: 100, g: 100, b: 255, a: 255 };
    oval.fillOpacity = 0.7;
    oval.strokeStyle = { r: 0, g: 0, b: 200, a: 255 };
    oval.strokeWidth = 2;

    const triangle = new Triangle(
        { x: 0, y: -70 },
        { x: -80, y: 70 },
        { x: 80, y: 70 },
        new Transform({ x: 380, y: 200, rotation: 0.08, scaleX: 1, scaleY: 1 })
    );
    triangle.fillStyle = { r: 100, g: 255, b: 100, a: 255 };
    triangle.fillOpacity = 0.75;
    triangle.strokeStyle = { r: 0, g: 160, b: 0, a: 255 };
    triangle.strokeWidth = 2;

    const path = new PathBezier(
        [
            { x: -170, y: 10 },
            { x: -130, y: -95 },
            { x: -35, y: -115 },
            { x: 55, y: -75 },
            { x: 130, y: -20 },
            { x: 155, y: 70 },
            { x: 70, y: 125 },
            { x: -15, y: 110 },
            { x: -95, y: 60 },
            { x: -175, y: -25 },
            { x: -120, y: -55 },
        ],
        'catmull',
        true,
        new Transform({ x: curveX, y: 230, rotation: 0, scaleX: 1, scaleY: 1 })
    );
    path.strokeStyle = { r: 255, g: 255, b: 255, a: 255 };
    path.strokeWidth = 2;
    path.flatness = 0.6;

    const quadTransform = new Transform({ x: curveX, y: 500, rotation: 0, scaleX: 1, scaleY: 1 });
    const quadratic = new QuadraticBezier(
        { x: -140, y: 0 },
        { x: 0, y: -160 },
        { x: 140, y: 0 },
        quadTransform
    );
    quadratic.strokeStyle = { r: 255, g: 255, b: 255, a: 255 };
    quadratic.strokeWidth = 2;
    quadratic.flatness = 0.5;

    const quadBaseline = new Line(-140, 0, 140, 0, quadTransform.clone());
    quadBaseline.strokeStyle = { r: 255, g: 255, b: 255, a: 255 };
    quadBaseline.strokeWidth = 2;

    const cubicTransform = new Transform({ x: curveX, y: 780, rotation: 0, scaleX: 1, scaleY: 1 });
    const cubic = new CubicBezier(
        { x: -140, y: 0 },
        { x: -50, y: -140 },
        { x: 50, y: 140 },
        { x: 140, y: 0 },
        cubicTransform
    );
    cubic.strokeStyle = { r: 255, g: 255, b: 255, a: 255 };
    cubic.strokeWidth = 2;
    cubic.flatness = 0.5;

    const cubicBaseline = new Line(-140, 0, 140, 0, cubicTransform.clone());
    cubicBaseline.strokeStyle = { r: 255, g: 255, b: 255, a: 255 };
    cubicBaseline.strokeWidth = 2;

    return [rect, oval, triangle, path, quadratic, quadBaseline, cubic, cubicBaseline];
}

function layoutShapes(shapes: Shape[], width: number, height: number) {
    const padX = width * 0.1;
    const padY = height * 0.12;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const col = (t: number) => padX + usableW * t;
    const row = (t: number) => padY + usableH * t;

    shapes[0].transform.x = col(0.18);
    shapes[0].transform.y = row(0.2);

    shapes[1].transform.x = col(0.5);
    shapes[1].transform.y = row(0.2);

    shapes[2].transform.x = col(0.82);
    shapes[2].transform.y = row(0.2);

    shapes[3].transform.x = col(0.5);
    shapes[3].transform.y = row(0.42);

    const quadX = col(0.28);
    const quadY = row(0.72);
    shapes[4].transform.x = quadX;
    shapes[4].transform.y = quadY;
    shapes[5].transform.x = quadX;
    shapes[5].transform.y = quadY;

    const cubicX = col(0.72);
    const cubicY = row(0.72);
    shapes[6].transform.x = cubicX;
    shapes[6].transform.y = cubicY;
    shapes[7].transform.x = cubicX;
    shapes[7].transform.y = cubicY;

    const scale = Math.min(1, Math.min(width, height) / 900);
    for (const shape of shapes) {
        shape.transform.scaleX = scale;
        shape.transform.scaleY = scale;
    }
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

function drawControlPoints(
    r: RasterRenderer,
    shape: Shape & EditableShape,
    selectedIndex: number | null
) {
    const anchors = shape.getControlPoints();
    const isPath = shape instanceof PathBezierClass;
    const isQuad = shape.constructor.name === 'QuadraticBezier';
    const isCubic = shape.constructor.name === 'CubicBezier';

    anchors.forEach((pt, index) => {
        const device = shape.transformPointToDevice(pt.x, pt.y);
        const selected = index === selectedIndex;
        const isEndpoint =
            isPath ||
            (isQuad && (index === 0 || index === 2)) ||
            (isCubic && (index === 0 || index === 3)) ||
            shape.constructor.name === 'Line' ||
            shape.constructor.name === 'Triangle';

        const fill: RGBA = selected
            ? { r: 255, g: 180, b: 0, a: 255 }
            : isEndpoint
              ? { r: 80, g: 200, b: 255, a: 255 }
              : { r: 255, g: 90, b: 160, a: 255 };

        r.fillCircle(device.x, device.y, selected ? 7 : 5, fill);
        r.strokeLine(device.x - 8, device.y, device.x + 8, device.y, { r: 40, g: 40, b: 50, a: 180 }, 1);
        r.strokeLine(device.x, device.y - 8, device.x, device.y + 8, { r: 40, g: 40, b: 50, a: 180 }, 1);
    });
}

export const CanvasTest: React.FC<CanvasTestProps> = ({ lineAlg, onLineAlgChange }) => {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [demoShapes] = useState(createDemoShapes);
    const shapesRef = useRef<Shape[]>(demoShapes);

    const [hoveredShape, setHoveredShape] = useState<string | null>(null);
    const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
    const [dragState, setDragState] = useState<{ shapeIndex: number; pointIndex: number } | null>(null);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const findControlPointHit = (mx: number, my: number) => {
            const shapes = shapesRef.current;
            for (let si = shapes.length - 1; si >= 0; si--) {
                const shape = shapes[si];
                if (!isEditableShape(shape)) continue;
                const points = shape.getControlPoints();
                for (let pi = points.length - 1; pi >= 0; pi--) {
                    const d = shape.transformPointToDevice(points[pi].x, points[pi].y);
                    const dx = mx - d.x;
                    const dy = my - d.y;
                    if (dx * dx + dy * dy <= CONTROL_HIT_RADIUS * CONTROL_HIT_RADIUS) {
                        return { shapeIndex: si, pointIndex: pi };
                    }
                }
            }
            return null;
        };

        const handleMouseDown = (e: MouseEvent) => {
            const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);
            const hit = findControlPointHit(x, y);
            if (hit) {
                setSelectedShapeIndex(hit.shapeIndex);
                setDragState(hit);
                return;
            }
            const shapes = shapesRef.current;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (shapes[i].hitTest(x, y)) {
                    setSelectedShapeIndex(i);
                    setDragState(null);
                    return;
                }
            }
            setSelectedShapeIndex(null);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);

            if (dragState) {
                const shape = shapesRef.current[dragState.shapeIndex];
                if (isEditableShape(shape)) {
                    const local = shape.transformPointToLocal(x, y);
                    if (local) {
                        shape.setControlPoint(dragState.pointIndex, local);
                    }
                }
                return;
            }

            let hit: string | null = null;
            const shapes = shapesRef.current;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (shapes[i].hitTest(x, y)) {
                    hit = shapes[i].constructor.name;
                    break;
                }
            }
            setHoveredShape(hit);
        };

        const handleMouseUp = () => setDragState(null);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [dragState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const resizeObserver = new ResizeObserver(() => {
            const r = rendererRef.current;
            if (!r) return;
            r.resize();
            if (r.width > 0 && r.height > 0) {
                layoutShapes(shapesRef.current, r.width, r.height);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        } else {
            resizeObserver.observe(canvas);
        }

        let rafId: number;

        const frame = () => {
            const r = rendererRef.current;
            if (r && r.width > 0 && r.height > 0) {
                r.beginFrame(true);

                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }

                const sel = selectedShapeIndex;
                if (sel !== null && isEditableShape(shapesRef.current[sel])) {
                    drawControlPoints(
                        r,
                        shapesRef.current[sel] as Shape & EditableShape,
                        dragState?.shapeIndex === sel ? dragState.pointIndex : null
                    );
                }

                const w = r.width;
                const h = r.height;
                const white = { r: 255, g: 255, b: 255, a: 255 };
                const yellow = { r: 255, g: 255, b: 0, a: 255 };
                r.drawLine(w * 0.1, h * 0.92, w * 0.9, h * 0.92, white);
                r.drawLine(w * 0.1, h * 0.94, w * 0.9, h * 0.955, yellow);
                r.drawLine(w * 0.1, h * 0.955, w * 0.9, h * 0.97, yellow);
                r.drawLine(w * 0.1, h * 0.97, w * 0.9, h * 0.985, white);

                r.commit();
            }
            rafId = requestAnimationFrame(frame);
        };

        frame();
        if (renderer.width > 0 && renderer.height > 0) {
            layoutShapes(shapesRef.current, renderer.width, renderer.height);
        }

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            rendererRef.current?.dispose();
        };
    }, [lineAlg, selectedShapeIndex, dragState]);

    const selectedShapeName =
        selectedShapeIndex !== null
            ? demoShapes[selectedShapeIndex]?.constructor.name ?? null
            : null;

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100vh',
                paddingTop: '64px',
                boxSizing: 'border-box',
                backgroundColor: '#0f0f1a',
                position: 'relative',
            }}
        >
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'fixed',
                    top: '80px',
                    left: '20px',
                    zIndex: 1000,
                    background: 'rgba(30, 30, 40, 0.95)',
                    padding: '8px 20px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
            >
                ← Назад в галерею
            </button>

            <div
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    zIndex: 1000,
                    background: 'rgba(30, 30, 40, 0.95)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
            >
                <button
                    onClick={() => onLineAlgChange('wu')}
                    style={{
                        padding: '6px 16px',
                        background: lineAlg === 'wu' ? '#3b82f6' : '#4a4a5a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    Сяолинь Ву
                </button>
                <button
                    onClick={() => onLineAlgChange('bresenham')}
                    style={{
                        padding: '6px 16px',
                        background: lineAlg === 'bresenham' ? '#3b82f6' : '#4a4a5a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                    }}
                >
                    Брезенхем
                </button>
            </div>

            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: '#ccc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    maxWidth: '420px',
                    lineHeight: 1.5,
                }}
            >
                Алгоритм: {lineAlg === 'bresenham' ? 'Брезенхем' : 'Сяолинь Ву'}
                <br />
                Hit: {hoveredShape ?? 'нет'}
            </div>

            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: dragState ? 'grabbing' : hoveredShape || selectedShapeName ? 'pointer' : 'default',
                }}
            />
        </div>
    );
};
