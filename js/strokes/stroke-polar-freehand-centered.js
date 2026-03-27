import { StrokeBase } from './stroke-base.js';

export class StrokePolarFreehandCentered extends StrokeBase {
  get name() { return 'PolarFreehandCentered'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    // Freehand segment
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Centered polar line through center
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
