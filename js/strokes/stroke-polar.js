import { StrokeBase } from './stroke-base.js';

export class StrokePolar extends StrokeBase {
  get name() { return 'Polar'; }

  constructor(engine) {
    super(engine);
    this._anchorX = 0;
    this._anchorY = 0;
    this._mirrorCount = 2; // default: option 0 → mirrorCount = 2
  }

  get sides() { return this._mirrorCount - 2; }
  set sides(v) { this._mirrorCount = Math.max(2, (v || 0) + 2); }

  onStart(ctx, x, y, pressure) {
    // Anchor = first touch point
    this._anchorX = x;
    this._anchorY = y;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const ax = this._anchorX;
    const ay = this._anchorY;
    const n = this._mirrorCount;

    const xDiff = ax - x, yDiff = ay - y;
    const polarRadius = Math.hypot(xDiff, yDiff);
    let theta = Math.atan2(yDiff, xDiff) + Math.PI;
    const step = (Math.PI * 2) / n;

    // Draw dot at current position + N rotated copies
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y); // tiny line for dot with round lineCap
    for (let i = 0; i < n; i++) {
      const nx = Math.cos(theta) * polarRadius + ax;
      const ny = Math.sin(theta) * polarRadius + ay;
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + 0.1, ny);
      theta -= step;
    }
    ctx.stroke();
  }
}
