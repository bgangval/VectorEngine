import { RasterRenderer } from '../raster/RasterRenderer';
import { Shape } from './Shape';
import { Bounds } from './Bounds';
import { Transform } from './Transform';

export class Rect extends Shape {
    width: number;
    height: number;

    constructor(width: number, height: number, transform?: Transform) {
        super({ transform });
        this.width = width;
        this.height = height;
    }

    getLocalBounds(): Bounds {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return new Bounds(-halfW, -halfH, halfW, halfH);
    }

    hitTestLocal(px: number, py: number): boolean {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return px >= -halfW && px <= halfW && py >= -halfH && py <= halfH;
    }

    drawRaster(r: RasterRenderer): void {
        const bounds = this.getLocalBounds();
        
        const corners = [
            { x: bounds.minX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.maxY },
            { x: bounds.minX, y: bounds.maxY }
        ];
        
        const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));
        
        if (this.fillOpacity > 0) {
            r.fillPolygon(deviceCorners, this.getFillColor());
        }
        
        if (this.strokeWidth > 0 && this.strokeOpacity > 0) {
            r.strokePolygon(deviceCorners, this.getStrokeColor(), this.strokeWidth);
        }
    }

    clone(): Rect {
        const rect = new Rect(this.width, this.height, this.transform.clone());
        rect.fillStyle = { ...this.fillStyle };
        rect.fillOpacity = this.fillOpacity;
        rect.strokeStyle = { ...this.strokeStyle };
        rect.strokeWidth = this.strokeWidth;
        rect.strokeOpacity = this.strokeOpacity;
        return rect;
    }

    toJSON(): object {
        return {
            type: 'Rect',
            id: this.id,
            width: this.width,
            height: this.height,
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