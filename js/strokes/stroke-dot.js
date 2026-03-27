import { StrokeBase } from './stroke-base.js';

export class StrokeDot extends StrokeBase {
  get name() { return 'Dot'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth / 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
