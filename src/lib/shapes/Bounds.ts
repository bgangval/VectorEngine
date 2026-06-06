export interface BoundsParams {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export class Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    get width(): number {
        return this.maxX - this.minX;
    }

    get height(): number {
        return this.maxY - this.minY;
    }

    get centerX(): number {
        return (this.minX + this.maxX) / 2;
    }

    get centerY(): number {
        return (this.minY + this.maxY) / 2;
    }

    containsPoint(x: number, y: number): boolean {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }

    expand(x: number, y: number): void {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
    }

    union(other: Bounds): Bounds {
        return new Bounds(
            Math.min(this.minX, other.minX),
            Math.min(this.minY, other.minY),
            Math.max(this.maxX, other.maxX),
            Math.max(this.maxY, other.maxY)
        );
    }

    clone(): Bounds {
        return new Bounds(this.minX, this.minY, this.maxX, this.maxY);
    }

    toJSON(): BoundsParams {
        return {
            minX: this.minX,
            minY: this.minY,
            maxX: this.maxX,
            maxY: this.maxY
        };
    }
}