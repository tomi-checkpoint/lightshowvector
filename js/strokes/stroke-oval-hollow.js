import { StrokeBase } from './stroke-base.js';

export class StrokeOvalHollow extends StrokeBase {
  get name() { return 'OvalHollow'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const rx = ctx.lineWidth;
    const ry = ctx.lineWidth * 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
