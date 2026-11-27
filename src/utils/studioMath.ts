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

export function createInitialEditState(fileName = 'noorcut-export'): StudioEditState {
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
      fileName,
    },
  };
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Computes final export canvas pixel dimensions for a given aspect ratio preset.
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
 * Builds an HTML5 Canvas 2D CSS filter string from studio color adjustments.
 */
export function buildCanvasFilterString(adjust: ColorAdjustments, extraBlurPx = 0): string {
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
    // Positive warmth adds gentle sepia warmth
    filters.push(`sepia(${Math.min(60, Math.round(adjust.warmth * 0.9))}%)`);
  } else if (adjust.warmth < 0) {
    // Negative warmth shifts subtly cooler via hue-rotate
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
  return cleaned || 'noorcut-studio';
}

/**
 * Resolves the fallback engine order for resilient Triple-Engine AI execution.
 * Engine 1 (rmbg-local) is always the guaranteed on-device safety net.
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
