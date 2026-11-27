import type {
  AiEngineId,
  AiExecutionBackend,
  CutoutResult,
  EngineProgress,
  RuntimeCapabilities,
} from '../types/studio';
import { resolveFallbackEngines } from '../utils/studioMath';

const IMGLY_DATA_PUBLIC_PATH =
  'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
const IMGLY_CACHE_NAME = 'alhaj-cut-imgly-models-v1';

interface CachedRmbgSession {
  transformers: any;
  model: any;
  processor: any;
  modelId: string;
  backend: AiExecutionBackend;
}

let cachedRmbgPromise: Promise<CachedRmbgSession> | null = null;
let cachedRmbgBackendKey: string | null = null;
let cachedCapabilities: RuntimeCapabilities | null = null;
let activeInferenceQueue: Promise<unknown> = Promise.resolve();

function createAbortError(): Error {
  const err = new Error('Operation canceled');
  err.name = 'AbortError';
  return err;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function raceWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(createAbortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(createAbortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (val) => {
        signal.removeEventListener('abort', onAbort);
        resolve(val);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

function serializeQueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = activeInferenceQueue.then(fn, fn);
  activeInferenceQueue = next.catch(() => {});
  return next;
}

/**
 * Detects real hardware & browser runtime capabilities (WebGPU, Cross-Origin Isolation,
 * SharedArrayBuffer threads, file:// vs HTTP/HTTPS protocol, online status).
 */
export async function detectRuntimeCapabilities(
  forceRefresh = false
): Promise<RuntimeCapabilities> {
  if (cachedCapabilities && !forceRefresh) {
    return {
      ...cachedCapabilities,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }

  const rawProto =
    typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const protocol: 'http' | 'https' | 'file' =
    rawProto === 'file:' ? 'file' : rawProto === 'http:' ? 'http' : 'https';
  const isFileProtocol = protocol === 'file';
  const isSecureContext =
    typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
  const crossOriginIsolated =
    typeof window !== 'undefined' ? Boolean(window.crossOriginIsolated) : false;
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

  let hasWebGPU = false;
  let webgpuFp16 = false;
  let webgpuAdapterName: string | undefined;

  if (
    !isFileProtocol &&
    typeof navigator !== 'undefined' &&
    'gpu' in navigator &&
    (navigator as any).gpu
  ) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        hasWebGPU = true;
        webgpuFp16 = Boolean(adapter.features?.has?.('shader-f16'));
        const info = adapter.info;
        if (info) {
          webgpuAdapterName =
            [info.vendor, info.architecture, info.description]
              .filter(Boolean)
              .join(' ') || undefined;
        }
      }
    } catch {
      hasWebGPU = false;
    }
  }

  const hwThreads =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const recommendedThreads =
    crossOriginIsolated && hasSharedArrayBuffer
      ? Math.max(1, Math.min(hwThreads, 8))
      : 1;

  cachedCapabilities = {
    protocol,
    isFileProtocol,
    isSecureContext,
    crossOriginIsolated,
    hasWebGPU,
    webgpuAdapterName,
    webgpuFp16,
    hasSharedArrayBuffer,
    recommendedThreads,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    localAiSupported: !isFileProtocol,
  };

  return cachedCapabilities;
}

/**
 * Loads a classic non-module vendor bundle via <script> tag and resolves its global namespace.
 * Eliminates external CDN JS dependencies while remaining subpath-safe.
 */
const loadedScriptPromises = new Map<string, Promise<void>>();

function loadClassicScript(relativePath: string): Promise<void> {
  const url = new URL(relativePath, window.location.href).href;
  const existing = loadedScriptPromises.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadedScriptPromises.delete(url);
      reject(new Error(`Could not load local runtime script: ${relativePath}`));
    };
    document.head.appendChild(script);
  });

  loadedScriptPromises.set(url, promise);
  return promise;
}

