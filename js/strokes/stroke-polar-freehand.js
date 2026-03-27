import { StrokeBase } from './stroke-base.js';

export class StrokePolarFreehand extends StrokeBase {
  get name() { return 'PolarFreehand'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    // Draw from previous to current
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Also draw line from center to current point
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
