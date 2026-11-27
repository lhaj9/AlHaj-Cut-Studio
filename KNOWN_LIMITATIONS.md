# Known Limitations & Technical Notes — AlHaj Cut Studio

1. **Direct `file://` Protocol Browser Restrictions:**
   - Modern browsers (Chrome, Edge, Firefox) enforce strict `origin: null` security rules under `file://` that block `fetch()` against local `.wasm` binaries, ES module imports, Service Workers, and `new Worker()` scripts.
   - As a result, when double-clicking `index.html` directly over `file://`, all UI, sample photos, Manual Studio editing, Magic Brush, Text Behind Subject, DSLR Bokeh, Effects, Resize, Zoom/Pan, and PNG/WebP/JPG/ZIP exports work locally, while local WebGPU/WASM AI engines are intentionally blocked by browser security.
   - **Solution:** Launch `AlHaj-Cut-Studio-Static/START.bat` (Windows PowerShell static server on `127.0.0.1`, no Node.js required) or host on HTTPS (e.g. GitHub Pages) to unlock full local AI engines.

2. **First-Time Internet Connection for AI Model Weights:**
   - To keep the static distribution compact and avoid multi-hundred-megabyte bloat on initial page load, neural model weights (`briaai/RMBG-1.4` / `Xenova/modnet` from Hugging Face, `isnet_fp16` ~84.1 MB from `staticimgly.com`) are downloaded on demand on first use and cached persistently via browser Cache Storage.
   - Completely offline usage of an AI engine requires having run that engine at least once while online so its weights are stored in browser cache. Images can still be opened and edited anytime in **Manual Studio Mode** without internet.

3. **Optional Cloud Engine (`notlain-cloud`):**
   - Selecting `notlain-cloud` sends the image to the public Hugging Face ZeroGPU Space (`not-lain/background-removal`) after explicit user confirmation.
   - Availability depends on Hugging Face ZeroGPU queue limits and internet connectivity; a 25-second timeout triggers automatic fallback to local AI engines.

4. **Multi-Threaded WASM (`SharedArrayBuffer`) Requirements:**
   - Multi-threaded WASM requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` (`window.crossOriginIsolated === true`).
   - `START.bat` sends these headers directly. On static hosts without custom HTTP headers (such as GitHub Pages), `coi-serviceworker.js` registers on first load so subsequent visits/reloads gain `crossOriginIsolated`; on the very first visit before the service worker activates, the app automatically falls back to single-threaded WASM (`WASM Single-Thread`) or `WebGPU` without failing.

5. **WebGPU Availability & Driver Variability:**
   - WebGPU acceleration depends on browser support (Chrome/Edge desktop with compatible GPU drivers) and is automatically probed via `navigator.gpu.requestAdapter()`. If a driver or shader rejects WebGPU inference at runtime, the engine falls back automatically to WASM.

6. **Browser Canvas Filter & Large Batch RAM Limits:**
   - Subject/background brightness, contrast, saturation, warmth, and DSLR bokeh use HTML5 Canvas `ctx.filter`.
   - Bulk Batch Mode stores compressed lossless PNG masks (`maskBlob`) and frees full-resolution canvases between items, capped at 80 images per queue (`MAX_BATCH_FILES = 80`) and 4096px max edge resolution (`MAX_DIM = 4096`) to keep browser memory stable.

7. **Commercial Licensing Considerations:**
   - `briaai/RMBG-1.4` and `@imgly/background-removal` carry non-commercial / AGPL-3.0 restrictions respectively. See [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) before commercial deployment.
