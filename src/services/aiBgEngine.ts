import type { AiEngineId, CutoutResult, EngineProgress } from '../types/studio';
import { resolveFallbackEngines } from '../utils/studioMath';

/**
 * Unbundled native runtime ESM CDN loader.
 * Prevents Vite / Rollup from bundling or minifying ONNX / WASM / WebGPU runtime internals.
 */
const importModule = new Function('url', 'return import(url)') as <T = any>(
  url: string
) => Promise<T>;

const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';
const TRANSFORMERS_WASM_PATHS =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/';
const IMGLY_CDN = 'https://esm.sh/@imgly/background-removal@1.5.5';
const IMGLY_PUBLIC_PATH =
  'https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist/';
const GRADIO_CDN = 'https://cdn.jsdelivr.net/npm/@gradio/client/+esm';

interface CachedRmbgSession {
  transformers: any;
  model: any;
  processor: any;
  modelId: string;
}

let cachedRmbgPromise: Promise<CachedRmbgSession> | null = null;
let cachedImglyModule: any | null = null;
let cachedGradioModule: any | null = null;

/**
 * Loads an image Blob, File, or URL into an HTMLCanvasElement at full resolution (capped safely at 4096px).
 */
export async function decodeSourceToCanvas(
  source: File | Blob | string
): Promise<{ canvas: HTMLCanvasElement; blob: Blob }> {
  let blob: Blob;
  if (typeof source === 'string') {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`);
    }
    blob = await response.blob();
  } else {
    blob = source;
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file.'));
      el.src = objectUrl;
    });

    const MAX_DIM = 4096;
    let targetW = img.naturalWidth || img.width;
    let targetH = img.naturalHeight || img.height;
    if (targetW > MAX_DIM || targetH > MAX_DIM) {
      const scale = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
      targetW = Math.round(targetW * scale);
      targetH = Math.round(targetH * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return { canvas, blob };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Extracts the alpha channel of an RGBA PNG/Blob into a dedicated white-with-alpha maskCanvas
 * aligned to the original image dimensions.
 */
async function extractMaskFromCutoutBlob(
  cutoutBlob: Blob,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  const { canvas: cutoutCanvas } = await decodeSourceToCanvas(cutoutBlob);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = targetWidth;
  maskCanvas.height = targetHeight;
  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Mask canvas unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cutoutCanvas, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = a;
  }
  ctx.putImageData(imgData, 0, 0);
  return maskCanvas;
}

/**
 * Loads and caches Transformers.js v3 + briaai/RMBG-1.4 (with clean fallback to q8 / Xenova/modnet).
 */
async function getRmbgSession(
  onProgress?: (p: EngineProgress) => void
): Promise<CachedRmbgSession> {
  if (cachedRmbgPromise) {
    return cachedRmbgPromise;
  }

  cachedRmbgPromise = (async () => {
    onProgress?.({ phase: 'loading-runtime', percent: 8 });
    const transformers = await importModule(TRANSFORMERS_CDN);
    const { env, AutoModel, AutoProcessor } = transformers;

    // Critical ONNX WASM configuration BEFORE model load
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.wasmPaths = TRANSFORMERS_WASM_PATHS;
      env.backends.onnx.wasm.numThreads =
        typeof window !== 'undefined' && window.crossOriginIsolated
          ? Math.min(navigator.hardwareConcurrency || 4, 8)
          : 1;
    }

    const fileTrackers = new Map<string, { loaded: number; total: number }>();

    const handleProgress = (info: any) => {
      if (!info) return;
      if (info.file && typeof info.loaded === 'number' && typeof info.total === 'number' && info.total > 0) {
        fileTrackers.set(info.file, { loaded: info.loaded, total: info.total });
        let loaded = 0;
        let total = 0;
        for (const item of fileTrackers.values()) {
          loaded += item.loaded;
          total += item.total;
        }
        const ratio = total > 0 ? Math.min(1, loaded / total) : 0;
        onProgress?.({
          phase: 'downloading-model',
          percent: Math.round(12 + ratio * 66),
          loadedMB: Number((loaded / (1024 * 1024)).toFixed(1)),
          totalMB: Number((total / (1024 * 1024)).toFixed(1)),
        });
      } else if (typeof info.progress === 'number') {
        onProgress?.({
          phase: 'downloading-model',
          percent: Math.round(12 + Math.min(100, info.progress) * 0.66),
        });
      }
    };

    // Safely determine device — default to 'wasm' for rock-solid compatibility across all browsers & shared hosts
    const attempts: { modelId: string; dtype?: string; config?: Record<string, any> }[] = [
      { modelId: 'briaai/RMBG-1.4', dtype: 'fp16', config: { model_type: 'custom' } },
      { modelId: 'briaai/RMBG-1.4', dtype: 'q8', config: { model_type: 'custom' } },
      { modelId: 'Xenova/modnet' },
    ];

    let lastErr: unknown = null;
    for (const attempt of attempts) {
      try {
        const modelOptions: Record<string, any> = {
          device: 'wasm',
          progress_callback: handleProgress,
        };
        if (attempt.dtype) {
          modelOptions.dtype = attempt.dtype;
        }
        if (attempt.config) {
          modelOptions.config = attempt.config;
        }

        const processorOptions: Record<string, any> = {
          progress_callback: handleProgress,
        };
        if (attempt.modelId === 'briaai/RMBG-1.4') {
          processorOptions.config = {
            do_normalize: true,
            do_pad: false,
            do_rescale: true,
            do_resize: true,
            image_mean: [0.5, 0.5, 0.5],
            feature_extractor_type: 'ImageFeatureExtractor',
            image_std: [1, 1, 1],
            resample: 2,
            rescale_factor: 0.00392156862745098,
            size: { width: 1024, height: 1024 },
          };
        }

        const [model, processor] = await Promise.all([
          AutoModel.from_pretrained(attempt.modelId, modelOptions),
          AutoProcessor.from_pretrained(attempt.modelId, processorOptions),
        ]);

        return { transformers, model, processor, modelId: attempt.modelId };
      } catch (err) {
        lastErr = err;
        fileTrackers.clear();
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error('Failed to load local RMBG/ModNet model');
  })();

  try {
    return await cachedRmbgPromise;
  } catch (err) {
    cachedRmbgPromise = null;
    throw err;
  }
}

/**
 * Engine 1: Local Browser AI — RMBG-1.4 / ModNet via Transformers.js v3
 */
async function runRmbgLocalEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  onProgress?: (p: EngineProgress) => void
): Promise<HTMLCanvasElement> {
  const { transformers, model, processor } = await getRmbgSession(onProgress);
  const { RawImage } = transformers;

  onProgress?.({ phase: 'inferring', percent: 82 });

  const objectUrl = URL.createObjectURL(blob);
  let rawImage: any;
  try {
    rawImage = await RawImage.fromURL(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const { pixel_values } = await processor(rawImage);
  const { output } = await model({ input: pixel_values });

  onProgress?.({ phase: 'refining', percent: 94 });

  // Extract the first mask tensor cleanly regardless of batch/channel nesting
  let maskTensor = output[0];
  if (maskTensor.dims && maskTensor.dims.length === 4) {
    maskTensor = maskTensor[0];
  }
  if (maskTensor.dims && maskTensor.dims.length === 3) {
    maskTensor = maskTensor[0];
  }

  const maskH = maskTensor.dims[maskTensor.dims.length - 2];
  const maskW = maskTensor.dims[maskTensor.dims.length - 1];
  const tensorData = maskTensor.data as Float32Array | Uint8Array;

  // Normalize values to 0..255 cleanly
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < tensorData.length; i++) {
    const v = tensorData[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }

  const smallMaskCanvas = document.createElement('canvas');
  smallMaskCanvas.width = maskW;
  smallMaskCanvas.height = maskH;
  const smallCtx = smallMaskCanvas.getContext('2d');
  if (!smallCtx) throw new Error('Mask 2D context unavailable');

  const smallImgData = smallCtx.createImageData(maskW, maskH);
  const out = smallImgData.data;
  const range = maxVal - minVal;
  const isAlreadyByte = maxVal > 1.5;

  for (let i = 0; i < maskW * maskH; i++) {
    const raw = tensorData[i];
    let alphaByte: number;
    if (isAlreadyByte) {
      alphaByte = Math.max(0, Math.min(255, Math.round(raw)));
    } else if (range > 0.0001) {
      const norm = (raw - minVal) / range;
      alphaByte = Math.max(0, Math.min(255, Math.round(norm * 255)));
    } else {
      alphaByte = Math.max(0, Math.min(255, Math.round(raw * 255)));
    }
    const idx = i * 4;
    out[idx] = 255;
    out[idx + 1] = 255;
    out[idx + 2] = 255;
    out[idx + 3] = alphaByte;
  }
  smallCtx.putImageData(smallImgData, 0, 0);

  // Smooth high-quality upscale to original resolution
  const fullMaskCanvas = document.createElement('canvas');
  fullMaskCanvas.width = originalCanvas.width;
  fullMaskCanvas.height = originalCanvas.height;
  const fullCtx = fullMaskCanvas.getContext('2d', { willReadFrequently: true });
  if (!fullCtx) throw new Error('Full mask 2D context unavailable');
  fullCtx.imageSmoothingEnabled = true;
  fullCtx.imageSmoothingQuality = 'high';
  fullCtx.drawImage(smallMaskCanvas, 0, 0, originalCanvas.width, originalCanvas.height);

  return fullMaskCanvas;
}

/**
 * Engine 2: Local Studio Matting — IMG.LY ISNet (100% On-Device)
 */
async function runImglyLocalEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  onProgress?: (p: EngineProgress) => void
): Promise<HTMLCanvasElement> {
  onProgress?.({ phase: 'loading-runtime', percent: 10 });
  if (!cachedImglyModule) {
    cachedImglyModule = await importModule(IMGLY_CDN);
  }

  const removeBackground =
    cachedImglyModule.removeBackground || cachedImglyModule.default;
  if (typeof removeBackground !== 'function') {
    throw new Error('IMG.LY removeBackground export unavailable');
  }

  const resultBlob: Blob = await removeBackground(blob, {
    publicPath: IMGLY_PUBLIC_PATH,
    device: 'cpu',
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      if (total > 0) {
        const ratio = Math.min(1, current / total);
        const isFetch = key.toLowerCase().includes('fetch') || key.toLowerCase().includes('download');
        onProgress?.({
          phase: isFetch ? 'downloading-model' : 'inferring',
          percent: isFetch ? Math.round(14 + ratio * 62) : Math.round(78 + ratio * 16),
          loadedMB: isFetch ? Number((current / (1024 * 1024)).toFixed(1)) : undefined,
          totalMB: isFetch ? Number((total / (1024 * 1024)).toFixed(1)) : undefined,
        });
      }
    },
  });

  onProgress?.({ phase: 'refining', percent: 95 });
  return extractMaskFromCutoutBlob(
    resultBlob,
    originalCanvas.width,
    originalCanvas.height
  );
}

/**
 * Engine 3: not-lain Cloud Ultra AI (Free Hugging Face ZeroGPU Space)
 * Wrapped in a strict 25-second timeout so busy/rate-limited states fail fast into Engine 1.
 */
async function runNotLainCloudEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  onProgress?: (p: EngineProgress) => void
): Promise<HTMLCanvasElement> {
  const TIMEOUT_MS = 25000;
  let timerId: number | undefined;

  const task = (async () => {
    onProgress?.({ phase: 'loading-runtime', percent: 15 });
    if (!cachedGradioModule) {
      cachedGradioModule = await importModule(GRADIO_CDN);
    }

    const Client = cachedGradioModule.Client || cachedGradioModule.default?.Client;
    if (!Client) {
      throw new Error('Gradio Client export unavailable');
    }

    onProgress?.({ phase: 'inferring', percent: 45 });
    const client = await Client.connect('not-lain/background-removal');

    let prediction: any;
    try {
      prediction = await client.predict('/png', { f: blob });
    } catch {
      prediction = await client.predict('/image', { image: blob });
    }

    onProgress?.({ phase: 'refining', percent: 85 });

    // Locate resulting image URL across Gradio 4/5 response shapes
    const dataArr = Array.isArray(prediction?.data) ? prediction.data : [];
    let outputUrl: string | null = null;
    for (const item of dataArr) {
      if (!item) continue;
      if (typeof item === 'string' && item.startsWith('http')) {
        outputUrl = item;
        break;
      }
      if (typeof item?.url === 'string') {
        outputUrl = item.url;
        break;
      }
      if (Array.isArray(item)) {
        for (const sub of item) {
          if (typeof sub?.url === 'string') {
            outputUrl = sub.url;
          }
        }
      }
    }

    if (!outputUrl) {
      throw new Error('ZeroGPU space returned no output image URL');
    }

    const res = await fetch(outputUrl);
    if (!res.ok) {
      throw new Error(`Could not fetch cloud cutout (${res.status})`);
    }
    const cutoutBlob = await res.blob();
    return extractMaskFromCutoutBlob(
      cutoutBlob,
      originalCanvas.width,
      originalCanvas.height
    );
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => {
      reject(new Error('Cloud ZeroGPU timeout (25s)'));
    }, TIMEOUT_MS);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  }
}

/**
 * Runs Triple-Engine AI background removal with automatic seamless fallback.
 * Never substitutes color-threshold hacks — executes genuine neural alpha matting.
 */
export async function removeBackgroundWithAI(
  source: File | Blob | string,
  preferredEngine: AiEngineId,
  onProgress?: (p: EngineProgress) => void
): Promise<CutoutResult> {
  const startTime = performance.now();
  const { canvas: originalCanvas, blob } = await decodeSourceToCanvas(source);
  const engineChain = resolveFallbackEngines(preferredEngine);

  let lastError: unknown = null;
  let fallbackFrom: AiEngineId | undefined;
  let fallbackReason: string | undefined;

  for (let i = 0; i < engineChain.length; i++) {
    const engineId = engineChain[i];
    try {
      if (i > 0) {
        onProgress?.({
          phase: 'fallback',
          percent: 15,
          message: fallbackReason,
        });
      }

      let maskCanvas: HTMLCanvasElement;
      if (engineId === 'rmbg-local') {
        maskCanvas = await runRmbgLocalEngine(originalCanvas, blob, onProgress);
      } else if (engineId === 'imgly-local') {
        maskCanvas = await runImglyLocalEngine(originalCanvas, blob, onProgress);
      } else {
        maskCanvas = await runNotLainCloudEngine(originalCanvas, blob, onProgress);
      }

      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!maskCtx) throw new Error('Mask context unreadable');
      const initialMaskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

      onProgress?.({ phase: 'refining', percent: 100 });

      return {
        originalCanvas,
        maskCanvas,
        initialMaskData,
        width: originalCanvas.width,
        height: originalCanvas.height,
        engineUsed: engineId,
        fallbackFrom,
        fallbackReason,
        durationMs: Math.round(performance.now() - startTime),
      };
    } catch (err) {
      lastError = err;
      if (!fallbackFrom) {
        fallbackFrom = engineId;
        fallbackReason = err instanceof Error ? err.message : 'Engine unavailable';
      }
      // Continue automatically to next resilient engine in chain
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All AI background removal engines failed to initialize.');
}
