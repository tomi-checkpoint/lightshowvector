import { StrokeBase } from './stroke-base.js';

export class StrokeRandom extends StrokeBase {
  get name() { return 'Random'; }

  constructor(engine) {
    super(engine);
    this._delegate = null;
  }

  setDelegate(stroke) {
    this._delegate = stroke;
  }

  onStart(ctx, x, y, pressure) {
    // Pick a random stroke from registry (excluding self)
    const registry = this.engine.strokeRegistry;
    if (registry) {
      const names = Object.keys(registry).filter(n => n !== 'Random');
      const pick = names[Math.floor(Math.random() * names.length)];
      this._delegate = registry[pick];
    }
    if (this._delegate) this._delegate.onStart(ctx, x, y, pressure);
  }

  onMove(ctx, prevX, prevY, x, y, pressure) {
    if (this._delegate) this._delegate.onMove(ctx, prevX, prevY, x, y, pressure);
  }

  onEnd(ctx, x, y) {
    if (this._delegate) this._delegate.onEnd(ctx, x, y);
  }
}
