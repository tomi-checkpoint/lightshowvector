export class UndoStack {
  constructor(ctx, maxSize = 20) {
    this.ctx = ctx;
    this.stack = [];
    this.maxSize = maxSize;
  }

  save() {
    const imageData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.stack.push(imageData);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
  }

  undo() {
    if (this.stack.length === 0) return false;
    const imageData = this.stack.pop();
    this.ctx.putImageData(imageData, 0, 0);
    return true;
  }

  clear() {
    this.stack = [];
  }

  get canUndo() {
    return this.stack.length > 0;
  }
}
