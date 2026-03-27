import { StrokeBase } from './stroke-base.js';

export class StrokeFullBox extends StrokeBase {
  get name() { return 'FullBox'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const s = ctx.lineWidth;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  }
}
