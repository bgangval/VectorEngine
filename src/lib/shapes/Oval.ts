import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';

export class Oval extends Shape {
    radiusX: number;
    radiusY: number;

    constructor(radiusX: number, radiusY: number, transform?: Transform) {
        super({ transform });
        this.radiusX = radiusX;
        this.radiusY = radiusY;
    }

    getLocalBounds(): Bounds {
        return new Bounds(-this.radiusX, -this.radiusY, this.radiusX, this.radiusY);
    }

    hitTestLocal(px: number, py: number): boolean {
        const nx = px / this.radiusX;
        const ny = py / this.radiusY;
        return nx * nx + ny * ny <= 1;
    }

    private getEllipsePoints(segments: number = 50): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = this.radiusX * Math.cos(angle);
            const y = this.radiusY * Math.sin(angle);
            points.push({ x, y });
        }
        return points;
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getEllipsePoints();
        const devicePoints = points.map(p => this.transformPointToDevice(p.x, p.y));
        
        if (this.fillOpacity > 0) {
            r.fillPolygon(devicePoints, this.getFillColor());
        }
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(devicePoints, this.getStrokeColor(), this.strokeWidth);
        }
    }

    clone(): Oval {
        const oval = new Oval(this.radiusX, this.radiusY, this.transform.clone());
        oval.fillStyle = { ...this.fillStyle };
        oval.fillOpacity = this.fillOpacity;
        oval.strokeStyle = { ...this.strokeStyle };
        oval.strokeWidth = this.strokeWidth;
        oval.strokeOpacity = this.strokeOpacity;
        return oval;
    }

    toJSON(): object {
        return {
            type: 'Oval',
            id: this.id,
            radiusX: this.radiusX,
            radiusY: this.radiusY,
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