import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';

export class Line extends Shape {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(x1: number, y1: number, x2: number, y2: number, transform?: Transform) {
        super({ transform });
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    getLocalBounds(): Bounds {
        return new Bounds(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.max(this.x1, this.x2),
            Math.max(this.y1, this.y2)
        );
    }

    private pointToSegmentDistance(px: number, py: number): number {
        const ax = this.x2 - this.x1;
        const ay = this.y2 - this.y1;
        const len2 = ax * ax + ay * ay;
        
        if (len2 === 0) {
            const dx = px - this.x1;
            const dy = py - this.y1;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        let t = ((px - this.x1) * ax + (py - this.y1) * ay) / len2;
        t = Math.max(0, Math.min(1, t));
        
        const projX = this.x1 + t * ax;
        const projY = this.y1 + t * ay;
        
        const dx = px - projX;
        const dy = py - projY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    hitTestLocal(px: number, py: number): boolean {
        const distance = this.pointToSegmentDistance(px, py);
        const threshold = Math.max(5, this.strokeWidth / 2);
        return distance <= threshold;
    }

    getControlPoints(): { x: number; y: number }[] {
        return [{ x: this.x1, y: this.y1 }, { x: this.x2, y: this.y2 }];
    }

    setControlPoint(index: number, point: { x: number; y: number }): void {
        if (index === 0) {
            this.x1 = point.x;
            this.y1 = point.y;
        } else if (index === 1) {
            this.x2 = point.x;
            this.y2 = point.y;
        }
    }

    drawRaster(r: RasterRenderer): void {
        const p1 = this.transformPointToDevice(this.x1, this.y1);
        const p2 = this.transformPointToDevice(this.x2, this.y2);
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokeLine(p1.x, p1.y, p2.x, p2.y, this.getStrokeColor(), this.strokeWidth);
        }
    }

    clone(): Line {
        const line = new Line(this.x1, this.y1, this.x2, this.y2, this.transform.clone());
        line.fillStyle = { ...this.fillStyle };
        line.fillOpacity = this.fillOpacity;
        line.strokeStyle = { ...this.strokeStyle };
        line.strokeWidth = this.strokeWidth;
        line.strokeOpacity = this.strokeOpacity;
        return line;
    }

    toJSON(): object {
        return {
            type: 'Line',
            id: this.id,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
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