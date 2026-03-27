import { CanvasEngine } from './canvas-engine.js';
import { InputHandler } from './input-handler.js';
import { UI } from './ui.js';

// Initialize canvas
const canvas = document.getElementById('drawing-canvas');
const engine = new CanvasEngine(canvas);

// Size canvas to fill full screen (toolbar floats over it)
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  engine.resize(w * dpr, h * dpr);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Clear to black
engine.clear();

// Initialize UI
const ui = new UI(engine);

// Wire up input
new InputHandler(canvas, {
  onStart(x, y, pressure) {
    engine.onPointerStart(x, y, pressure);
    ui.onPointerStart(x, y, pressure);
  },
  onMove(x, y, pressure) {
    engine.onPointerMove(x, y, pressure);
    ui.onPointerMove(x, y, pressure);
  },
  onEnd(x, y) {
    engine.onPointerEnd(x, y);
  }
});
