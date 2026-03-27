import { StrokeBase } from './stroke-base.js';

export class StrokeCrazyDots extends StrokeBase {
  get name() { return 'CrazyDots'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const spread = ctx.lineWidth * 4;
    const count = 5;
    for (let i = 0; i < count; i++) {
      const ox = x + (Math.random() - 0.5) * spread;
      const oy = y + (Math.random() - 0.5) * spread;
      const r = Math.random() * ctx.lineWidth * 0.3 + 1;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
