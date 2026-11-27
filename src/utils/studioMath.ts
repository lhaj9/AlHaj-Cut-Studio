import type {
  AiEngineId,
  AspectPresetId,
  ColorAdjustments,
  ExportFormat,
  GradientPreset,
  StudioEditState,
} from '../types/studio';

export const MAX_HISTORY_STEPS = 25;

export const DEFAULT_COLOR_ADJUSTMENTS: ColorAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
};

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'alabaster-mist',
    labelKey: 'gradAlabaster',
    angle: 135,
    stops: [
      { offset: 0, color: '#F8FAFC' },
      { offset: 0.55, color: '#E2E8F0' },
      { offset: 1, color: '#CBD5E1' },
    ],
  },
  {
    id: 'emerald-daylight',
    labelKey: 'gradEmerald',
    angle: 130,
    stops: [
      { offset: 0, color: '#ECFDF5' },
      { offset: 0.5, color: '#99F6E4' },
      { offset: 1, color: '#0D9488' },
    ],
  },
  {
    id: 'warm-travertine',
    labelKey: 'gradTravertine',
    angle: 145,
    stops: [
      { offset: 0, color: '#FFFBEB' },
      { offset: 0.5, color: '#FDE68A' },
      { offset: 1, color: '#D97706' },
    ],
  },
  {
    id: 'obsidian-studio',
    labelKey: 'gradObsidian',
    angle: 140,
    stops: [
      { offset: 0, color: '#334155' },
      { offset: 0.55, color: '#1E293B' },
      { offset: 1, color: '#0F172A' },
    ],
  },
  {
    id: 'terracotta-sun',
    labelKey: 'gradTerracotta',
    angle: 125,
    stops: [
      { offset: 0, color: '#FFF1F2' },
      { offset: 0.5, color: '#FECDD3' },
      { offset: 1, color: '#E11D48' },
    ],
  },
  {
    id: 'nordic-sky',
    labelKey: 'gradNordic',
    angle: 135,
    stops: [
      { offset: 0, color: '#F0F9FF' },
      { offset: 0.5, color: '#BAE6FD' },
      { offset: 1, color: '#0284C7' },
    ],
  },
];

export const SOLID_COLOR_PRESETS = [
  { id: 'amazon-white', color: '#FFFFFF', labelKey: 'presetAmazonWhite' },
  { id: 'studio-gray', color: '#F3F4F6', labelKey: 'presetStudioGray' },
  { id: 'warm-sand', color: '#F5EFE6', labelKey: 'presetWarmSand' },
  { id: 'obsidian', color: '#0F172A', labelKey: 'presetObsidian' },
  { id: 'emerald', color: '#0D9488', labelKey: 'presetEmerald' },
  { id: 'cobalt', color: '#1D4ED8', labelKey: 'presetCobalt' },
] as const;

export function createInitialEditState(
  fileName = 'alhaj-cut-export'
): StudioEditState {
  return {
    background: {
      mode: 'transparent',
      solidColor: '#FFFFFF',
      gradientId: 'alabaster-mist',
      customImageUrl: null,
      bokehBlur: 14,
    },
    textLayers: [],
    selectedTextId: null,
    effects: {
      strokeEnabled: false,
      strokeWidth: 10,
      strokeColor: '#FFFFFF',
      shadowEnabled: false,
      shadowOffsetX: 0,
      shadowOffsetY: 18,
      shadowBlur: 28,
      shadowOpacity: 0.32,
      shadowColor: '#0F172A',
    },
    subjectAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS },
    bgAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS },
    aspectPreset: 'original',
    subjectScale: 1,
    subjectOffsetX: 0,
    subjectOffsetY: 0,
    exportSettings: {
      format: 'image/png',
      quality: 0.92,
      scale: 1,
      fileName,
    },
  };
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Computes base composite canvas pixel dimensions for a given aspect ratio preset.
 */
export function computeCanvasDimensions(
  originalWidth: number,
  originalHeight: number,
  preset: AspectPresetId
): Dimensions {
  const safeW = Math.max(1, Math.round(originalWidth));
  const safeH = Math.max(1, Math.round(originalHeight));

  switch (preset) {
    case 'amazon-square':
      return { width: 1080, height: 1080 };
    case 'youtube-16-9':
      return { width: 1920, height: 1080 };
    case 'reels-9-16':
      return { width: 1080, height: 1920 };
    case 'passport-35-45':
      return { width: 1050, height: 1350 };
    case 'original':
    default:
      return { width: safeW, height: safeH };
  }
}

/**
 * Computes final export pixel dimensions applying both aspect preset and resolution scale.
 */
