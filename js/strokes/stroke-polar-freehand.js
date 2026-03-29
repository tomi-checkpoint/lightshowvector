import { StrokeBase } from './stroke-base.js';

export class StrokePolarFreehand extends StrokeBase {
  get name() { return 'PolarFreehand'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    // Freehand trail only — polar repetition comes from the mirror system
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
