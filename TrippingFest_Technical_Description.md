# TrippingFest — Full Technical Description

> **App:** Tripping Fest Drawing
> **Developer:** Forrest Heller (Tripping Fest LLC)
> **Package ID:** `com.forrestheller.trippingfest`
> **Version:** 1.25 (build 25)
> **Last Updated:** April 15, 2012
> **Size:** 1.2 MB
> **Min SDK:** Android 2.1 (Eclair)
> **Category:** Entertainment
> **Rating:** 4.6/5 (270 ratings)
> **Installs:** 10,000+
> **Price:** $2.00
> **Content Rating:** Everyone

---

## 1. Overview & History

TrippingFest is a psychedelic drawing/sketching app that enables users to create complex, symmetrical, and visually striking artwork with minimal input. Described as "not for the meek, but for the festive," the app was designed for experiential, exploratory use — users move their fingers around and the app produces magnificently complex psychedelic designs from simple touch input.

The app originated as a Visual Basic 5 desktop drawing program written by Forrest Heller around 2003 while he was in middle school. That original program featured ~20 patterns, random colors, automated random drawing, and (notably) fart sound effects. Heller waited for years for someone else to release a similar concept — drawing many different things with many different colors — but nobody did.

In early 2009, Heller began a Java-based multi-platform port but had to shelve it due to college coursework. Later in 2009, in a single week between work and school, he learned Objective-C and the iPhone SDK from scratch and completed the iPhone version. It was later ported to Android and also released on the Amazon Appstore.

### Platform Timeline

| Year | Event |
|------|-------|
| ~2003 | Original VB5 desktop drawing program |
| Early 2009 | Java multi-platform proof-of-concept (shelved) |
| Late 2009 | iPhone (iOS) version built in one week — first App Store release |
| ~2010 | TrippingFest 2 (iOS) — App Store ID `327205553`, priced $1–$2.99 |
| ~2011 | Android version released on Google Play |
| ~2011 | Amazon Appstore listing (`B004JK9Y36`) |
| 2012 | Final update (v1.25) on Android |
| ~2023+ | Delisted from both iOS App Store and Google Play |

### Variants

- **Tripping Fest (Full, $2)** — All features, no ads.
- **Tripping Fest Lite (Free)** — Package: `com.forrestheller.trippingfest.free`. Reduced feature set, with advertisements. Delisted.

---

## 2. Features

### 2.1 Drawing Specialties

| Feature | Description |
|---------|-------------|
| **Optical Illusions** | Patterns that exploit visual perception, creating moiré effects and apparent motion |
| **3D Drawings** | Depth illusion technique: draw outward first, then pull back inward — combined with symmetry modes, this creates expanding forms with concentric layering that simulates depth |
| **Symmetry-based Drawing** | Multiple mirror axes create kaleidoscopic patterns from single finger strokes |
| **Flexible Coloring** | Gradient, random, background-based, and custom color modes |
| **General Purpose Drawing** | Freeform drawing without symmetry constraints |
| **WildWalk** | Automated drawing mode — the app draws by itself using algorithmic wandering |

### 2.2 Pattern System (20+ Patterns)

The pattern button ("P") provides access to over 20 distinct drawing patterns, including:

- **Blur** — Gaussian-style softening applied to strokes
- **Emboss** — Relief/raised effect on drawn content
- **Color Mixing** — Sophisticated blending of overlapping strokes
- **Geometric Patterns** — Various procedurally generated textures and fills
- **Kaleidoscopic Patterns** — Symmetry-multiplied rendering patterns

### 2.3 Color System

Accessed via the "C" button:

| Mode | Description |
|------|-------------|
| **Gradient** | Colors transition smoothly across the stroke path |
| **Random** | Each stroke segment uses a randomly selected color |
| **Ranged Random** | Colors are random but constrained within a user-selected hue/saturation range — "sets the tone" for a picture while maintaining variety |
| **Random w/ Smoothness** | Random colors with adjustable interpolation (added in v1.24) |
| **Background** | Draws using the current background color — useful for erasing or negative-space effects |
| **Custom** | User-selected fixed colors |

### 2.4 Options System

Accessed via the "O" button:

- **Mirror Combinations** — Multiple axis configurations for symmetry rendering
- **Transparency** — Adjustable stroke opacity for layering effects

### 2.5 WildWalk (Automatic Drawing)

The "W" button starts/stops WildWalk — an algorithmic automatic drawing mode where the app generates drawings autonomously. In v1.24+, WildWalk can run without toolbars for full-screen effect.

### 2.6 Recording & Playback

- **Record** — Captures all touch inputs to a file
- **Play** — Replays recorded touch sessions, including built-in demo recordings
- **Gallery** — Browse saved recordings with thumbnail previews
- WildWalk sessions can also be recorded and replayed

### 2.7 Other Tools

| Tool | Description |
|------|-------------|
| **Line Width Slider** | Bottom toolbar slider for adjusting stroke thickness |
| **Undo** | Reverses last operation |
| **Clear** | Wipes the canvas |
| **Save** | Export to Facebook, Email, or device Gallery |
| **Load** | Import drawings or photos from device |
| **Settings Save/Restore** | Persist and quickly reload favorite pattern/color/mirror configurations (v1.24+) |
| **Hide/Show Toolbars** | Toggle UI visibility for full-screen drawing |

