import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Images,
  Info,
  Layers,
  Loader2,
  Paintbrush,
  RotateCcw,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { BeforeAfterCurtain } from './components/BeforeAfterCurtain';
import { BulkStudio } from './components/BulkStudio';
import { Header } from './components/Header';
import { LandingSections } from './components/LandingSections';
import { StudioCanvas } from './components/StudioCanvas';
import { StudioInspector } from './components/StudioInspector';
import { HERO_SHOWCASE_AFTER_URL, SAMPLE_PHOTOS } from './data/samplePhotos';
import { useI18n } from './i18n/useI18n';
import {
  createManualCutout,
  detectRuntimeCapabilities,
  removeBackgroundWithAI,
  resolveImageSourceToBlob,
} from './services/aiBgEngine';
import type {
  AiEngineId,
  BrushSettings,
  CutoutResult,
  EngineProgress,
  InspectorTab,
  RuntimeCapabilities,
  StudioEditState,
  WorkspaceMode,
} from './types/studio';
import {
  evictBgImageCache,
  exportCanvasToBlob,
  loadImageElement,
  releaseCompositorScratchBuffers,
  renderStudioComposite,
} from './utils/canvasCompositor';
import {
  computeExportDimensions,
  createHistoryStack,
  createInitialEditState,
  getExtensionForFormat,
  pushHistory,
  redoHistory,
  sanitizeExportBaseName,
  undoHistory,
  type HistoryStack,
} from './utils/studioMath';

interface MaskSnapshot {
  maskData: ImageData;
  editState: StudioEditState;
}

const DEFAULT_CAPS: RuntimeCapabilities = {
  protocol:
    typeof window !== 'undefined' && window.location.protocol === 'file:'
      ? 'file'
      : typeof window !== 'undefined' && window.location.protocol === 'http:'
      ? 'http'
      : 'https',
  isFileProtocol:
    typeof window !== 'undefined' && window.location.protocol === 'file:',
  isSecureContext:
    typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
  crossOriginIsolated:
    typeof window !== 'undefined' ? Boolean(window.crossOriginIsolated) : false,
  hasWebGPU: false,
  webgpuFp16: false,
  hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  recommendedThreads: 1,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  localAiSupported:
    typeof window !== 'undefined' ? window.location.protocol !== 'file:' : true,
};

function releaseCutoutBuffers(result: CutoutResult | null) {
  if (!result) return;
  result.originalCanvas.width = 0;
  result.originalCanvas.height = 0;
  result.maskCanvas.width = 0;
  result.maskCanvas.height = 0;
}

