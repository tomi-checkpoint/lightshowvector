export class StrokeBase {
  constructor(engine) {
    this.engine = engine;
  }

  get name() { return 'Base'; }

  onStart(ctx, x, y, pressure) {}

  onMove(ctx, prevX, prevY, x, y, pressure) {}

  onEnd(ctx, x, y) {}
}
