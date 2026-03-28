import { MirrorSystem } from './mirror.js';
import { ColorSystem } from './color.js';
import { UndoStack } from './undo.js';
import { createStroke, STROKE_CLASSES } from './strokes/stroke-registry.js';
import { StrokeHistory, exportSVGBlob } from './svg-export.js';

export class CanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Drawing state
    this.activeStroke = createStroke('Line', this);
    this.mirrorSystem = new MirrorSystem();
    this.colorSystem = new ColorSystem();
    this.undoStack = new UndoStack(this.ctx);
    this.strokeHistory = new StrokeHistory();

    this.lineWidth = 12;
    this.lineCap = 'round';
    this.drawingMode = 0; // 0=precision, 1=crazy
    this.filter = 'none';
    this._compositeOp = 'source-over';

    // Offscreen buffer for Porter-Duff mask modes
    this._offscreenCanvas = null;
    this._offscreenCtx = null;
    this._preStrokeImageData = null;

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
      'DARKEN': 'darken',
      'LIGHTEN': 'lighten',
      'MULTIPLY': 'multiply',
      'SCREEN': 'screen',
      'MASK_ALPHA': 'source-atop',
      'MASK_BG': 'destination-in',
      'MASK_INV_BG': 'destination-out',
      'MASK_FG': 'source-in',
      'DRAW_IN_BG': 'destination-over',
      'XOR': 'xor',
      'ADD': 'lighter',
    };
    const newOp = map[op] || 'source-over';
    if (this._maskBase && newOp !== this._compositeOp) {
      this._clearMaskState();
    }
    this._compositeOp = newOp;
    this._compositeOpKey = op;
    this.ctx.globalCompositeOperation = this._compositeOp;
  }

  parseOptions(args) {
    const transparency = this.mirrorSystem.parseOptions(args);
    this.colorSystem.transparency = 100 - transparency; // Invert: 0=opaque, 100=transparent
  }

  _needsOffscreen() {
    return ['destination-in', 'destination-out', 'source-in', 'source-atop'].includes(this._compositeOp);
  }

  _clearMaskState() {
    this._maskBase = null;
    this._maskAccumCanvas = null;
    this._maskAccumCtx = null;
  }

  _extractForeground(imageData) {
    const fgData = new ImageData(
      new Uint8ClampedArray(imageData.data), imageData.width, imageData.height
    );
    const bg = this.colorSystem.bgColor;
    const d = fgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === bg.r && d[i+1] === bg.g && d[i+2] === bg.b) {
        d[i+3] = 0;
      }
    }
    return fgData;
  }

  _setupOffscreen() {
    const w = this.canvas.width, h = this.canvas.height;
    if (!this._offscreenCanvas) {
      this._offscreenCanvas = document.createElement('canvas');
      this._fgCanvas = document.createElement('canvas');
    }
    this._offscreenCanvas.width = w;
    this._offscreenCanvas.height = h;
    this._offscreenCtx = this._offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this._offscreenCtx.clearRect(0, 0, w, h);

    // Pre-populate offscreen with accumulated mask strokes from previous strokes
    if (this._maskAccumCanvas) {
      this._offscreenCtx.drawImage(this._maskAccumCanvas, 0, 0);
    }

    // Copy rendering state to offscreen
    this._offscreenCtx.lineWidth = this.lineWidth;
    this._offscreenCtx.lineCap = this.lineCap;
    this._offscreenCtx.lineJoin = 'round';
    this._offscreenCtx.globalCompositeOperation = 'source-over';
    this._offscreenCtx.globalAlpha = 1;

    // Build foreground-only layer from the ORIGINAL content (mask base)
    this._fgCanvas.width = w;
    this._fgCanvas.height = h;
  }

  _compositeOffscreen() {
    const w = this.canvas.width, h = this.canvas.height;
    const fgCtx = this._fgCanvas.getContext('2d');

    // Always composite against the ORIGINAL foreground (mask base), not the degraded canvas
    const sourceData = this._maskBase || this._preStrokeImageData;
    fgCtx.putImageData(this._extractForeground(sourceData), 0, 0);

    // Apply the Porter-Duff operation: original foreground vs accumulated+current strokes
    fgCtx.globalCompositeOperation = this._compositeOp;
    fgCtx.drawImage(this._offscreenCanvas, 0, 0);

    // Rebuild main canvas: background + composited foreground
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.colorSystem.getBgColorCSS();
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.drawImage(this._fgCanvas, 0, 0);
  }

  _getRenderCtx() {
    return this._offscreenCtx || this.ctx;
  }

  onPointerStart(x, y, pressure) {
    this._isDrawing = true;
    this._strokeLength = 0;
    this._embossMinX = this._embossMinY = this._embossMaxX = this._embossMaxY = null;
    this.undoStack.save(this.strokeHistory.snapshot());
    this.colorSystem.onNewStroke();
    this.mirrorSystem.randomizeCenter();
    this._applyCtxState();

    // Set up offscreen buffer for destructive Porter-Duff modes
    if (this._needsOffscreen()) {
      this._preStrokeImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      // Save the original content on the FIRST mask stroke (persists across strokes)
      if (!this._maskBase) {
        this._maskBase = new ImageData(
          new Uint8ClampedArray(this._preStrokeImageData.data),
          this.canvas.width, this.canvas.height
        );
        this._maskAccumCanvas = document.createElement('canvas');
        this._maskAccumCanvas.width = this.canvas.width;
        this._maskAccumCanvas.height = this.canvas.height;
        this._maskAccumCtx = this._maskAccumCanvas.getContext('2d');
        this._maskAccumCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this._setupOffscreen();
    } else {
      this._offscreenCtx = null;
      this._preStrokeImageData = null;
      if (this._maskBase) this._clearMaskState();
    }

    const renderCtx = this._getRenderCtx();
    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);
    this._prevPoints = points;

    // Record stroke start — for Random stroke, record the delegate's name
    const strokeName = this.activeStroke.delegateName || this.activeStroke.name;
    this.strokeHistory.addStrokeStart(strokeName, this.lineWidth, this.lineCap, this._compositeOp);

    for (const p of points) {
      this.activeStroke.onStart(renderCtx, p.x, p.y, pressure);
    }
  }

  onPointerMove(x, y, pressure) {
    if (!this._isDrawing) return;

    const renderCtx = this._getRenderCtx();
    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);

    // Get color for this segment
    const color = this.colorSystem.getColor(this._strokeLength, 0);
    renderCtx.strokeStyle = color;
    renderCtx.fillStyle = color;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = this._prevPoints && this._prevPoints[i] ? this._prevPoints[i] : p;
      this.activeStroke.onMove(renderCtx, prev.x, prev.y, p.x, p.y, pressure);
    }

    // Composite offscreen onto main after each segment
    if (this._offscreenCtx) {
      this._compositeOffscreen();
    }

    // Track stroke length
    if (this._prevPoints && this._prevPoints[0]) {
      const dx = x - this._prevPoints[0].x;
      const dy = y - this._prevPoints[0].y;
      this._strokeLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Record segment for SVG history
    this.strokeHistory.addSegment(color, this._prevPoints || points, points, pressure);

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

    const renderCtx = this._getRenderCtx();
    const points = this.mirrorSystem.getTransformedPoints(x, y, this.canvas.width, this.canvas.height);
    for (const p of points) {
      this.activeStroke.onEnd(renderCtx, p.x, p.y);
    }
    this._prevPoints = null;
    this.strokeHistory.addStrokeEnd();

    // Final composite for offscreen modes
    if (this._offscreenCtx) {
      this._compositeOffscreen();
      if (this._maskAccumCtx) {
        this._maskAccumCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._maskAccumCtx.drawImage(this._offscreenCanvas, 0, 0);
      }
      this._offscreenCtx = null;
      this._preStrokeImageData = null;
    }

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
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.colorSystem.getBgColorCSS();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._applyCtxState();
    this._clearMaskState();
    this.strokeHistory.addClear();
  }

  recolorBackground(oldBg, newBg) {
    const w = this.canvas.width, h = this.canvas.height;
    const imageData = this.ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === oldBg.r && d[i+1] === oldBg.g && d[i+2] === oldBg.b && d[i+3] === 255) {
        d[i] = newBg.r;
        d[i+1] = newBg.g;
        d[i+2] = newBg.b;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
    if (this._maskBase) {
      const md = this._maskBase.data;
      for (let i = 0; i < md.length; i += 4) {
        if (md[i] === oldBg.r && md[i+1] === oldBg.g && md[i+2] === oldBg.b && md[i+3] === 255) {
          md[i] = newBg.r;
          md[i+1] = newBg.g;
          md[i+2] = newBg.b;
        }
      }
    }
  }

  undo() {
    const histLen = this.undoStack.undo();
    if (histLen !== false && histLen !== undefined) {
      this.strokeHistory.restoreSnapshot(histLen);
    }
    this._clearMaskState();
  }

  exportPNG() {
    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  }

  exportSVG() {
    return exportSVGBlob(this, this.strokeHistory);
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