export function computeExportDimensions(
  originalWidth: number,
  originalHeight: number,
  preset: AspectPresetId,
  scale = 1
): Dimensions {
  const base = computeCanvasDimensions(originalWidth, originalHeight, preset);
  const clampedScale = Math.max(0.25, Math.min(2, Number.isFinite(scale) ? scale : 1));
  return {
    width: Math.max(1, Math.round(base.width * clampedScale)),
    height: Math.max(1, Math.round(base.height * clampedScale)),
  };
}

export interface PlacementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes subject draw rect inside canvas using aspect-preserving containment plus user scale & offset.
 */
export function computeSubjectRect(
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0
): PlacementRect {
  const sW = Math.max(1, sourceWidth);
  const sH = Math.max(1, sourceHeight);
  const cW = Math.max(1, canvasWidth);
  const cH = Math.max(1, canvasHeight);

  const fitRatio = Math.min(cW / sW, cH / sH);
  const drawW = sW * fitRatio * scale;
  const drawH = sH * fitRatio * scale;

  const x = (cW - drawW) / 2 + offsetX * cW;
  const y = (cH - drawH) / 2 + offsetY * cH;

  return { x, y, width: drawW, height: drawH };
}

/**
 * Computes cover placement rect (for background photos & DSLR bokeh original layer) with optional bleed margin.
 */
export function computeCoverRect(
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  bleedPx = 0
): PlacementRect {
  const sW = Math.max(1, sourceWidth);
  const sH = Math.max(1, sourceHeight);
  const targetW = Math.max(1, canvasWidth) + bleedPx * 2;
  const targetH = Math.max(1, canvasHeight) + bleedPx * 2;

  const coverRatio = Math.max(targetW / sW, targetH / sH);
  const drawW = sW * coverRatio;
  const drawH = sH * coverRatio;

  return {
    x: (canvasWidth - drawW) / 2,
    y: (canvasHeight - drawH) / 2,
    width: drawW,
    height: drawH,
  };
}

/**
 * Computes exact CSS display dimensions to fit a canvas inside a viewport stage without aspect distortion.
 */
export function computeFittedDisplaySize(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 32,
  maxUpscale = 4
): Dimensions {
  const cW = Math.max(1, canvasWidth);
  const cH = Math.max(1, canvasHeight);
  const availW = Math.max(120, viewportWidth - padding);
  const availH = Math.max(120, viewportHeight - padding);

  const fitRatio = Math.min(availW / cW, availH / cH, maxUpscale);
  return {
    width: Math.max(1, Math.round(cW * fitRatio)),
    height: Math.max(1, Math.round(cH * fitRatio)),
  };
}

/**
 * Clamps pan offsets so a portion of the zoomed canvas always remains reachable inside the viewport.
 */
export function clampPanOffset(
  panX: number,
  panY: number,
  displayWidth: number,
  displayHeight: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const scaledW = displayWidth * zoom;
  const scaledH = displayHeight * zoom;
  const visibleMarginX = Math.min(96, scaledW * 0.25);
  const visibleMarginY = Math.min(96, scaledH * 0.25);

  const maxOffsetX = Math.max(0, (viewportWidth + scaledW) / 2 - visibleMarginX);
  const maxOffsetY = Math.max(0, (viewportHeight + scaledH) / 2 - visibleMarginY);

  return {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, panX)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, panY)),
  };
}

/**
 * Adjusts pan when zooming around a specific point inside the viewport so that pixel stays anchored.
 */
export function computeZoomAroundPoint(
  currentZoom: number,
  nextZoom: number,
  currentPan: { x: number; y: number },
  cursorLocalX: number,
  cursorLocalY: number,
  viewportWidth: number,
  viewportHeight: number,
  displayWidth: number,
  displayHeight: number
): { zoom: number; pan: { x: number; y: number } } {
  const safeCurrentZoom = Math.max(0.1, currentZoom);
  const clampedZoom = Math.max(0.25, Math.min(5, Number(nextZoom.toFixed(3))));
  const dx = cursorLocalX - viewportWidth / 2;
  const dy = cursorLocalY - viewportHeight / 2;

  const localX = (dx - currentPan.x) / safeCurrentZoom;
  const localY = (dy - currentPan.y) / safeCurrentZoom;

  const rawPanX = dx - localX * clampedZoom;
  const rawPanY = dy - localY * clampedZoom;

  const pan = clampPanOffset(
    rawPanX,
    rawPanY,
    displayWidth,
    displayHeight,
    clampedZoom,
    viewportWidth,
    viewportHeight
  );

  return { zoom: clampedZoom, pan };
}

/**
 * Maps screen client coordinates into internal canvas pixels accurately under CSS transform zoom & pan.
 */
