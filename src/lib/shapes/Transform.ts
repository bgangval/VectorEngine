import { mat3, type Mat3 } from '../math/mat3';

export interface TransformParams {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

export class Transform {
    x: number = 0;
    y: number = 0;
    rotation: number = 0;
    scaleX: number = 1;
    scaleY: number = 1;

    constructor(params?: Partial<TransformParams>) {
        if (params) {
            this.x = params.x ?? 0;
            this.y = params.y ?? 0;
            this.rotation = params.rotation ?? 0;
            this.scaleX = params.scaleX ?? 1;
            this.scaleY = params.scaleY ?? 1;
        }
    }

    getMatrix(): Mat3 {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const sx = this.scaleX;
        const sy = this.scaleY;
        const tx = this.x;
        const ty = this.y;
        
        return [
            cos * sx, -sin * sy, tx,
            sin * sx,  cos * sy, ty,
            0, 0, 1
        ];
    }

    getInverseMatrix(): Mat3 | null {
        return mat3.invert(this.getMatrix());
    }

    clone(): Transform {
        return new Transform({
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY
        });
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
    }
}