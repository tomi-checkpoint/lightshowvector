export class UndoStack {
  constructor(ctx, maxSize = 20) {
    this.ctx = ctx;
    this.stack = [];
    this.maxSize = maxSize;
  }

  save(historyLen) {
    const imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.stack.push({ imageData, historyLen });
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
  }

  undo() {
    if (this.stack.length === 0) return false;
    const entry = this.stack.pop();
    this.ctx.putImageData(entry.imageData, 0, 0);
    return entry.historyLen;
  }

  clear() {
    this.stack = [];
  }

  get canUndo() {
    return this.stack.length > 0;
  }
}
