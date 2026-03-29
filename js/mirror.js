export class MirrorSystem {
  constructor() {
    this.vertical = false;       // reflect across vertical axis (left-right) = Android mirrorHorizontal
    this.horizontal = false;     // reflect across horizontal axis (top-bottom) = Android mirrorVertical
    this.diagonal1 = false;      // 180° point reflection = Android mirrorDiagonal
    this.diagonal2 = false;      // 135 degree (web-only)
    this.polar = false;          // N-fold radial
    this.polarCentered = true;   // polar rotation around canvas center (vs touch point)
    this.sameColor = true;       // same color for all mirrors
    this.polarFolds = 0;         // number of polar subdivisions
    this.offCenter = false;      // randomize mirror center
    this._offCenterX = 0.5;     // normalized offset (0-1)
    this._offCenterY = 0.5;
    this._initialX = 0;         // first touch point for non-centered polar
    this._initialY = 0;
  }

  // Call at start of each stroke to set initial touch point
  setInitialPoint(x, y) {
    this._initialX = x;
    this._initialY = y;
  }

  // Call on each new stroke to re-randomize the center
  randomizeCenter() {
    if (!this.offCenter) return;
    // Count active mirrors to scale randomness
    let count = 0;
    if (this.vertical) count++;
    if (this.horizontal) count++;
    if (this.diagonal1) count++;
    if (this.diagonal2) count++;
    if (this.polar) count += this.polarFolds || 1;
    // More mirrors → keep center closer to middle so everything stays visible
    // Range: 0.15–0.85 for 1 mirror, 0.3–0.7 for many
    const spread = Math.max(0.15, 0.35 - count * 0.03);
    this._offCenterX = 0.5 + (Math.random() - 0.5) * 2 * spread;
    this._offCenterY = 0.5 + (Math.random() - 0.5) * 2 * spread;
  }

  // Parse the options field from Android recording format:
  // options,sameColorForAll,mirrorRegular,mirrorHorizontal,mirrorVertical,mirrorDiagonal,mirrorPolar,polarCount,polarCentered,transparencyEnabled,transparencyValue
  parseOptions(args) {
    const parts = args.split(',');
    this.sameColor = parts[0] === 'true';
    // parts[1] = mirrorRegular (draw unmirrored stroke) — always true in our system
    this.vertical = parts[2] === 'true';       // Android mirrorHorizontal = flip X = our vertical (left-right)
    this.horizontal = parts[3] === 'true';     // Android mirrorVertical = flip Y = our horizontal (top-bottom)
    this.diagonal1 = parts[4] === 'true';      // Android mirrorDiagonal = 180° point reflection
    this.polar = parts[5] === 'true';
    this.polarFolds = parseInt(parts[6]) || 0;
    this.polarCentered = parts[7] === 'true';
    // parts[8] = transparencyEnabled
    const transparency = parseInt(parts[9]) || 0;
    return transparency;
  }

  getTransformedPoints(x, y, canvasWidth, canvasHeight) {
    const cx = this.offCenter ? canvasWidth * this._offCenterX : canvasWidth / 2;
    const cy = this.offCenter ? canvasHeight * this._offCenterY : canvasHeight / 2;
    const points = [{ x, y }];

    if (this.polar && this.polarFolds > 0) {
      // Polar center: canvas center if polarCentered, else first touch point
      const pcx = this.polarCentered ? cx : this._initialX;
      const pcy = this.polarCentered ? cy : this._initialY;
      return this._getPolarPoints(x, y, pcx, pcy);
    }

    // Accumulate mirror reflections
    const toAdd = [];

    if (this.vertical) {
      for (const p of points) {
        toAdd.push({ x: 2 * cx - p.x, y: p.y });
      }
    }
    points.push(...toAdd);
    toAdd.length = 0;

    if (this.horizontal) {
      for (const p of points) {
        toAdd.push({ x: p.x, y: 2 * cy - p.y });
      }
    }
    points.push(...toAdd);
    toAdd.length = 0;

    if (this.diagonal1) {
      for (const p of points) {
        // 180° point reflection through center (Android mirrorDiagonal: flip both X and Y)
        toAdd.push({ x: 2 * cx - p.x, y: 2 * cy - p.y });
      }
    }
    points.push(...toAdd);
    toAdd.length = 0;

    if (this.diagonal2) {
      for (const p of points) {
        // Reflect across y=-x line through center
        const dx = p.x - cx;
        const dy = p.y - cy;
        toAdd.push({ x: cx - dy, y: cy - dx });
      }
    }
    points.push(...toAdd);

    return this._dedupe(points);
  }

  _getPolarPoints(x, y, cx, cy) {
    const n = this.polarFolds;
    const points = [];
    const dx = x - cx;
    const dy = y - cy;

    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      points.push({
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
      });
    }

    // If classic mirrors are also on, reflect each polar point
    if (this.vertical || this.horizontal) {
      const reflected = [];
      for (const p of points) {
        const rdx = p.x - cx;
        const rdy = p.y - cy;
        reflected.push({ x: cx + rdx, y: cy - rdy }); // reflect across horizontal
      }
      points.push(...reflected);
    }

    return this._dedupe(points);
  }

  _dedupe(points) {
    const seen = new Set();
    return points.filter(p => {
      const key = `${Math.round(p.x * 10)},${Math.round(p.y * 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
