import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  CheckCircle2,
  Download,
  ExternalLink,
  Images,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import type { TranslationDictionary } from '../i18n/translations';
import {
  decodeSourceToCanvas,
  removeBackgroundWithAI,
  resolveImageSourceToBlob,
} from '../services/aiBgEngine';
import type {
  AiEngineId,
  AspectPresetId,
  BatchGlobalSettings,
  BatchItem,
  CutoutResult,
  ExportFormat,
  RuntimeCapabilities,
} from '../types/studio';
import { renderBatchItemBlob } from '../utils/canvasCompositor';
import {
  getExtensionForFormat,
  getUniqueExportBaseName,
  sanitizeExportBaseName,
} from '../utils/studioMath';

interface BulkStudioProps {
  selectedEngine: AiEngineId;
  capabilities: RuntimeCapabilities;
  t: TranslationDictionary;
  onEnsureCloudConsent: () => Promise<boolean>;
  onOpenCutoutInSingle: (
    cutout: CutoutResult,
    fileName: string,
    sourceFile: File
  ) => void;
}

const MAX_BATCH_FILES = 80;

async function decodeItemToCanvases(item: BatchItem): Promise<{
  originalCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
}> {
  if (!item.maskBlob) {
    throw new Error('Mask data missing for completed item');
  }
  const [{ canvas: originalCanvas }, { canvas: maskCanvas }] = await Promise.all([
    decodeSourceToCanvas(item.file),
    decodeSourceToCanvas(item.maskBlob),
  ]);
  return { originalCanvas, maskCanvas };
}