async function loadTransformersRuntime(): Promise<any> {
  const g = window as any;
  if (g.__ALHAJ_TRANSFORMERS__) return g.__ALHAJ_TRANSFORMERS__;
  try {
    await loadClassicScript('./assets/vendor/transformers-runtime.js');
    if (g.__ALHAJ_TRANSFORMERS__) return g.__ALHAJ_TRANSFORMERS__;
  } catch (err) {
    if ((import.meta as any).env?.DEV) {
      return await import('@huggingface/transformers');
    }
    throw err;
  }
  throw new Error('Transformers runtime unavailable');
}

async function loadImglyRuntime(): Promise<any> {
  const g = window as any;
  if (g.__ALHAJ_IMGLY__) return g.__ALHAJ_IMGLY__;
  try {
    await loadClassicScript('./assets/vendor/imgly-runtime.js');
    if (g.__ALHAJ_IMGLY__) return g.__ALHAJ_IMGLY__;
  } catch (err) {
    if ((import.meta as any).env?.DEV) {
      return await import('@imgly/background-removal');
    }
    throw err;
  }
  throw new Error('IMG.LY runtime unavailable');
}

async function loadGradioRuntime(): Promise<any> {
  const g = window as any;
  if (g.__ALHAJ_GRADIO__) return g.__ALHAJ_GRADIO__;
  try {
    await loadClassicScript('./assets/vendor/gradio-runtime.js');
    if (g.__ALHAJ_GRADIO__) return g.__ALHAJ_GRADIO__;
  } catch (err) {
    if ((import.meta as any).env?.DEV) {
      return await import('@gradio/client');
    }
    throw err;
  }
  throw new Error('Gradio client runtime unavailable');
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('Invalid data URI');
  }
  const header = dataUrl.slice(0, commaIdx);
  const body = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

const resolvedUrlBlobCache = new Map<string, Blob>();

/**
 * Resolves a sample or inline image URL safely across HTTP(S), file://, and offline modes.
 */
