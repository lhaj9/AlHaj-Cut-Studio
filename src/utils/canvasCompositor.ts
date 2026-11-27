import type {
  BatchGlobalSettings,
  ExportFormat,
  StudioEditState,
  TextLayer,
} from '../types/studio';
import {
  buildCanvasFilterString,
  computeCanvasDimensions,
  computeCoverRect,
  computeExportDimensions,
  computeSubjectRect,
  DEFAULT_COLOR_ADJUSTMENTS,
  GRADIENT_PRESETS,
} from './studioMath';

const MAX_BG_CACHE_ENTRIES = 8;
const loadedBgImageCache = new Map<string, HTMLImageElement>();

// Reusable offscreen scratch canvases to prevent per-frame 4K memory spikes & GC churn
let scratchMaskedCanvas: HTMLCanvasElement | null = null;
let scratchTintCanvas: HTMLCanvasElement | null = null;
let scratchStrokeCanvas: HTMLCanvasElement | null = null;

function getOrResizeCanvas(
  existing: HTMLCanvasElement | null,
  width: number,
  height: number
): HTMLCanvasElement {
  const c = existing || document.createElement('canvas');
  const targetW = Math.max(1, Math.round(width));
  const targetH = Math.max(1, Math.round(height));
  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW;
    c.height = targetH;
  } else {
    const ctx = c.getContext('2d');
    ctx?.clearRect(0, 0, targetW, targetH);
  }
  return c;
}

export function evictBgImageCache(url?: string | null) {
  if (url) {
    loadedBgImageCache.delete(url);
  }
}

export function releaseCompositorScratchBuffers() {
  for (const c of [scratchMaskedCanvas, scratchTintCanvas, scratchStrokeCanvas]) {
    if (c) {
      c.width = 0;
      c.height = 0;
    }
  }
  scratchMaskedCanvas = null;
  scratchTintCanvas = null;
  scratchStrokeCanvas = null;
}

export async function loadImageElement(url: string): Promise<HTMLImageElement> {
  const existing = loadedBgImageCache.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      el.crossOrigin = 'anonymous';
    }
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load background image'));
    el.src = url;
  });

  if (loadedBgImageCache.size >= MAX_BG_CACHE_ENTRIES) {
    const oldestKey = loadedBgImageCache.keys().next().value;
    if (oldestKey) loadedBgImageCache.delete(oldestKey);
  }
  loadedBgImageCache.set(url, img);
  return img;
}

/**
 * Combines originalCanvas with mutable maskCanvas into a reusable scratch canvas
 * sized cleanly to target draw dimensions (saves >90% RAM during interactive preview).
 */
function buildMaskedSubjectCanvas(
  originalCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  scratchMaskedCanvas = getOrResizeCanvas(
    scratchMaskedCanvas,
    targetWidth,
    targetHeight
  );
  const ctx = scratchMaskedCanvas.getContext('2d');
  if (!ctx) return scratchMaskedCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(originalCanvas, 0, 0, targetWidth, targetHeight);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, targetWidth, targetHeight);
  ctx.globalCompositeOperation = 'source-over';
  return scratchMaskedCanvas;
}

/**
 * Generates an alpha-dilated Sticker Outline silhouette canvas in the requested color.
 */