export function screenToCanvasPoint(
  clientX: number,
  clientY: number,
  canvasRect: { left: number; top: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): { cx: number; cy: number } | null {
  if (canvasRect.width <= 0 || canvasRect.height <= 0) return null;
  const cx = ((clientX - canvasRect.left) / canvasRect.width) * canvasWidth;
  const cy = ((clientY - canvasRect.top) / canvasRect.height) * canvasHeight;
  return { cx, cy };
}

/**
 * Maps internal composite canvas pixels to mutable original mask canvas coordinates.
 */
export function canvasToMaskPoint(
  cx: number,
  cy: number,
  subjectRect: PlacementRect,
  maskWidth: number,
  maskHeight: number
): { mx: number; my: number } | null {
  if (subjectRect.width <= 0 || subjectRect.height <= 0) return null;
  const mx = ((cx - subjectRect.x) / subjectRect.width) * maskWidth;
  const my = ((cy - subjectRect.y) / subjectRect.height) * maskHeight;
  return { mx, my };
}

/**
 * Computes exact CSS diameter (px) of the brush cursor ring matching the painted stroke in mask space.
 */
export function computeScreenBrushDiameter(
  brushSize: number,
  cutoutWidth: number,
  cutoutHeight: number,
  maskWidth: number,
  subjectRectWidth: number,
  canvasWidth: number,
  canvasRectWidth: number
): number {
  if (maskWidth <= 0 || canvasWidth <= 0 || canvasRectWidth <= 0) {
    return Math.max(8, Math.round(brushSize));
  }
  const resFactor = Math.max(cutoutWidth, cutoutHeight) / 1000;
  const maskStrokeDiameter = brushSize * resFactor;
  const maskToCanvasScale = subjectRectWidth / maskWidth;
  const canvasToScreenScale = canvasRectWidth / canvasWidth;
  return Math.max(
    8,
    Math.round(maskStrokeDiameter * maskToCanvasScale * canvasToScreenScale)
  );
}

/**
 * Builds an HTML5 Canvas 2D CSS filter string from studio color adjustments.
 */
export function buildCanvasFilterString(
  adjust: ColorAdjustments,
  extraBlurPx = 0
): string {
  const filters: string[] = [];

  if (adjust.brightness !== 100) {
    filters.push(`brightness(${adjust.brightness}%)`);
  }
  if (adjust.contrast !== 100) {
    filters.push(`contrast(${adjust.contrast}%)`);
  }
  if (adjust.saturation !== 100) {
    filters.push(`saturate(${adjust.saturation}%)`);
  }
  if (adjust.warmth > 0) {
    filters.push(`sepia(${Math.min(60, Math.round(adjust.warmth * 0.9))}%)`);
  } else if (adjust.warmth < 0) {
    filters.push(`hue-rotate(${Math.max(-25, Math.round(adjust.warmth * 0.45))}deg)`);
  }
  if (extraBlurPx > 0) {
    filters.push(`blur(${extraBlurPx}px)`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Formats byte count into a clean human-readable string (e.g., 248 KB, 1.42 MB).
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Returns file extension for a given export MIME format.
 */
export function getExtensionForFormat(format: ExportFormat): string {
  switch (format) {
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
    default:
      return 'png';
  }
}

/**
 * Sanitizes an uploaded filename into a safe export base name.
 */
export function sanitizeExportBaseName(rawName: string): string {
  const withoutExt = rawName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .trim()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'alhaj-cut-studio';
}

/**
 * Generates collision-free export base names across batch items (e.g. photo, photo-2, photo-3).
 */
export function getUniqueExportBaseName(
  rawName: string,
  usedNames: Set<string>
): string {
  const base = sanitizeExportBaseName(rawName);
  let candidate = base;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  usedNames.add(candidate);
  return candidate;
}

/**
 * Resolves the fallback engine order.
 * Local engines NEVER auto-upload user photos to cloud services on failure.
 */
export function resolveFallbackEngines(preferred: AiEngineId): AiEngineId[] {
  switch (preferred) {
    case 'notlain-cloud':
      return ['notlain-cloud', 'rmbg-local', 'imgly-local'];
    case 'imgly-local':
      return ['imgly-local', 'rmbg-local'];
    case 'rmbg-local':
    default:
      return ['rmbg-local', 'imgly-local'];
  }
}

export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistoryStack<T>(initial: T): HistoryStack<T> {
  return { past: [], present: initial, future: [] };
}

export function pushHistory<T>(
  stack: HistoryStack<T>,
  nextPresent: T,
  maxSteps = MAX_HISTORY_STEPS
): HistoryStack<T> {
  const nextPast = [...stack.past, stack.present];
  if (nextPast.length > maxSteps) {
    nextPast.shift();
  }
  return {
    past: nextPast,
    present: nextPresent,
    future: [],
  };
}

export function undoHistory<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.past.length === 0) return stack;
  const previous = stack.past[stack.past.length - 1];
  return {
    past: stack.past.slice(0, -1),
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

export function redoHistory<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.future.length === 0) return stack;
  const next = stack.future[0];
  return {
    past: [...stack.past, stack.present],
    present: next,
    future: stack.future.slice(1),
  };
}
