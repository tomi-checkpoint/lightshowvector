import { StrokeBase } from './stroke-base.js';

export class StrokeWave extends StrokeBase {
  get name() { return 'Wave'; }

  constructor(engine) {
    super(engine);
    this._t = 0;
  }

  onStart(ctx, x, y) {
    this._t = 0;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    this._t += 0.3;
    const amp = ctx.lineWidth;
    const dx = x - prevX;
    const dy = y - prevY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const offset = Math.sin(this._t) * amp;

    ctx.beginPath();
    ctx.moveTo(prevX + nx * Math.sin(this._t - 0.3) * amp, prevY + ny * Math.sin(this._t - 0.3) * amp);
    ctx.lineTo(x + nx * offset, y + ny * offset);
    ctx.stroke();
  }
}
