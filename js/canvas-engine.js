import { MirrorSystem } from './mirror.js';
import { ColorSystem } from './color.js';
import { UndoStack } from './undo.js';
import { createStroke, STROKE_CLASSES } from './strokes/stroke-registry.js';

export class CanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Drawing state
    this.activeStroke = createStroke('Line', this);
    this.mirrorSystem = new MirrorSystem();
    this.colorSystem = new ColorSystem();
    this.undoStack = new UndoStack(this.ctx);

    this.lineWidth = 12;
    this.lineCap = 'round';
    this.drawingMode = 0; // 0=precision, 1=crazy
    this.filter = 'none';
    this._compositeOp = 'source-over';

    // Per-stroke tracking
    this._prevPoints = null; // Previous mirrored points
    this._strokeLength = 0;
    this._isDrawing = false;

    // Expose for Random stroke
    this.strokeRegistry = {};
    for (const name of Object.keys(STROKE_CLASSES)) {
      this.strokeRegistry[name] = createStroke(name, this);
    }

    this._applyCtxState();
  }

  resize(width, height) {
    // Save current content
    let imageData = null;
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      try { imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); } catch(e) {}
    }
    this.canvas.width = width;
    this.canvas.height = height;
    if (imageData) {
      this.ctx.putImageData(imageData, 0, 0);
    }
    this._applyCtxState();
  }

  setPattern(name) {
    this.activeStroke = createStroke(name, this);
  }

  setPatternDetail(value) {
    if (this.activeStroke.sides !== undefined) {
      this.activeStroke.sides = value;
    }
  }

  setCompositeOp(op) {
    const map = {
      'SRC_OVER': 'source-over',
      'XOR': 'xor',
      'MULTIPLY': 'multiply',
      'SCREEN': 'screen',
      'ADD': 'lighter',
    };
    this._compositeOp = map[op] || 'source-over';
    this.ctx.globalCompositeOperation = this._compositeOp;
  }

  parseOptions(args) {
    const transparency = this.mirrorSystem.parseOptions(args);
    this.colorSystem.transparency = 100 - transparency; // Invert: 0=opaque, 100=transparent
  }

  onPointerStart(x, y, pressure) {
    this._isDrawing = true;
    this._strokeLength = 0;
    this._embossMinX = this._embossMinY = this._embossMaxX = this._embossMaxY = null;
    this.undoStack.save();
    this.colorSystem.onNewStroke();
    this.mirrorSystem.randomizeCenter();
    this._applyCtxState();

    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);
    this._prevPoints = points;

    for (const p of points) {
      this.activeStroke.onStart(this.ctx, p.x, p.y, pressure);
    }
  }

  onPointerMove(x, y, pressure) {
    if (!this._isDrawing) return;

    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);

    // Get color for this segment
    const color = this.colorSystem.getColor(this._strokeLength, 0);
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = this._prevPoints && this._prevPoints[i] ? this._prevPoints[i] : p;
      this.activeStroke.onMove(this.ctx, prev.x, prev.y, p.x, p.y, pressure);
    }

    // Track stroke length
    if (this._prevPoints && this._prevPoints[0]) {
      const dx = x - this._prevPoints[0].x;
      const dy = y - this._prevPoints[0].y;
      this._strokeLength += Math.sqrt(dx * dx + dy * dy);
    }

    this._prevPoints = points;

    // Track bounding box for emboss
    if (this.filter === 'emboss') {
      const pad = this.lineWidth * 2;
      for (const p of points) {
        this._embossMinX = Math.min(this._embossMinX ?? p.x, p.x - pad);
        this._embossMinY = Math.min(this._embossMinY ?? p.y, p.y - pad);
        this._embossMaxX = Math.max(this._embossMaxX ?? p.x, p.x + pad);
        this._embossMaxY = Math.max(this._embossMaxY ?? p.y, p.y + pad);
      }
    }
  }

  onPointerEnd(x, y) {
    if (!this._isDrawing) return;
    this._isDrawing = false;

    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);
    for (const p of points) {
      this.activeStroke.onEnd(this.ctx, p.x, p.y);
    }
    this._prevPoints = null;

    // Apply emboss as post-process on the stroke bounding box
    if (this.filter === 'emboss' && this._embossMinX != null) {
      this._applyEmboss(
        this._embossMinX, this._embossMinY,
        this._embossMaxX - this._embossMinX,
        this._embossMaxY - this._embossMinY
      );
      this._embossMinX = this._embossMinY = this._embossMaxX = this._embossMaxY = null;
    }
  }

  clear() {
    this.ctx.fillStyle = this.colorSystem.getBgColorCSS();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._applyCtxState();
  }

  undo() {
    this.undoStack.undo();
  }

  exportPNG() {
    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  }

  _applyCtxState() {
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = this.lineCap;
    this.ctx.lineJoin = 'round';
    this.ctx.globalCompositeOperation = this._compositeOp;
    this.ctx.globalAlpha = 1; // Alpha handled per-color
  }

  _applyEmboss(bx, by, bw, bh) {
    const x = Math.max(0, Math.round(bx));
    const y = Math.max(0, Math.round(by));
    const w = Math.min(Math.round(bw), this.canvas.width - x);
    const h = Math.min(Math.round(bh), this.canvas.height - y);
    if (w <= 2 || h <= 2) return;

    const imageData = this.ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    const out = new Uint8ClampedArray(data.length);

    // 3x3 emboss kernel: [-2,-1,0],[-1,1,1],[0,1,2]
    for (let row = 1; row < h - 1; row++) {
      for (let col = 1; col < w - 1; col++) {
        for (let ch = 0; ch < 3; ch++) {
          const idx = (row * w + col) * 4 + ch;
          const val =
            -2 * data[((row-1)*w + (col-1)) * 4 + ch] +
            -1 * data[((row-1)*w + col) * 4 + ch] +
            -1 * data[(row*w + (col-1)) * 4 + ch] +
             1 * data[(row*w + col) * 4 + ch] +
             1 * data[(row*w + (col+1)) * 4 + ch] +
             1 * data[((row+1)*w + col) * 4 + ch] +
             2 * data[((row+1)*w + (col+1)) * 4 + ch];
          out[idx] = Math.max(0, Math.min(255, val + 128));
        }
        out[(row * w + col) * 4 + 3] = data[(row * w + col) * 4 + 3]; // preserve alpha
      }
    }

    const outData = new ImageData(out, w, h);
    this.ctx.putImageData(outData, x, y);
  }
}