export async function resolveImageSourceToBlob(
  source: File | Blob | string
): Promise<Blob> {
  if (typeof source !== 'string') {
    return source;
  }
  if (source.startsWith('data:')) {
    return dataUrlToBlob(source);
  }
  const cachedBlob = resolvedUrlBlobCache.get(source);
  if (cachedBlob) {
    return cachedBlob;
  }

  const tryInlineSampleFallback = async (): Promise<Blob | null> => {
    if (typeof window === 'undefined') return null;
    const g = window as any;
    if (!g.__ALHAJ_SAMPLES__) {
      try {
        await loadClassicScript('./assets/js/sample-inline.js');
      } catch {
        // Ignore if missing
      }
    }
    const samples: Record<string, string> | undefined = g.__ALHAJ_SAMPLES__;
    if (samples) {
      for (const [key, dataUri] of Object.entries(samples)) {
        if (source.includes(key) && typeof dataUri === 'string') {
          return dataUrlToBlob(dataUri);
        }
      }
    }
    return null;
  };

  // Under file://, fetch('./assets/...') is blocked by Chromium/Edge CORS on origin 'null'.
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const inlineBlob = await tryInlineSampleFallback();
    if (inlineBlob) return inlineBlob;
  }

  const tryLoadedDomImageFallback = async (): Promise<Blob | null> => {
    if (typeof document === 'undefined' || window.location.protocol === 'file:') {
      return null;
    }
    const imgs = Array.from(document.images);
    const match = imgs.find(
      (img) =>
        img.complete &&
        img.naturalWidth > 0 &&
        (img.src === source || img.getAttribute('src') === source || img.src.endsWith(source.replace(/^\.\//, '')))
    );
    if (!match) return null;
    try {
      const c = document.createElement('canvas');
      c.width = match.naturalWidth;
      c.height = match.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(match, 0, 0);
      return await new Promise<Blob | null>((resolve) =>
        c.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
      );
    } catch {
      return null;
    }
  };

  // When offline over HTTP(S), try extracting from already-rendered DOM <img> first to avoid failed network logs
  if (
    typeof window !== 'undefined' &&
    window.location.protocol !== 'file:' &&
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    const domBlob = await tryLoadedDomImageFallback();
    if (domBlob) {
      resolvedUrlBlobCache.set(source, domBlob);
      return domBlob;
    }
  }

  try {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to load image (${response.status})`);
    }
    const fetchedBlob = await response.blob();
    resolvedUrlBlobCache.set(source, fetchedBlob);
    return fetchedBlob;
  } catch (err) {
    const inlineBlob = await tryInlineSampleFallback();
    if (inlineBlob) {
      resolvedUrlBlobCache.set(source, inlineBlob);
      return inlineBlob;
    }
    const domBlob = await tryLoadedDomImageFallback();
    if (domBlob) {
      resolvedUrlBlobCache.set(source, domBlob);
      return domBlob;
    }
    throw err;
  }
}

/**
 * Loads an image Blob, File, or URL into an HTMLCanvasElement at full resolution (capped safely at 4096px).
 */
export async function decodeSourceToCanvas(
  source: File | Blob | string
): Promise<{ canvas: HTMLCanvasElement; blob: Blob }> {
  const blob = await resolveImageSourceToBlob(source);

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file.'));
      el.src = objectUrl;
    });

    const MAX_DIM = 4096;
    let targetW = img.naturalWidth || img.width;
    let targetH = img.naturalHeight || img.height;
    if (targetW <= 0 || targetH <= 0) {
      throw new Error('Decoded image has invalid dimensions.');
    }
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
 * Opens an image directly in the Studio without running AI segmentation (solid white initial mask).
 * Works 100% offline and under file:// for manual brush, text, bokeh, adjustments, and export.
 */
export async function createManualCutout(
  source: File | Blob | string
): Promise<CutoutResult> {
  const { canvas: originalCanvas } = await decodeSourceToCanvas(source);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = originalCanvas.width;
  maskCanvas.height = originalCanvas.height;
  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Mask canvas unavailable');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  const initialMaskData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  return {
    originalCanvas,
    maskCanvas,
    initialMaskData,
    width: originalCanvas.width,
    height: originalCanvas.height,
    engineUsed: 'rmbg-local',
    backendUsed: 'manual',
    durationMs: 0,
  };
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

  // Release temporary decoded cutout buffer immediately
  cutoutCanvas.width = 0;
  cutoutCanvas.height = 0;

  return maskCanvas;
}

/**
 * Loads and caches Transformers.js v3 + briaai/RMBG-1.4 (or Xenova/modnet fallback)
 * prioritizing WebGPU -> Multi-Thread WASM -> Single-Thread WASM.
 */
async function getRmbgSession(
  caps: RuntimeCapabilities,
  onProgress?: (p: EngineProgress) => void,
  signal?: AbortSignal,
  forceCpuOnly = false
): Promise<CachedRmbgSession> {
  throwIfAborted(signal);
  const wantedKey = forceCpuOnly ? 'wasm' : caps.hasWebGPU ? 'webgpu' : 'wasm';

  if (cachedRmbgPromise && cachedRmbgBackendKey === wantedKey) {
    return cachedRmbgPromise;
  }

  // Dispose previous cached model if switching backend
  if (cachedRmbgPromise && cachedRmbgBackendKey !== wantedKey) {
    try {
      const oldSession = await cachedRmbgPromise;
      await oldSession.model?.dispose?.();
    } catch {
      // Ignore cleanup errors
    }
    cachedRmbgPromise = null;
  }

  cachedRmbgBackendKey = wantedKey;
  cachedRmbgPromise = (async () => {
    const wasmBackend: AiExecutionBackend =
      caps.recommendedThreads > 1 ? 'wasm-mt' : 'wasm-st';

    onProgress?.({
      phase: 'loading-runtime',
      percent: 8,
      engineId: 'rmbg-local',
      backend: !forceCpuOnly && caps.hasWebGPU ? 'webgpu' : wasmBackend,
    });

    const transformers = await raceWithAbort(loadTransformersRuntime(), signal);
    throwIfAborted(signal);

    const { env, AutoModel, AutoProcessor } = transformers;

    env.allowLocalModels = false;
    env.useBrowserCache = typeof caches !== 'undefined';
    if (env.backends?.onnx) {
      env.backends.onnx.logLevel = 'error';
    }
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.wasmPaths = new URL(
        './assets/wasm/transformers/',
        window.location.href
      ).href;
      env.backends.onnx.wasm.numThreads = caps.recommendedThreads;
      env.backends.onnx.wasm.proxy = false;
    }

    const fileTrackers = new Map<string, { loaded: number; total: number }>();

    interface LoadAttempt {
      modelId: string;
      device: 'webgpu' | 'wasm';
      dtype?: string;
      backend: AiExecutionBackend;
      config?: Record<string, any>;
    }

    const attempts: LoadAttempt[] = [];
    if (!forceCpuOnly && caps.hasWebGPU) {
      attempts.push({
        modelId: 'briaai/RMBG-1.4',
        device: 'webgpu',
        dtype: caps.webgpuFp16 ? 'fp16' : 'fp32',
        backend: 'webgpu',
        config: { model_type: 'custom' },
      });
    }
    attempts.push(
      {
        modelId: 'briaai/RMBG-1.4',
        device: 'wasm',
        dtype: 'fp16',
        backend: wasmBackend,
        config: { model_type: 'custom' },
      },
      {
        modelId: 'briaai/RMBG-1.4',
        device: 'wasm',
        dtype: 'q8',
        backend: wasmBackend,
        config: { model_type: 'custom' },
      }
    );
    if (!forceCpuOnly && caps.hasWebGPU) {
      attempts.push({
        modelId: 'Xenova/modnet',
        device: 'webgpu',
        dtype: 'fp32',
        backend: 'webgpu',
      });
    }
    attempts.push({
      modelId: 'Xenova/modnet',
      device: 'wasm',
      dtype: 'q8',
      backend: wasmBackend,
    });

    let lastErr: unknown = null;
    for (const attempt of attempts) {
      throwIfAborted(signal);
      try {
        fileTrackers.clear();
        const handleProgress = (info: any) => {
          if (!info || signal?.aborted) return;
          if (
            info.file &&
            typeof info.loaded === 'number' &&
            typeof info.total === 'number' &&
            info.total > 0
          ) {
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
              engineId: 'rmbg-local',
              backend: attempt.backend,
              loadedMB: Number((loaded / (1024 * 1024)).toFixed(1)),
              totalMB: Number((total / (1024 * 1024)).toFixed(1)),
            });
          } else if (typeof info.progress === 'number') {
            onProgress?.({
              phase: 'downloading-model',
              percent: Math.round(12 + Math.min(100, info.progress) * 0.66),
              engineId: 'rmbg-local',
              backend: attempt.backend,
            });
          }
        };

        const modelOptions: Record<string, any> = {
          device: attempt.device,
          progress_callback: handleProgress,
          session_options: { logSeverityLevel: 3 },
        };
        if (attempt.dtype) modelOptions.dtype = attempt.dtype;
        if (attempt.config) modelOptions.config = attempt.config;

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

        const [model, processor] = await raceWithAbort(
          Promise.all([
            AutoModel.from_pretrained(attempt.modelId, modelOptions),
            AutoProcessor.from_pretrained(attempt.modelId, processorOptions),
          ]),
          signal
        );

        return {
          transformers,
          model,
          processor,
          modelId: attempt.modelId,
          backend: attempt.backend,
        };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        lastErr = err;
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new Error('Failed to load local RMBG/MODNet model');
  })();

  try {
    return await cachedRmbgPromise;
  } catch (err) {
    cachedRmbgPromise = null;
    cachedRmbgBackendKey = null;
    throw err;
  }
}

/**
 * Engine 1: Local Browser AI — RMBG-1.4 / MODNet via Transformers.js v3
 */
async function runRmbgLocalEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  caps: RuntimeCapabilities,
  onProgress?: (p: EngineProgress) => void,
  signal?: AbortSignal
): Promise<{ maskCanvas: HTMLCanvasElement; backend: AiExecutionBackend }> {
  let session = await getRmbgSession(caps, onProgress, signal, false);
  const { RawImage } = session.transformers;

  throwIfAborted(signal);
  onProgress?.({
    phase: 'inferring',
    percent: 82,
    engineId: 'rmbg-local',
    backend: session.backend,
  });

  const objectUrl = URL.createObjectURL(blob);
  let rawImage: any;
  try {
    rawImage = await RawImage.fromURL(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  let pixelValues: any = null;
  let modelOutput: any = null;

  try {
    const processed: any = await raceWithAbort(session.processor(rawImage), signal);
    pixelValues = processed.pixel_values;
    try {
      modelOutput = await raceWithAbort(
        session.model({ input: pixelValues }),
        signal
      );
    } catch (inferErr) {
      if ((inferErr as Error)?.name === 'AbortError') throw inferErr;
      // If WebGPU inference fails on a driver/shader edge case, cleanly retry on WASM
      if (session.backend === 'webgpu') {
        pixelValues?.dispose?.();
        pixelValues = null;
        session = await getRmbgSession(caps, onProgress, signal, true);
        onProgress?.({
          phase: 'inferring',
          percent: 82,
          engineId: 'rmbg-local',
          backend: session.backend,
        });
        const retryProc: any = await raceWithAbort(session.processor(rawImage), signal);
        pixelValues = retryProc.pixel_values;
        modelOutput = await raceWithAbort(
          session.model({ input: pixelValues }),
          signal
        );
      } else {
        throw inferErr;
      }
    }

    throwIfAborted(signal);
    onProgress?.({
      phase: 'refining',
      percent: 94,
      engineId: 'rmbg-local',
      backend: session.backend,
    });

    let maskTensor = modelOutput.output[0];
    if (maskTensor.dims && maskTensor.dims.length === 4) {
      maskTensor = maskTensor[0];
    }
    if (maskTensor.dims && maskTensor.dims.length === 3) {
      maskTensor = maskTensor[0];
    }

    const maskH = maskTensor.dims[maskTensor.dims.length - 2];
    const maskW = maskTensor.dims[maskTensor.dims.length - 1];
    const tensorData = maskTensor.data as Float32Array | Uint8Array;

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

    const fullMaskCanvas = document.createElement('canvas');
    fullMaskCanvas.width = originalCanvas.width;
    fullMaskCanvas.height = originalCanvas.height;
    const fullCtx = fullMaskCanvas.getContext('2d', { willReadFrequently: true });
    if (!fullCtx) throw new Error('Full mask 2D context unavailable');
    fullCtx.imageSmoothingEnabled = true;
    fullCtx.imageSmoothingQuality = 'high';
    fullCtx.drawImage(
      smallMaskCanvas,
      0,
      0,
      originalCanvas.width,
      originalCanvas.height
    );

    smallMaskCanvas.width = 0;
    smallMaskCanvas.height = 0;

    return { maskCanvas: fullMaskCanvas, backend: session.backend };
  } finally {
    try {
      pixelValues?.dispose?.();
      modelOutput?.output?.dispose?.();
    } catch {
      // Ignore disposal errors
    }
  }
}

/**
 * Routes IMG.LY ONNX WASM requests locally from ./assets/wasm/imgly/
 * and caches staticimgly.com model weights persistently in Cache Storage.
 */
async function withImglyLocalWasmAndCache<T>(
  run: () => Promise<T>
): Promise<T> {
  const originalFetch = window.fetch.bind(window);
  const localWasmBase = new URL('./assets/wasm/imgly/', window.location.href).href;

  let modelCache: Cache | null = null;
  if (typeof caches !== 'undefined') {
    try {
      modelCache = await caches.open(IMGLY_CACHE_NAME);
    } catch {
      modelCache = null;
    }
  }

  let localWasmManifest: Record<string, any> | null = null;
  try {
    const manifestRes = await originalFetch(`${localWasmBase}wasm-resources.json`);
    if (manifestRes.ok) {
      localWasmManifest = await manifestRes.json();
    }
  } catch {
    localWasmManifest = null;
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : input.url;

    if (
      urlStr === `${IMGLY_DATA_PUBLIC_PATH}resources.json` &&
      localWasmManifest
    ) {
      let res: Response | undefined;
      if (modelCache) {
        const cached = await modelCache.match(urlStr);
        if (cached) res = cached.clone();
      }
      if (!res) {
        res = await originalFetch(input, init);
        if (res.ok && modelCache) {
          try {
            await modelCache.put(urlStr, res.clone());
          } catch {
            // Ignore quota errors
          }
        }
      }
      if (res.ok) {
        const remoteMap = await res.json();
        const merged = { ...remoteMap, ...localWasmManifest };
        return new Response(JSON.stringify(merged), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return res;
    }

    if (urlStr.startsWith(`${IMGLY_DATA_PUBLIC_PATH}ort-wasm-`)) {
      const fileName = urlStr.slice(IMGLY_DATA_PUBLIC_PATH.length);
      return originalFetch(`${localWasmBase}${fileName}`, init);
    }

    if (urlStr.startsWith(IMGLY_DATA_PUBLIC_PATH)) {
      if (modelCache) {
        const cached = await modelCache.match(urlStr);
        if (cached) return cached.clone();
      }
      const res = await originalFetch(input, init);
      if (res.ok && modelCache) {
        try {
          await modelCache.put(urlStr, res.clone());
        } catch {
          // Ignore quota errors
        }
      }
      return res;
    }

    if (urlStr.startsWith(localWasmBase)) {
      return originalFetch(input, init);
    }

    return originalFetch(input, init);
  };

  try {
    return await run();
  } finally {
    window.fetch = originalFetch;
  }
}

/**
 * Engine 2: Local Studio Matting — IMG.LY ISNet (100% On-Device)
 */
async function runImglyLocalEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  caps: RuntimeCapabilities,
  onProgress?: (p: EngineProgress) => void,
  signal?: AbortSignal
): Promise<{ maskCanvas: HTMLCanvasElement; backend: AiExecutionBackend }> {
  throwIfAborted(signal);
  const wasmBackend: AiExecutionBackend =
    caps.recommendedThreads > 1 ? 'wasm-mt' : 'wasm-st';
  const preferredBackend: AiExecutionBackend = caps.hasWebGPU
    ? 'webgpu'
    : wasmBackend;

  onProgress?.({
    phase: 'loading-runtime',
    percent: 10,
    engineId: 'imgly-local',
    backend: preferredBackend,
  });

  const imglyModule = await raceWithAbort(loadImglyRuntime(), signal);
  throwIfAborted(signal);

  const removeBackground = imglyModule.removeBackground || imglyModule.default;
  if (typeof removeBackground !== 'function') {
    throw new Error('IMG.LY removeBackground export unavailable');
  }

  const deviceChain: ('gpu' | 'cpu')[] = caps.hasWebGPU ? ['gpu', 'cpu'] : ['cpu'];
  let resultBlob: Blob | null = null;
  let usedBackend: AiExecutionBackend = wasmBackend;
  let lastErr: unknown = null;

  for (const device of deviceChain) {
    throwIfAborted(signal);
    const activeBackend: AiExecutionBackend =
      device === 'gpu' ? 'webgpu' : wasmBackend;

    try {
      resultBlob = await raceWithAbort(
        withImglyLocalWasmAndCache(() =>
          removeBackground(blob, {
            publicPath: IMGLY_DATA_PUBLIC_PATH,
            device,
            proxyToWorker: false,
            model: 'isnet_fp16',
            output: { format: 'image/png', quality: 1 },
            progress: (key: string, current: number, total: number) => {
              if (signal?.aborted) return;
              if (total > 0) {
                const ratio = Math.min(1, current / total);
                const isFetch =
                  key.toLowerCase().includes('fetch') ||
                  key.toLowerCase().includes('download');
                onProgress?.({
                  phase: isFetch ? 'downloading-model' : 'inferring',
                  percent: isFetch
                    ? Math.round(14 + ratio * 62)
                    : Math.round(78 + ratio * 16),
                  engineId: 'imgly-local',
                  backend: activeBackend,
                  loadedMB: isFetch
                    ? Number((current / (1024 * 1024)).toFixed(1))
                    : undefined,
                  totalMB: isFetch
                    ? Number((total / (1024 * 1024)).toFixed(1))
                    : undefined,
                });
              }
            },
          })
        ),
        signal
      );
      usedBackend = activeBackend;
      break;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      lastErr = err;
    }
  }

  if (!resultBlob) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error('IMG.LY ISNet inference failed');
  }

  onProgress?.({
    phase: 'refining',
    percent: 95,
    engineId: 'imgly-local',
    backend: usedBackend,
  });

  const maskCanvas = await extractMaskFromCutoutBlob(
    resultBlob,
    originalCanvas.width,
    originalCanvas.height
  );
  return { maskCanvas, backend: usedBackend };
}

/**
 * Engine 3: Optional Cloud Ultra AI (Hugging Face ZeroGPU Space)
 * Only executes when explicitly requested by user; wrapped in strict 25s timeout + abort support.
 */
async function runNotLainCloudEngine(
  originalCanvas: HTMLCanvasElement,
  blob: Blob,
  onProgress?: (p: EngineProgress) => void,
  signal?: AbortSignal
): Promise<{ maskCanvas: HTMLCanvasElement; backend: AiExecutionBackend }> {
  throwIfAborted(signal);
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Offline: Cloud engine requires an internet connection.');
  }

  const TIMEOUT_MS = 25000;
  let timerId: number | undefined;

  const task = (async () => {
    onProgress?.({
      phase: 'loading-runtime',
      percent: 15,
      engineId: 'notlain-cloud',
      backend: 'cloud',
    });
    const gradioModule = await loadGradioRuntime();
    throwIfAborted(signal);

    const Client = gradioModule.Client || gradioModule.default?.Client;
    if (!Client) {
      throw new Error('Gradio Client export unavailable');
    }

    onProgress?.({
      phase: 'inferring',
      percent: 45,
      engineId: 'notlain-cloud',
      backend: 'cloud',
    });
    const client = await Client.connect('not-lain/background-removal');
    throwIfAborted(signal);

    let prediction: any;
    try {
      prediction = await client.predict('/png', { f: blob });
    } catch {
      prediction = await client.predict('/image', { image: blob });
    }
    throwIfAborted(signal);

    onProgress?.({
      phase: 'refining',
      percent: 85,
      engineId: 'notlain-cloud',
      backend: 'cloud',
    });

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

    const res = await fetch(outputUrl, { signal });
    if (!res.ok) {
      throw new Error(`Could not fetch cloud cutout (${res.status})`);
    }
    const cutoutBlob = await res.blob();
    const maskCanvas = await extractMaskFromCutoutBlob(
      cutoutBlob,
      originalCanvas.width,
      originalCanvas.height
    );
    return { maskCanvas, backend: 'cloud' as AiExecutionBackend };
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => {
      reject(new Error('Cloud ZeroGPU timeout (25s)'));
    }, TIMEOUT_MS);
  });

  try {
    return await raceWithAbort(Promise.race([task, timeoutPromise]), signal);
  } finally {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  }
}

export interface RemoveBackgroundOptions {
  signal?: AbortSignal;
}

/**
 * Runs AI background removal serialized cleanly to avoid concurrent ONNX/WebGPU races.
 * Local engines never send user images to cloud services on failure.
 */
export function removeBackgroundWithAI(
  source: File | Blob | string,
  preferredEngine: AiEngineId,
  onProgress?: (p: EngineProgress) => void,
  options?: RemoveBackgroundOptions
): Promise<CutoutResult> {
  return serializeQueue(async () => {
    const signal = options?.signal;
    throwIfAborted(signal);

    const startTime = performance.now();
    const caps = await detectRuntimeCapabilities();
    throwIfAborted(signal);

    const { canvas: originalCanvas, blob } = await decodeSourceToCanvas(source);
    throwIfAborted(signal);

    if (caps.isFileProtocol && preferredEngine !== 'notlain-cloud') {
      originalCanvas.width = 0;
      originalCanvas.height = 0;
      const err = new Error('FILE_PROTOCOL_AI_BLOCKED');
      err.name = 'FileProtocolError';
      throw err;
    }

    const engineChain = resolveFallbackEngines(preferredEngine);

    let lastError: unknown = null;
    let fallbackFrom: AiEngineId | undefined;
    let fallbackReason: string | undefined;

    for (let i = 0; i < engineChain.length; i++) {
      throwIfAborted(signal);
      const engineId = engineChain[i];
      if (caps.isFileProtocol && engineId !== 'notlain-cloud') {
        continue;
      }

      try {
        if (i > 0) {
          onProgress?.({
            phase: 'fallback',
            percent: 15,
            engineId,
            message: fallbackReason,
          });
        }

        let res: { maskCanvas: HTMLCanvasElement; backend: AiExecutionBackend };
        if (engineId === 'rmbg-local') {
          res = await runRmbgLocalEngine(
            originalCanvas,
            blob,
            caps,
            onProgress,
            signal
          );
        } else if (engineId === 'imgly-local') {
          res = await runImglyLocalEngine(
            originalCanvas,
            blob,
            caps,
            onProgress,
            signal
          );
        } else {
          res = await runNotLainCloudEngine(
            originalCanvas,
            blob,
            onProgress,
            signal
          );
        }

        const maskCtx = res.maskCanvas.getContext('2d', {
          willReadFrequently: true,
        });
        if (!maskCtx) throw new Error('Mask context unreadable');
        const initialMaskData = maskCtx.getImageData(
          0,
          0,
          res.maskCanvas.width,
          res.maskCanvas.height
        );

        onProgress?.({
          phase: 'refining',
          percent: 100,
          engineId,
          backend: res.backend,
        });

        return {
          originalCanvas,
          maskCanvas: res.maskCanvas,
          initialMaskData,
          width: originalCanvas.width,
          height: originalCanvas.height,
          engineUsed: engineId,
          backendUsed: res.backend,
          fallbackFrom,
          fallbackReason,
          durationMs: Math.round(performance.now() - startTime),
        };
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          originalCanvas.width = 0;
          originalCanvas.height = 0;
          throw err;
        }
        lastError = err;
        if (!fallbackFrom) {
          fallbackFrom = engineId;
          fallbackReason =
            err instanceof Error ? err.message : 'Engine unavailable';
        }
      }
    }

    originalCanvas.width = 0;
    originalCanvas.height = 0;
    throw lastError instanceof Error
      ? lastError
      : new Error('AI background removal engine could not initialize.');
  });
}
