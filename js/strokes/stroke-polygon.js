import { StrokeBase } from './stroke-base.js';

export class StrokePolygon extends StrokeBase {
  get name() { return 'Polygon'; }

  constructor(engine) {
    super(engine);
    this.sides = 6;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth;
    const n = this.sides;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}
