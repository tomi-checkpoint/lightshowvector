import { StrokeBase } from './stroke-base.js';

export class StrokeSwirl extends StrokeBase {
  get name() { return 'Swirl'; }

  constructor(engine) {
    super(engine);
    this._angle = 0;
  }

  onStart(ctx, x, y) {
    this._angle = 0;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    this._angle += 0.3;
    const r = ctx.lineWidth;
    const sx = x + Math.cos(this._angle) * r;
    const sy = y + Math.sin(this._angle) * r;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  }
}
