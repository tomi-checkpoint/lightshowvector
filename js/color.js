export class ColorSystem {
  constructor() {
    this.mode = 'simple'; // simple, gradient, multiGradient, random, rangedRandom, smoothRandom, background
    this.color1 = { r: 255, g: 255, b: 255, a: 255 };
    this.color2 = { r: 0, g: 255, b: 255, a: 255 };
    this.gradientColors = [
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 255, b: 0, a: 255 },
      { r: 0, g: 0, b: 255, a: 255 },
    ];
    this.bgColor = { r: 0, g: 0, b: 0, a: 255 };
    this.transparency = 100; // 0-100, maps to alpha
    this.colorAlpha = 100; // per-color-mode alpha (0-100)
    this.changeEveryTouch = false;
    this.smoothness = 0.5;
    this.colorSpace = 0; // 0=RGB, 1=HSV

    // Internal state
    this._t = 0;
    this._currentHue = Math.random() * 360;
    this._targetHue = Math.random() * 360;
    this._hueRange = [0, 360];
    this._satRange = [80, 100];
  }

  // Parse recording color line: color,type,param1,param2,alpha,changeEveryTouch,bgColor
  parseColor(args) {
    const parts = args.split(',');
    const type = parseInt(parts[0]);
    const param1 = parseInt(parts[1]) || 0;
    const param2 = parseInt(parts[2]) || 0;
    const alpha = parseInt(parts[3]) || 100;
    this.changeEveryTouch = parts[4] === 'true';
    const bgInt = parseInt(parts[5]) || 0;

    this.colorAlpha = alpha;
    this.bgColor = ColorSystem.parseAndroidColor(bgInt);

    switch (type) {
      case 0: // Simple
        this.mode = 'simple';
        if (param1 !== 0) this.color1 = ColorSystem.parseAndroidColor(param1);
        break;
      case 1: // Ranged random
        this.mode = 'rangedRandom';
        this.color1 = ColorSystem.parseAndroidColor(param1);
        break;
      case 2: // Random
        this.mode = 'random';
        break;
      case 3: // Gradient
        this.mode = 'gradient';
        this.color1 = ColorSystem.parseAndroidColor(param1);
        this.color2 = ColorSystem.parseAndroidColor(param2);
        break;
      default:
        this.mode = 'random';
    }
  }

  onNewStroke() {
    this._t = 0;
    if (this.changeEveryTouch || this.mode === 'random') {
      this._currentHue = Math.random() * 360;
      this._targetHue = Math.random() * 360;
    }
  }

  getColor(t, totalLength) {
    const alpha = (this.transparency / 100) * (this.colorAlpha / 100);

    switch (this.mode) {
      case 'simple':
        return this._rgba(this.color1, alpha);

      case 'gradient': {
        // Cycle continuously through HSV space between color1 and color2
        const hsv1 = this._rgbToHsv(this.color1);
        const hsv2 = this._rgbToHsv(this.color2);
        const cyclePeriod = 200; // pixels of stroke length per full cycle
        const progress = (this._t++ % cyclePeriod) / cyclePeriod; // 0..1 repeating
        const h = this._lerp(hsv1.h, hsv2.h, progress);
        const s = this._lerp(hsv1.s, hsv2.s, progress);
        const v = this._lerp(hsv1.v, hsv2.v, progress);
        const rgb = this._hsvToRgb(h, s, v);
        return `rgba(${rgb.r|0},${rgb.g|0},${rgb.b|0},${alpha})`;
      }

      case 'multiGradient': {
        const colors = this.gradientColors;
        if (colors.length < 2) return this._rgba(colors[0] || this.color1, alpha);
        const segments = colors.length - 1;
        const cyclePeriod = 200 * segments;
        const progress = (this._t++ % cyclePeriod) / cyclePeriod; // 0..1 repeating
        const pos = progress * segments;
        const idx = Math.min(Math.floor(pos), segments - 1);
        const localT = pos - idx;
        const hsv1 = this._rgbToHsv(colors[idx]);
        const hsv2 = this._rgbToHsv(colors[idx + 1]);
        const h = this._lerp(hsv1.h, hsv2.h, localT);
        const s = this._lerp(hsv1.s, hsv2.s, localT);
        const v = this._lerp(hsv1.v, hsv2.v, localT);
        const rgb = this._hsvToRgb(h, s, v);
        return `rgba(${rgb.r|0},${rgb.g|0},${rgb.b|0},${alpha})`;
      }

      case 'random':
        this._currentHue = (this._currentHue + 7) % 360;
        return `hsla(${this._currentHue|0},90%,55%,${alpha})`;

      case 'rangedRandom': {
        const hsl = this._rgbToHsl(this.color1);
        const hue = hsl.h + (Math.random() - 0.5) * 60;
        const sat = Math.max(30, Math.min(100, hsl.s + (Math.random() - 0.5) * 20));
        return `hsla(${hue|0},${sat|0}%,55%,${alpha})`;
      }

      case 'smoothRandom': {
        this._currentHue = this._lerp(this._currentHue, this._targetHue, this.smoothness * 0.05);
        if (Math.abs(this._currentHue - this._targetHue) < 5) {
          this._targetHue = Math.random() * 360;
        }
        return `hsla(${this._currentHue|0},85%,55%,${alpha})`;
      }

      case 'background':
        return this._rgba(this.bgColor, alpha);

      default:
        return `rgba(255,255,255,${alpha})`;
    }
  }

  getBgColorCSS() {
    return this._rgba(this.bgColor, 1);
  }

  _rgba(c, alpha) {
    return `rgba(${c.r},${c.g},${c.b},${alpha})`;
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _rgbToHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  _rgbToHsv(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
  }

  _hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else               { r = c; g = 0; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }

  static parseAndroidColor(int32) {
    if (int32 === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const unsigned = int32 >>> 0;
    const a = (unsigned >> 24) & 0xFF;
    const r = (unsigned >> 16) & 0xFF;
    const g = (unsigned >> 8) & 0xFF;
    const b = unsigned & 0xFF;
    return { r, g, b, a };
  }
}
