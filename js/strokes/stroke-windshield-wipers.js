import { StrokeBase } from './stroke-base.js';

export class StrokeWindshieldWipers extends StrokeBase {
  get name() { return 'WindshieldWipers'; }

  constructor(engine) {
    super(engine);
    this._t = 0;
  }

  onStart(ctx, x, y) {
    this._t = 0;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    this._t += 0.2;
    const r = ctx.lineWidth * 2;
    const angle = Math.sin(this._t) * Math.PI * 0.4;
    const ex = x + Math.cos(angle - Math.PI / 2) * r;
    const ey = y + Math.sin(angle - Math.PI / 2) * r;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}
