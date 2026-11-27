export type AiEngineId = 'rmbg-local' | 'imgly-local' | 'notlain-cloud';

export type AiExecutionBackend =
  | 'webgpu'
  | 'wasm-mt'
  | 'wasm-st'
  | 'cloud'
  | 'manual';

export interface RuntimeCapabilities {
  protocol: 'http' | 'https' | 'file';
  isFileProtocol: boolean;
  isSecureContext: boolean;
  crossOriginIsolated: boolean;
  hasWebGPU: boolean;
  webgpuAdapterName?: string;
  webgpuFp16: boolean;
  hasSharedArrayBuffer: boolean;
  recommendedThreads: number;
  isOnline: boolean;
  localAiSupported: boolean;
}

export type WorkspaceMode = 'single' | 'bulk';

export type InspectorTab =
  | 'background'
  | 'text'
  | 'effects'
  | 'brush'
  | 'adjust'
  | 'export';

export type BackgroundMode =
  | 'transparent'
  | 'solid'
  | 'gradient'
  | 'image'
  | 'bokeh';

export interface GradientPreset {
  id: string;
  labelKey: string;
  angle: number;
  stops: { offset: number; color: string }[];
}

export interface BackgroundSettings {
  mode: BackgroundMode;
  solidColor: string;
  gradientId: string;
  customImageUrl: string | null;
  bokehBlur: number; // 0 to 40 px
}

export type TextPlacement = 'behind' | 'front';

export type StudioFontFamily =
  | 'Cairo'
  | 'Tajawal'
  | 'Readex Pro'
  | 'Anton'
  | 'Plus Jakarta Sans'
  | 'Playfair Display';

export interface TextLayer {
  id: string;
  content: string;
  placement: TextPlacement;
  fontFamily: StudioFontFamily;
  fontSize: number; // relative to 1080px reference height (e.g. 96)
  fontWeight: number;
  color: string;
  strokeWidth: number;
  strokeColor: string;
  shadowBlur: number;
  shadowColor: string;
  rotation: number; // degrees -180..180
  x: number; // normalized 0..1 of canvas width
  y: number; // normalized 0..1 of canvas height
  opacity: number; // 0..1
}

export interface StrokeShadowSettings {
  strokeEnabled: boolean;
  strokeWidth: number; // 0..32 px
  strokeColor: string;
  shadowEnabled: boolean;
  shadowOffsetX: number; // -40..40 px
  shadowOffsetY: number; // -40..40 px
  shadowBlur: number; // 0..60 px
  shadowOpacity: number; // 0..1
  shadowColor: string;
}

export interface ColorAdjustments {
  brightness: number; // 50..150 (100 = neutral)
  contrast: number; // 50..150
  saturation: number; // 0..200
  warmth: number; // -50..50
}

export type AspectPresetId =
  | 'original'
  | 'amazon-square'
  | 'youtube-16-9'
  | 'reels-9-16'
  | 'passport-35-45';

export interface BrushSettings {
  active: boolean;
  mode: 'erase' | 'restore';
  size: number; // 8..120 px (in normalized 1000px reference space)
  softness: number; // 0..1
}

export type ExportFormat = 'image/png' | 'image/webp' | 'image/jpeg';

export interface ExportSettings {
  format: ExportFormat;
  quality: number; // 0.5..1.0
  scale: number; // 0.5 | 0.75 | 1
  fileName: string;
}

export interface StudioEditState {
  background: BackgroundSettings;
  textLayers: TextLayer[];
  selectedTextId: string | null;
  effects: StrokeShadowSettings;
  subjectAdjust: ColorAdjustments;
  bgAdjust: ColorAdjustments;
  aspectPreset: AspectPresetId;
  subjectScale: number; // 0.5..1.4
  subjectOffsetX: number; // -0.4..0.4
  subjectOffsetY: number; // -0.4..0.4
  exportSettings: ExportSettings;
}

export interface EngineProgress {
  phase:
    | 'loading-runtime'
    | 'downloading-model'
    | 'inferring'
    | 'refining'
    | 'fallback';
  percent: number;
  engineId?: AiEngineId;
  backend?: AiExecutionBackend;
  loadedMB?: number;
  totalMB?: number;
  message?: string;
}

export interface CutoutResult {
  originalCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  initialMaskData: ImageData;
  width: number;
  height: number;
  engineUsed: AiEngineId;
  backendUsed?: AiExecutionBackend;
  fallbackFrom?: AiEngineId;
  fallbackReason?: string;
  durationMs: number;
}

export interface BatchGlobalSettings {
  backgroundType: 'transparent' | 'white' | 'studio-gray' | 'custom';
  customColor: string;
  aspectPreset: AspectPresetId;
  watermarkText: string;
  watermarkOpacity: number;
  format: ExportFormat;
  quality: number;
}

export type BatchItemStatus = 'queued' | 'processing' | 'done' | 'error';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  sourceUrl: string;
  selected: boolean;
  status: BatchItemStatus;
  progress: number;
  width?: number;
  height?: number;
  engineUsed?: AiEngineId;
  backendUsed?: AiExecutionBackend;
  errorMessage?: string;
  maskBlob?: Blob;
  previewUrl?: string;
}

export interface SamplePhoto {
  id: 'portrait' | 'product' | 'sneaker';
  labelKey: 'samplePortrait' | 'sampleProduct' | 'sampleSneaker';
  url: string;
  fileName: string;
}
