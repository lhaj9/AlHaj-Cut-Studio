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
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import type { TranslationDictionary } from '../i18n/translations';
import { removeBackgroundWithAI } from '../services/aiBgEngine';
import type {
  AiEngineId,
  AspectPresetId,
  BatchGlobalSettings,
  BatchItem,
  CutoutResult,
  ExportFormat,
} from '../types/studio';
import { renderBatchItemBlob } from '../utils/canvasCompositor';
import {
  getExtensionForFormat,
  sanitizeExportBaseName,
} from '../utils/studioMath';

interface BulkStudioProps {
  selectedEngine: AiEngineId;
  t: TranslationDictionary;
  onOpenCutoutInSingle: (cutout: CutoutResult, fileName: string) => void;
}

export function BulkStudio({
  selectedEngine,
  t,
  onOpenCutoutInSingle,
}: BulkStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const pauseRequestedRef = useRef(false);
  const processingLoopActiveRef = useRef(false);

  const [globalSettings, setGlobalSettings] = useState<BatchGlobalSettings>({
    backgroundType: 'transparent',
    customColor: '#FFFFFF',
    aspectPreset: 'original',
    watermarkText: '',
    watermarkOpacity: 0.6,
    format: 'image/png',
    quality: 0.92,
  });

  // Keep a ref to latest globalSettings and engine for the sequential queue loop
  const globalSettingsRef = useRef(globalSettings);
  globalSettingsRef.current = globalSettings;
  const engineRef = useRef(selectedEngine);
  engineRef.current = selectedEngine;

  // Regenerate live thumbnails whenever global background/ratio/watermark changes
  useEffect(() => {
    let cancelled = false;
    const refreshPreviews = async () => {
      const doneItems = items.filter(
        (it) => it.status === 'done' && it.originalCanvas && it.maskCanvas
      );
      if (doneItems.length === 0) return;

      for (const item of doneItems) {
        if (cancelled) break;
        if (!item.originalCanvas || !item.maskCanvas) continue;
        try {
          const blob = await renderBatchItemBlob(
            item.originalCanvas,
            item.maskCanvas,
            globalSettings,
            360
          );
          if (cancelled) break;
          const nextUrl = URL.createObjectURL(blob);
          setItems((prev) =>
            prev.map((row) => {
              if (row.id !== item.id) return row;
              if (row.previewUrl) URL.revokeObjectURL(row.previewUrl);
              return { ...row, previewUrl: nextUrl };
            })
          );
        } catch {
          // Skip transient thumbnail errors
        }
      }
    };

    const timer = window.setTimeout(refreshPreviews, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Trigger only when styling settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    globalSettings.backgroundType,
    globalSettings.customColor,
    globalSettings.aspectPreset,
    globalSettings.watermarkText,
    globalSettings.format,
  ]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/') || /\.(png|jpe?g|webp|avif)$/i.test(f.name)
    );
    if (incoming.length === 0) return;

    const newItems: BatchItem[] = incoming.slice(0, 60).map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      sourceUrl: URL.createObjectURL(file),
      status: 'queued',
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleLoadSamples = async () => {
    const sampleFiles: File[] = [];
    for (const sample of SAMPLE_PHOTOS) {
      try {
        const res = await fetch(sample.url);
        const blob = await res.blob();
        sampleFiles.push(new File([blob], sample.fileName, { type: blob.type || 'image/jpeg' }));
      } catch {
        // Ignore single sample fetch failure
      }
    }
    if (sampleFiles.length > 0) {
      addFiles(sampleFiles);
    }
  };

  // Sequential RAM-safe processor loop
  const runSequentialQueue = useCallback(async () => {
    if (processingLoopActiveRef.current) return;
    processingLoopActiveRef.current = true;
    pauseRequestedRef.current = false;
    setIsRunning(true);

    try {
      while (!pauseRequestedRef.current) {
        let nextItem: BatchItem | undefined;
        setItems((current) => {
          nextItem = current.find((it) => it.status === 'queued');
          return current;
        });

        // Allow state read tick
        await new Promise((r) => setTimeout(r, 15));
        if (!nextItem || pauseRequestedRef.current) break;

        const targetId = nextItem.id;
        const targetFile = nextItem.file;

        setItems((prev) =>
          prev.map((it) =>
            it.id === targetId
              ? { ...it, status: 'processing', progress: 10, errorMessage: undefined }
              : it
          )
        );

        try {
          const cutout = await removeBackgroundWithAI(
            targetFile,
            engineRef.current,
            (p) => {
              setItems((prev) =>
                prev.map((it) =>
                  it.id === targetId ? { ...it, progress: Math.max(10, p.percent) } : it
                )
              );
            }
          );

          const previewBlob = await renderBatchItemBlob(
            cutout.originalCanvas,
            cutout.maskCanvas,
            globalSettingsRef.current,
            360
          );
          const previewUrl = URL.createObjectURL(previewBlob);

          setItems((prev) =>
            prev.map((it) =>
              it.id === targetId
                ? {
                    ...it,
                    status: 'done',
                    progress: 100,
                    engineUsed: cutout.engineUsed,
                    originalCanvas: cutout.originalCanvas,
                    maskCanvas: cutout.maskCanvas,
                    previewUrl,
                  }
                : it
            )
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === targetId
                ? {
                    ...it,
                    status: 'error',
                    progress: 0,
                    errorMessage:
                      err instanceof Error ? err.message : 'Processing failed',
                  }
                : it
            )
          );
        }
      }
    } finally {
      processingLoopActiveRef.current = false;
      setIsRunning(false);
    }
  }, []);

  const handlePauseQueue = () => {
    pauseRequestedRef.current = true;
    setIsRunning(false);
  };

  const handleClearAll = () => {
    pauseRequestedRef.current = true;
    items.forEach((it) => {
      URL.revokeObjectURL(it.sourceUrl);
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
  };

  const handleRemoveOne = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.sourceUrl);
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleDownloadSingle = async (item: BatchItem) => {
    if (!item.originalCanvas || !item.maskCanvas) return;
    const blob = await renderBatchItemBlob(
      item.originalCanvas,
      item.maskCanvas,
      globalSettings
    );
    const ext = getExtensionForFormat(globalSettings.format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeExportBaseName(item.name)}-cutout.${ext}`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter(
      (it) => it.status === 'done' && it.originalCanvas && it.maskCanvas
    );
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const ext = getExtensionForFormat(globalSettings.format);
      const usedNames = new Set<string>();

      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        if (!item.originalCanvas || !item.maskCanvas) continue;
        const blob = await renderBatchItemBlob(
          item.originalCanvas,
          item.maskCanvas,
          globalSettings
        );
        let base = sanitizeExportBaseName(item.name);
        if (usedNames.has(base)) {
          base = `${base}-${i + 1}`;
        }
        usedNames.add(base);
        zip.file(`${base}-cutout.${ext}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noorcut-batch-${readyItems.length}-images.zip`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setIsZipping(false);
    }
  };

  const handleOpenInSingle = (item: BatchItem) => {
    if (!item.originalCanvas || !item.maskCanvas) return;
    const maskCtx = item.maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;
    const initialMaskData = maskCtx.getImageData(
      0,
      0,
      item.maskCanvas.width,
      item.maskCanvas.height
    );
    onOpenCutoutInSingle(
      {
        originalCanvas: item.originalCanvas,
        maskCanvas: item.maskCanvas,
        initialMaskData,
        width: item.originalCanvas.width,
        height: item.originalCanvas.height,
        engineUsed: item.engineUsed || selectedEngine,
        durationMs: 0,
      },
      item.name
    );
  };

  const completedCount = items.filter((it) => it.status === 'done').length;
  const queuedCount = items.filter((it) => it.status === 'queued').length;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-[#E5E7EB] pt-5">
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
                    backgroundType: e.target.value as BatchGlobalSettings['backgroundType'],
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
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-[#111827] tabular-nums">
                {completedCount} / {items.length} {t.bulkProcessedCount}
              </span>
              {items.length > 0 && (
                <div className="hidden sm:block h-2 w-40 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full bg-[#0D9488] transition-all duration-300"
                    style={{ width: `${Math.round((completedCount / items.length) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                  onClick={handlePauseQueue}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.bulkPauseQueue}</span>
                </button>
              )}

              <button
                type="button"
                disabled={completedCount === 0 || isZipping}
                onClick={handleDownloadAllZip}
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
                className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden checkerboard-grid">
                  <img
                    src={item.previewUrl || item.sourceUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-contain transition-opacity ${
                      item.status === 'processing' ? 'opacity-60' : 'opacity-100'
                    }`}
                  />

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
                      <Loader2 className="h-5 w-5 animate-spin text-[#0D9488]" aria-hidden="true" />
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
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9488]" aria-hidden="true" />
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
                        <span className="font-medium text-rose-600">
                          {t.bulkStatusError}
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
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
