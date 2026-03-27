import { StrokeBase } from './stroke-base.js';

export class StrokeLine extends StrokeBase {
  get name() { return 'Line'; }

  onStart(ctx, x, y, pressure) {
    this._startX = x;
    this._startY = y;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
