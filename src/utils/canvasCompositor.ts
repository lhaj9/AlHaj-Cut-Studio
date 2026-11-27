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
  computeSubjectRect,
  DEFAULT_COLOR_ADJUSTMENTS,
  GRADIENT_PRESETS,
} from './studioMath';

const loadedBgImageCache = new Map<string, HTMLImageElement>();

export async function loadImageElement(url: string): Promise<HTMLImageElement> {
  const existing = loadedBgImageCache.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load background image'));
    el.src = url;
  });
  loadedBgImageCache.set(url, img);
  return img;
}

/**
 * Creates a masked subject offscreen canvas by combining originalCanvas with mutable maskCanvas.
 */
function buildMaskedSubjectCanvas(
  originalCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = originalCanvas.width;
  out.height = originalCanvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) return out;

  ctx.drawImage(originalCanvas, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, originalCanvas.width, originalCanvas.height);
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

/**
 * Generates an alpha-dilated YouTube Sticker Outline silhouette canvas in the requested color.
 */
function buildStickerStrokeCanvas(
  maskCanvas: HTMLCanvasElement,
  drawWidth: number,
  drawHeight: number,
  strokeWidth: number,
  strokeColor: string
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(strokeWidth) + 2;
  const w = Math.max(1, Math.round(drawWidth) + pad * 2);
  const h = Math.max(1, Math.round(drawHeight) + pad * 2);

  // Step 1: Create solid tinted silhouette of the mask at target scale
  const tintCanvas = document.createElement('canvas');
  tintCanvas.width = Math.max(1, Math.round(drawWidth));
  tintCanvas.height = Math.max(1, Math.round(drawHeight));
  const tintCtx = tintCanvas.getContext('2d');
  if (tintCtx) {
    tintCtx.drawImage(maskCanvas, 0, 0, tintCanvas.width, tintCanvas.height);
    tintCtx.globalCompositeOperation = 'source-in';
    tintCtx.fillStyle = strokeColor;
    tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
  }

  // Step 2: Radial multi-pass alpha dilation for smooth sticker outline
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (ctx) {
    const steps = Math.max(16, Math.min(36, Math.ceil(strokeWidth * 2)));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const dx = Math.cos(angle) * strokeWidth;
      const dy = Math.sin(angle) * strokeWidth;
      ctx.drawImage(tintCanvas, pad + dx, pad + dy);
    }
    // Fill inner core as well so semi-transparent border fringes stay solid
    ctx.drawImage(tintCanvas, pad, pad);
  }

  return { canvas: out, pad };
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
  watermarkText?: string;
  watermarkOpacity?: number;
  forceOpaqueBackgroundForJpg?: boolean;
}

/**
 * True non-destructive 5-layer HTML5 Canvas compositor:
 * 1. Background Layer (Transparent / Solid / Gradient / Image / DSLR Bokeh)
 * 2. Text Behind Subject Layer
 * 3. Shadow & Sticker Stroke Layer
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
    watermarkText,
    watermarkOpacity = 0.55,
    forceOpaqueBackgroundForJpg = false,
  } = options;

  const fullDims = computeCanvasDimensions(
    originalCanvas.width,
    originalCanvas.height,
    state.aspectPreset
  );

  let renderW = fullDims.width;
  let renderH = fullDims.height;

  if (maxPreviewDimension && (renderW > maxPreviewDimension || renderH > maxPreviewDimension)) {
    const downscale = Math.min(maxPreviewDimension / renderW, maxPreviewDimension / renderH);
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
  const scaleFromFull = renderW / fullDims.width;

  // ------------------------------------------------------------------
  // LAYER 1: BACKGROUND LAYER (Transparent / Solid / Gradient / Image / DSLR Bokeh)
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
    const blurPx = Math.max(0, bg.bokehBlur * scaleFromFull);
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

  // Build masked subject cutout from original + editable alpha mask
  const maskedSubject = buildMaskedSubjectCanvas(originalCanvas, maskCanvas);

  // ------------------------------------------------------------------
  // LAYER 3: STUDIO DROP SHADOW & YOUTUBE STICKER STROKE LAYER
  // ------------------------------------------------------------------
  const fx = state.effects;
  const strokeWidthScaled = fx.strokeEnabled
    ? Math.max(1, fx.strokeWidth * scaleFromFull)
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
    ctx.save();
    ctx.globalAlpha = fx.shadowOpacity;
    ctx.shadowColor = fx.shadowColor;
    ctx.shadowBlur = fx.shadowBlur * scaleFromFull;
    ctx.shadowOffsetX = fx.shadowOffsetX * scaleFromFull;
    ctx.shadowOffsetY = fx.shadowOffsetY * scaleFromFull;

    // Draw shadow caster offscreen-shifted or directly underneath subject
    if (stickerAsset) {
      ctx.drawImage(
        stickerAsset.canvas,
        subjectRect.x - stickerAsset.pad,
        subjectRect.y - stickerAsset.pad
      );
    } else {
      ctx.drawImage(
        maskedSubject,
        subjectRect.x,
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
  // LAYER 4: SUBJECT CUTOUT LAYER (with independent Subject Color Adjustments)
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
  const step = Math.max(1, radius * 0.28);
  const steps = Math.max(1, Math.ceil(dist / step));

  ctx.save();
  ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';

  const innerRatio = Math.max(0.05, Math.min(0.95, 1 - softness * 0.85));

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = fromX + (toX - fromX) * t;
    const cy = fromY + (toY - fromY) * t;

    const grad = ctx.createRadialGradient(cx, cy, radius * innerRatio, cx, cy, radius);
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

  return exportCanvasToBlob(canvas, globalSettings.format, globalSettings.quality);
}
