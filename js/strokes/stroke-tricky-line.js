import { StrokeBase } from './stroke-base.js';

export class StrokeTrickyLine extends StrokeBase {
  get name() { return 'TrickyLine'; }

  constructor(engine) {
    super(engine);
    this._anchorX = 0;
    this._anchorY = 0;
  }

  onStart(ctx, x, y) {
    this._anchorX = x;
    this._anchorY = y;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    ctx.beginPath();
    ctx.moveTo(this._anchorX, this._anchorY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}