---

## 3. User Interface Architecture

### 3.1 Layout

```
┌──────────────────────────────────────────┐
│  [Record] [Play] [Undo] [Clear] [Save]  │  ← Top Toolbar
├──────────────────────────────────────────┤
│                                          │
│                                          │
│              Canvas Area                 │
│         (Full touch surface)             │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ [━━━━ Width Slider ━━━━] [P][C][O][W]   │  ← Bottom Toolbar
└──────────────────────────────────────────┘
```

### 3.2 Android Menu Options

Accessible via the device menu key:
1. Show/Hide toolbars
2. Clear canvas
3. Undo
4. Load drawings or pictures
5. Save to gallery / email / Facebook
6. Save and restore settings

### 3.3 Interaction Model

- **Single finger touch** — Primary drawing input
- **Stroke path** — Continuous touch generates path coordinates
- **Real-time rendering** — Each touch point is immediately rendered with the active pattern, color, and symmetry settings
- **Seizure warning** — App includes a warning due to rapidly flashing/cycling visual effects

---

## 4. Algorithm Analysis

### 4.1 Core Rendering Pipeline

```
Touch Input → Path Generation → Symmetry Transform → Pattern Apply → Color Apply → Canvas Composite
```

1. **Touch Capture:** Raw touch events (`ACTION_DOWN`, `ACTION_MOVE`, `ACTION_UP`) are captured and converted to canvas-space coordinates.

2. **Path Interpolation:** Touch points are connected (likely via linear or Catmull-Rom spline interpolation) to create smooth stroke paths.

3. **Symmetry Multiplication:** Each path point is reflected across configured mirror axes, generating multiple mirrored copies of each stroke.

4. **Pattern Rendering:** The active pattern shader is applied to each stroke segment.

5. **Color Computation:** The active color mode determines the RGBA value for each rendered pixel.

6. **Canvas Compositing:** Rendered strokes are blended onto the canvas bitmap using the current transparency setting.

### 4.2 Symmetry / Mirror Algorithm

The symmetry system is the core innovation of TrippingFest. It works by:

1. **Defining Mirror Axes:** One or more reflection axes are defined, typically passing through the canvas center. Common configurations include:
   - **Vertical axis** — Left-right reflection
   - **Horizontal axis** — Top-bottom reflection
   - **Diagonal axes** — 45° and 135° reflections
   - **Radial (N-fold)** — N evenly-spaced axes creating kaleidoscope effects (e.g., 4-fold, 6-fold, 8-fold symmetry)

2. **Point Reflection Formula:**
   For a mirror axis defined by angle θ passing through center (cx, cy):
   ```
   dx = x - cx
   dy = y - cy
   x' = cx + dx·cos(2θ) + dy·sin(2θ)
   y' = cy + dx·sin(2θ) - dy·cos(2θ)
   ```

3. **Compound Symmetry:** Multiple mirror types can be combined, creating complex transformations. For example, combining vertical + horizontal + both diagonals produces 8-fold dihedral symmetry (D₄ group).

4. **Rendering:** Each touch point generates N copies (where N = number of symmetry-related positions), all rendered simultaneously.

### 4.3 Pattern Algorithms

#### Blur
- Likely implements a box blur or Gaussian blur convolution kernel applied to a local region around each stroke point
- On Android 2.1-era hardware: probably a simplified 3×3 or 5×5 kernel for performance

#### Emboss
- Classic 3×3 emboss convolution matrix:
  ```
  [-2, -1,  0]
  [-1,  1,  1]
  [ 0,  1,  2]
  ```
- Applied to the canvas region around each new stroke, creating a raised/relief appearance

#### Color Mixing
- Alpha-blended compositing where overlapping strokes combine additively or using Porter-Duff blending modes
- May use HSV color space for more perceptually natural blending

### 4.4 Color Algorithms

#### Gradient Color
```
color(t) = lerp(color_start, color_end, t / path_length)
```
Where `t` is the distance along the stroke path. Likely interpolated in HSV space for smooth hue transitions.

#### Random Color
```
color(segment) = HSV(random(0, 360), saturation, value)
```
Each stroke segment gets a randomly generated hue. In v1.24+, the "smoothness" parameter controls interpolation:
```
color(t) = lerp(color(t-1), random_target, smoothness_factor)
```
Low smoothness = rapid color changes; high smoothness = gradual transitions.

#### Optical Illusion Colors
- High-contrast alternating colors (e.g., black/white stripes)
- Phase-offset patterns that create moiré interference when overlapping
- Rapid hue cycling that creates afterimage effects

### 4.5 WildWalk Algorithm

The automatic drawing mode likely uses a random walk algorithm:

