import { StrokeBase } from './stroke-base.js';

export class StrokePolar extends StrokeBase {
  get name() { return 'Polar'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
