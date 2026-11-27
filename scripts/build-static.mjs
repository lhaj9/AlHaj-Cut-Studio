import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { build as esbuild } from 'esbuild';

// Windows AppContainer sandbox blocks GetFinalPathNameByHandleW in fs.realpathSync.native;
// fall back cleanly to JS realpathSync when native throws EPERM.
const origRealpathNative = fs.realpathSync.native;
fs.realpathSync.native = function safeRealpathNative(p, options) {
  try {
    return origRealpathNative.call(fs.realpathSync, p, options);
  } catch (err) {
    if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
      return fs.realpathSync(p, options);
    }
    throw err;
  }
};
const origAsyncRealpathNative = fs.realpath.native;
if (origAsyncRealpathNative) {
  fs.realpath.native = function safeAsyncRealpathNative(p, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    origAsyncRealpathNative.call(fs.realpath, p, options, (err, res) => {
      if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
        fs.realpath(p, options, cb);
      } else {
        cb(err, res);
      }
    });
  };
}

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');
const staticDir = path.join(rootDir, 'AlHaj-Cut-Studio-Static');

function ensureCleanDir(dir) {
  if (fs.existsSync(dir)) {
    for (const entry of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFileChecked(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

async function buildVendorBundles(outVendorDir) {
  fs.mkdirSync(outVendorDir, { recursive: true });

  const metaBanner = {
    js: 'var __ALHAJ_META_URL__=(typeof document!=="undefined"&&document.currentScript&&document.currentScript.src)||location.href;',
  };
  const importMetaDefine = {
    'import.meta.url': '__ALHAJ_META_URL__',
  };

  console.log('Bundling local vendor runtime: transformers-runtime.js ...');
  await esbuild({
    entryPoints: [
      path.join(
        rootDir,
        'node_modules/@huggingface/transformers/dist/transformers.min.js'
      ),
    ],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: '__ALHAJ_TRANSFORMERS__',
    platform: 'browser',
    target: ['es2022'],
    banner: metaBanner,
    define: importMetaDefine,
    outfile: path.join(outVendorDir, 'transformers-runtime.js'),
  });

  console.log('Bundling local vendor runtime: imgly-runtime.js ...');
  await esbuild({
    stdin: {
      contents: `
        import * as ort from 'onnxruntime-web';
        import * as ortGpu from 'onnxruntime-web/webgpu';
        import { removeBackground, preload, segmentForeground, applySegmentationMask } from '@imgly/background-removal';
        export { removeBackground, preload, segmentForeground, applySegmentationMask, ort, ortGpu };
        export default removeBackground;
      `,
      resolveDir: rootDir,
      loader: 'js',
    },
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: '__ALHAJ_IMGLY__',
    platform: 'browser',
    target: ['es2022'],
    banner: metaBanner,
    define: importMetaDefine,
    outfile: path.join(outVendorDir, 'imgly-runtime.js'),
  });

  console.log('Bundling local vendor runtime: gradio-runtime.js ...');
  await esbuild({
    entryPoints: [
      path.join(rootDir, 'node_modules/@gradio/client/dist/browser.js'),
    ],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: '__ALHAJ_GRADIO__',
    platform: 'browser',
    target: ['es2022'],
    banner: metaBanner,
    define: importMetaDefine,
    outfile: path.join(outVendorDir, 'gradio-runtime.js'),
  });
}

function copyLocalWasmAssets(outWasmDir) {
  const tfDist = path.join(rootDir, 'node_modules/@huggingface/transformers/dist');
  const tfWasmDir = path.join(outWasmDir, 'transformers');
  for (const file of [
    'ort-wasm-simd-threaded.jsep.mjs',
    'ort-wasm-simd-threaded.jsep.wasm',
  ]) {
    copyFileChecked(path.join(tfDist, file), path.join(tfWasmDir, file));
  }

  const ortDist = path.join(rootDir, 'node_modules/onnxruntime-web/dist');
  const imglyWasmDir = path.join(outWasmDir, 'imgly');
  const imglyFiles = [
    {
      key: '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
      name: 'ort-wasm-simd-threaded.wasm',
      mime: 'application/wasm',
    },
    {
      key: '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
      name: 'ort-wasm-simd-threaded.mjs',
      mime: 'text/javascript',
    },
    {
      key: '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
      name: 'ort-wasm-simd-threaded.jsep.wasm',
      mime: 'application/wasm',
    },
    {
      key: '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
      name: 'ort-wasm-simd-threaded.jsep.mjs',
      mime: 'text/javascript',
    },
  ];

  const manifest = {};
  for (const item of imglyFiles) {
    const src = path.join(ortDist, item.name);
    const dst = path.join(imglyWasmDir, item.name);
    copyFileChecked(src, dst);
    const size = fs.statSync(dst).size;
    manifest[item.key] = {
      mime: item.mime,
      size,
      chunks: [{ name: item.name, offsets: [0, size] }],
    };
  }

  fs.writeFileSync(
    path.join(imglyWasmDir, 'wasm-resources.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

function buildSampleInlineFallback(outJsDir) {
  const imagesDir = path.join(rootDir, 'src/assets/images');
  const sampleFiles = ['sample-portrait.jpg', 'sample-product.jpg', 'sample-sneaker.jpg'];
  const map = {};
  for (const name of sampleFiles) {
    const buf = fs.readFileSync(path.join(imagesDir, name));
    map[name] = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }
  const content = `window.__ALHAJ_SAMPLES__ = ${JSON.stringify(map)};\n`;
  fs.mkdirSync(outJsDir, { recursive: true });
  fs.writeFileSync(path.join(outJsDir, 'sample-inline.js'), content, 'utf8');
}

function patchHtmlForStaticAndFileProtocol(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /<script\b([^>]*)\btype="module"([^>]*)><\/script>/gi,
    (_m, before, after) => {
      const attrs = `${before} ${after}`
        .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `<script defer ${attrs}></script>`;
    }
  );
  html = html.replace(
    /<link\b([^>]*rel="stylesheet"[^>]*)>/gi,
    (_m, inner) => {
      const attrs = inner
        .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `<link ${attrs}>`;
    }
  );
  fs.writeFileSync(htmlPath, html, 'utf8');
}

function writeStaticLauncherAndDocs(targetDir) {
  const startBatPath = path.join(rootDir, 'scripts', 'START.bat');
  copyFileChecked(startBatPath, path.join(targetDir, 'START.bat'));

  const staticReadme = `# AlHaj Cut Studio (AIHAJ Cut Studio) — Static Edition

Zero-Node, zero-backend static web application ready for local execution or static hosting (GitHub Pages, Netlify, Cloudflare Pages, Apache, Nginx).

## Ways to Run

1. **Full Local Mode (Recommended — enables WebGPU, Multi-Threaded WASM & all AI engines):**
   - Double-click \`START.bat\` (uses built-in Windows PowerShell; no Node.js or admin rights required).
   - Opens automatically at \`http://127.0.0.1:<port>/\` with Cross-Origin Isolation enabled.
   - Press \`Ctrl + C\` or close the terminal window to stop the server.

2. **Direct File Mode (\`file://\`):**
   - Double-click \`index.html\` directly.
   - Works out of the box for the Studio UI, local photo uploads, sample photos, Magic Brush, Text Behind Subject, DSLR Bokeh, Sticker Stroke, Drop Shadows, Adjustments, Aspect Presets, Zoom/Pan, and PNG/WebP/JPG/ZIP exports.
   - Note: Browser security blocks local WebAssembly/Worker fetches over \`file://\`; use \`START.bat\` or HTTPS hosting for local AI background removal engines.

3. **GitHub Pages / Static Hosting:**
   - Upload the entire contents of \`AlHaj-Cut-Studio-Static/\` to your repository or \`gh-pages\` branch.
   - All asset links are relative (\`./\`), \`.nojekyll\` is included, and \`coi-serviceworker.js\` enables multi-threaded WASM over HTTPS subpaths.
`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), staticReadme, 'utf8');
}

async function main() {
  ensureCleanDir(distDir);
  console.log('Building React + TypeScript + Tailwind static bundle with Vite...');
  const { build: viteBuild } = await import('vite');
  const configMod = await import(
    pathToFileURL(path.join(rootDir, 'vite.config.ts')).href
  );
  const resolvedConfig =
    typeof configMod.default === 'function'
      ? configMod.default({ mode: 'production', command: 'build' })
      : configMod.default;
  await viteBuild({ ...resolvedConfig, configFile: false, root: rootDir });

  // Remove .htaccess from dist/static if copied from public (not used on GitHub Pages)
  const distHtaccess = path.join(distDir, '.htaccess');
  if (fs.existsSync(distHtaccess)) fs.rmSync(distHtaccess, { force: true });

  // Keep modern woff2 fonts and strip unused legacy .woff references from CSS
  const distCssPath = path.join(distDir, 'assets', 'css', 'app.css');
  const distFontsDir = path.join(distDir, 'assets', 'fonts');
  if (fs.existsSync(distFontsDir) && fs.existsSync(distCssPath)) {
    let css = fs.readFileSync(distCssPath, 'utf8');
    css = css.replace(/,\s*url\([^)]+\.woff\)\s*format\(["']woff["']\)/g, '');
    fs.writeFileSync(distCssPath, css, 'utf8');
    for (const f of fs.readdirSync(distFontsDir)) {
      if (f.endsWith('.woff') && fs.existsSync(path.join(distFontsDir, f + '2'))) {
        fs.rmSync(path.join(distFontsDir, f), { force: true });
      }
    }
  }

  await buildVendorBundles(path.join(distDir, 'assets', 'vendor'));
  copyLocalWasmAssets(path.join(distDir, 'assets', 'wasm'));
  buildSampleInlineFallback(path.join(distDir, 'assets', 'js'));
  patchHtmlForStaticAndFileProtocol(path.join(distDir, 'index.html'));

  ensureCleanDir(staticDir);
  fs.cpSync(distDir, staticDir, { recursive: true, force: true });
  writeStaticLauncherAndDocs(staticDir);

  console.log(`Static bundle ready at: ${staticDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