function buildStickerStrokeCanvas(
  maskCanvas: HTMLCanvasElement,
  drawWidth: number,
  drawHeight: number,
  strokeWidth: number,
  strokeColor: string
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(strokeWidth) + 2;
  const dw = Math.max(1, Math.round(drawWidth));
  const dh = Math.max(1, Math.round(drawHeight));
  const w = dw + pad * 2;
  const h = dh + pad * 2;

  scratchTintCanvas = getOrResizeCanvas(scratchTintCanvas, dw, dh);
  const tintCtx = scratchTintCanvas.getContext('2d');
  if (tintCtx) {
    tintCtx.imageSmoothingEnabled = true;
    tintCtx.imageSmoothingQuality = 'high';
    tintCtx.globalCompositeOperation = 'source-over';
    tintCtx.drawImage(maskCanvas, 0, 0, dw, dh);
    tintCtx.globalCompositeOperation = 'source-in';
    tintCtx.fillStyle = strokeColor;
    tintCtx.fillRect(0, 0, dw, dh);
    tintCtx.globalCompositeOperation = 'source-over';
  }

  scratchStrokeCanvas = getOrResizeCanvas(scratchStrokeCanvas, w, h);
  const ctx = scratchStrokeCanvas.getContext('2d');
  if (ctx) {
    const steps = Math.max(16, Math.min(36, Math.ceil(strokeWidth * 2)));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const dx = Math.cos(angle) * strokeWidth;
      const dy = Math.sin(angle) * strokeWidth;
      ctx.drawImage(scratchTintCanvas, pad + dx, pad + dy);
    }
    ctx.drawImage(scratchTintCanvas, pad, pad);
  }

  return { canvas: scratchStrokeCanvas, pad };
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!layer.content.trim()) return;
  const scaleFactor = canvasHeight / 1080;
  const fontSizePx = Math.max(12, Math.round(layer.fontSize * scaleFactor));
  const posX = layer.x * canvasWidth;
  const posY = layer.y * canvasHeight;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = layer.opacity;
  ctx.font = `${layer.fontWeight} ${fontSizePx}px "${layer.fontFamily}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  if (layer.shadowBlur > 0) {
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = layer.shadowBlur * scaleFactor;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(4 * scaleFactor);
  }

  const lines = layer.content.split('\n');
  const lineHeight = fontSizePx * 1.18;
  const startY = -((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, idx) => {
    const y = startY + idx * lineHeight;
    if (layer.strokeWidth > 0) {
      ctx.lineWidth = layer.strokeWidth * scaleFactor * 2;
      ctx.strokeStyle = layer.strokeColor;
      ctx.strokeText(line, 0, y);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(line, 0, y);
  });

  ctx.restore();
}

export interface RenderOptions {
  targetCanvas: HTMLCanvasElement;
  originalCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  state: StudioEditState;
  customBgImage?: HTMLImageElement | null;
  maxPreviewDimension?: number;
  exportScale?: number;
  watermarkText?: string;
  watermarkOpacity?: number;
  forceOpaqueBackgroundForJpg?: boolean;
}

/**
 * True non-destructive 5-layer HTML5 Canvas compositor:
 * 1. Background Layer (Transparent / Solid / Gradient / Image / DSLR Bokeh)
 * 2. Text Behind Subject Layer
 * 3. Shadow & Sticker Stroke Layer (pure offscreen shadow projection avoids alpha doubling)
 * 4. Subject Cutout Layer (original + mutable alpha mask + subject color adjustments)
 * 5. Foreground Text & Optional Watermark Layer
 */
export function renderStudioComposite(options: RenderOptions): {
  canvasWidth: number;
  canvasHeight: number;
  subjectRect: { x: number; y: number; width: number; height: number };
} {
  const {
    targetCanvas,
    originalCanvas,
    maskCanvas,
    state,
    customBgImage,
    maxPreviewDimension,
    exportScale = 1,
    watermarkText,
    watermarkOpacity = 0.55,
    forceOpaqueBackgroundForJpg = false,
  } = options;

  const baseDims = computeCanvasDimensions(
    originalCanvas.width,
    originalCanvas.height,
    state.aspectPreset
  );

  const scaledDims = maxPreviewDimension
    ? baseDims
    : computeExportDimensions(
        originalCanvas.width,
        originalCanvas.height,
        state.aspectPreset,
        exportScale
      );

  let renderW = scaledDims.width;
  let renderH = scaledDims.height;

  if (
    maxPreviewDimension &&
    (renderW > maxPreviewDimension || renderH > maxPreviewDimension)
  ) {
    const downscale = Math.min(
      maxPreviewDimension / renderW,
      maxPreviewDimension / renderH
    );
    renderW = Math.max(1, Math.round(renderW * downscale));
    renderH = Math.max(1, Math.round(renderH * downscale));
  }

  if (targetCanvas.width !== renderW || targetCanvas.height !== renderH) {
    targetCanvas.width = renderW;
    targetCanvas.height = renderH;
  }

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) {
    return {
      canvasWidth: renderW,
      canvasHeight: renderH,
      subjectRect: { x: 0, y: 0, width: renderW, height: renderH },
    };
  }

  ctx.clearRect(0, 0, renderW, renderH);
  // Reference scale always compares against unscaled base aspect dimensions for 1:1 preview/export parity
  const scaleFromBase = renderW / baseDims.width;

  // ------------------------------------------------------------------
  // LAYER 1: BACKGROUND LAYER
  // ------------------------------------------------------------------
  const bg = state.background;
  ctx.save();
  if (bg.mode === 'transparent') {
    if (forceOpaqueBackgroundForJpg) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, renderW, renderH);
    }
  } else if (bg.mode === 'solid') {
    ctx.filter = buildCanvasFilterString(state.bgAdjust);
    ctx.fillStyle = bg.solidColor;
    ctx.fillRect(0, 0, renderW, renderH);
  } else if (bg.mode === 'gradient') {
    ctx.filter = buildCanvasFilterString(state.bgAdjust);
    const preset =
      GRADIENT_PRESETS.find((g) => g.id === bg.gradientId) || GRADIENT_PRESETS[0];
    const rad = ((preset.angle - 90) * Math.PI) / 180;
    const cx = renderW / 2;
    const cy = renderH / 2;
    const len = Math.hypot(renderW, renderH) / 2;
    const grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len,
      cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len,
      cy + Math.sin(rad) * len
    );
    preset.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, renderW, renderH);
  } else if (bg.mode === 'image' && customBgImage) {
    ctx.filter = buildCanvasFilterString(state.bgAdjust);
    const rect = computeCoverRect(
      customBgImage.naturalWidth || customBgImage.width,
      customBgImage.naturalHeight || customBgImage.height,
      renderW,
      renderH
    );
    ctx.drawImage(customBgImage, rect.x, rect.y, rect.width, rect.height);
  } else if (bg.mode === 'bokeh') {
    const blurPx = Math.max(0, bg.bokehBlur * scaleFromBase);
    const bleed = Math.ceil(blurPx * 2.5);
    ctx.filter = buildCanvasFilterString(state.bgAdjust, blurPx);
    const rect = computeCoverRect(
      originalCanvas.width,
      originalCanvas.height,
      renderW,
      renderH,
      bleed
    );
    ctx.drawImage(originalCanvas, rect.x, rect.y, rect.width, rect.height);
  }
  ctx.restore();

  // ------------------------------------------------------------------
  // LAYER 2: TEXT BEHIND SUBJECT LAYER
  // ------------------------------------------------------------------
  for (const layer of state.textLayers) {
    if (layer.placement === 'behind') {
      drawTextLayer(ctx, layer, renderW, renderH);
    }
  }

  // Compute subject geometry
  const subjectRect = computeSubjectRect(
    originalCanvas.width,
    originalCanvas.height,
    renderW,
    renderH,
    state.subjectScale,
    state.subjectOffsetX,
    state.subjectOffsetY
  );

  // Build masked subject cutout sized to target subject draw box (or full source when upscaled)
  const subjectDrawW = Math.max(1, Math.round(subjectRect.width));
  const subjectDrawH = Math.max(1, Math.round(subjectRect.height));
  const maskedSubject = buildMaskedSubjectCanvas(
    originalCanvas,
    maskCanvas,
    subjectDrawW,
    subjectDrawH
  );

  // ------------------------------------------------------------------
  // LAYER 3: STUDIO DROP SHADOW & STICKER STROKE LAYER
  // ------------------------------------------------------------------
  const fx = state.effects;
  const strokeWidthScaled = fx.strokeEnabled
    ? Math.max(0.5, fx.strokeWidth * scaleFromBase)
    : 0;

  let stickerAsset: { canvas: HTMLCanvasElement; pad: number } | null = null;
  if (fx.strokeEnabled && strokeWidthScaled > 0) {
    stickerAsset = buildStickerStrokeCanvas(
      maskCanvas,
      subjectRect.width,
      subjectRect.height,
      strokeWidthScaled,
      fx.strokeColor
    );
  }

  if (fx.shadowEnabled && fx.shadowOpacity > 0) {
    // Shift caster off-canvas so ONLY the drop shadow renders (prevents semi-transparent alpha doubling)
    const offscreenShift = renderW + Math.max(2000, Math.round(fx.shadowBlur * 4 + 200));
    ctx.save();
    ctx.globalAlpha = fx.shadowOpacity;
    ctx.shadowColor = fx.shadowColor;
    ctx.shadowBlur = fx.shadowBlur * scaleFromBase;
    ctx.shadowOffsetX = fx.shadowOffsetX * scaleFromBase + offscreenShift;
    ctx.shadowOffsetY = fx.shadowOffsetY * scaleFromBase;

    if (stickerAsset) {
      ctx.drawImage(
        stickerAsset.canvas,
        subjectRect.x - stickerAsset.pad - offscreenShift,
        subjectRect.y - stickerAsset.pad
      );
    } else {
      ctx.drawImage(
        maskedSubject,
        subjectRect.x - offscreenShift,
        subjectRect.y,
        subjectRect.width,
        subjectRect.height
      );
    }
    ctx.restore();
  }

  if (stickerAsset) {
    ctx.save();
    ctx.drawImage(
      stickerAsset.canvas,
      subjectRect.x - stickerAsset.pad,
      subjectRect.y - stickerAsset.pad
    );
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // LAYER 4: SUBJECT CUTOUT LAYER
  // ------------------------------------------------------------------
  ctx.save();
  ctx.filter = buildCanvasFilterString(state.subjectAdjust);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    maskedSubject,
    subjectRect.x,
    subjectRect.y,
    subjectRect.width,
    subjectRect.height
  );
  ctx.restore();

  // ------------------------------------------------------------------
  // LAYER 5: FOREGROUND TEXT & WATERMARK LAYER
  // ------------------------------------------------------------------
  for (const layer of state.textLayers) {
    if (layer.placement === 'front') {
      drawTextLayer(ctx, layer, renderW, renderH);
    }
  }

  if (watermarkText && watermarkText.trim().length > 0) {
    const wmScale = renderH / 1080;
    const wmFontSize = Math.max(14, Math.round(32 * wmScale));
    ctx.save();
    ctx.globalAlpha = watermarkOpacity;
    ctx.font = `600 ${wmFontSize}px "Cairo", "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 8 * wmScale;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(
      watermarkText.trim(),
      renderW - Math.round(28 * wmScale),
      renderH - Math.round(24 * wmScale)
    );
    ctx.restore();
  }

  return {
    canvasWidth: renderW,
    canvasHeight: renderH,
    subjectRect,
  };
}

