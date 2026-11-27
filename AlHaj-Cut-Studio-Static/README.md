# AlHaj Cut Studio (AIHAJ Cut Studio) — Static Edition

Zero-Node, zero-backend static web application ready for local execution or static hosting (GitHub Pages, Netlify, Cloudflare Pages, Apache, Nginx).

## Ways to Run

1. **Full Local Mode (Recommended — enables WebGPU, Multi-Threaded WASM & all AI engines):**
   - Double-click `START.bat` (uses built-in Windows PowerShell; no Node.js or admin rights required).
   - Opens automatically at `http://127.0.0.1:<port>/` with Cross-Origin Isolation enabled.
   - Press `Ctrl + C` or close the terminal window to stop the server.

2. **Direct File Mode (`file://`):**
   - Double-click `index.html` directly.
   - Works out of the box for the Studio UI, local photo uploads, sample photos, Magic Brush, Text Behind Subject, DSLR Bokeh, Sticker Stroke, Drop Shadows, Adjustments, Aspect Presets, Zoom/Pan, and PNG/WebP/JPG/ZIP exports.
   - Note: Browser security blocks local WebAssembly/Worker fetches over `file://`; use `START.bat` or HTTPS hosting for local AI background removal engines.

3. **GitHub Pages / Static Hosting:**
   - Upload the entire contents of `AlHaj-Cut-Studio-Static/` to your repository or `gh-pages` branch.
   - All asset links are relative (`./`), `.nojekyll` is included, and `coi-serviceworker.js` enables multi-threaded WASM over HTTPS subpaths.