export default function App() {
  const { locale, t, setLocale } = useI18n();
  const [mode, setMode] = useState<WorkspaceMode>('single');
  const [selectedEngine, setSelectedEngine] = useState<AiEngineId>('rmbg-local');
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities>(DEFAULT_CAPS);

  // Explicit opt-in consent for Cloud ZeroGPU processing
  const [cloudConsentGranted, setCloudConsentGranted] = useState(false);
  const [cloudConsentPrompt, setCloudConsentPrompt] = useState<{
    resolve: (ok: boolean) => void;
  } | null>(null);

  // Active Single Studio session state
  const [cutout, setCutout] = useState<CutoutResult | null>(null);
  const [currentSource, setCurrentSource] = useState<{
    source: File | string;
    fileName: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<EngineProgress | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'info' | 'error';
    text: string;
    canOpenManual?: boolean;
    canRetry?: boolean;
  } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Editor state + unified Undo/Redo stack
  const [editState, setEditState] = useState<StudioEditState>(() =>
    createInitialEditState()
  );
  const [history, setHistory] = useState<HistoryStack<MaskSnapshot> | null>(null);
  const [maskRevision, setMaskRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<InspectorTab>('background');
  const [customBgImage, setCustomBgImage] = useState<HTMLImageElement | null>(null);
  const [brush, setBrush] = useState<BrushSettings>({
    active: false,
    mode: 'erase',
    size: 42,
    softness: 0.45,
  });

  const [estimatedBytes, setEstimatedBytes] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const manualFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);
  const cutoutRef = useRef<CutoutResult | null>(null);
  cutoutRef.current = cutout;
  const customBgUrlRef = useRef<string | null>(null);
  customBgUrlRef.current = editState.background.customImageUrl;

  // Detect browser capabilities (WebGPU, COI, Online/Offline, file://)
  useEffect(() => {
    detectRuntimeCapabilities(true).then(setCapabilities).catch(() => {});
    const onNetChange = () => {
      setCapabilities((prev) => ({ ...prev, isOnline: navigator.onLine }));
    };
    window.addEventListener('online', onNetChange);
    window.addEventListener('offline', onNetChange);
    return () => {
      window.removeEventListener('online', onNetChange);
      window.removeEventListener('offline', onNetChange);
      activeAbortRef.current?.abort();
      releaseCutoutBuffers(cutoutRef.current);
      releaseCompositorScratchBuffers();
      if (customBgUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(customBgUrlRef.current);
      }
    };
  }, []);

  const ensureCloudConsent = useCallback((): Promise<boolean> => {
    if (cloudConsentGranted) return Promise.resolve(true);
    return new Promise((resolve) => {
      setCloudConsentPrompt({
        resolve: (ok: boolean) => {
          setCloudConsentPrompt(null);
          if (ok) setCloudConsentGranted(true);
          resolve(ok);
        },
      });
    });
  }, [cloudConsentGranted]);

  const engineDescription = useMemo(() => {
    if (selectedEngine === 'rmbg-local') return t.engineRmbgDesc;
    if (selectedEngine === 'imgly-local') return t.engineImglyDesc;
    return t.engineCloudDesc;
  }, [selectedEngine, t]);

  const outputDimensions = useMemo(() => {
    if (!cutout) return { width: 0, height: 0 };
    return computeExportDimensions(
      cutout.width,
      cutout.height,
      editState.aspectPreset,
      editState.exportSettings.scale || 1
    );
  }, [cutout, editState.aspectPreset, editState.exportSettings.scale]);

  const cloneMaskData = useCallback((canvas: HTMLCanvasElement): ImageData => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Mask context unavailable');
    const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height);
  }, []);

  const restoreMaskData = useCallback((canvas: HTMLCanvasElement, data: ImageData) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
    setMaskRevision((r) => r + 1);
  }, []);

  const applyCutoutSession = useCallback(
    (result: CutoutResult, fileName: string) => {
      const prevCutout = cutoutRef.current;
      if (prevCutout && prevCutout !== result) {
        releaseCutoutBuffers(prevCutout);
      }
      if (customBgUrlRef.current?.startsWith('blob:')) {
        evictBgImageCache(customBgUrlRef.current);
        URL.revokeObjectURL(customBgUrlRef.current);
      }

      const freshEdit = createInitialEditState(sanitizeExportBaseName(fileName));
      setCutout(result);
      setEditState(freshEdit);
      setCustomBgImage(null);
      setBrush((prev) => ({
        ...prev,
        active: false,
      }));
      if (result.backendUsed === 'manual') {
        setActiveTab('brush');
      }
      setMaskRevision((r) => r + 1);

      const initialSnap: MaskSnapshot = {
        maskData: new ImageData(
          new Uint8ClampedArray(result.initialMaskData.data),
          result.initialMaskData.width,
          result.initialMaskData.height
        ),
        editState: freshEdit,
      };
      setHistory(createHistoryStack(initialSnap));
    },
    []
  );

  const openInManualStudio = useCallback(
    async (source: File | string, fileName: string) => {
      setMode('single');
      setCurrentSource({ source, fileName });
      setStatusNotice(null);
      try {
        const result = await createManualCutout(source);
        applyCutoutSession(result, fileName);
      } catch (err) {
        setStatusNotice({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Could not decode the selected image.',
        });
      }
    },
    [applyCutoutSession]
  );

  const startCutoutProcess = useCallback(
    async (source: File | string, fileName: string, engineOverride?: AiEngineId) => {
      const engineToUse = engineOverride || selectedEngine;

      if (engineToUse === 'notlain-cloud') {
        const ok = await ensureCloudConsent();
        if (!ok) {
          setSelectedEngine('rmbg-local');
          return;
        }
      }

      // Resolve string URLs (samples) while hero thumbnails are still mounted in DOM
      let resolvedSource: File | string = source;
      if (typeof source === 'string') {
        try {
          const blob = await resolveImageSourceToBlob(source);
          resolvedSource = new File([blob], fileName, {
            type: blob.type || 'image/jpeg',
          });
        } catch {
          resolvedSource = source;
        }
      }

      activeAbortRef.current?.abort();
      const controller = new AbortController();
      activeAbortRef.current = controller;

      setMode('single');
      setCurrentSource({ source: resolvedSource, fileName });
      setIsProcessing(true);
      setStatusNotice(null);
      setProgress({
        phase: 'loading-runtime',
        percent: 6,
        engineId: engineToUse,
      });

      try {
        const result = await removeBackgroundWithAI(
          resolvedSource,
          engineToUse,
          (p) => setProgress(p),
          { signal: controller.signal }
        );

        applyCutoutSession(result, fileName);

        if (result.fallbackFrom) {
          setStatusNotice({
            type: 'info',
            text: t.processingFallbackNotice,
          });
        }
      } catch (err) {
        const errName = (err as Error)?.name;
        const msg = err instanceof Error ? err.message : '';

        if (errName === 'AbortError') {
          setStatusNotice({
            type: 'info',
            text: t.processingCanceled,
            canOpenManual: true,
            canRetry: true,
          });
        } else if (
          errName === 'FileProtocolError' ||
          msg === 'FILE_PROTOCOL_AI_BLOCKED'
        ) {
          setStatusNotice({
            type: 'error',
            text: t.fileModeAiBlocked,
            canOpenManual: true,
            canRetry: false,
          });
        } else if (!navigator.onLine) {
          setStatusNotice({
            type: 'error',
            text: t.offlineNoModelNotice,
            canOpenManual: true,
            canRetry: true,
          });
        } else {
          setStatusNotice({
            type: 'error',
            text: msg || 'Could not complete background removal.',
            canOpenManual: true,
            canRetry: true,
          });
        }
      } finally {
        activeAbortRef.current = null;
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [
      selectedEngine,
      ensureCloudConsent,
      applyCutoutSession,
      t.processingFallbackNotice,
      t.processingCanceled,
      t.fileModeAiBlocked,
      t.offlineNoModelNotice,
    ]
  );

  // Debounced history recording for slider & style edits
  const historyDebounceRef = useRef<number | null>(null);
  const handleUpdateEditState = useCallback(
    (updater: (prev: StudioEditState) => StudioEditState) => {
      setEditState((prev) => {
        const next = updater(prev);
        if (cutout) {
          if (historyDebounceRef.current) {
            window.clearTimeout(historyDebounceRef.current);
          }
          historyDebounceRef.current = window.setTimeout(() => {
            try {
              const maskData = cloneMaskData(cutout.maskCanvas);
              setHistory((h) =>
                h ? pushHistory(h, { maskData, editState: next }) : h
              );
            } catch {
              // Ignore if canvas disposed
            }
          }, 240);
        }
        return next;
      });
    },
    [cutout, cloneMaskData]
  );

  const handleCommitMaskEdit = useCallback(() => {
    if (!cutout) return;
    setMaskRevision((r) => r + 1);
    const maskData = cloneMaskData(cutout.maskCanvas);
    setHistory((h) => (h ? pushHistory(h, { maskData, editState }) : h));
  }, [cutout, cloneMaskData, editState]);

  const handleCommitTextMove = useCallback(() => {
    if (!cutout) return;
    const maskData = cloneMaskData(cutout.maskCanvas);
    setHistory((h) => (h ? pushHistory(h, { maskData, editState }) : h));
  }, [cutout, cloneMaskData, editState]);

  const handleResetMask = useCallback(() => {
    if (!cutout) return;
    const copy = new ImageData(
      new Uint8ClampedArray(cutout.initialMaskData.data),
      cutout.initialMaskData.width,
      cutout.initialMaskData.height
    );
    restoreMaskData(cutout.maskCanvas, copy);
    setHistory((h) => (h ? pushHistory(h, { maskData: copy, editState }) : h));
  }, [cutout, editState, restoreMaskData]);

  const handleUndo = useCallback(() => {
    if (!cutout || !history || history.past.length === 0) return;
    const nextStack = undoHistory(history);
    setHistory(nextStack);
    setEditState(nextStack.present.editState);
    restoreMaskData(cutout.maskCanvas, nextStack.present.maskData);
  }, [cutout, history, restoreMaskData]);

  const handleRedo = useCallback(() => {
    if (!cutout || !history || history.future.length === 0) return;
    const nextStack = redoHistory(history);
    setHistory(nextStack);
    setEditState(nextStack.present.editState);
    restoreMaskData(cutout.maskCanvas, nextStack.present.maskData);
  }, [cutout, history, restoreMaskData]);

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!cutout || mode !== 'single') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (mod && e.key.toLowerCase() === 'y') ||
        (mod && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cutout, mode, handleUndo, handleRedo]);

  // Estimate live output file size whenever visual/format/quality/scale changes on Export tab
  useEffect(() => {
    if (!cutout || activeTab !== 'export') return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const tempCanvas = document.createElement('canvas');
      try {
        renderStudioComposite({
          targetCanvas: tempCanvas,
          originalCanvas: cutout.originalCanvas,
          maskCanvas: cutout.maskCanvas,
          state: editState,
          customBgImage,
          exportScale: editState.exportSettings.scale || 1,
          forceOpaqueBackgroundForJpg:
            editState.exportSettings.format === 'image/jpeg',
        });
        const blob = await exportCanvasToBlob(
          tempCanvas,
          editState.exportSettings.format,
          editState.exportSettings.quality
        );
        if (!cancelled) setEstimatedBytes(blob.size);
      } catch {
        // Ignore transient estimation errors
      } finally {
        tempCanvas.width = 0;
        tempCanvas.height = 0;
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    cutout,
    activeTab,
    editState.background,
    editState.textLayers,
    editState.effects,
    editState.subjectAdjust,
    editState.bgAdjust,
    editState.aspectPreset,
    editState.subjectScale,
    editState.subjectOffsetX,
    editState.subjectOffsetY,
    editState.exportSettings.format,
    editState.exportSettings.quality,
    editState.exportSettings.scale,
    customBgImage,
    maskRevision,
  ]);

  const handleUploadCustomBg = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      const oldUrl = editState.background.customImageUrl;
      if (oldUrl && oldUrl.startsWith('blob:')) {
        evictBgImageCache(oldUrl);
        URL.revokeObjectURL(oldUrl);
      }
      setCustomBgImage(img);
      handleUpdateEditState((prev) => ({
        ...prev,
        background: {
          ...prev.background,
          mode: 'image',
          customImageUrl: url,
        },
      }));
    } catch {
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadExport = async () => {
    if (!cutout) return;
    setIsExporting(true);
    const exportCanvas = document.createElement('canvas');
    try {
      renderStudioComposite({
        targetCanvas: exportCanvas,
        originalCanvas: cutout.originalCanvas,
        maskCanvas: cutout.maskCanvas,
        state: editState,
        customBgImage,
        exportScale: editState.exportSettings.scale || 1,
        forceOpaqueBackgroundForJpg:
          editState.exportSettings.format === 'image/jpeg',
      });
      const blob = await exportCanvasToBlob(
        exportCanvas,
        editState.exportSettings.format,
        editState.exportSettings.quality
      );
      setEstimatedBytes(blob.size);
      const ext = getExtensionForFormat(editState.exportSettings.format);
      const safeName = sanitizeExportBaseName(editState.exportSettings.fileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${ext}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } finally {
      exportCanvas.width = 0;
      exportCanvas.height = 0;
      setIsExporting(false);
    }
  };

  const handleOpenCutoutFromBulk = (
    bulkCutout: CutoutResult,
    fileName: string,
    sourceFile: File
  ) => {
    setCurrentSource({ source: sourceFile, fileName });
    applyCutoutSession(bulkCutout, fileName);
    setMode('single');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progressHeadline = useMemo(() => {
    if (!progress) return '';
    if (progress.phase === 'downloading-model') {
      if (progress.loadedMB !== undefined && progress.totalMB) {
        return `${t.processingDownloading} (${progress.loadedMB} MB / ${progress.totalMB} MB)`;
      }
      return t.processingInitRmbg;
    }
    if (progress.phase === 'inferring') return t.processingInferring;
    if (progress.phase === 'refining') return t.processingRefining;
    if (progress.phase === 'fallback') return t.processingFallbackNotice;
    return t.processingInitRmbg;
  }, [progress, t]);

  return (
    <div
      id="studio-top"
      className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]"
    >
      <Header
        locale={locale}
        onLocaleChange={setLocale}
        t={t}
        mode={mode}
        onModeChange={setMode}
        selectedEngine={selectedEngine}
        onEngineChange={setSelectedEngine}
        capabilities={capabilities}
      />

      <main
        id="studio-workspace"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-5"
      >
        {/* Workspace Mode Switcher + Subtle Active Engine Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Workspace Mode"
            className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'single'}
              onClick={() => setMode('single')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'single'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>{t.modeSingle}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'bulk'}
              onClick={() => setMode('bulk')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              <Images className="h-4 w-4" aria-hidden="true" />
              <span>{t.modeBulk}</span>
            </button>
          </div>

          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            {engineDescription}
          </p>
        </div>

        {/* Direct File Protocol Notice (transparent capability explanation without disabling security) */}
        {capabilities.isFileProtocol && (
          <div
            role="note"
            data-testid="file-protocol-notice"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <span>{t.fileModeNotice}</span>
          </div>
        )}

        {/* Explicit Cloud Processing Privacy Confirmation */}
        {cloudConsentPrompt && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-xs sm:text-sm text-amber-950 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert
                className="h-4 w-4 shrink-0 mt-0.5 text-amber-700"
                aria-hidden="true"
              />
              <span className="font-medium leading-relaxed">
                {t.cloudPrivacyNotice}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => cloudConsentPrompt.resolve(false)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E293B] hover:bg-amber-100/50 cursor-pointer"
              >
                {t.cloudPrivacyCancel}
              </button>
              <button
                type="button"
                onClick={() => cloudConsentPrompt.resolve(true)}
                className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F766E] cursor-pointer"
              >
                {t.cloudPrivacyConfirm}
              </button>
            </div>
          </div>
        )}

        {/* Status / Error Notification with Retry & Manual Studio Fallback */}
        {statusNotice && (
          <div
            role="status"
            data-testid="studio-status-notice"
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium ${
              statusNotice.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-[#0D9488]/25 bg-[#0D9488]/5 text-[#0F766E]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {statusNotice.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span>{statusNotice.text}</span>
            </div>

            {(statusNotice.canRetry || statusNotice.canOpenManual) && currentSource && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {statusNotice.canRetry && (
                  <button
                    type="button"
                    onClick={() =>
                      startCutoutProcess(
                        currentSource.source,
                        currentSource.fileName
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-current/25 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-white/80 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.processingRetry}</span>
                  </button>
                )}
                {statusNotice.canOpenManual && (
                  <button
                    type="button"
                    data-testid="open-manual-studio-btn"
                    onClick={() =>
                      openInManualStudio(
                        currentSource.source,
                        currentSource.fileName
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F172A] cursor-pointer"
                  >
                    <Paintbrush className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.openManualStudio}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Real-Time AI Progress Bar + Cancel Button */}
        {isProcessing && progress && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Loader2
                  className="h-5 w-5 animate-spin text-[#0D9488] shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm sm:text-base font-semibold text-[#111827]">
                  {progressHeadline}
                </p>
                {progress.backend && (
                  <span className="rounded bg-[#0D9488]/10 px-2 py-0.5 text-[11px] font-bold uppercase text-[#0F766E]">
                    {progress.backend}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm font-bold text-[#0D9488] tabular-nums">
                  {progress.percent}%
                </span>
                <button
                  type="button"
                  onClick={() => activeAbortRef.current?.abort()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#475569] hover:text-rose-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.processingCancel}</span>
                </button>
              </div>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#0D9488] transition-all duration-200"
                style={{ width: `${Math.max(4, progress.percent)}%` }}
              />
            </div>
          </div>
        )}

        {/* SINGLE STUDIO WORKSPACE */}
        {mode === 'single' && !isProcessing && (
          <>
            {!cutout ? (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Primary Upload & Sample Selection Column */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-7 space-y-5">
                  <div className="space-y-2.5">
                    <h1 className="text-2xl sm:text-[34px] font-extrabold tracking-tight text-[#111827] leading-[1.18] [text-wrap:balance]">
                      {t.heroTitle}
                    </h1>
                    <p className="text-sm sm:text-[15px] leading-relaxed text-[#64748B] max-w-2xl">
                      {t.heroSubtitle}
                    </p>
                  </div>

                  {/* Interactive Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        if (capabilities.isFileProtocol) {
                          void openInManualStudio(file, file.name);
                        } else {
                          void startCutoutProcess(file, file.name);
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
                      isDraggingFile
                        ? 'border-[#0D9488] bg-[#0D9488]/5'
                        : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#0D9488]/60'
                    }`}
                  >
                    <input
                      ref={singleFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void startCutoutProcess(file, file.name);
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={manualFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void openInManualStudio(file, file.name);
                        e.target.value = '';
                      }}
                    />
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-[#E5E7EB] text-[#0D9488] shadow-xs">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="text-base font-bold text-[#111827]">{t.dropHeadline}</p>
                    <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
                      {t.dropSubline}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => singleFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#0F766E] transition-colors cursor-pointer"
                      >
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        <span>{t.dropButton}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => manualFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                      >
                        <Paintbrush className="h-4 w-4 text-[#0D9488]" aria-hidden="true" />
                        <span>{t.openManualStudio}</span>
                      </button>
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-[#64748B]">
                      {t.dropFormats}
                    </p>
                  </div>

                  {/* 1-Click Studio Sample Photos */}
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs font-semibold text-[#475569]">
                      {t.trySampleLabel}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {SAMPLE_PHOTOS.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          data-testid={`sample-photo-${sample.id}`}
                          onClick={() =>
                            capabilities.isFileProtocol
                              ? void openInManualStudio(sample.url, sample.fileName)
                              : void startCutoutProcess(sample.url, sample.fileName)
                          }
                          className="group overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-start transition-all hover:border-[#0D9488] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3F4F6]">
                            <img
                              src={sample.url}
                              alt={t[sample.labelKey]}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <div className="px-2.5 py-2 text-[11px] sm:text-xs font-semibold text-[#1E293B] truncate">
                            {t[sample.labelKey]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Before/After Showcase Column */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                      {t.showcaseTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B]">
                      {t.showcaseSubtitle}
                    </p>
                  </div>

                  <BeforeAfterCurtain
                    beforeSrc={SAMPLE_PHOTOS[0].url}
                    afterSrc={HERO_SHOWCASE_AFTER_URL}
                    beforeLabel={t.compareBefore}
                    afterLabel={t.compareAfter}
                    alt={t.samplePortrait}
                    aspectClass="aspect-[4/3] lg:flex-1"
                    imageFit="cover"
                  />

                  <div className="flex items-center justify-between gap-3 text-xs text-[#64748B]">
                    <span>{t.compareDragHint}</span>
                    <button
                      type="button"
                      onClick={() =>
                        capabilities.isFileProtocol
                          ? void openInManualStudio(
                              SAMPLE_PHOTOS[0].url,
                              SAMPLE_PHOTOS[0].fileName
                            )
                          : void startCutoutProcess(
                              SAMPLE_PHOTOS[0].url,
                              SAMPLE_PHOTOS[0].fileName
                            )
                      }
                      className="inline-flex items-center gap-1 font-semibold text-[#0D9488] hover:underline whitespace-nowrap cursor-pointer"
                    >
                      <span>{t.samplePortrait}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* Active Multi-Layer Single Studio Editor */
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-8">
                  <StudioCanvas
                    cutout={cutout}
                    state={editState}
                    brush={brush}
                    customBgImage={customBgImage}
                    maskRevision={maskRevision}
                    selectedEngine={selectedEngine}
                    t={t}
                    canUndo={Boolean(history && history.past.length > 0)}
                    canRedo={Boolean(history && history.future.length > 0)}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onCommitMaskEdit={handleCommitMaskEdit}
                    onSelectTextLayer={(id) =>
                      setEditState((prev) => ({ ...prev, selectedTextId: id }))
                    }
                    onMoveTextLayer={(id, x, y) =>
                      setEditState((prev) => ({
                        ...prev,
                        textLayers: prev.textLayers.map((l) =>
                          l.id === id ? { ...l, x, y } : l
                        ),
                      }))
                    }
                    onCommitTextMove={handleCommitTextMove}
                    onReprocessEngine={() => {
                      if (currentSource) {
                        void startCutoutProcess(
                          currentSource.source,
                          editState.exportSettings.fileName,
                          selectedEngine
                        );
                      }
                    }}
                    onResetToUpload={() => {
                      releaseCutoutBuffers(cutout);
                      if (customBgUrlRef.current?.startsWith('blob:')) {
                        evictBgImageCache(customBgUrlRef.current);
                        URL.revokeObjectURL(customBgUrlRef.current);
                      }
                      setCutout(null);
                      setCustomBgImage(null);
                      setCurrentSource(null);
                      setStatusNotice(null);
                      setHistory(null);
                    }}
                  />
                </div>

                <div className="lg:col-span-4">
                  <StudioInspector
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    state={editState}
                    onUpdateState={handleUpdateEditState}
                    brush={brush}
                    onUpdateBrush={setBrush}
                    onResetMask={handleResetMask}
                    onUploadCustomBg={handleUploadCustomBg}
                    estimatedBytes={estimatedBytes}
                    outputDimensions={outputDimensions}
                    isExporting={isExporting}
                    onDownloadExport={handleDownloadExport}
                    t={t}
                  />
                </div>
              </section>
            )}
          </>
        )}

        {/* BULK / BATCH WORKSPACE (Kept mounted so switching tabs preserves user's batch queue) */}
        <div className={mode === 'bulk' ? 'block' : 'hidden'}>
          <BulkStudio
            selectedEngine={selectedEngine}
            capabilities={capabilities}
            t={t}
            onEnsureCloudConsent={ensureCloudConsent}
            onOpenCutoutInSingle={handleOpenCutoutFromBulk}
          />
        </div>
      </main>

      <LandingSections locale={locale} t={t} />
    </div>
  );
}
