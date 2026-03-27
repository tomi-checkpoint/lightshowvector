import { createStroke } from './strokes/stroke-registry.js';

// ── Stroke History ──
// Records drawing operations as the user draws, parallel to bitmap rendering.

export class StrokeHistory {
  constructor() {
    this.operations = [];
  }

  addStrokeStart(strokeName, lineWidth, lineCap, compositeOp) {
    this.operations.push({ type: 'stroke-start', strokeName, lineWidth, lineCap, compositeOp });
  }

  addSegment(color, prevPoints, points, pressure) {
    this.operations.push({
      type: 'segment',
      color,
      prevPoints: prevPoints.map(p => ({ x: p.x, y: p.y })),
      points: points.map(p => ({ x: p.x, y: p.y })),
      pressure
    });
  }

  addStrokeEnd() {
    this.operations.push({ type: 'stroke-end' });
  }

  addClear() {
    // Wipe history — matches bitmap clear behavior
    this.operations = [];
  }

  snapshot() {
    return this.operations.length;
  }

  restoreSnapshot(len) {
    this.operations.length = len;
  }

  reset() {
    this.operations = [];
  }
}

// ── SVG Context Proxy ──
// Implements the subset of CanvasRenderingContext2D used by all 26 stroke classes.

class SVGContext {
  constructor(canvasWidth, canvasHeight) {
    this.canvas = { width: canvasWidth, height: canvasHeight };
    this.lineWidth = 1;
    this.lineCap = 'round';
    this.lineJoin = 'round';
    this.strokeStyle = '#fff';
    this.fillStyle = '#fff';
    this.globalCompositeOperation = 'source-over';
    this.globalAlpha = 1;

    this.elements = [];
    this._pathData = '';
    this._transformStack = [new DOMMatrix()];
  }

  // ── Path building ──

  beginPath() {
    this._pathData = '';
  }

  moveTo(x, y) {
    const p = this._transform(x, y);
    this._pathData += `M${r(p.x)} ${r(p.y)}`;
  }

  lineTo(x, y) {
    const p = this._transform(x, y);
    this._pathData += `L${r(p.x)} ${r(p.y)}`;
  }

  arc(x, y, radius, startAngle, endAngle, ccw) {
    // Check if it's a full circle (all current usage is full circle)
    const range = Math.abs(endAngle - startAngle);
    if (range >= Math.PI * 1.999) {
      const p = this._transform(x, y);
      const m = this._currentMatrix();
      const scaledR = radius * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      this.elements.push(
        `<circle cx="${r(p.x)}" cy="${r(p.y)}" r="${r(scaledR)}" ` +
        `fill="${this.fillStyle}" stroke="${this.strokeStyle}" ` +
        `stroke-width="${this.lineWidth}"/>`
      );
      return;
    }
    // Partial arc — convert to SVG arc path
    const m = this._currentMatrix();
    const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const sr = radius * scale;
    const sp = this._transform(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
    const ep = this._transform(x + radius * Math.cos(endAngle), y + radius * Math.sin(endAngle));
    const largeArc = range > Math.PI ? 1 : 0;
    const sweep = ccw ? 0 : 1;
    this._pathData += `M${r(sp.x)} ${r(sp.y)}A${r(sr)} ${r(sr)} 0 ${largeArc} ${sweep} ${r(ep.x)} ${r(ep.y)}`;
  }

  ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw) {
    const p = this._transform(x, y);
    const m = this._currentMatrix();
    const rot = rotation + Math.atan2(m.b, m.a);
    const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const rx = radiusX * scale;
    const ry = radiusY * scale;
    this.elements.push(
      `<ellipse cx="${r(p.x)}" cy="${r(p.y)}" rx="${r(rx)}" ry="${r(ry)}" ` +
      `transform="rotate(${r(rot * 180 / Math.PI)} ${r(p.x)} ${r(p.y)})" ` +
      `fill="none" stroke="${this.strokeStyle}" ` +
      `stroke-width="${this.lineWidth}" stroke-linecap="${this.lineCap}"/>`
    );
  }

  closePath() {
    this._pathData += 'Z';
  }

  // ── Rendering ──

  stroke() {
    if (!this._pathData) return;
    this.elements.push(
      `<path d="${this._pathData}" fill="none" ` +
      `stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" ` +
      `stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"/>`
    );
    this._pathData = '';
  }

  fill() {
    if (!this._pathData) return;
    this.elements.push(
      `<path d="${this._pathData}" fill="${this.fillStyle}" stroke="none"/>`
    );
    this._pathData = '';
  }

  fillRect(x, y, w, h) {
    const p1 = this._transform(x, y);
    const p2 = this._transform(x + w, y);
    const p3 = this._transform(x + w, y + h);
    const p4 = this._transform(x, y + h);
    this.elements.push(
      `<polygon points="${r(p1.x)},${r(p1.y)} ${r(p2.x)},${r(p2.y)} ` +
      `${r(p3.x)},${r(p3.y)} ${r(p4.x)},${r(p4.y)}" ` +
      `fill="${this.fillStyle}" stroke="none"/>`
    );
  }

