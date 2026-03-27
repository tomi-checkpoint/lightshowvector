import { StrokeBase } from './stroke-base.js';

export class StrokeStar extends StrokeBase {
  get name() { return 'Star'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const r = ctx.lineWidth;
    const points = 5;
    const step = Math.PI / points;
    const innerR = r * 0.4;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = -Math.PI / 2 + i * step;
      const radius = i % 2 === 0 ? r : innerR;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
