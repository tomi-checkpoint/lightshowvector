import { StrokeBase } from './stroke-base.js';

export class StrokeTargetOval extends StrokeBase {
  get name() { return 'TargetOval'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth;
    const rings = 3;
    for (let i = rings; i > 0; i--) {
      const rx = (r * i) / rings;
      const ry = rx * 0.6;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
