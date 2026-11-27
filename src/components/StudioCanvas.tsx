import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Columns2,
  Hand,
  ImagePlus,
  Maximize2,
  Redo2,
  RefreshCw,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  AiEngineId,
  BrushSettings,
  CutoutResult,
  StudioEditState,
} from '../types/studio';
import {
  paintMaskBrushStroke,
  renderStudioComposite,
} from '../utils/canvasCompositor';
import { BeforeAfterCurtain } from './BeforeAfterCurtain';

interface StudioCanvasProps {
  cutout: CutoutResult;
  state: StudioEditState;
  brush: BrushSettings;
  customBgImage: HTMLImageElement | null;
  maskRevision: number;
  selectedEngine: AiEngineId;
  t: TranslationDictionary;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCommitMaskEdit: () => void;
  onSelectTextLayer: (id: string | null) => void;
  onMoveTextLayer: (id: string, x: number, y: number) => void;
  onReprocessEngine: () => void;
  onResetToUpload: () => void;
}

export function StudioCanvas({
  cutout,
  state,
  brush,
  customBgImage,
  maskRevision,
  selectedEngine,
  t,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCommitMaskEdit,
  onSelectTextLayer,
  onMoveTextLayer,
  onReprocessEngine,
  onResetToUpload,
}: StudioCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const subjectRectRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: cutout.width,
    height: cutout.height,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareUrls, setCompareUrls] = useState<{ before: string; after: string } | null>(
    null
  );
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const isPaintingRef = useRef(false);
  const lastMaskPtRef = useRef<{ x: number; y: number } | null>(null);
  const draggingTextRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const panningRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  // Render composite whenever state, background image, or mask changes
  const redrawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const result = renderStudioComposite({
      targetCanvas: canvas,
      originalCanvas: cutout.originalCanvas,
      maskCanvas: cutout.maskCanvas,
      state,
      customBgImage,
      maxPreviewDimension: 1400,
    });
    subjectRectRef.current = result.subjectRect;
  }, [cutout, state, customBgImage]);

  useEffect(() => {
    redrawComposite();
  }, [redrawComposite, maskRevision]);

  // Generate fresh before/after data URLs whenever compare mode is enabled
  useEffect(() => {
    if (!compareMode) {
      setCompareUrls(null);
      return;
    }
    const beforeCanvas = document.createElement('canvas');
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(cutout.width, cutout.height));
    beforeCanvas.width = Math.max(1, Math.round(cutout.width * scale));
    beforeCanvas.height = Math.max(1, Math.round(cutout.height * scale));
    const bCtx = beforeCanvas.getContext('2d');
    if (bCtx) {
      bCtx.drawImage(cutout.originalCanvas, 0, 0, beforeCanvas.width, beforeCanvas.height);
    }

    const afterCanvas = document.createElement('canvas');
    renderStudioComposite({
      targetCanvas: afterCanvas,
      originalCanvas: cutout.originalCanvas,
      maskCanvas: cutout.maskCanvas,
      state,
      customBgImage,
      maxPreviewDimension: maxDim,
    });

    setCompareUrls({
      before: beforeCanvas.toDataURL('image/jpeg', 0.9),
      after: afterCanvas.toDataURL('image/png'),
    });
  }, [compareMode, cutout, state, customBgImage, maskRevision]);

  const engineDisplayName = useMemo(() => {
    if (cutout.engineUsed === 'rmbg-local') return t.engineRmbgName;
    if (cutout.engineUsed === 'imgly-local') return t.engineImglyName;
    return t.engineCloudName;
  }, [cutout.engineUsed, t]);

  // Helper: convert pointer clientX/Y into canvas pixel coordinates
  const clientToCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const cx = ((clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((clientY - rect.top) / rect.height) * canvas.height;
    return { cx, cy, rect };
  };

  // Helper: map canvas pixel coordinates into original mask space
  const canvasToMaskCoords = (cx: number, cy: number) => {
    const sr = subjectRectRef.current;
    if (sr.width <= 0 || sr.height <= 0) return null;
    const mx = ((cx - sr.x) / sr.width) * cutout.maskCanvas.width;
    const my = ((cy - sr.y) / sr.height) * cutout.maskCanvas.height;
    return { mx, my };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panMode || e.button === 1) {
      panningRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const pt = clientToCanvasCoords(e.clientX, e.clientY);
    if (!pt) return;

    // Magic Brush Painting Mode
    if (brush.active) {
      const mPt = canvasToMaskCoords(pt.cx, pt.cy);
      if (!mPt) return;
      isPaintingRef.current = true;
      lastMaskPtRef.current = { x: mPt.mx, y: mPt.my };
      e.currentTarget.setPointerCapture(e.pointerId);

      // Scale brush size relative to original image resolution
      const resFactor = Math.max(cutout.width, cutout.height) / 1000;
      paintMaskBrushStroke(
        cutout.maskCanvas,
        mPt.mx,
        mPt.my,
        mPt.mx,
        mPt.my,
        brush.mode,
        brush.size * resFactor,
        brush.softness
      );
      redrawComposite();
      return;
    }

    // Direct Drag-to-Move for Text Layers
    const canvas = canvasRef.current;
    if (!canvas || state.textLayers.length === 0) return;

    const normX = pt.cx / canvas.width;
    const normY = pt.cy / canvas.height;

    // Hit-test text layers from top-most to bottom-most
    const hitLayer = [...state.textLayers].reverse().find((layer) => {
      const dx = Math.abs(normX - layer.x);
      const dy = Math.abs(normY - layer.y);
      return dx < 0.22 && dy < 0.12;
    });

    if (hitLayer) {
      onSelectTextLayer(hitLayer.id);
      draggingTextRef.current = {
        id: hitLayer.id,
        offsetX: normX - hitLayer.x,
        offsetY: normY - hitLayer.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const vp = viewportRef.current;
    if (vp && brush.active) {
      const vpRect = vp.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - vpRect.left,
        y: e.clientY - vpRect.top,
        visible: true,
      });
    }

    if (panningRef.current) {
      const dx = e.clientX - panningRef.current.startX;
      const dy = e.clientY - panningRef.current.startY;
      setPan({
        x: panningRef.current.origPanX + dx,
        y: panningRef.current.origPanY + dy,
      });
      return;
    }

    const pt = clientToCanvasCoords(e.clientX, e.clientY);
    if (!pt) return;

    if (isPaintingRef.current && brush.active) {
      const mPt = canvasToMaskCoords(pt.cx, pt.cy);
      if (!mPt) return;
      const prev = lastMaskPtRef.current || { x: mPt.mx, y: mPt.my };
      const resFactor = Math.max(cutout.width, cutout.height) / 1000;
      paintMaskBrushStroke(
        cutout.maskCanvas,
        prev.x,
        prev.y,
        mPt.mx,
        mPt.my,
        brush.mode,
        brush.size * resFactor,
        brush.softness
      );
      lastMaskPtRef.current = { x: mPt.mx, y: mPt.my };
      redrawComposite();
      return;
    }

    if (draggingTextRef.current && canvasRef.current) {
      const normX = Math.max(
        0.04,
        Math.min(0.96, pt.cx / canvasRef.current.width - draggingTextRef.current.offsetX)
      );
      const normY = Math.max(
        0.04,
        Math.min(0.96, pt.cy / canvasRef.current.height - draggingTextRef.current.offsetY)
      );
      onMoveTextLayer(draggingTextRef.current.id, normX, normY);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      lastMaskPtRef.current = null;
      onCommitMaskEdit();
    }
    draggingTextRef.current = null;
    panningRef.current = null;
  };

  // Visual brush preview size on screen
  const previewBrushDiameter = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return brush.size;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return brush.size;
    const resFactor = Math.max(cutout.width, cutout.height) / 1000;
    const cssScale = rect.width / cutout.width;
    return Math.max(10, Math.round(brush.size * resFactor * cssScale));
  }, [brush.size, cutout.width, cutout.height, zoom]);

  const showReprocessButton = selectedEngine !== cutout.engineUsed;

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
      {/* Top Floating Canvas Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB]/90 px-4 py-2.5">
        {/* Left: Metadata & Engine Switch */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span className="font-semibold text-[#111827]">{engineDisplayName}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {cutout.width}×{cutout.height}px
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {t.processingDoneIn} {(cutout.durationMs / 1000).toFixed(1)}s
          </span>
          {showReprocessButton && (
            <button
              type="button"
              onClick={onReprocessEngine}
              className="ms-2 inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/30 bg-[#0D9488]/10 px-2.5 py-1 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/15 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.reprocessWithEngine}
            </button>
          )}
        </div>

        {/* Right: Compare, Undo/Redo, Zoom, New Image */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            aria-pressed={compareMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              compareMode
                ? 'border-[#0D9488] bg-[#0D9488] text-white'
                : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6]'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.compareToggle}</span>
          </button>

          <div className="h-4 w-px bg-[#E5E7EB] mx-0.5" aria-hidden="true" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={t.undo}
            title={`${t.undo} (Ctrl+Z)`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label={t.redo}
            title={`${t.redo} (Ctrl+Y)`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {!compareMode && (
            <>
              <div className="h-4 w-px bg-[#E5E7EB] mx-0.5 hidden sm:block" aria-hidden="true" />
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(2))))}
                  aria-label="Zoom out"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="w-11 text-center text-xs font-medium text-[#475569] tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(2))))}
                  aria-label="Zoom in"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setPanMode(false);
                  }}
                  aria-label={t.zoomFit}
                  title={t.zoomFit}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPanMode((p) => !p)}
                  aria-pressed={panMode}
                  aria-label="Pan canvas"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    panMode
                      ? 'border-[#1E293B] bg-[#1E293B] text-white'
                      : 'border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Hand className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </>
          )}

          <div className="h-4 w-px bg-[#E5E7EB] mx-0.5" aria-hidden="true" />

          <button
            type="button"
            onClick={onResetToUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E293B] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.newImage}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div
        ref={viewportRef}
        className="relative flex min-h-[420px] lg:min-h-[580px] w-full flex-1 items-center justify-center overflow-hidden bg-[#F3F4F6] p-4 sm:p-6"
      >
        {compareMode && compareUrls ? (
          <div className="w-full max-w-[720px]">
            <BeforeAfterCurtain
              beforeSrc={compareUrls.before}
              afterSrc={compareUrls.after}
              beforeLabel={t.compareBefore}
              afterLabel={t.compareAfter}
              alt="Studio cutout comparison"
              aspectClass="aspect-[4/3]"
            />
          </div>
        ) : (
          <div
            className="relative flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="overflow-hidden rounded-lg border border-[#E5E7EB] shadow-[0_10px_32px_rgba(15,23,42,0.08)] checkerboard-grid">
              <canvas
                ref={canvasRef}
                data-testid="studio-composite-canvas"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                onPointerLeave={() =>
                  setCursorPos((prev) => ({ ...prev, visible: false }))
                }
                className={`block max-h-[520px] max-w-full w-auto h-auto touch-none ${
                  panMode
                    ? 'cursor-grab active:cursor-grabbing'
                    : brush.active
                    ? 'cursor-none'
                    : state.textLayers.length > 0
                    ? 'cursor-move'
                    : 'cursor-default'
                }`}
              />
            </div>
          </div>
        )}

        {/* Live Brush Preview Ring */}
        {brush.active && !compareMode && !panMode && cursorPos.visible && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-20 rounded-full border-2 shadow-sm"
            style={{
              width: previewBrushDiameter,
              height: previewBrushDiameter,
              left: cursorPos.x - previewBrushDiameter / 2,
              top: cursorPos.y - previewBrushDiameter / 2,
              borderColor: brush.mode === 'erase' ? '#E11D48' : '#0D9488',
              backgroundColor:
                brush.mode === 'erase'
                  ? 'rgba(225, 29, 72, 0.14)'
                  : 'rgba(13, 148, 136, 0.16)',
            }}
          />
        )}
      </div>
    </div>
  );
}
