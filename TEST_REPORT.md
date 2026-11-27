# Test Report — AlHaj Cut Studio

All automated unit tests, TypeScript checks, and browser E2E suites listed below were executed directly against the final source and `AlHaj-Cut-Studio-Static/` build in this session.

---

## 1. Unit & Static Checks

| Check | Command | Scope | Result |
|---|---|---|---|
| Unit Tests | `npm test` (`node --experimental-strip-types --test src/utils/studioMath.test.ts`) | Aspect presets, export scale, subject/cover rects, fitted display sizing, pan clamping, cursor-anchored zoom, screen/canvas/mask coordinate mapping, brush diameter math, CSS filters, file size formatting, filename sanitization, collision-free batch naming, fallback privacy rules, undo/redo history stack | **PASS (10/10)** |
| TypeScript Check | `npm run lint` (`tsc --noEmit`) | Full `src/` strict compilation | **PASS (0 errors)** |
| Static Bundle Build | `npm run build` (`node scripts/build-static.mjs`) | Vite IIFE app bundle, local font bundling, esbuild vendor runtimes, local WASM copy, `sample-inline.js`, HTML patching, `AlHaj-Cut-Studio-Static/` generation | **PASS** |

---

## 2. Browser Automation (`e2e_static_suite.py` & `ai_e2e_suite.py`)

### Browsers Tested
- **Playwright Chromium** (`chromium-1208`) — Headless desktop (`1440×900`) & mobile (`390×844`)
- **Google Chrome** (`C:\Program Files\Google\Chrome\Application\chrome.exe`) — Headless desktop & mobile (`WebGPU Ready` detected)
- **Microsoft Edge** (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) — Headless desktop & mobile (`WebGPU Ready` detected; run outside Windows AppContainer sandbox because Edge's Crashpad named pipe exits under AppContainer restrictions)
- **Mozilla Firefox** — **Not tested** (not installed on this Windows machine)

### Detailed Verification Results

| Scenario | Browsers | Observed Outcome |
|---|---|---|
| `START.bat` script & PowerShell `TcpListener` probe | Windows PowerShell | **PASS** — Binds strictly to `127.0.0.1`, sets `Cross-Origin-Opener-Policy: same-origin` & `Cross-Origin-Embedder-Policy: credentialless`, serves `application/wasm` MIME type |
| `file://` direct opening (`AlHaj-Cut-Studio-Static/index.html`) | Chromium, Chrome, Edge | **PASS** — Zero console/page errors, `file://` notice displayed, Arabic RTL (`dir="rtl"`) active, all 3 sample thumbnails and Hero Before/After showcase (`sample-portrait.jpg` / `sample-portrait2.png`, `1200×896`) load cleanly |
| 4-Language switching (`ar`, `en`, `pt`, `fr`) | Chromium, Chrome, Edge | **PASS** — `dir="rtl"` for `ar`, `dir="ltr"` for `en`/`pt`/`fr`, document title updates to `AlHaj Cut Studio` / `AIHAJ Cut Studio`, zero `NoorCut` or `الحاج` strings |
| Sample photo click -> Studio Canvas (`file://`) | Chromium, Chrome, Edge | **PASS** — Opens in Manual Studio without canvas tainting, canvas renders at exact `729×544` (`1200:896`) ratio, and immediate direct mouse-drag pans image cleanly |
| Editing Tools (`file://`): Solid/Bokeh BG, Text Behind Subject, Sticker Stroke, Drop Shadow, Magic Brush, Undo/Redo, 1:1 Resize, Compare Curtain, Wheel Zoom, Direct Mouse Pan, Zoom Fit | Chromium, Chrome, Edge | **PASS** — Hand toggle button verified removed (`count === 0`), Undo/Redo active, `1:1` resize verified, Compare curtain toggle & pixel restoration (`w >= 1000, h >= 1000, alpha > 200`) verified, wheel zoom & direct free mouse-drag pan verified (`init_drag=True`, `pan_moved=True`) |
| PNG / JPG / WebP Export (`file://`) at `50%` scale | Chromium, Chrome, Edge | **PASS** — Exported PNG verified at exact `540×540` pixels; JPG (`FFD8FF`) and WebP (`RIFF...WEBP`) magic bytes verified |
| Bulk Studio Sample Load (`file://`) | Chromium, Chrome, Edge | **PASS** — 3 sample cards queued cleanly, zero console/page errors |
| GitHub Pages Subpath Simulation (`/alhaj-cut-studio/`) on Mobile (`390×844`) | Chromium, Chrome, Edge | **PASS** — `window.crossOriginIsolated === true`, zero HTTP 404s, zero horizontal overflow, mobile zoom controls visible, local PNG upload works |
| Non-COI Single-Thread capability badge & Offline Manual fallback | Chromium, Chrome, Edge | **PASS** — Reports `WASM Single-Thread` (Chromium without GPU) / `WebGPU Ready` (Chrome/Edge), switches to `Offline Mode`, and opens photo in Manual Studio cleanly |
| Real AI Engine 1 (`rmbg-local`) Portrait cutout + Compare restore | Google Chrome | **PASS** — Inference completed in `18.91s`, output `1200×896` verified (`tl=0`, `tr=0`, `center=255`) before and immediately after toggling Compare ON/OFF, zero external CDN JS/font requests |
| Real AI Engine 1 Cached Model Reuse (Sneaker) | Google Chrome | **PASS** — Completed in `0.36s` without re-downloading weights (`tl=0`, `tr=0`, `center=255`) |
| Offline AI Inference from Cached Weights (Product) | Google Chrome | **PASS** — Completed offline (`set_offline(True)`) using cached model (`1024×1024`, `tl=0`, `tr=0`, `center=255`) |
| Real AI Engine 2 (`imgly-local` ISNet) | Google Chrome | **PASS** — Loaded 2 local WASM assets from `127.0.0.1/assets/wasm/imgly/` (`remote_wasm=[]`), produced real cutout (`1024×1024`, `tl=0`, `tr=0`, `center=255`) |
| Bulk AI Processing (5 images + duplicate names) & ZIP Export | Google Chrome | **PASS** — Processed 5/5 items, downloaded `alhaj-cut-batch-5-images.zip` containing 5 unique cutout PNGs (`dup-cutout.png`, `dup-2-cutout.png`, plus 3 samples), opened item in Single Studio |
| Cloud Privacy Consent Guard (`notlain-cloud`) | Google Chrome | **PASS** — Displayed confirmation `alertdialog` before upload; clicking Cancel reverted engine to `rmbg-local` with zero external requests |
| Slow Network (`180 KB/s`, `200ms` latency) & Cancel Abort | Google Chrome | **PASS** — Progress indicator rendered cleanly; Cancel aborted processing cleanly with Retry & Manual Studio options |

---

## 3. Not Run / Out-of-Scope Remote Checks
- **Remote Hugging Face ZeroGPU live prediction (`notlain-cloud`)**: Not executed against the remote Hugging Face Space (only its privacy consent guard and local `@gradio/client` runtime bundling were verified) to avoid external rate limits and sending test images to third-party servers.
- **Mozilla Firefox**: Not installed in this test environment.
