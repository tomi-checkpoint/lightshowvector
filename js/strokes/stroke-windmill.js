import { StrokeBase } from './stroke-base.js';

export class StrokeWindmill extends StrokeBase {
  get name() { return 'Windmill'; }

  constructor(engine) {
    super(engine);
    this._angle = 0;
  }

  onStart(ctx, x, y) {
    this._angle = 0;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    this._angle += 0.15;
    const r = ctx.lineWidth * 2;
    const blades = 4;
    for (let i = 0; i < blades; i++) {
      const a = this._angle + (Math.PI * 2 * i) / blades;
      const ex = x + Math.cos(a) * r;
      const ey = y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }
}