export function BulkStudio({
  selectedEngine,
  capabilities,
  t,
  onEnsureCloudConsent,
  onOpenCutoutInSingle,
}: BulkStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const itemsRef = useRef<BatchItem[]>([]);
  itemsRef.current = items;

  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  const stopRequestedRef = useRef(false);
  const processingLoopActiveRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [globalSettings, setGlobalSettings] = useState<BatchGlobalSettings>({
    backgroundType: 'transparent',
    customColor: '#FFFFFF',
    aspectPreset: 'original',
    watermarkText: '',
    watermarkOpacity: 0.6,
    format: 'image/png',
    quality: 0.92,
  });

  const globalSettingsRef = useRef(globalSettings);
  globalSettingsRef.current = globalSettings;
  const engineRef = useRef(selectedEngine);
  engineRef.current = selectedEngine;

  // Cleanup all Blob URLs on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      for (const it of itemsRef.current) {
        URL.revokeObjectURL(it.sourceUrl);
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      }
    };
  }, []);

  // Regenerate lightweight thumbnails whenever global background/ratio/watermark/format changes
  useEffect(() => {
    let cancelled = false;
    const refreshPreviews = async () => {
      const doneItems = itemsRef.current.filter(
        (it) => it.status === 'done' && it.maskBlob
      );
      if (doneItems.length === 0) return;

      for (const item of doneItems) {
        if (cancelled) break;
        let canvases: {
          originalCanvas: HTMLCanvasElement;
          maskCanvas: HTMLCanvasElement;
        } | null = null;
        try {
          canvases = await decodeItemToCanvases(item);
          if (cancelled) break;
          const blob = await renderBatchItemBlob(
            canvases.originalCanvas,
            canvases.maskCanvas,
            globalSettings,
            360
          );
          if (cancelled) break;
          const nextUrl = URL.createObjectURL(blob);
          const staleUrls: string[] = [];
          setItems((prev) =>
            prev.map((row) => {
              if (row.id !== item.id) return row;
              if (row.previewUrl) staleUrls.push(row.previewUrl);
              return { ...row, previewUrl: nextUrl };
            })
          );
          if (staleUrls.length > 0) {
            window.setTimeout(() => {
              for (const u of staleUrls) URL.revokeObjectURL(u);
            }, 800);
          }
        } catch {
          // Ignore transient thumbnail errors
        } finally {
          if (canvases) {
            canvases.originalCanvas.width = 0;
            canvases.originalCanvas.height = 0;
            canvases.maskCanvas.width = 0;
            canvases.maskCanvas.height = 0;
          }
        }
      }
    };

    const timer = window.setTimeout(refreshPreviews, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    globalSettings.backgroundType,
    globalSettings.customColor,
    globalSettings.aspectPreset,
    globalSettings.watermarkText,
    globalSettings.format,
    globalSettings.quality,
  ]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|avif)$/i.test(f.name)
    );
    if (incoming.length === 0) return;

    setBatchNotice(null);
    setItems((prev) => {
      const remainingSlots = Math.max(0, MAX_BATCH_FILES - prev.length);
      if (remainingSlots === 0) {
        setBatchNotice(`Maximum ${MAX_BATCH_FILES} images per batch queue.`);
        return prev;
      }
      const accepted = incoming.slice(0, remainingSlots);
      if (incoming.length > remainingSlots) {
        setBatchNotice(
          `Added ${accepted.length} images (batch limit ${MAX_BATCH_FILES}).`
        );
      }
      const newItems: BatchItem[] = accepted.map((file, idx) => ({
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        sourceUrl: URL.createObjectURL(file),
        selected: true,
        status: 'queued',
        progress: 0,
      }));
      return [...prev, ...newItems];
    });
  }, []);

  const handleLoadSamples = async () => {
    const sampleFiles: File[] = [];
    for (const sample of SAMPLE_PHOTOS) {
      try {
        const blob = await resolveImageSourceToBlob(sample.url);
        sampleFiles.push(
          new File([blob], sample.fileName, { type: blob.type || 'image/jpeg' })
        );
      } catch {
        // Ignore single sample failure
      }
    }
    if (sampleFiles.length > 0) {
      addFiles(sampleFiles);
    }
  };

  const runSequentialQueue = useCallback(async () => {
    if (processingLoopActiveRef.current) return;

    if (engineRef.current === 'notlain-cloud') {
      const ok = await onEnsureCloudConsent();
      if (!ok) return;
    }

    if (capabilities.isFileProtocol && engineRef.current !== 'notlain-cloud') {
      setBatchNotice(t.fileModeAiBlocked);
      return;
    }

    setBatchNotice(null);
    processingLoopActiveRef.current = true;
    stopRequestedRef.current = false;
    setIsStopping(false);
    setIsRunning(true);

    try {
      while (!stopRequestedRef.current) {
        const nextItem = itemsRef.current.find((it) => it.status === 'queued');
        if (!nextItem) break;

        const targetId = nextItem.id;
        const targetFile = nextItem.file;
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setItems((prev) =>
          prev.map((it) =>
            it.id === targetId
              ? { ...it, status: 'processing', progress: 8, errorMessage: undefined }
              : it
          )
        );

        let cutout: CutoutResult | null = null;
        try {
          cutout = await removeBackgroundWithAI(
            targetFile,
            engineRef.current,
            (p) => {
              setItems((prev) =>
                prev.map((it) =>
                  it.id === targetId
                    ? { ...it, progress: Math.max(8, p.percent) }
                    : it
                )
              );
            },
            { signal: controller.signal }
          );

          // Store compressed lossless PNG maskBlob so RAM stays low across 50+ 4K images
          const maskBlob = await new Promise<Blob>((resolve, reject) => {
            cutout!.maskCanvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('Mask encoding failed'))),
              'image/png'
            );
          });

          const previewBlob = await renderBatchItemBlob(
            cutout.originalCanvas,
            cutout.maskCanvas,
            globalSettingsRef.current,
            360
          );
          const previewUrl = URL.createObjectURL(previewBlob);
          const oldPreviews: string[] = [];

          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== targetId) return it;
              if (it.previewUrl) oldPreviews.push(it.previewUrl);
              return {
                ...it,
                status: 'done',
                progress: 100,
                width: cutout!.width,
                height: cutout!.height,
                engineUsed: cutout!.engineUsed,
                backendUsed: cutout!.backendUsed,
                maskBlob,
                previewUrl,
              };
            })
          );
          if (oldPreviews.length > 0) {
            window.setTimeout(() => {
              for (const u of oldPreviews) URL.revokeObjectURL(u);
            }, 800);
          }
        } catch (err) {
          const isAborted = (err as Error)?.name === 'AbortError';
          setItems((prev) =>
            prev.map((it) =>
              it.id === targetId
                ? {
                    ...it,
                    status: isAborted ? 'queued' : 'error',
                    progress: 0,
                    errorMessage: isAborted
                      ? undefined
                      : err instanceof Error
                      ? err.message
                      : 'Processing failed',
                  }
                : it
            )
          );
          if (isAborted) break;
        } finally {
          if (cutout) {
            cutout.originalCanvas.width = 0;
            cutout.originalCanvas.height = 0;
            cutout.maskCanvas.width = 0;
            cutout.maskCanvas.height = 0;
          }
          abortControllerRef.current = null;
        }

        // Yield briefly to keep UI responsive across long queues
        await new Promise((r) => setTimeout(r, 16));
      }
    } finally {
      processingLoopActiveRef.current = false;
      stopRequestedRef.current = false;
      setIsStopping(false);
      setIsRunning(false);
    }
  }, [capabilities.isFileProtocol, onEnsureCloudConsent, t.fileModeAiBlocked]);

  const handleStopQueue = () => {
    stopRequestedRef.current = true;
    setIsStopping(true);
    abortControllerRef.current?.abort();
  };

  const handleRetryFailed = () => {
    setItems((prev) =>
      prev.map((it) =>
        it.status === 'error'
          ? { ...it, status: 'queued', progress: 0, errorMessage: undefined }
          : it
      )
    );
    window.setTimeout(() => {
      void runSequentialQueue();
    }, 30);
  };

  const handleClearAll = () => {
    stopRequestedRef.current = true;
    abortControllerRef.current?.abort();
    items.forEach((it) => {
      URL.revokeObjectURL(it.sourceUrl);
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
    setBatchNotice(null);
  };

  const handleDeleteSelected = () => {
    setItems((prev) => {
      const kept: BatchItem[] = [];
      for (const it of prev) {
        if (it.selected && it.status !== 'processing') {
          URL.revokeObjectURL(it.sourceUrl);
          if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
        } else {
          kept.push(it);
        }
      }
      return kept;
    });
  };

  const handleRemoveOne = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        if (target.status === 'processing') {
          abortControllerRef.current?.abort();
        }
        URL.revokeObjectURL(target.sourceUrl);
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: checked })));
  };

  const handleDownloadSingle = async (item: BatchItem) => {
    if (!item.maskBlob) return;
    let canvases: {
      originalCanvas: HTMLCanvasElement;
      maskCanvas: HTMLCanvasElement;
    } | null = null;
    try {
      canvases = await decodeItemToCanvases(item);
      const blob = await renderBatchItemBlob(
        canvases.originalCanvas,
        canvases.maskCanvas,
        globalSettings
      );
      const ext = getExtensionForFormat(globalSettings.format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeExportBaseName(item.name)}-cutout.${ext}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } finally {
      if (canvases) {
        canvases.originalCanvas.width = 0;
        canvases.originalCanvas.height = 0;
        canvases.maskCanvas.width = 0;
        canvases.maskCanvas.height = 0;
      }
    }
  };

  const handleDownloadZip = async (selectedOnly: boolean) => {
    const readyItems = items.filter(
      (it) =>
        it.status === 'done' && it.maskBlob && (!selectedOnly || it.selected)
    );
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const ext = getExtensionForFormat(globalSettings.format);
      const usedNames = new Set<string>();

      for (const item of readyItems) {
        let canvases: {
          originalCanvas: HTMLCanvasElement;
          maskCanvas: HTMLCanvasElement;
        } | null = null;
        try {
          canvases = await decodeItemToCanvases(item);
          const blob = await renderBatchItemBlob(
            canvases.originalCanvas,
            canvases.maskCanvas,
            globalSettings
          );
          const uniqueBase = getUniqueExportBaseName(item.name, usedNames);
          zip.file(`${uniqueBase}-cutout.${ext}`, blob);
        } finally {
          if (canvases) {
            canvases.originalCanvas.width = 0;
            canvases.originalCanvas.height = 0;
            canvases.maskCanvas.width = 0;
            canvases.maskCanvas.height = 0;
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alhaj-cut-batch-${readyItems.length}-images.zip`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setIsZipping(false);
    }
  };

  const handleOpenInSingle = async (item: BatchItem) => {
    if (!item.maskBlob) return;
    const { originalCanvas, maskCanvas } = await decodeItemToCanvases(item);
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;
    const initialMaskData = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    onOpenCutoutInSingle(
      {
        originalCanvas,
        maskCanvas,
        initialMaskData,
        width: originalCanvas.width,
        height: originalCanvas.height,
        engineUsed: item.engineUsed || selectedEngine,
        backendUsed: item.backendUsed,
        durationMs: 0,
      },
      item.name,
      item.file
    );
  };

  const completedCount = items.filter((it) => it.status === 'done').length;
  const queuedCount = items.filter((it) => it.status === 'queued').length;
  const failedCount = items.filter((it) => it.status === 'error').length;
  const selectedCount = items.filter((it) => it.selected).length;
  const selectedDoneCount = items.filter(
    (it) => it.selected && it.status === 'done'
  ).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <div className="space-y-6">
      {/* Header & Dropzone Card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              {t.bulkTitle}
            </h2>
            <p className="text-sm text-[#64748B] max-w-2xl">{t.bulkSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Images className="h-4 w-4 text-[#0D9488]" aria-hidden="true" />
              <span>{t.bulkLoadSamples}</span>
            </button>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:text-rose-600 hover:border-rose-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.bulkClearAll}</span>
              </button>
            )}
          </div>
        </div>

        {batchNotice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
            {batchNotice}
          </div>
        )}

        {/* Multi-file Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) {
              addFiles(e.dataTransfer.files);
            }
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            isDragging
              ? 'border-[#0D9488] bg-[#0D9488]/5'
              : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#0D9488]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E5E7EB] text-[#0D9488] shadow-xs">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[#111827]">{t.bulkDropHeadline}</p>
          <p className="mt-1 text-xs text-[#64748B]">{t.bulkDropSubline}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-xl bg-[#1E293B] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F172A] transition-colors cursor-pointer"
          >
            {t.dropButton}
          </button>
        </div>

        {/* Global Batch Settings Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-[#E5E7EB] pt-5">
          {/* Global Background */}
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-bg-select"
              className="block text-xs font-semibold text-[#475569]"
            >
              {t.bulkGlobalBg}
            </label>
            <div className="flex items-center gap-2">
              <select
                id="bulk-bg-select"
                value={globalSettings.backgroundType}
                onChange={(e) =>
                  setGlobalSettings((prev) => ({
                    ...prev,
                    backgroundType: e.target
                      .value as BatchGlobalSettings['backgroundType'],
                  }))
                }
                className="h-9 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#111827]"
              >
                <option value="transparent">{t.bgTransparent}</option>
                <option value="white">{t.presetAmazonWhite} (#FFFFFF)</option>
                <option value="studio-gray">{t.presetStudioGray} (#F3F4F6)</option>
                <option value="custom">{t.bgSolid}</option>
              </select>
              {globalSettings.backgroundType === 'custom' && (
                <input
                  type="color"
                  aria-label={t.bgSolid}
                  value={globalSettings.customColor}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      customColor: e.target.value,
                    }))
                  }
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-0.5"
                />
              )}
            </div>
          </div>

          {/* Global Aspect Ratio */}
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-ratio-select"
              className="block text-xs font-semibold text-[#475569]"
            >
              {t.bulkGlobalRatio}
            </label>
            <select
              id="bulk-ratio-select"
              value={globalSettings.aspectPreset}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  aspectPreset: e.target.value as AspectPresetId,
                }))
              }
              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#111827]"
            >
              <option value="original">{t.ratioOriginal}</option>
              <option value="amazon-square">{t.ratioAmazon}</option>
              <option value="youtube-16-9">{t.ratioYoutube}</option>
              <option value="reels-9-16">{t.ratioReels}</option>
              <option value="passport-35-45">{t.ratioPassport}</option>
            </select>
          </div>

          {/* Global Format */}
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-format-select"
              className="block text-xs font-semibold text-[#475569]"
            >
              {t.exportFormatLabel}
            </label>
            <select
              id="bulk-format-select"
              value={globalSettings.format}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  format: e.target.value as ExportFormat,
                }))
              }
              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#111827]"
            >
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
              <option value="image/jpeg">JPG</option>
            </select>
          </div>

          {/* Global Compression Quality */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>{t.exportQualityLabel}</span>
              <span className="tabular-nums">
                {globalSettings.format === 'image/png'
                  ? '100%'
                  : `${Math.round(globalSettings.quality * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              aria-label={t.exportQualityLabel}
              disabled={globalSettings.format === 'image/png'}
              min={0.5}
              max={1}
              step={0.02}
              value={globalSettings.quality}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  quality: Number(e.target.value),
                }))
              }
              className="studio-slider w-full mt-2 disabled:opacity-40"
            />
          </div>

          {/* Global Text Watermark */}
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-watermark-input"
              className="block text-xs font-semibold text-[#475569]"
            >
              {t.bulkWatermarkLabel}
            </label>
            <input
              id="bulk-watermark-input"
              type="text"
              placeholder={t.bulkWatermarkPlaceholder}
              value={globalSettings.watermarkText}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  watermarkText: e.target.value,
                }))
              }
              className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs text-[#111827] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>
      </div>

      {/* Queue Action Bar & Live Thumbnail Grid */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="font-bold text-[#111827] tabular-nums">
                {completedCount} / {items.length} {t.bulkProcessedCount}
              </span>
              <div className="hidden sm:block h-2 w-36 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full bg-[#0D9488] transition-all duration-300"
                  style={{
                    width: `${Math.round((completedCount / items.length) * 100)}%`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleToggleSelectAll(!allSelected)}
                className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-semibold text-[#475569] hover:text-[#111827] cursor-pointer"
              >
                {allSelected ? t.bulkDeselectAll : t.bulkSelectAll} ({selectedCount})
              </button>

              {selectedCount > 0 && !isRunning && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>{t.bulkDeleteSelected}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {failedCount > 0 && !isRunning && (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {t.bulkRetryFailed} ({failedCount})
                  </span>
                </button>
              )}

              {!isRunning ? (
                <button
                  type="button"
                  disabled={queuedCount === 0}
                  onClick={runSequentialQueue}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.bulkStartQueue}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isStopping}
                  onClick={handleStopQueue}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F3F4F6] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isStopping ? t.bulkStopping : t.bulkPauseQueue}</span>
                </button>
              )}

              {selectedDoneCount > 0 && selectedDoneCount < completedCount && (
                <button
                  type="button"
                  disabled={isZipping}
                  onClick={() => handleDownloadZip(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1E293B] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F3F4F6] disabled:opacity-45 transition-colors cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {t.bulkDownloadSelectedZip} ({selectedDoneCount})
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={completedCount === 0 || isZipping}
                onClick={() => handleDownloadZip(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E293B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F172A] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isZipping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isZipping ? t.bulkZipPreparing : t.bulkDownloadZip}</span>
              </button>
            </div>
          </div>

          <div
            data-testid="bulk-items-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {items.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                  item.selected
                    ? 'border-[#0D9488]/60 bg-[#F9FAFB]'
                    : 'border-[#E5E7EB] bg-[#F9FAFB]'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden checkerboard-grid">
                  <img
                    src={item.previewUrl || item.sourceUrl}
                    alt={item.name}
                    className={`h-full w-full object-contain transition-opacity ${
                      item.status === 'processing' ? 'opacity-60' : 'opacity-100'
                    }`}
                  />

                  <label className="absolute top-2 start-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-xs cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={item.selected}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? { ...row, selected: e.target.checked }
                              : row
                          )
                        )
                      }
                      className="h-4 w-4 rounded accent-[#0D9488] cursor-pointer"
                    />
                  </label>

                  <button
                    type="button"
                    aria-label={`${t.bulkRemoveOne} ${item.name}`}
                    onClick={() => handleRemoveOne(item.id)}
                    className="absolute top-2 end-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-[#475569] shadow-xs hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  {item.status === 'processing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-xs px-4">
                      <Loader2
                        className="h-5 w-5 animate-spin text-[#0D9488]"
                        aria-hidden="true"
                      />
                      <span className="mt-2 text-xs font-semibold text-[#111827] tabular-nums">
                        {item.progress}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-2.5 bg-white p-3">
                  <div>
                    <p className="truncate text-xs font-semibold text-[#111827]">
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      {item.status === 'done' && (
                        <>
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-[#0D9488]"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-[#0D9488]">
                            {t.bulkStatusDone}
                          </span>
                        </>
                      )}
                      {item.status === 'queued' && (
                        <span className="text-[#64748B]">{t.bulkStatusQueued}</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="font-medium text-[#0D9488]">
                          {t.bulkStatusProcessing}
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span
                          title={item.errorMessage}
                          className="font-medium text-rose-600 truncate"
                        >
                          {t.bulkStatusError}
                          {item.errorMessage ? `: ${item.errorMessage}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status === 'done' && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#F3F4F6]">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0D9488]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#0D9488] hover:bg-[#0D9488]/15 transition-colors cursor-pointer"
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        <span>{t.bulkDownloadOne}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInSingle(item)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1E293B] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span>{t.bulkOpenInStudio}</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  status: 'queued',
                                  progress: 0,
                                  errorMessage: undefined,
                                }
                              : row
                          )
                        );
                        window.setTimeout(() => void runSequentialQueue(), 30);
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      <span>{t.processingRetry}</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
