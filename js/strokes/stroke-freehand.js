import { StrokeBase } from './stroke-base.js';

export class StrokeFreehand extends StrokeBase {
  get name() { return 'Freehand'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
