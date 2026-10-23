declare module "p5.brush" {
  import type P5 from "p5";
  export function instance(p: P5): void;
  export function load(): void;
  export function noStroke(): void;
  export function noHatch(): void;
  export function noField(): void;
  export function fill(color: string, opacity: number): void;
  export function fillBleed(
    strength: number,
    direction?: "in" | "out",
    angle?: number,
  ): void;
  export function fillTexture(
    texture: number,
    border: number,
    scatter?: boolean,
  ): void;
  export function beginShape(curvature?: number): void;
  export function vertex(x: number, y: number): void;
  export function endShape(close?: boolean): void;
  export function seed(seed: number): void;
  export function noiseSeed(seed: number): void;
}
