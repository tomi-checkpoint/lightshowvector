import { getStrokeNames } from './strokes/stroke-registry.js';
import { RecordingPlayer, RecordingRecorder } from './recording.js';
import { WildWalk } from './wildwalk.js';

export class UI {
  constructor(engine) {
    this.engine = engine;
    this.player = new RecordingPlayer(engine);
    this.recorder = new RecordingRecorder();
    this.wildwalk = new WildWalk(engine);
    this._isRecording = false;
    this._setupToolbar();
    this._setupDialogs();
  }

  _setupToolbar() {
    const engine = this.engine;

    // Width slider
    const slider = document.getElementById('width-slider');
    slider.value = engine.lineWidth;
    slider.addEventListener('input', () => {
      engine.lineWidth = parseInt(slider.value);
      engine.ctx.lineWidth = engine.lineWidth;
      if (this.recorder.recording) {
        this.recorder.recordStateChange('width', engine.lineWidth);
      }
    });

    // Clear
    document.getElementById('btn-clear').addEventListener('click', () => {
      engine.undoStack.save();
      engine.clear();
    });

    // Undo
    document.getElementById('btn-undo').addEventListener('click', () => {
      engine.undo();
    });

    // Save PNG
    document.getElementById('btn-save').addEventListener('click', async () => {
      const blob = await engine.exportPNG();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trippingfest-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Record toggle
    const btnRecord = document.getElementById('btn-record');
    btnRecord.addEventListener('click', () => {
      if (this._isRecording) {
        this._isRecording = false;
        btnRecord.classList.remove('active');
        btnRecord.textContent = 'Rec';
        const text = this.recorder.stop();
        // Download recording
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trippingfest-${Date.now()}.recording`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        this._isRecording = true;
        btnRecord.classList.add('active');
        btnRecord.textContent = 'Stop';
        this.recorder.start(engine);
      }
    });

    // Play demos
    document.getElementById('btn-play').addEventListener('click', () => {
      this._showDialog('playback-dialog');
    });

    // Pattern
    document.getElementById('btn-pattern').addEventListener('click', () => {
      this._showDialog('pattern-dialog');
    });

    // Color
    document.getElementById('btn-color').addEventListener('click', () => {
      this._showDialog('color-dialog');
    });

    // Options
    document.getElementById('btn-options').addEventListener('click', () => {
      this._showDialog('options-dialog');
    });

    // WildWalk toggle
    const btnWild = document.getElementById('btn-wildwalk');
    btnWild.addEventListener('click', () => {
      if (this.wildwalk.running) {
        this.wildwalk.stop();
        btnWild.classList.remove('active');
      } else {
        this.wildwalk.start();
        btnWild.classList.add('active');
      }
    });
  }

  _setupDialogs() {
    this._buildPatternDialog();
    this._buildColorDialog();
    this._buildOptionsDialog();
    this._buildPlaybackDialog();

  }

  _showDialog(id) {
    const dialog = document.getElementById(id);
    dialog.classList.remove('hidden');

    // Close on backdrop/overlay click (re-register each open to keep it simple)
    const handler = (e) => {
      if (e.target === dialog || e.target.classList.contains('dialog-backdrop')) {
        dialog.classList.add('hidden');
        dialog.removeEventListener('click', handler);
      }
    };
    dialog.addEventListener('click', handler);
  }

  _buildPatternDialog() {
    const list = document.getElementById('pattern-list');
    const names = getStrokeNames();
    list.innerHTML = '';
    for (const name of names) {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        this.engine.setPattern(name);
        list.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (this.recorder.recording) {
          this.recorder.recordStateChange('p', name);
        }
      });
      if (name === 'Line') btn.classList.add('selected');
      list.appendChild(btn);
    }
  }

  _buildColorDialog() {
    const modeList = document.getElementById('color-mode-list');
    const controls = document.getElementById('color-controls');

    const modes = [
      { id: 'simple', label: 'Simple' },
      { id: 'gradient', label: 'Gradient' },
      { id: 'multiGradient', label: 'Multi Gradient' },
      { id: 'random', label: 'Random' },
      { id: 'rangedRandom', label: 'Ranged Random' },
      { id: 'smoothRandom', label: 'Smooth Random' },
      { id: 'background', label: 'Background' },
    ];

    modeList.innerHTML = '';
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.textContent = mode.label;
      btn.addEventListener('click', () => {
        this.engine.colorSystem.mode = mode.id;
        modeList.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._updateColorControls();
      });
      if (mode.id === 'random') btn.classList.add('selected');
      modeList.appendChild(btn);
    }

    // Default to random
    this.engine.colorSystem.mode = 'random';
    this._updateColorControls();
  }

  _updateColorControls() {
    const controls = document.getElementById('color-controls');
    const cs = this.engine.colorSystem;
    controls.innerHTML = '';

    if (cs.mode === 'simple' || cs.mode === 'gradient' || cs.mode === 'rangedRandom') {
      const label1 = document.createElement('label');
      label1.textContent = 'Color 1: ';
      const input1 = document.createElement('input');
      input1.type = 'color';
      input1.value = this._rgbToHex(cs.color1);
      input1.addEventListener('input', () => {
        cs.color1 = this._hexToRgb(input1.value);
      });
      label1.appendChild(input1);
      controls.appendChild(label1);
    }

    if (cs.mode === 'gradient') {
      const label2 = document.createElement('label');
      label2.textContent = 'Color 2: ';
      const input2 = document.createElement('input');
      input2.type = 'color';
      input2.value = this._rgbToHex(cs.color2);
      input2.addEventListener('input', () => {
        cs.color2 = this._hexToRgb(input2.value);
      });
      label2.appendChild(input2);
      controls.appendChild(label2);
    }

    if (cs.mode === 'multiGradient') {
      const container = document.createElement('div');
      container.id = 'multi-gradient-colors';

      const renderColors = () => {
        container.innerHTML = '';
        cs.gradientColors.forEach((c, i) => {
          const row = document.createElement('label');
          row.textContent = `Color ${i + 1}: `;
          const input = document.createElement('input');
          input.type = 'color';
          input.value = this._rgbToHex(c);
          input.addEventListener('input', () => {
            cs.gradientColors[i] = this._hexToRgb(input.value);
          });
          row.appendChild(input);

          if (cs.gradientColors.length > 2) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '\u2212';
            removeBtn.style.cssText = 'width:28px;height:28px;margin-left:8px;background:rgba(255,60,60,0.25);color:#ff6b6b;border:1px solid rgba(255,60,60,0.3);border-radius:8px;cursor:pointer;font-size:16px;line-height:1';
            removeBtn.addEventListener('click', () => {
              cs.gradientColors.splice(i, 1);
              renderColors();
            });
            row.appendChild(removeBtn);
          }

          container.appendChild(row);
        });

        if (cs.gradientColors.length < 5) {
          const addBtn = document.createElement('button');
          addBtn.textContent = '+ Add Color';
          addBtn.style.cssText = 'margin-top:6px;padding:8px 16px;background:rgba(96,165,250,0.2);color:#60a5fa;border:1px solid rgba(96,165,250,0.3);border-radius:8px;cursor:pointer;font-size:13px;font-weight:500';
          addBtn.addEventListener('click', () => {
            const hue = (cs.gradientColors.length * 72) % 360;
            const rgb = cs._hsvToRgb(hue, 90, 90);
            cs.gradientColors.push({ r: rgb.r | 0, g: rgb.g | 0, b: rgb.b | 0, a: 255 });
            renderColors();
          });
          container.appendChild(addBtn);
        }
      };

      renderColors();
      controls.appendChild(container);
    }

    if (cs.mode === 'smoothRandom') {
      const label = document.createElement('label');
      label.textContent = 'Smoothness: ';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '100';
      input.value = String(cs.smoothness * 100);
      input.addEventListener('input', () => {
        cs.smoothness = parseInt(input.value) / 100;
      });
      label.appendChild(input);
      controls.appendChild(label);
    }

    // Background color (always available)
    const bgLabel = document.createElement('label');
    bgLabel.textContent = 'Background: ';
    const bgInput = document.createElement('input');
    bgInput.type = 'color';
    bgInput.value = this._rgbToHex(cs.bgColor);
    bgInput.addEventListener('input', () => {
      cs.bgColor = this._hexToRgb(bgInput.value);
    });
    bgLabel.appendChild(bgInput);
    controls.appendChild(bgLabel);
  }

  _buildOptionsDialog() {
    const mirrorOpts = document.getElementById('mirror-options');
    const transpCtrl = document.getElementById('transparency-control');
    const ms = this.engine.mirrorSystem;

    const mirrors = [
      { key: 'vertical', label: 'Vertical Mirror' },
      { key: 'horizontal', label: 'Horizontal Mirror' },
      { key: 'diagonal1', label: 'Diagonal Mirror (45°)' },
      { key: 'diagonal2', label: 'Diagonal Mirror (135°)' },
    ];

    mirrorOpts.innerHTML = '';
    for (const m of mirrors) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = ms[m.key];
      cb.addEventListener('change', () => {
        ms[m.key] = cb.checked;
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(` ${m.label}`));
      mirrorOpts.appendChild(label);
    }

    // Polar folds
    const polarLabel = document.createElement('label');
    const polarCb = document.createElement('input');
    polarCb.type = 'checkbox';
    polarCb.checked = ms.polar;
    const polarNum = document.createElement('input');
    polarNum.type = 'number';
    polarNum.min = '2';
    polarNum.max = '32';
    polarNum.value = String(ms.polarFolds || 6);
    polarCb.addEventListener('change', () => {
      ms.polar = polarCb.checked;
      if (ms.polar) ms.polarFolds = parseInt(polarNum.value) || 6;
    });
    polarNum.addEventListener('input', () => {
      ms.polarFolds = parseInt(polarNum.value) || 6;
    });
    polarLabel.appendChild(polarCb);
    polarLabel.appendChild(document.createTextNode(' Polar Folds: '));
    polarLabel.appendChild(polarNum);
    mirrorOpts.appendChild(polarLabel);

    // Same color
    const sameLabel = document.createElement('label');
    const sameCb = document.createElement('input');
    sameCb.type = 'checkbox';
    sameCb.checked = ms.sameColor;
    sameCb.addEventListener('change', () => {
      ms.sameColor = sameCb.checked;
    });
    sameLabel.appendChild(sameCb);
    sameLabel.appendChild(document.createTextNode(' Same Color for All Mirrors'));
    mirrorOpts.appendChild(sameLabel);

    // Off-center mirroring
    const offLabel = document.createElement('label');
    const offCb = document.createElement('input');
    offCb.type = 'checkbox';
    offCb.checked = ms.offCenter;
    offCb.addEventListener('change', () => {
      ms.offCenter = offCb.checked;
      if (ms.offCenter) ms.randomizeCenter();
    });
    offLabel.appendChild(offCb);
    offLabel.appendChild(document.createTextNode(' Off-Center Mirroring'));
    mirrorOpts.appendChild(offLabel);

    // Transparency
    transpCtrl.innerHTML = '';
    const tLabel = document.createElement('label');
    tLabel.textContent = 'Transparency: ';
    const tSlider = document.createElement('input');
    tSlider.type = 'range';
    tSlider.min = '0';
    tSlider.max = '100';
    tSlider.value = String(100 - this.engine.colorSystem.transparency);
    tSlider.addEventListener('input', () => {
      this.engine.colorSystem.transparency = 100 - parseInt(tSlider.value);
    });
    tLabel.appendChild(tSlider);
    transpCtrl.appendChild(tLabel);

    // Line cap
    const capLabel = document.createElement('label');
    capLabel.textContent = 'Line Cap: ';
    const capSelect = document.createElement('select');
    capSelect.style.cssText = 'background:#444;color:#fff;border:1px solid #666;border-radius:4px;padding:4px;font-size:14px';
    for (const cap of ['round', 'square', 'butt']) {
      const opt = document.createElement('option');
      opt.value = cap;
      opt.textContent = cap;
      if (cap === this.engine.lineCap) opt.selected = true;
      capSelect.appendChild(opt);
    }
    capSelect.addEventListener('change', () => {
      this.engine.lineCap = capSelect.value;
      this.engine.ctx.lineCap = capSelect.value;
    });
    capLabel.appendChild(capSelect);
    transpCtrl.appendChild(capLabel);

    // Drawing mode
    const modeLabel = document.createElement('label');
    const modeCb = document.createElement('input');
    modeCb.type = 'checkbox';
    modeCb.checked = this.engine.drawingMode === 1;
    modeCb.addEventListener('change', () => {
      this.engine.drawingMode = modeCb.checked ? 1 : 0;
    });
    modeLabel.appendChild(modeCb);
    modeLabel.appendChild(document.createTextNode(' Crazy Mode'));
    transpCtrl.appendChild(modeLabel);
  }

  async _buildPlaybackDialog() {
    const list = document.getElementById('recording-list');
    list.innerHTML = '';

    // Demo recordings
    for (let i = 1; i <= 8; i++) {
      const item = document.createElement('div');
      item.className = 'recording-item';
      const img = document.createElement('img');
      img.src = `assets/demos/Demo${i}.png`;
      img.alt = `Demo ${i}`;
      const label = document.createElement('span');
      label.textContent = `Demo ${i}`;
      item.appendChild(img);
      item.appendChild(label);
      item.addEventListener('click', () => this._playDemo(i));
      list.appendChild(item);
    }

    // Import recording button
    const importItem = document.createElement('div');
    importItem.className = 'recording-item';
    importItem.innerHTML = '<span style="font-size:24px;display:block;padding:20px">+</span><span>Import .recording</span>';
    importItem.addEventListener('click', () => this._importRecording());
    list.appendChild(importItem);
  }

  async _playDemo(num) {
    document.getElementById('playback-dialog').classList.add('hidden');

    try {
      const resp = await fetch(`assets/demos/Demo${num}.recording`);
      const text = await resp.text();
      this.engine.clear();
      this.player.load(text);
      this.player.onComplete = () => {};
      this.player.play();
    } catch (e) {
      console.error('Failed to load demo:', e);
    }
  }

  _importRecording() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.recording,.txt';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const text = await file.text();
      document.getElementById('playback-dialog').classList.add('hidden');
      this.engine.clear();
      this.player.load(text);
      this.player.play();
    });
    input.click();
  }

  // Called by app.js to wire recording into input
  onPointerStart(x, y, pressure) {
    if (this.recorder.recording) {
      this.recorder.recordStrokeStart(x, y, pressure);
    }
  }

  onPointerMove(x, y, pressure) {
    if (this.recorder.recording) {
      this.recorder.recordMove(x, y, pressure);
    }
  }

  _rgbToHex(c) {
    const r = Math.max(0, Math.min(255, c.r)).toString(16).padStart(2, '0');
    const g = Math.max(0, Math.min(255, c.g)).toString(16).padStart(2, '0');
    const b = Math.max(0, Math.min(255, c.b)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: 255 };
  }
}
