import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';
import { boundsFromPoints } from './bezierUtils';

export class Triangle extends Shape {
    points: { x: number; y: number }[];

    constructor(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, transform?: Transform) {
        super({ transform });
        
        const cx = (p1.x + p2.x + p3.x) / 3;
        const cy = (p1.y + p2.y + p3.y) / 3;
        
        this.points = [
            { x: p1.x - cx, y: p1.y - cy },
            { x: p2.x - cx, y: p2.y - cy },
            { x: p3.x - cx, y: p3.y - cy }
        ];
    }

    getDeviceVertices(): { x: number; y: number }[] {
        return this.points.map(p => this.transformPointToDevice(p.x, p.y));
    }

    getLocalBounds(): Bounds {
        return boundsFromPoints(this.points);
    }

    getBounds(): Bounds {
        return boundsFromPoints(this.getDeviceVertices());
    }

    hitTestLocal(px: number, py: number): boolean {
        const p1 = this.points[0];
        const p2 = this.points[1];
        const p3 = this.points[2];
        
        const sign = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
            return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
        };
        
        const d1 = sign(px, py, p1.x, p1.y, p2.x, p2.y);
        const d2 = sign(px, py, p2.x, p2.y, p3.x, p3.y);
        const d3 = sign(px, py, p3.x, p3.y, p1.x, p1.y);
        
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
        return !(hasNeg && hasPos);
    }

    drawRaster(r: RasterRenderer): void {
        const devicePoints = this.getDeviceVertices();
        
        if (this.fillOpacity > 0) {
            r.fillPolygon(devicePoints, this.getFillColor());
        }
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(devicePoints, this.getStrokeColor(), this.strokeWidth);
        }
    }

    getControlPoints(): { x: number; y: number }[] {
        return this.points.map(p => ({ ...p }));
    }

    setControlPoint(index: number, point: { x: number; y: number }): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = { ...point };
        }
    }

    clone(): Triangle {
        const triangle = new Triangle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, this.transform.clone());
        triangle.points = this.points.map(p => ({ ...p }));
        triangle.fillStyle = { ...this.fillStyle };
        triangle.fillOpacity = this.fillOpacity;
        triangle.strokeStyle = { ...this.strokeStyle };
        triangle.strokeWidth = this.strokeWidth;
        triangle.strokeOpacity = this.strokeOpacity;
        return triangle;
    }

    toJSON(): object {
        return {
            type: 'Triangle',
            id: this.id,
            points: this.points,
            transform: {
                x: this.transform.x,
                y: this.transform.y,
                rotation: this.transform.rotation,
                scaleX: this.transform.scaleX,
                scaleY: this.transform.scaleY
            },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}
