export class WildWalk {
  constructor(engine) {
    this.engine = engine;
    this.running = false;
    this._x = 0;
    this._y = 0;
    this._angle = 0;
    this._speed = 3;
    this._rafId = null;
    this._stepCount = 0;
  }

  start() {
    this.running = true;
    this._x = this.engine.canvas.width / 2;
    this._y = this.engine.canvas.height / 2;
    this._angle = Math.random() * Math.PI * 2;
    this._speed = 2 + Math.random() * 3;
    this._stepCount = 0;

    this.engine.onPointerStart(this._x, this._y, 0);
    this._tick();
  }

  stop() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.engine.onPointerEnd(this._x, this._y);
  }

  _tick() {
    if (!this.running) return;

    // Smooth random walk
    this._angle += (Math.random() - 0.5) * 0.5;
    this._speed += (Math.random() - 0.5) * 0.3;
    this._speed = Math.max(1, Math.min(8, this._speed));

    const newX = this._x + Math.cos(this._angle) * this._speed;
    const newY = this._y + Math.sin(this._angle) * this._speed;

    // Boundary reflection
    const w = this.engine.canvas.width;
    const h = this.engine.canvas.height;
    const margin = 10;

    if (newX < margin || newX > w - margin) {
      this._angle = Math.PI - this._angle;
    }
    if (newY < margin || newY > h - margin) {
      this._angle = -this._angle;
    }

    this._x = Math.max(margin, Math.min(w - margin, newX));
    this._y = Math.max(margin, Math.min(h - margin, newY));

    this.engine.onPointerMove(this._x, this._y, 0);
    this._stepCount++;

    // Occasionally start a new stroke for color changes
    if (this._stepCount % 200 === 0) {
      this.engine.onPointerEnd(this._x, this._y);
      this.engine.colorSystem.onNewStroke();
      this.engine.onPointerStart(this._x, this._y, 0);
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }
}
