export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';

export function clampByte(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
    hex = hex.replace('#', '');
    
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b, a: clampByte(alpha) };
}

export class RasterRenderer {
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData | null = null;
    private buf!: Uint8ClampedArray;
    
    width = 0;
    height = 0;
    dpr = 1;
    
    private canvas: HTMLCanvasElement;
    private _onWindowResize: () => void;
    private lineAlg: LineAlg = 'bresenham';
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('No 2D context');
        }
        
        this.ctx = ctx;
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        
        this.resize();
    }
    
    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
    }
    
    setLineAlgorithm(a: LineAlg) {
        this.lineAlg = a;
    }
    
    getLineAlgorithm(): LineAlg {
        return this.lineAlg;
    }
    
    drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg === 'wu') {
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }

    private idx(x: number, y: number): number {
        return (Math.floor(y) * this.width + Math.floor(x)) * 4;
    }

    setPixel(x: number, y: number, color: RGBA) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        
        const i = this.idx(x, y);
        this.buf[i] = color.r;
        this.buf[i + 1] = color.g;
        this.buf[i + 2] = color.b;
        this.buf[i + 3] = color.a;
    }

    private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        
        const i = this.idx(x, y);
        
        const srcAlpha = (color.a / 255) * alphaFactor;
        const srcAlphaClamped = Math.min(1, Math.max(0, srcAlpha));
        
        const dstR = this.buf[i];
        const dstG = this.buf[i + 1];
        const dstB = this.buf[i + 2];
        const dstA = this.buf[i + 3] / 255;
        
        const outAlpha = srcAlphaClamped + dstA * (1 - srcAlphaClamped);
        
        if (outAlpha > 0) {
            const outR = (color.r * srcAlphaClamped + dstR * dstA * (1 - srcAlphaClamped)) / outAlpha;
            const outG = (color.g * srcAlphaClamped + dstG * dstA * (1 - srcAlphaClamped)) / outAlpha;
            const outB = (color.b * srcAlphaClamped + dstB * dstA * (1 - srcAlphaClamped)) / outAlpha;
            
            this.buf[i] = clampByte(outR);
            this.buf[i + 1] = clampByte(outG);
            this.buf[i + 2] = clampByte(outB);
            this.buf[i + 3] = clampByte(outAlpha * 255);
        }
    }

    resize() {
        this.dpr = window.devicePixelRatio || 1;
        
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;
        
        this.width = Math.max(1, Math.floor(cssWidth * this.dpr));
        this.height = Math.max(1, Math.floor(cssHeight * this.dpr));
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf = this.imageData.data;
    }
    
    beginFrame(clear = true) {
        if (clear && this.buf) {
            for (let i = 0; i < this.buf.length; i++) {
                this.buf[i] = 0;
            }
        }
    }
    
    commit() {
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
    }

    drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        let x = Math.floor(x0);
        let y = Math.floor(y0);
        const xEnd = Math.floor(x1);
        const yEnd = Math.floor(y1);
        
        const dx = Math.abs(xEnd - x);
        const dy = Math.abs(yEnd - y);
        
        const sx = x < xEnd ? 1 : -1;
        const sy = y < yEnd ? 1 : -1;
        
        let err = dx - dy;
        
        while (true) {
            this.setPixel(x, y, color);
            
            if (x === xEnd && y === yEnd) break;
            
            const e2 = 2 * err;
            
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        
        if (steep) {
            let temp = x0; x0 = y0; y0 = temp;
            temp = x1; x1 = y1; y1 = temp;
        }
        
        if (x0 > x1) {
            let temp = x0; x0 = x1; x1 = temp;
            temp = y0; y0 = y1; y1 = temp;
        }
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const gradient = dx === 0 ? 1 : dy / dx;
        
        let y = y0;
        
        for (let x = x0; x <= x1; x++) {
            const yFloor = Math.floor(y);
            const frac = y - yFloor;
            
            const intensity1 = (1 - frac) * 255;
            const intensity2 = frac * 255;
            
            const color1 = { ...color, a: Math.min(255, color.a * intensity1 / 255) };
            const color2 = { ...color, a: Math.min(255, color.a * intensity2 / 255) };
            
            if (steep) {
                this.blendPixel(yFloor, x, color1, 1);
                this.blendPixel(yFloor + 1, x, color2, 1);
            } else {
                this.blendPixel(x, yFloor, color1, 1);
                this.blendPixel(x, yFloor + 1, color2, 1);
            }
            
            y += gradient;
        }
    }

    private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
        const yInt = Math.floor(y);
        const xStart = Math.floor(Math.min(x0, x1));
        const xEnd = Math.floor(Math.max(x0, x1));
        
        for (let x = xStart; x <= xEnd; x++) {
            this.blendPixel(x, yInt, color, 1);
        }
    }

    fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
        const r = Math.floor(radius);
        const centerX = Math.floor(cx);
        const centerY = Math.floor(cy);
        
        for (let y = -r; y <= r; y++) {
            const dy = Math.abs(y);
            const dx = Math.floor(Math.sqrt(r * r - dy * dy));
            
            const x1 = centerX - dx;
            const x2 = centerX + dx;
            const yPos = centerY + y;
            
            if (yPos >= 0 && yPos < this.height) {
                this.drawHSpan(yPos, x1, x2, color);
            }
        }
    }

    fillPolygon(points: { x: number; y: number }[], color: RGBA) {
        if (points.length < 3) return;
        
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (const p of points) {
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        
        const yMin = Math.floor(minY);
        const yMax = Math.floor(maxY);
        
        for (let y = yMin; y <= yMax; y++) {
            const intersections: number[] = [];
            
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                
                if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                    const t = (y - p1.y) / (p2.y - p1.y);
                    const x = p1.x + t * (p2.x - p1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 < intersections.length) {
                    this.drawHSpan(y, intersections[i], intersections[i + 1], color);
                }
            }
        }
    }

    strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
        if (width <= 1) {
            this.drawLine(x0, y0, x1, y1, color);
            return;
        }
        
        const half = width / 2;
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len < 0.001) {
            this.fillCircle(x0, y0, half, color);
            return;
        }
        
        const nx = -dy / len;
        const ny = dx / len;
        
        const p1 = { x: x0 + nx * half, y: y0 + ny * half };
        const p2 = { x: x0 - nx * half, y: y0 - ny * half };
        const p3 = { x: x1 - nx * half, y: y1 - ny * half };
        const p4 = { x: x1 + nx * half, y: y1 + ny * half };
        
        this.fillPolygon([p1, p2, p3, p4], color);
        this.fillCircle(x0, y0, half, color);
        this.fillCircle(x1, y1, half, color);
    }

    strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
        if (points.length < 2) return;
        
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
        }
        
        if (width > 1) {
            const radius = width / 2;
            for (const p of points) {
                this.fillCircle(p.x, p.y, radius, color);
            }
        }
    }
}
