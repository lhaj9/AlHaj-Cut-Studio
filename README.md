# AlHaj Cut Studio (AIHAJ Cut Studio)

Static, browser-based AI Background Remover, Bulk Cutout Processor, and Multi-Layer Creative Photo Studio — built with React, TypeScript, Tailwind CSS, WebGPU, and WebAssembly with **zero backend or Node.js runtime requirements**.

---

## Key Features

- **Adaptive Local AI Engines (Privacy-First):**
  - **RMBG-1.4 / MODNet** via `@huggingface/transformers` (`3.8.1`) with automatic hardware priority: **WebGPU → Multi-Threaded WASM → Single-Threaded WASM**.
  - **IMG.LY ISNet** via `@imgly/background-removal` (`1.7.0`) with local ONNX Runtime WASM routing and persistent Cache API storage for weights.
  - **Optional Cloud Processing (`not-lain/background-removal`)** via `@gradio/client` (`2.8.0`), strictly opt-in with explicit user privacy confirmation before any image leaves the device. Local engines never fall back to cloud services automatically.
- **Creative Multi-Layer Studio:**
  - Transparent, Solid Color, Mesh Gradient, Custom Background Photo, and DSLR Bokeh blur backgrounds.
  - Text Behind Subject & Foreground Typography with 6 bundled offline fonts (`Cairo`, `Tajawal`, `Readex Pro`, `Anton`, `Plus Jakarta Sans`, `Playfair Display`), rotation, stroke, shadow, opacity, and canvas dragging.
  - Sticker Outline Stroke & Studio Drop Shadow.
  - Interactive Magic Brush (Erase / Restore) with live resolution- & zoom-accurate cursor ring and unified 25-step Undo/Redo (`Ctrl+Z` / `Ctrl+Y`).
  - Independent Subject & Background color adjustments + E-Commerce / Social Aspect Ratio presets (`Original`, `1:1`, `16:9`, `9:16`, `3.5×4.5`).
  - Precision Zoom (`25%–500%`, wheel-to-cursor, pinch-to-zoom), direct free mouse drag pan (`bounds-clamped`), Before/After Split Curtain, and PNG/WebP/JPG export with resolution scaling (`100%`, `75%`, `50%`).
- **Bulk Batch Processor:**
  - Multi-file upload & Drag-and-Drop (up to 80 images), item selection, retry failed items, stop/cancel, global background/ratio/watermark/format/quality, collision-free ZIP export via JSZip, and 1-click "Edit in Studio".
- **Multilingual RTL & LTR UI:**
  - Full Arabic (`ar`, RTL), English (`en`, LTR), Portuguese (`pt`, LTR), and French (`fr`, LTR) interface.

---

## Running & Deploying the Static Site (Repository Root)

The project root itself (`index.html`, `assets/`, `manifest.webmanifest`, `coi-serviceworker.js`, `.nojekyll`) is a complete static web application with **no Node.js, npm, PHP, or backend required at runtime**:

### 1. Deploying Directly to GitHub Pages (Root Repository)
1. Push this repository to GitHub (`.gitignore` excludes `_dev/`, `*.bat`, `node_modules/`, and dev build artifacts automatically).
2. In your GitHub repository go to **Settings → Pages → Build and deployment → Source: `Deploy from a branch`** and select **`main` / `/ (root)`**.
3. All paths use relative `./` URLs so subpath hosting like `https://<username>.github.io/<repo-name>/` works out of the box, with `.nojekyll` and `coi-serviceworker.js` at root.

### 2. Local Full AI Mode (`_dev/START.bat` — WebGPU + Multi-Threaded WASM)
1. Double-click **`_dev/START.bat`** (ignored by Git via `.gitignore`).
   - Serves the project root cleanly over localhost (`127.0.0.1`) using built-in Windows PowerShell (no Administrator rights or Node.js required).
   - Sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` for instant `SharedArrayBuffer` multi-threaded WASM & WebGPU acceleration, while keeping `.git/` and `_dev/` private.
   - Automatically selects an available port (`8123–8199`) and opens your browser.
   - Press `Ctrl+C` or close the terminal window to stop the server.

### 3. Direct File Mode (`file://`)
- Double-click or drag-and-drop **`index.html`** from the project root directly into your browser.
- Works out of the box for the full Studio UI, local photo uploads, bundled sample photos, Manual Magic Brush, Text Behind Subject, DSLR Bokeh, Sticker Stroke, Drop Shadow, Color Adjustments, Aspect Presets, Zoom/Pan, Undo/Redo, Before/After Curtain, and PNG/WebP/JPG exports.
- Note: Modern browser security policies block local WebAssembly (`fetch('file://...')`) and Worker creation under `file://`. The app detects `file://` automatically, displays a clear notice, and allows editing any image manually or switching to `_dev/START.bat` / HTTPS hosting for local AI inference.

---

## Development & Rebuilding from `_dev/`

Requires Node.js (v20+ recommended) **only inside `_dev/` during development/build**:

```bash
cd _dev
npm install        # Install pinned dependencies
npm run dev        # Start local Vite dev server
npm test           # Run unit tests (src/utils/studioMath.test.ts)
npm run lint       # Run TypeScript type check (tsc --noEmit)
npm run build      # Build production _dev/dist/ and publish static output to project root
```

---

## Additional Documentation

- [CHANGELOG.md](./CHANGELOG.md) — Summary of technical fixes, refactoring, and rebranding.
- [TEST_REPORT.md](./TEST_REPORT.md) — Verified unit and browser automation test results.
- [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) — Libraries, fonts, and AI model license audit (including commercial notes).
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) — Browser constraints and technical caveats.
