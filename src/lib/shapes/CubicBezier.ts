import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';
import {
    DEFAULT_FLATNESS,
    DEFAULT_HIT_THRESHOLD_PX,
    boundsFromPoints,
    flattenCubicLocal,
    hitTestPolyline,
    mapPointsToDevice,
} from './bezierUtils';

export class CubicBezier extends Shape {
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
    flatness: number = DEFAULT_FLATNESS;

    constructor(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, transform?: Transform) {
        super({ transform });
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    evalLocal(t: number): { x: number; y: number } {
        const mt = 1 - t;
        const x = mt * mt * mt * this.p0.x + 3 * mt * mt * t * this.p1.x + 3 * mt * t * t * this.p2.x + t * t * t * this.p3.x;
        const y = mt * mt * mt * this.p0.y + 3 * mt * mt * t * this.p1.y + 3 * mt * t * t * this.p2.y + t * t * t * this.p3.y;
        return { x, y };
    }

    getFlattenedPoints(): { x: number; y: number }[] {
        return flattenCubicLocal(this.p0, this.p1, this.p2, this.p3, this.flatness);
    }

    flattenDevicePoints(): { x: number; y: number }[] {
        return mapPointsToDevice(this.getFlattenedPoints(), (x, y) => this.transformPointToDevice(x, y));
    }

    getLocalBounds(): Bounds {
        return boundsFromPoints(this.getFlattenedPoints());
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
        return hitTestPolyline(px, py, this.getFlattenedPoints(), threshold);
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
        return [this.p0, this.p1, this.p2, this.p3];
    }

    setControlPoint(index: number, point: { x: number; y: number }): void {
        if (index === 0) this.p0 = point;
        if (index === 1) this.p1 = point;
        if (index === 2) this.p2 = point;
        if (index === 3) this.p3 = point;
    }

    clone(): CubicBezier {
        const bezier = new CubicBezier(
            { ...this.p0 }, { ...this.p1 }, { ...this.p2 }, { ...this.p3 },
            this.transform.clone()
        );
        bezier.flatness = this.flatness;
        bezier.fillStyle = { ...this.fillStyle };
        bezier.fillOpacity = this.fillOpacity;
        bezier.strokeStyle = { ...this.strokeStyle };
        bezier.strokeWidth = this.strokeWidth;
        bezier.strokeOpacity = this.strokeOpacity;
        return bezier;
    }

    toJSON(): object {
        return {
            type: 'CubicBezier',
            id: this.id,
            p0: this.p0,
            p1: this.p1,
            p2: this.p2,
            p3: this.p3,
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
