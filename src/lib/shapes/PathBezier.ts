import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';
import {
    DEFAULT_FLATNESS,
    DEFAULT_HIT_THRESHOLD_PX,
    boundsFromPoints,
    catmullToBeziers,
    flattenBezierSegmentsLocal,
    flattenPolylineLocal,
    hitTestPolyline,
    mapPointsToDevice,
    type CubicSegment,
    type Point2D,
} from './bezierUtils';

export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    points: { x: number; y: number }[];
    mode: PathMode;
    closed: boolean;
    flatness: number = DEFAULT_FLATNESS;

    constructor(points: { x: number; y: number }[], mode: PathMode = 'polyline', closed = false, transform?: Transform) {
        super({ transform });
        this.points = [...points];
        this.mode = mode;
        this.closed = closed;
    }

    catmullToBeziers(): CubicSegment[] {
        return catmullToBeziers(this.points, this.closed);
    }

    private bezierAnchorsToSegments(): CubicSegment[] {
        if (this.points.length < 4) return [];

        const segments: CubicSegment[] = [];
        for (let i = 0; i < this.points.length - 3; i += 3) {
            segments.push({
                p0: this.points[i],
                p1: this.points[i + 1],
                p2: this.points[i + 2],
                p3: this.points[i + 3],
            });
        }
        return segments;
    }

    private computeFlattenedPoints(): Point2D[] {
        if (this.mode === 'polyline') {
            return flattenPolylineLocal(this.points, this.closed);
        }
        if (this.mode === 'bezier') {
            const flat = flattenBezierSegmentsLocal(this.bezierAnchorsToSegments(), this.flatness);
            if (this.closed && flat.length > 0) {
                flat.push({ ...flat[0] });
            }
            return flat;
        }
        const flat = flattenBezierSegmentsLocal(this.catmullToBeziers(), this.flatness);
        if (this.closed && flat.length > 0) {
            flat.push({ ...flat[0] });
        }
        return flat;
    }

    getFlattenedPoints(): Point2D[] {
        return this.computeFlattenedPoints();
    }

    flattenDevicePoints(): Point2D[] {
        return mapPointsToDevice(this.computeFlattenedPoints(), (x, y) => this.transformPointToDevice(x, y));
    }

    getLocalBounds(): Bounds {
        return boundsFromPoints(this.computeFlattenedPoints());
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.flattenDevicePoints());
    }

    hitTest(px: number, py: number): boolean {
        const threshold = Math.max(DEFAULT_HIT_THRESHOLD_PX, this.strokeWidth * 2);
        return hitTestPolyline(px, py, this.flattenDevicePoints(), threshold);
    }

    hitTestLocal(px: number, py: number): boolean {
        const threshold = Math.max(DEFAULT_HIT_THRESHOLD_PX, this.strokeWidth * 2);
        return hitTestPolyline(px, py, this.computeFlattenedPoints(), threshold);
    }

    drawRaster(r: RasterRenderer): void {
        const devicePoints = this.flattenDevicePoints();

        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            for (let i = 0; i < devicePoints.length - 1; i++) {
                r.strokeLine(
                    devicePoints[i].x, devicePoints[i].y,
                    devicePoints[i + 1].x, devicePoints[i + 1].y,
                    this.getStrokeColor(), this.strokeWidth
                );
            }
        }
    }

    getControlPoints(): { x: number; y: number }[] {
        return [...this.points];
    }

    setControlPoint(index: number, point: { x: number; y: number }): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    addPointLocal(point: { x: number; y: number }, index?: number): void {
        if (index !== undefined && index >= 0 && index <= this.points.length) {
            this.points.splice(index, 0, point);
        } else {
            this.points.push(point);
        }
    }

    removePoint(index: number): void {
        if (index >= 0 && index < this.points.length) {
            this.points.splice(index, 1);
        }
    }

    setMode(mode: PathMode): void {
        this.mode = mode;
    }

    setClosed(closed: boolean): void {
        this.closed = closed;
    }

    clone(): PathBezier {
        const path = new PathBezier(
            this.points.map(p => ({ ...p })),
            this.mode,
            this.closed,
            this.transform.clone()
        );
        path.flatness = this.flatness;
        path.fillStyle = { ...this.fillStyle };
        path.fillOpacity = this.fillOpacity;
        path.strokeStyle = { ...this.strokeStyle };
        path.strokeWidth = this.strokeWidth;
        path.strokeOpacity = this.strokeOpacity;
        return path;
    }

    toJSON(): object {
        return {
            type: 'PathBezier',
            id: this.id,
            points: this.points,
            mode: this.mode,
            closed: this.closed,
            flatness: this.flatness,
            transform: {
                x: this.transform.x,
                y: this.transform.y,
                rotation: this.transform.rotation,
                scaleX: this.transform.scaleX,
                scaleY: this.transform.scaleY
            },
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}
