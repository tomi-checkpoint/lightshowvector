export class InputHandler {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks; // { onStart, onMove, onEnd }
    this._isDrawing = false;
    this._setupEvents();
  }

  _setupEvents() {
    const c = this.canvas;

    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      this._isDrawing = true;
      const { x, y } = this._getCoords(e);
      this.callbacks.onStart(x, y, e.pressure || 0);
    });

    c.addEventListener('pointermove', (e) => {
      if (!this._isDrawing) return;
      e.preventDefault();
      const { x, y } = this._getCoords(e);
      this.callbacks.onMove(x, y, e.pressure || 0);
    });

    c.addEventListener('pointerup', (e) => {
      if (!this._isDrawing) return;
      e.preventDefault();
      this._isDrawing = false;
      const { x, y } = this._getCoords(e);
      this.callbacks.onEnd(x, y);
    });

    c.addEventListener('pointercancel', (e) => {
      this._isDrawing = false;
    });
  }

  _getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
}