  strokeRect(x, y, w, h) {
    const p = this._transform(x, y);
    const m = this._currentMatrix();
    const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    this.elements.push(
      `<rect x="${r(p.x)}" y="${r(p.y)}" width="${r(w * scale)}" height="${r(h * scale)}" ` +
      `fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" ` +
      `stroke-linecap="${this.lineCap}"/>`
    );
  }

  // ── Transform stack ──

  save() {
    const m = this._currentMatrix();
    this._transformStack.push(new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]));
  }

  restore() {
    if (this._transformStack.length > 1) {
      this._transformStack.pop();
    }
  }

  translate(x, y) {
    const m = this._currentMatrix();
    m.e += m.a * x + m.c * y;
    m.f += m.b * x + m.d * y;
  }

  rotate(angle) {
    const m = this._currentMatrix();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const a = m.a, b = m.b, c = m.c, d = m.d;
    m.a = a * cos + c * sin;
    m.b = b * cos + d * sin;
    m.c = a * -sin + c * cos;
    m.d = b * -sin + d * cos;
  }

  scale(sx, sy) {
    const m = this._currentMatrix();
    m.a *= sx;
    m.b *= sx;
    m.c *= sy;
    m.d *= sy;
  }

  // ── Internals ──

  _currentMatrix() {
    return this._transformStack[this._transformStack.length - 1];
  }

  _transform(x, y) {
    const m = this._currentMatrix();
    return {
      x: m.a * x + m.c * y + m.e,
      y: m.b * x + m.d * y + m.f
    };
  }
}

// Round to 2 decimal places for compact SVG
function r(n) {
  return Math.round(n * 100) / 100;
}

// ── Export Function ──

export function buildSVG(engine, history) {
  const dpr = window.devicePixelRatio || 1;
  const w = engine.canvas.width / dpr;
  const h = engine.canvas.height / dpr;
  const cw = engine.canvas.width;
  const ch = engine.canvas.height;

  const svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${r(w)}" height="${r(h)}" viewBox="0 0 ${cw} ${ch}">`
  ];

  // Background
  const bg = engine.colorSystem.getBgColorCSS();
  svgParts.push(`<rect width="${cw}" height="${ch}" fill="${bg}"/>`);

  // Replay stroke history
  let currentStroke = null;
  let strokeCtx = null;
  let compositeOp = 'source-over';
  let groupOpen = false;

  for (const op of history.operations) {
    if (op.type === 'stroke-start') {
      currentStroke = createStroke(op.strokeName, engine);
      strokeCtx = new SVGContext(cw, ch);
      strokeCtx.lineWidth = op.lineWidth;
      strokeCtx.lineCap = op.lineCap;
      strokeCtx.lineJoin = 'round';
      compositeOp = op.compositeOp;

      // Open blend-mode group if needed
      const blend = mapCompositeOp(compositeOp);
      if (blend) {
        svgParts.push(`<g style="mix-blend-mode:${blend}">`);
        groupOpen = true;
      }

      // Call onStart for each initial mirror point (from first segment's prevPoints)
    } else if (op.type === 'segment') {
      if (!currentStroke || !strokeCtx) continue;

      strokeCtx.strokeStyle = op.color;
      strokeCtx.fillStyle = op.color;

      for (let i = 0; i < op.points.length; i++) {
        const p = op.points[i];
        const prev = op.prevPoints[i] || p;

        // If this is the first segment, call onStart
        if (strokeCtx.elements.length === 0 && strokeCtx._pathData === '') {
          currentStroke.onStart(strokeCtx, prev.x, prev.y, op.pressure);
        }

        currentStroke.onMove(strokeCtx, prev.x, prev.y, p.x, p.y, op.pressure);
      }

      // Flush any elements generated
      svgParts.push(...strokeCtx.elements);
      strokeCtx.elements = [];

    } else if (op.type === 'stroke-end') {
      if (currentStroke && strokeCtx) {
        // Call onEnd
        currentStroke.onEnd(strokeCtx, 0, 0);
        svgParts.push(...strokeCtx.elements);
        strokeCtx.elements = [];
      }
      if (groupOpen) {
        svgParts.push('</g>');
        groupOpen = false;
      }
      currentStroke = null;
      strokeCtx = null;
    }
  }

  if (groupOpen) svgParts.push('</g>');
  svgParts.push('</svg>');

  return svgParts.join('\n');
}

function mapCompositeOp(op) {
  switch (op) {
    case 'multiply': return 'multiply';
    case 'screen': return 'screen';
    case 'lighter': return 'lighten';
    case 'xor': return 'difference';
    default: return null; // source-over = no blend mode
  }
}

export function exportSVGBlob(engine, history) {
  const svgString = buildSVG(engine, history);
  return new Blob([svgString], { type: 'image/svg+xml' });
}
