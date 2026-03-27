import { StrokeBase } from './stroke-base.js';

export class StrokePolarCentered extends StrokeBase {
  get name() { return 'PolarCentered'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