/**
 * Paints a soft-edged circular stroke directly onto the alpha maskCanvas.
 * Erase removes alpha (destination-out); Restore paints white alpha (source-over).
 */
export function paintMaskBrushStroke(
  maskCanvas: HTMLCanvasElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  mode: 'erase' | 'restore',
  brushSize: number,
  softness: number
) {
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return;

  const radius = Math.max(2, brushSize / 2);
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const step = Math.max(1, radius * 0.25);
  const steps = Math.max(1, Math.ceil(dist / step));

  ctx.save();
  ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';

  const innerRatio = Math.max(0.05, Math.min(0.98, 1 - softness * 0.85));

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = fromX + (toX - fromX) * t;
    const cy = fromY + (toY - fromY) * t;

    const grad = ctx.createRadialGradient(
      cx,
      cy,
      radius * innerRatio,
      cx,
      cy,
      radius
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Exports a rendered canvas to a Blob in PNG, WebP, or JPG format.
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode image export'));
      },
      format,
      format === 'image/png' ? undefined : quality
    );
  });
}

/**
 * Renders a batch item using global batch settings into an offscreen canvas and returns a Blob.
 */
export async function renderBatchItemBlob(
  originalCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  globalSettings: BatchGlobalSettings,
  maxPreviewDimension?: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  let mode: 'transparent' | 'solid' = 'transparent';
  let solidColor = '#FFFFFF';
  if (globalSettings.backgroundType === 'white') {
    mode = 'solid';
    solidColor = '#FFFFFF';
  } else if (globalSettings.backgroundType === 'studio-gray') {
    mode = 'solid';
    solidColor = '#F3F4F6';
  } else if (globalSettings.backgroundType === 'custom') {
    mode = 'solid';
    solidColor = globalSettings.customColor;
  }

  const state: StudioEditState = {
    background: {
      mode,
      solidColor,
      gradientId: 'alabaster-mist',
      customImageUrl: null,
      bokehBlur: 0,
    },
    textLayers: [],
    selectedTextId: null,
    effects: {
      strokeEnabled: false,
      strokeWidth: 0,
      strokeColor: '#FFFFFF',
      shadowEnabled: false,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowOpacity: 0,
      shadowColor: '#0F172A',
    },
    subjectAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS },
    bgAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS },
    aspectPreset: globalSettings.aspectPreset,
    subjectScale: 1,
    subjectOffsetX: 0,
    subjectOffsetY: 0,
    exportSettings: {
      format: globalSettings.format,
      quality: globalSettings.quality,
      scale: 1,
      fileName: 'batch',
    },
  };

  renderStudioComposite({
    targetCanvas: canvas,
    originalCanvas,
    maskCanvas,
    state,
    maxPreviewDimension,
    watermarkText: globalSettings.watermarkText,
    watermarkOpacity: globalSettings.watermarkOpacity,
    forceOpaqueBackgroundForJpg: globalSettings.format === 'image/jpeg',
  });

  try {
    return await exportCanvasToBlob(
      canvas,
      globalSettings.format,
      globalSettings.quality
    );
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
