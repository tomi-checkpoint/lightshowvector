import { StrokeBase } from './stroke-base.js';

export class StrokeTargetRect extends StrokeBase {
  get name() { return 'TargetRect'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth;
    const rings = 3;
    for (let i = rings; i > 0; i--) {
      const s = (r * 2 * i) / rings;
      ctx.strokeRect(x - s / 2, y - s / 2, s, s);
    }
  }
}
