import { StrokeBase } from './stroke-base.js';

export class StrokeTarget extends StrokeBase {
  get name() { return 'Target'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth;
    const rings = 3;
    for (let i = rings; i > 0; i--) {
      const radius = (r * i) / rings;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
  }
}