```python
class WildWalk:
    def __init__(self):
        self.x = canvas_center_x
        self.y = canvas_center_y
        self.angle = random(0, 2π)
        self.speed = base_speed

    def step(self):
        # Perlin noise or smoothed random for organic movement
        self.angle += random_gaussian(0, angle_variance)
        self.speed += random_gaussian(0, speed_variance)
        self.speed = clamp(self.speed, min_speed, max_speed)

        self.x += cos(self.angle) * self.speed
        self.y += sin(self.angle) * self.speed

        # Boundary reflection or wrapping
        if out_of_bounds(self.x, self.y):
            self.angle = reflect_angle(self.angle)

        draw_point(self.x, self.y)  # Fed through same pipeline
```

Key characteristics:
- **Smooth trajectory** — Not pure random; uses correlated noise for organic-looking paths
- **Boundary awareness** — Reflects or wraps at canvas edges
- **Integration with pipeline** — WildWalk output feeds into the same symmetry + pattern + color pipeline as manual touch input

### 4.6 Recording System

The recording system serializes touch events:

```
Recording File Format (estimated):
  Header: timestamp, version, canvas_dimensions
  Events: [
    { time_ms, event_type, x, y, pressure },
    ...
  ]
  Settings: { pattern, color_mode, mirror_config, line_width, transparency }
```

Playback replays events with original timing, applying them through the current rendering pipeline. Recordings are sorted newest-first (v1.25).

---

## 5. Technical Architecture

### 5.1 Platform Stack

| Layer | Technology |
|-------|-----------|
| **Language** | Java (Android), Objective-C (iOS) |
| **Graphics** | Android Canvas API / `android.graphics` (likely `Canvas`, `Paint`, `Bitmap`, `Path`) |
| **Min API** | Android 2.1 (API level 7) |
| **Rendering** | Software rendering on `Bitmap` via `Canvas` |
| **Storage** | SD card / external storage for recordings and saved images |
| **Network** | Used for Facebook sharing integration |

### 5.2 Permissions

| Permission | Purpose |
|------------|---------|
| `INTERNET` | Facebook sharing, analytics |
| `WRITE_EXTERNAL_STORAGE` | Saving drawings and recordings |
| `ACCESS_NETWORK_STATE` | Check connectivity before sharing |
| `READ_EXTERNAL_STORAGE` (implied) | Loading saved drawings/photos |

### 5.3 Performance Considerations

At 1.2 MB APK size, the app is extremely lightweight. For Android 2.1-era devices:
- All rendering is CPU-based (no OpenGL)
- Bitmap operations are kept simple (no complex shaders)
- The emboss filter may cause lag on larger canvas areas (noted in user reviews)
- Memory management is critical for bitmap-heavy apps on devices with 256–512 MB RAM

---

## 6. Version History

| Version | Changes |
|---------|---------|
| **1.25** | Bug fixes. Recordings now sorted newest-first. |
| **1.24** | Save/load favorite settings. WildWalk without toolbars. New "smoothness" setting on random colors. |
| **< 1.24** | Initial release with core drawing, symmetry, patterns, colors, recording/playback, and WildWalk. |

---

## 7. Current Availability Status

| Platform | Status |
|----------|--------|
| iOS App Store | **Delisted** — Redirect to unrelated app |
| Google Play | **Delisted** — Returns "Not Found" |
| Amazon Appstore | **Listed** but likely non-functional |
| Source Code | **Not public** — Not on GitHub |
| APK Archives | **Obtained** — Downloaded v1.25 from Aptoide CDN |

### How We Obtained It

The APK was sourced via Aptoide's public API (`ws75.aptoide.com/api/7/app/get/package_name=com.forrestheller.trippingfest`), which returned a direct CDN download link. APKPure and APKMirror both returned 403 errors. The file is 1,253,736 bytes (~1.25 MB) and validates as a Java archive (APK).

A copy is saved at `~/Downloads/trippingfest.apk`.

---

## 8. Emulation Setup (This Mac)

An Android emulator has been configured on this machine:

```bash
# Environment setup (add to ~/.zshrc):
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"

# Launch the emulator:
emulator -avd trippingfest_phone -gpu swiftshader_indirect

# Install the APK:
adb install ~/Downloads/trippingfest.apk

# Launch the app:
adb shell am start -n com.forrestheller.trippingfest/.TrippingFest

# AVD Details:
#   Name: trippingfest_phone
#   Device: Pixel 3a
#   Android: 11.0 (API 30) with Google APIs
#   ABI: arm64-v8a (native Apple Silicon)
```

---

## 9. Reception & Cultural Impact

- A 2010 blog reviewer called it "probably the best app since the calculator or weather apps that came installed on the phone" and used it extensively on the NYC subway
- One user reported the app held their attention for 24 hours straight
- Google Play rating: 4.6/5 across 270 reviews, with 218 five-star ratings
- Users frequently compared it favorably to Picasso (another drawing app)
- The developer listed it under "Stuff I made a long time ago" on his personal website
- Known bugs: some users on newer devices reported only half the screen was available for drawing; the emboss effect caused lag on large canvas areas

---

*Document generated 2026-03-27. Based on archived Google Play listing (Wayback Machine, June 2013), APKCombo metadata, developer website research, blog reviews, and algorithmic analysis.*
