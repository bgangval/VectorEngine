import { test, expect } from "vitest";
import { mat3, type Mat3 } from "./mat3";

function expectMatCloseTo(actual: Mat3, expected: Mat3) {
    for (let i = 0; i < 9; i++) {
        expect(actual[i]).toBeCloseTo(expected[i]);
    }
}

function expectAffine(m: Mat3) {
    expect(m[6]).toBeCloseTo(0);
    expect(m[7]).toBeCloseTo(0);
    expect(m[8]).toBeCloseTo(1);
}

test("identity: full matrix", () => {
    const I = mat3.identity();
    const expected: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expectMatCloseTo(I, expected);
    expectAffine(I);
});

test("translate: exact matrix and transformPoint", () => {
    const tx = 10, ty = -5;
    const T = mat3.translate(tx, ty);
    const expected: Mat3 = [1, 0, tx, 0, 1, ty, 0, 0, 1];
    expectMatCloseTo(T, expected);
    expectAffine(T);
    
    const p = mat3.transformPoint(T, 3, 4);
    expect(p.x).toBeCloseTo(3 + tx);
    expect(p.y).toBeCloseTo(4 + ty);
});

test("scale: exact matrix and point behavior", () => {
    const sx = 2, sy = 0.5;
    const S = mat3.scale(sx, sy);
    const expected: Mat3 = [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    expectMatCloseTo(S, expected);
    expectAffine(S);
    
    const p = mat3.transformPoint(S, 4, 6);
    expect(p.x).toBeCloseTo(4 * sx);
    expect(p.y).toBeCloseTo(6 * sy);
});

test("rotate: 90deg rotation", () => {
    const r90 = mat3.rotate(Math.PI / 2);
    const p = { x: 1, y: 0 };
    const p_rotated = mat3.transformPoint(r90, p.x, p.y);
    
    expect(p_rotated.x).toBeCloseTo(0);
    expect(p_rotated.y).toBeCloseTo(1);
});

test("multiply: identity multiplication", () => {
    const I = mat3.identity();
    const T = mat3.translate(10, 5);
    const result = mat3.multiply(T, I);
    
    expect(result[2]).toBeCloseTo(10);
    expect(result[5]).toBeCloseTo(5);
});

test("invert: translation inverse", () => {
    const T = mat3.translate(10, 20);
    const T_inv = mat3.invert(T);
    
    if (T_inv) {
        const identity = mat3.multiply(T, T_inv);
        expect(identity[0]).toBeCloseTo(1);
        expect(identity[4]).toBeCloseTo(1);
        expect(identity[8]).toBeCloseTo(1);
    } else {
        expect(false).toBe(true);
    }
});

test("invert: scale by zero returns null", () => {
    expect(mat3.invert(mat3.scale(0, 1))).toBeNull();
    expect(mat3.invert(mat3.scale(1, 0))).toBeNull();
});

test("fromTransform: composes transformations correctly", () => {
    const tx = 100, ty = 50;
    const angle = Math.PI / 4;
    const sx = 2, sy = 1;
    
    const M = mat3.fromTransform(tx, ty, angle, sx, sy);
    const px = 10, py = 20;
    
    const pFromM = mat3.transformPoint(M, px, py);
    
    const scaled = { x: px * sx, y: py * sy };
    const rotated = {
        x: scaled.x * Math.cos(angle) - scaled.y * Math.sin(angle),
        y: scaled.x * Math.sin(angle) + scaled.y * Math.cos(angle)
    };
    const manual = { x: rotated.x + tx, y: rotated.y + ty };
    
    expect(pFromM.x).toBeCloseTo(manual.x);
    expect(pFromM.y).toBeCloseTo(manual.y);
    expectAffine(M);
});