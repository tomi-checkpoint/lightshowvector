import { StrokeBase } from './stroke-base.js';

export class StrokePolarFreehand extends StrokeBase {
  get name() { return 'PolarFreehand'; }

  constructor(engine) {
    super(engine);
    this._anchorX = 0;
    this._anchorY = 0;
    this._mirrorCount = 2; // default: option 0 → mirrorCount = 2
  }

  // Connect to pattern detail slider (sides property)
  get sides() { return this._mirrorCount - 2; }
  set sides(v) { this._mirrorCount = Math.max(2, (v || 0) + 2); }

  onStart(ctx, x, y, pressure) {
    // Anchor = first touch point (NOT canvas center)
    this._anchorX = x;
    this._anchorY = y;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const ax = this._anchorX;
    const ay = this._anchorY;
    const n = this._mirrorCount;

    // Convert current + prev points to polar coords relative to anchor
    const xDiff = ax - x, yDiff = ay - y;
    const xSlope = ax - prevX, ySlope = ay - prevY;
    const polarRadius = Math.hypot(xDiff, yDiff);
    const diffRadius = Math.hypot(xSlope, ySlope);
    let theta = Math.atan2(yDiff, xDiff) + Math.PI;
    let diffTheta = Math.atan2(ySlope, xSlope) + Math.PI;
    const step = (Math.PI * 2) / n;

    // Draw original freehand segment + N rotated copies
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(prevX, prevY);
    for (let i = 0; i < n; i++) {
      const nx = Math.cos(theta) * polarRadius + ax;
      const ny = Math.sin(theta) * polarRadius + ay;
      const npx = Math.cos(diffTheta) * diffRadius + ax;
      const npy = Math.sin(diffTheta) * diffRadius + ay;
      ctx.moveTo(nx, ny);
      ctx.lineTo(npx, npy);
      theta -= step;
      diffTheta -= step;
    }
    ctx.stroke();
  }
}
