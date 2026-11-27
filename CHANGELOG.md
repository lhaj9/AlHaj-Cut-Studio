# Changelog — NoorCut Studio → AlHaj Cut Studio

## [2.0.0] — Static Architecture, Rebranding & Technical Fixes

### Brand & Identity
- Rebranded across all UI, metadata, SEO tags, Open Graph, Twitter Cards, Schema.org JSON-LD, exports, and all 4 locales (`ar`, `en`, `pt`, `fr`) from **NoorCut Studio** to **AlHaj Cut Studio** (`AlHaj Cut` in `en`/`pt`/`fr`, and `AIHAJ Cut Studio` / `AIHAJ Cut` in English for the `ar` locale).
- Removed obsolete `noorcut.studio` domain and `hello@noorcut.studio` email without inventing placeholder domains/emails.
- Updated `BrandLogo.tsx` geometric vector mark and generated matching SVG/PNG favicons and PWA icons (`assets/icons/`) + `manifest.webmanifest`.
- Migrated locale persistence key to `alhaj_cut_studio_locale` with automatic non-destructive read migration from legacy `noorcut_studio_locale`.
- Temporarily disabled AdSense ad slots (`BRAND_CONFIG.ads.enabled = false`) while publisher & slot IDs are unconfigured.

### Static Web App Conversion & `file://` Compatibility
- Removed unused packages (`@google/genai`, `express`, `@types/express`, `dotenv`, `motion`, `autoprefixer`) and Google AI Studio remnants (`.env.example`, `bun.lock`).
- Replaced external runtime CDNs (`cdn.jsdelivr.net`, `esm.sh`, `fonts.googleapis.com`, `fonts.gstatic.com`, floating `@gradio/client/+esm`) with pinned local vendor IIFE bundles (`assets/vendor/`), local ONNX WASM assets (`assets/wasm/`), and bundled local WOFF2 fonts (`assets/fonts/`).
- Built `scripts/build-static.mjs` to output the self-contained `AlHaj-Cut-Studio-Static/` folder using a classic non-module IIFE `assets/js/app.js` script and relative `./` paths compatible with `file://`, `START.bat` localhost, and GitHub Pages subpaths.
- Added `AlHaj-Cut-Studio-Static/START.bat` (pure Windows PowerShell `TcpListener` localhost-only server with COOP/COEP headers and automatic port probing) and `.github/workflows/deploy-pages.yml` + `.nojekyll`.

### Sample Photos & Asset Optimization
- Optimized bundled sample photos (`sample-portrait.jpg`, `sample-product.jpg`, `sample-sneaker.jpg`) from ~2.39 MB combined down to ~555 KB total progressive JPEGs without reducing pixel dimensions.
- Removed the duplicate `copy-unbundled-src-assets` Vite plugin that previously duplicated `src/assets/` inside `dist/`.
- Added `assets/js/sample-inline.js` lazy data-URI fallback for `file://` and DOM `<img>` extraction fallback for offline mode so sample photos never taint `<canvas>` or fail with `fetch()` errors.

### AI Engine & Privacy Improvements (`src/services/aiBgEngine.ts`)
- Added `detectRuntimeCapabilities()` inspecting WebGPU (`navigator.gpu.requestAdapter()` + `shader-f16`), `crossOriginIsolated`, `SharedArrayBuffer`, online status, and `file://` mode.
- Added WebGPU acceleration priority (`webgpu` → multi-threaded WASM → single-threaded WASM) for both `rmbg-local` and `imgly-local`, with automatic fallback if a WebGPU driver/shader fails.
- Added local WASM routing (`wasm-resources.json`) and persistent Cache Storage (`alhaj-cut-imgly-models-v1`) for IMG.LY ISNet (`1.7.0`), alongside Transformers.js (`3.8.1`) Cache API reuse and tensor `.dispose()` cleanup.
- Added serialized inference queue, `AbortController` cancellation, Retry button, and "Open in Studio Manually (No AI)" mode (`createManualCutout`).
- Added explicit opt-in privacy confirmation dialog before uploading any photo to `notlain-cloud`, ensuring local engines never send photos to cloud servers automatically.

### Canvas Preview, Zoom/Pan, Tools & Bulk Studio
- Fixed `StudioCanvas.tsx` display sizing (`computeFittedDisplaySize` + `ResizeObserver` + DPR-aware preview buffer) to eliminate aspect ratio distortion and support small, large, portrait, landscape, and square photos cleanly.
- Implemented cursor-anchored mouse wheel zoom, touch pinch-to-zoom, and bounds-clamped free pan (direct left-click mouse drag on the image/stage, middle-click, or outer-stage drag without needing a Hand toggle), separate Fit/Reset controls, mobile-accessible zoom buttons, and automatic zoom/pan reset on new image load.
- Fixed `computeScreenBrushDiameter` so the Magic Brush preview ring aligns accurately under zoom, aspect presets, and subject scale changes.
- Added rotated text bounding-box hit-testing, text drag Undo/Redo checkpoints (`onCommitTextMove`), missing Text Opacity slider, and Export Resolution Scale (`100%`, `75%`, `50%`).
- Fixed `BeforeAfterCurtain.tsx` alignment (`imageFit="contain"` + matching aspect ratio so Before and After align 1:1).
- Reduced `canvasCompositor.ts` per-frame allocations via reusable offscreen scratch buffers, prevented drop-shadow alpha doubling via offscreen shadow projection, added bounded background image cache eviction, and decoupled filename edits from live export size re-calculation.
- Upgraded `BulkStudio.tsx` with RAM-safe compressed `maskBlob` storage (freeing 4K canvases between queue items), item selection checkboxes, Select All / Deselect All, Delete Selected, Retry Failed, `AbortController` Stop, Quality slider, collision-free ZIP naming (`getUniqueExportBaseName`), and persistent queue mounting across mode tabs.
