import { StrokeBase } from './stroke-base.js';

export class StrokeTransform extends StrokeBase {
  get name() { return 'Transform'; }

  constructor(engine) {
    super(engine);
    this._scale = 1;
    this._rotation = 0;
  }

  onStart(ctx, x, y) {
    this._scale = 1;
    this._rotation = 0;
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    this._rotation += 0.1;
    const r = ctx.lineWidth;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this._rotation);
    ctx.scale(this._scale, this._scale);

    ctx.beginPath();
    ctx.moveTo(-r, -r);
    ctx.lineTo(r, -r);
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}
