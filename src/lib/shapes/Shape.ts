import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import { Transform } from './Transform';
import { Bounds } from './Bounds';
import { type Mat3 } from '../math/mat3';

export interface ShapeStyle {
    fillStyle: RGBA;
    fillOpacity: number;
    strokeStyle: RGBA;
    strokeWidth: number;
    strokeOpacity: number;
}

export interface ShapeParams extends Partial<ShapeStyle> {
    id?: string;
    transform?: Transform;
}

let nextId = 0;
function generateId(): string {
    return `shape_${Date.now()}_${nextId++}`;
}

export abstract class Shape {
    readonly id: string;
    transform: Transform;
    
    fillStyle: RGBA = { r: 255, g: 255, b: 255, a: 255 };
    fillOpacity: number = 1;
    strokeStyle: RGBA = { r: 0, g: 0, b: 0, a: 255 };
    strokeWidth: number = 1;
    strokeOpacity: number = 1;

    constructor(params?: ShapeParams) {
        this.id = params?.id ?? generateId();
        this.transform = params?.transform ?? new Transform();
        
        if (params?.fillStyle) this.fillStyle = params.fillStyle;
        if (params?.fillOpacity !== undefined) this.fillOpacity = params.fillOpacity;
        if (params?.strokeStyle) this.strokeStyle = params.strokeStyle;
        if (params?.strokeWidth !== undefined) this.strokeWidth = params.strokeWidth;
        if (params?.strokeOpacity !== undefined) this.strokeOpacity = params.strokeOpacity;
    }

    getLocalToDeviceMatrix(): Mat3 {
        return this.transform.getMatrix();
    }

    getDeviceToLocalMatrix(): Mat3 | null {
        return this.transform.getInverseMatrix();
    }

    transformPointToDevice(px: number, py: number): { x: number; y: number } {
        const m = this.getLocalToDeviceMatrix();
        return {
            x: m[0] * px + m[1] * py + m[2],
            y: m[3] * px + m[4] * py + m[5]
        };
    }

    transformPointToLocal(px: number, py: number): { x: number; y: number } | null {
        const invM = this.getDeviceToLocalMatrix();
        if (!invM) return null;
        return {
            x: invM[0] * px + invM[1] * py + invM[2],
            y: invM[3] * px + invM[4] * py + invM[5]
        };
    }

    getCenter(): { x: number; y: number } {
        const localBounds = this.getLocalBounds();
        const centerX = (localBounds.minX + localBounds.maxX) / 2;
        const centerY = (localBounds.minY + localBounds.maxY) / 2;
        return this.transformPointToDevice(centerX, centerY);
    }

    resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
        const oldCenter = this.getCenter();
        const newCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        
        this.transform.x += newCenter.x - oldCenter.x;
        
        const oldBounds = this.getBounds();
        if (oldBounds.width > 0 && oldBounds.height > 0) {
            this.transform.scaleX *= (maxX - minX) / oldBounds.width;
            this.transform.scaleY *= (maxY - minY) / oldBounds.height;
        }
    }

    setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
    }

    getFillColor(): RGBA {
        return {
            r: this.fillStyle.r,
            g: this.fillStyle.g,
            b: this.fillStyle.b,
            a: Math.round(this.fillStyle.a * this.fillOpacity)
        };
    }

    getStrokeColor(): RGBA {
        return {
            r: this.strokeStyle.r,
            g: this.strokeStyle.g,
            b: this.strokeStyle.b,
            a: Math.round(this.strokeStyle.a * this.strokeOpacity)
        };
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;
        return this.hitTestLocal(local.x, local.y);
    }

    getBounds(): Bounds {
        const localBounds = this.getLocalBounds();
        
        const corners = [
            { x: localBounds.minX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.minY },
            { x: localBounds.maxX, y: localBounds.maxY },
            { x: localBounds.minX, y: localBounds.maxY }
        ];
        
        const deviceCorners = corners.map(p => this.transformPointToDevice(p.x, p.y));
        
        let minX = deviceCorners[0].x;
        let minY = deviceCorners[0].y;
        let maxX = deviceCorners[0].x;
        let maxY = deviceCorners[0].y;
        
        for (const p of deviceCorners) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return new Bounds(minX, minY, maxX, maxY);
    }

    abstract drawRaster(r: RasterRenderer): void;
    abstract hitTestLocal(px: number, py: number): boolean;
    abstract getLocalBounds(): Bounds;
    abstract clone(): Shape;
    abstract toJSON(): object;
}