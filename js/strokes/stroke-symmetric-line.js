import { StrokeBase } from './stroke-base.js';

export class StrokeSymmetricLine extends StrokeBase {
  get name() { return 'SymmetricLine'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const w = ctx.canvas.width;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Mirror across vertical center
    ctx.beginPath();
    ctx.moveTo(w - prevX, prevY);
    ctx.lineTo(w - x, y);
    ctx.stroke();
  }
}
