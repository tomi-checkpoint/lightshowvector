import { StrokeLine } from './stroke-line.js';
import { StrokeFreehand } from './stroke-freehand.js';
import { StrokeDot } from './stroke-dot.js';
import { StrokeWave } from './stroke-wave.js';
import { StrokeStar } from './stroke-star.js';
import { StrokeFullBox } from './stroke-full-box.js';
import { StrokeFullCircle } from './stroke-full-circle.js';
import { StrokeOvalHollow } from './stroke-oval-hollow.js';
import { StrokeRectangleHollow } from './stroke-rectangle-hollow.js';
import { StrokePolygon } from './stroke-polygon.js';
import { StrokeTrickyLine } from './stroke-tricky-line.js';
import { StrokePolar } from './stroke-polar.js';
import { StrokePolarCentered } from './stroke-polar-centered.js';
import { StrokePolarFreehand } from './stroke-polar-freehand.js';
import { StrokePolarFreehandCentered } from './stroke-polar-freehand-centered.js';
import { StrokeSymmetricLine } from './stroke-symmetric-line.js';
import { StrokeWindmill } from './stroke-windmill.js';
import { StrokeWindshieldWipers } from './stroke-windshield-wipers.js';
import { StrokeSwirl } from './stroke-swirl.js';
import { StrokeConfetti } from './stroke-confetti.js';
import { StrokeCrazyDots } from './stroke-crazy-dots.js';
import { StrokeTarget } from './stroke-target.js';
import { StrokeTargetOval } from './stroke-target-oval.js';
import { StrokeTargetRect } from './stroke-target-rect.js';
import { StrokeRandom } from './stroke-random.js';
import { StrokeTransform } from './stroke-transform.js';

// Maps recording pattern names to classes
const STROKE_CLASSES = {
  'Line': StrokeLine,
  'Freehand': StrokeFreehand,
  'Dot': StrokeDot,
  'Wave': StrokeWave,
  'Star': StrokeStar,
  'FullBox': StrokeFullBox,
  'FullCircle': StrokeFullCircle,
  'OvalHollow': StrokeOvalHollow,
  'RectangleHollow': StrokeRectangleHollow,
  'RectHollow': StrokeRectangleHollow,
  'Polygon': StrokePolygon,
  'TrickyLine': StrokeTrickyLine,
  'Polar': StrokePolar,
  'PolarCentered': StrokePolarCentered,
  'PolarFreehand': StrokePolarFreehand,
  'PolarFreehandCentered': StrokePolarFreehandCentered,
  'SymmetricLine': StrokeSymmetricLine,
  'Windmill': StrokeWindmill,
  'WindshieldWipers': StrokeWindshieldWipers,
  'Swirl': StrokeSwirl,
  'Confetti': StrokeConfetti,
  'CrazyDots': StrokeCrazyDots,
  'Target': StrokeTarget,
  'TargetOval': StrokeTargetOval,
  'TargetRect': StrokeTargetRect,
  'Random': StrokeRandom,
  'Transform': StrokeTransform,
};

export function createStroke(name, engine) {
  const Cls = STROKE_CLASSES[name];
  if (!Cls) {
    console.warn(`Unknown stroke: ${name}, falling back to Line`);
    return new StrokeLine(engine);
  }
  return new Cls(engine);
}

export function getStrokeNames() {
  return Object.keys(STROKE_CLASSES);
}

export { STROKE_CLASSES };
