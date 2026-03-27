export class RecordingParser {
  parse(text) {
    const commands = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const comma = trimmed.indexOf(',');
      if (comma === -1) continue;
      const type = trimmed.substring(0, comma);
      const args = trimmed.substring(comma + 1);
      commands.push({ type, args });
    }
    return commands;
  }
}

export class RecordingPlayer {
  constructor(engine) {
    this.engine = engine;
    this.commands = [];
    this.playing = false;
    this._index = 0;
    this._startTime = 0;
    this._rafId = null;
    this._origWidth = 600;
    this._origHeight = 1024;
    this._isInStroke = false;
    this._prevX = 0;
    this._prevY = 0;
    this._strokeStartTime = 0;
    this.onComplete = null;
  }

  load(text) {
    const parser = new RecordingParser();
    this.commands = parser.parse(text);
  }

  play() {
    if (this.commands.length === 0) return;
    this.playing = true;
    this._index = 0;
    this._isInStroke = false;

    // Apply all state commands at the beginning until we hit the first move
    this._applyStateCommands();
    this._startTime = performance.now();
    this._strokeStartTime = 0;
    this._tick();
  }

  stop() {
    this.playing = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._isInStroke) {
      this._isInStroke = false;
    }
  }

  _tick() {
    if (!this.playing) return;
    const now = performance.now();
    const elapsed = now - this._startTime;

    // Process commands up to the current elapsed time
    while (this._index < this.commands.length) {
      const cmd = this.commands[this._index];

      if (cmd.type === 'm') {
        const parts = cmd.args.split(',');
        const cmdElapsed = parseFloat(parts[0]);

        // New stroke detected (elapsed resets to 0 or near-0 after non-m commands)
        if (cmdElapsed === 0 && this._isInStroke) {
          this.engine.onPointerEnd(this._prevX, this._prevY);
          this._isInStroke = false;
        }

        if (cmdElapsed === 0) {
          this._strokeStartTime = elapsed;
        }

        const targetTime = this._strokeStartTime + cmdElapsed;
        if (elapsed < targetTime) break; // Wait for this time

        const x = parseFloat(parts[1]) * (this.engine.canvas.width / this._origWidth);
        const y = parseFloat(parts[2]) * (this.engine.canvas.height / this._origHeight);
        const pressure = parseFloat(parts[3]) || 0;

        if (!this._isInStroke) {
          this.engine.onPointerStart(x, y, pressure);
          this._isInStroke = true;
          this._prevX = x;
          this._prevY = y;
        } else {
          this.engine.onPointerMove(x, y, pressure);
          this._prevX = x;
          this._prevY = y;
        }
        this._index++;
      } else {
        // State command — apply immediately
        if (this._isInStroke) {
          this.engine.onPointerEnd(this._prevX, this._prevY);
          this._isInStroke = false;
        }
        this._applyCommand(cmd);
        this._index++;

        // After state commands, update stroke start time for next move sequence
        if (this._index < this.commands.length && this.commands[this._index].type === 'm') {
          this._strokeStartTime = elapsed;
        }
      }
    }

    if (this._index >= this.commands.length) {
      if (this._isInStroke) {
        this.engine.onPointerEnd(this._prevX, this._prevY);
        this._isInStroke = false;
      }
      this.playing = false;
      if (this.onComplete) this.onComplete();
      return;
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }

  _applyStateCommands() {
    while (this._index < this.commands.length) {
      const cmd = this.commands[this._index];
      if (cmd.type === 'm') break;
      this._applyCommand(cmd);
      this._index++;
    }
  }

  _applyCommand(cmd) {
    const engine = this.engine;
    switch (cmd.type) {
      case 'p':
        engine.setPattern(cmd.args);
        break;
      case 'pd':
        engine.setPatternDetail(parseInt(cmd.args));
        break;
      case 'drawingMode':
        engine.drawingMode = parseInt(cmd.args);
        break;
      case 'lineCap':
        engine.lineCap = cmd.args;
        break;
      case 'colorMix':
        engine.setCompositeOp(cmd.args);
        break;
      case 'filter':
        engine.filter = cmd.args;
        break;
      case 'options':
        engine.parseOptions(cmd.args);
        break;
      case 'colorSpace':
        engine.colorSystem.colorSpace = parseInt(cmd.args);
        break;
      case 'color':
        engine.colorSystem.parseColor(cmd.args);
        break;
      case 'r':
        // Recording timestamp — informational, skip
        break;
      case 'screenWH': {
        const parts = cmd.args.split(',');
        this._origWidth = parseInt(parts[0]) || 600;
        this._origHeight = parseInt(parts[1]) || 1024;
        break;
      }
      case 'width':
        engine.lineWidth = parseInt(cmd.args);
        break;
      case 'clear':
        if (cmd.args === 'true') engine.clear();
        break;
      case 'undo':
        engine.undo();
        break;
      default:
        // Unknown command, skip
        break;
    }
  }
}

export class RecordingRecorder {
  constructor() {
    this.lines = [];
    this.recording = false;
    this._startTime = 0;
    this._strokeStart = 0;
  }

  start(engine) {
    this.lines = [];
    this.recording = true;
    this._startTime = performance.now();

    // Record initial state
    this.lines.push(`p,${engine.activeStroke.name}`);
    this.lines.push(`drawingMode,${engine.drawingMode}`);
    this.lines.push(`lineCap,${engine.lineCap}`);
    this.lines.push(`colorMix,${engine._compositeOpKey || 'SRC_OVER'}`);
    this.lines.push(`filter,${engine.filter}`);
    this.lines.push(`screenWH,${engine.canvas.width},${engine.canvas.height}`);
    this.lines.push(`width,${engine.lineWidth}`);
  }

  recordStrokeStart(x, y, pressure) {
    if (!this.recording) return;
    this._strokeStart = performance.now();
    this.lines.push(`m,0,${x.toFixed(3)},${y.toFixed(3)},${pressure}`);
  }

  recordMove(x, y, pressure) {
    if (!this.recording) return;
    const elapsed = Math.round(performance.now() - this._strokeStart);
    this.lines.push(`m,${elapsed},${x.toFixed(3)},${y.toFixed(3)},${pressure}`);
  }

  recordStateChange(key, value) {
    if (!this.recording) return;
    this.lines.push(`${key},${value}`);
  }

  stop() {
    this.recording = false;
    return this.lines.join('\n');
  }

  export() {
    const text = this.lines.join('\n');
    return new Blob([text], { type: 'text/plain' });
  }
}
