import { StrokeBase } from './stroke-base.js';

export class StrokeConfetti extends StrokeBase {
  get name() { return 'Confetti'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const spread = ctx.lineWidth * 3;
    const count = 3;
    for (let i = 0; i < count; i++) {
      const ox = x + (Math.random() - 0.5) * spread;
      const oy = y + (Math.random() - 0.5) * spread;
      const size = Math.random() * ctx.lineWidth * 0.5 + 2;
      const angle = Math.random() * Math.PI;
      ctx.beginPath();
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      ctx.restore();
    }
  }
}
