import { StrokeBase } from './stroke-base.js';

export class StrokeRectangleHollow extends StrokeBase {
  get name() { return 'RectHollow'; }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    const s = ctx.lineWidth * 2;
    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
  }
}
