import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Columns2,
  ImagePlus,
  Maximize2,
  Redo2,
  RefreshCw,
  RotateCcw,
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
  TextLayer,
} from '../types/studio';
import {
  paintMaskBrushStroke,
  renderStudioComposite,
} from '../utils/canvasCompositor';
import {
  canvasToMaskPoint,
  clampPanOffset,
  computeCanvasDimensions,
  computeFittedDisplaySize,
  computeScreenBrushDiameter,
  computeSubjectRect,
  computeZoomAroundPoint,
  screenToCanvasPoint,
} from '../utils/studioMath';
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
  onCommitTextMove: () => void;
  onReprocessEngine: () => void;
  onResetToUpload: () => void;
}

function hitTestTextLayer(
  layer: TextLayer,
  normX: number,
  normY: number,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  if (!layer.content.trim() || canvasWidth <= 0 || canvasHeight <= 0) return false;
  const dxPx = (normX - layer.x) * canvasWidth;
  const dyPx = (normY - layer.y) * canvasHeight;
  const rad = (-layer.rotation * Math.PI) / 180;
  const localX = dxPx * Math.cos(rad) - dyPx * Math.sin(rad);
  const localY = dxPx * Math.sin(rad) + dyPx * Math.cos(rad);

  const scaleFactor = canvasHeight / 1080;
  const fontSizePx = Math.max(12, layer.fontSize * scaleFactor);
  const lines = layer.content.split('\n');
  const maxChars = Math.max(3, ...lines.map((l) => l.length));
  const halfW = Math.max(44, maxChars * fontSizePx * 0.34 + 16);
  const halfH = Math.max(28, (lines.length * fontSizePx * 1.18) / 2 + 16);

  return Math.abs(localX) <= halfW && Math.abs(localY) <= halfH;
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
  onCommitTextMove,
  onReprocessEngine,
  onResetToUpload,
}: StudioCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const subjectRectRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 0,
    y: 0,
    width: cutout.width,
    height: cutout.height,
  });

  const [viewportSize, setViewportSize] = useState({ width: 760, height: 540 });
  const [dpr, setDpr] = useState(() =>
    typeof window !== 'undefined' ? Math.min(2.5, window.devicePixelRatio || 1) : 1
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<{
    before: string;
    after: string;
    aspectRatio: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [canvasCssWidth, setCanvasCssWidth] = useState(0);

  const isPaintingRef = useRef(false);
  const lastMaskPtRef = useRef<{ x: number; y: number } | null>(null);
  const draggingTextRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const panningRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  // Multi-touch gesture tracking for pinch-to-zoom & 2-finger pan
  const touchPtsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchBaseRef = useRef<{
    dist: number;
    zoom: number;
    pan: { x: number; y: number };
    midX: number;
    midY: number;
  } | null>(null);

  // Reset zoom, pan, and compare mode whenever a new cutout image opens
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCompareMode(false);
  }, [cutout]);

  // Observe viewport size & DPR changes cleanly on window resize
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const syncMetrics = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
      setDpr(Math.min(2.5, window.devicePixelRatio || 1));
    };

    syncMetrics();
    const ro = new ResizeObserver(syncMetrics);
    ro.observe(el);
    window.addEventListener('resize', syncMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncMetrics);
    };
  }, []);

  // Spacebar temporary Pan shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const baseDims = useMemo(
    () => computeCanvasDimensions(cutout.width, cutout.height, state.aspectPreset),
    [cutout.width, cutout.height, state.aspectPreset]
  );

  const fittedDisplaySize = useMemo(
    () =>
      computeFittedDisplaySize(
        baseDims.width,
        baseDims.height,
        viewportSize.width,
        viewportSize.height,
        36,
        4
      ),
    [baseDims.width, baseDims.height, viewportSize.width, viewportSize.height]
  );

  // Clamp pan whenever viewport or zoom changes so canvas never gets lost
  useEffect(() => {
    setPan((prev) => {
      const clamped = clampPanOffset(
        prev.x,
        prev.y,
        fittedDisplaySize.width,
        fittedDisplaySize.height,
        zoom,
        viewportSize.width,
        viewportSize.height
      );
      if (clamped.x === prev.x && clamped.y === prev.y) return prev;
      return clamped;
    });
  }, [
    fittedDisplaySize.width,
    fittedDisplaySize.height,
    zoom,
    viewportSize.width,
    viewportSize.height,
  ]);

  // Compute crisp DPR-aware preview buffer resolution (up to full image size or 2600px max)
  const previewMaxDim = useMemo(() => {
    const targetCssMax = Math.max(fittedDisplaySize.width, fittedDisplaySize.height);
    const zoomedPx = Math.round(targetCssMax * dpr * Math.max(1, zoom));
    return Math.max(1200, Math.min(2600, zoomedPx));
  }, [fittedDisplaySize.width, fittedDisplaySize.height, dpr, zoom]);

  const redrawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const result = renderStudioComposite({
      targetCanvas: canvas,
      originalCanvas: cutout.originalCanvas,
      maskCanvas: cutout.maskCanvas,
      state,
      customBgImage,
      maxPreviewDimension: previewMaxDim,
    });
    subjectRectRef.current = result.subjectRect;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      setCanvasCssWidth(rect.width);
    }
  }, [cutout, state, customBgImage, previewMaxDim]);

  const isComparing = Boolean(compareMode && compareData);

  useEffect(() => {
    if (!isComparing) {
      redrawComposite();
    }
  }, [redrawComposite, maskRevision, isComparing]);

  // Generate pixel-aligned before/after comparison snapshots
  useEffect(() => {
    if (!compareMode) {
      setCompareData(null);
      return;
    }

    const maxDim = 1200;
    const afterCanvas = document.createElement('canvas');
    const afterRes = renderStudioComposite({
      targetCanvas: afterCanvas,
      originalCanvas: cutout.originalCanvas,
      maskCanvas: cutout.maskCanvas,
      state,
      customBgImage,
      maxPreviewDimension: maxDim,
    });

    const beforeCanvas = document.createElement('canvas');
    beforeCanvas.width = afterRes.canvasWidth;
    beforeCanvas.height = afterRes.canvasHeight;
    const bCtx = beforeCanvas.getContext('2d');
    if (bCtx) {
      const sr = computeSubjectRect(
        cutout.originalCanvas.width,
        cutout.originalCanvas.height,
        afterRes.canvasWidth,
        afterRes.canvasHeight,
        state.subjectScale,
        state.subjectOffsetX,
        state.subjectOffsetY
      );
      bCtx.fillStyle = '#F3F4F6';
      bCtx.fillRect(0, 0, beforeCanvas.width, beforeCanvas.height);
      bCtx.drawImage(
        cutout.originalCanvas,
        sr.x,
        sr.y,
        sr.width,
        sr.height
      );
    }

    setCompareData({
      before: beforeCanvas.toDataURL('image/jpeg', 0.9),
      after: afterCanvas.toDataURL('image/png'),
      aspectRatio: afterRes.canvasWidth / Math.max(1, afterRes.canvasHeight),
    });

    beforeCanvas.width = 0;
    beforeCanvas.height = 0;
    afterCanvas.width = 0;
    afterCanvas.height = 0;
  }, [compareMode, cutout, state, customBgImage, maskRevision]);

  // Wheel zoom centered at pointer position
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || compareMode) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vpRect = vp.getBoundingClientRect();
      const localX = e.clientX - vpRect.left;
      const localY = e.clientY - vpRect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;

      setZoom((prevZoom) => {
        const nextZoom = Math.max(0.25, Math.min(5, prevZoom * factor));
        setPan((prevPan) => {
          const res = computeZoomAroundPoint(
            prevZoom,
            nextZoom,
            prevPan,
            localX,
            localY,
            vpRect.width,
            vpRect.height,
            fittedDisplaySize.width,
            fittedDisplaySize.height
          );
          return res.pan;
        });
        return Number(nextZoom.toFixed(3));
      });
    };

    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => vp.removeEventListener('wheel', handleWheel);
  }, [compareMode, fittedDisplaySize.width, fittedDisplaySize.height]);

  const engineDisplayName = useMemo(() => {
    if (cutout.backendUsed === 'manual') return t.manualModeBadge;
    if (cutout.engineUsed === 'rmbg-local') return t.engineRmbgName;
    if (cutout.engineUsed === 'imgly-local') return t.engineImglyName;
    return t.engineCloudName;
  }, [cutout.engineUsed, cutout.backendUsed, t]);

  const applyZoomStep = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(0.25, Math.min(5, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  const resetViewToFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compareMode) return;

    // Multi-touch pinch tracking
    if (e.pointerType === 'touch') {
      touchPtsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPtsRef.current.size === 2) {
        isPaintingRef.current = false;
        draggingTextRef.current = null;
        const pts = Array.from(touchPtsRef.current.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        pinchBaseRef.current = {
          dist: Math.max(10, dist),
          zoom,
          pan,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
        };
        return;
      }
    }

    // Pan immediately on Space-hold, middle-click, or clicking outer stage outside canvas
    const clickedCanvas = e.target === canvasRef.current;
    if (spacePressed || e.button === 1 || !clickedCanvas) {
      panningRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt = screenToCanvasPoint(
      e.clientX,
      e.clientY,
      rect,
      canvas.width,
      canvas.height
    );
    if (!pt) return;

    // Magic Brush Painting Mode
    if (brush.active) {
      const mPt = canvasToMaskPoint(
        pt.cx,
        pt.cy,
        subjectRectRef.current,
        cutout.maskCanvas.width,
        cutout.maskCanvas.height
      );
      if (!mPt) return;
      isPaintingRef.current = true;
      lastMaskPtRef.current = { x: mPt.mx, y: mPt.my };
      e.currentTarget.setPointerCapture(e.pointerId);

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

    // Direct Drag-to-Move when clicking directly on a Text Layer
    if (state.textLayers.length > 0) {
      const normX = pt.cx / canvas.width;
      const normY = pt.cy / canvas.height;
      const hitLayer = [...state.textLayers]
        .reverse()
        .find((layer) =>
          hitTestTextLayer(layer, normX, normY, canvas.width, canvas.height)
        );

      if (hitLayer) {
        onSelectTextLayer(hitLayer.id);
        draggingTextRef.current = {
          id: hitLayer.id,
          offsetX: normX - hitLayer.x,
          offsetY: normY - hitLayer.y,
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Default free canvas pan: left-click & drag directly moves the image freely
    panningRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current;
    if (vp && brush.active && !spacePressed) {
      const vpRect = vp.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - vpRect.left,
        y: e.clientY - vpRect.top,
        visible: true,
      });
    } else if (cursorPos.visible) {
      setCursorPos((p) => ({ ...p, visible: false }));
    }

    // Handle 2-finger touch pinch & pan
    if (e.pointerType === 'touch' && touchPtsRef.current.has(e.pointerId)) {
      touchPtsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPtsRef.current.size === 2 && pinchBaseRef.current && vp) {
        const pts = Array.from(touchPtsRef.current.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const ratio = dist / pinchBaseRef.current.dist;
        const nextZoom = Math.max(
          0.25,
          Math.min(5, Number((pinchBaseRef.current.zoom * ratio).toFixed(3)))
        );
        const rawPanX = pinchBaseRef.current.pan.x + (midX - pinchBaseRef.current.midX);
        const rawPanY = pinchBaseRef.current.pan.y + (midY - pinchBaseRef.current.midY);
        const clamped = clampPanOffset(
          rawPanX,
          rawPanY,
          fittedDisplaySize.width,
          fittedDisplaySize.height,
          nextZoom,
          viewportSize.width,
          viewportSize.height
        );
        setZoom(nextZoom);
        setPan(clamped);
        return;
      }
    }

    if (panningRef.current) {
      const dx = e.clientX - panningRef.current.startX;
      const dy = e.clientY - panningRef.current.startY;
      const clamped = clampPanOffset(
        panningRef.current.origPanX + dx,
        panningRef.current.origPanY + dy,
        fittedDisplaySize.width,
        fittedDisplaySize.height,
        zoom,
        viewportSize.width,
        viewportSize.height
      );
      setPan(clamped);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = screenToCanvasPoint(
      e.clientX,
      e.clientY,
      canvas.getBoundingClientRect(),
      canvas.width,
      canvas.height
    );
    if (!pt) return;

    if (isPaintingRef.current && brush.active) {
      const mPt = canvasToMaskPoint(
        pt.cx,
        pt.cy,
        subjectRectRef.current,
        cutout.maskCanvas.width,
        cutout.maskCanvas.height
      );
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

    if (draggingTextRef.current) {
      const normX = Math.max(
        0.04,
        Math.min(0.96, pt.cx / canvas.width - draggingTextRef.current.offsetX)
      );
      const normY = Math.max(
        0.04,
        Math.min(0.96, pt.cy / canvas.height - draggingTextRef.current.offsetY)
      );
      draggingTextRef.current.moved = true;
      onMoveTextLayer(draggingTextRef.current.id, normX, normY);
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    touchPtsRef.current.delete(e.pointerId);
    if (touchPtsRef.current.size < 2) {
      pinchBaseRef.current = null;
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      lastMaskPtRef.current = null;
      onCommitMaskEdit();
    }
    if (draggingTextRef.current?.moved) {
      onCommitTextMove();
    }
    draggingTextRef.current = null;
    panningRef.current = null;
  };

  const previewBrushDiameter = useMemo(() => {
    const canvas = canvasRef.current;
    const rectW = canvasCssWidth || canvas?.getBoundingClientRect().width || fittedDisplaySize.width * zoom;
    const canvasW = canvas?.width || baseDims.width;
    return computeScreenBrushDiameter(
      brush.size,
      cutout.width,
      cutout.height,
      cutout.maskCanvas.width,
      subjectRectRef.current.width,
      canvasW,
      rectW
    );
  }, [
    brush.size,
    cutout.width,
    cutout.height,
    cutout.maskCanvas.width,
    canvasCssWidth,
    fittedDisplaySize.width,
    baseDims.width,
    zoom,
    state.aspectPreset,
    state.subjectScale,
  ]);

  const showReprocessButton =
    selectedEngine !== cutout.engineUsed || cutout.backendUsed === 'manual';

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
      {/* Top Floating Canvas Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB]/90 px-3 sm:px-4 py-2.5">
        {/* Left: Metadata & Engine Switch */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span className="font-semibold text-[#111827]">{engineDisplayName}</span>
          {cutout.backendUsed && cutout.backendUsed !== 'manual' && (
            <span className="rounded bg-[#0D9488]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#0F766E]">
              {cutout.backendUsed}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {cutout.width}×{cutout.height}px
          </span>
          {cutout.durationMs > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {t.processingDoneIn} {(cutout.durationMs / 1000).toFixed(1)}s
              </span>
            </>
          )}
          {showReprocessButton && (
            <button
              type="button"
              onClick={onReprocessEngine}
              className="ms-1 inline-flex items-center gap-1.5 rounded-md border border-[#0D9488]/30 bg-[#0D9488]/10 px-2.5 py-1 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/15 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.reprocessWithEngine}
            </button>
          )}
        </div>

        {/* Right: Compare, Undo/Redo, Zoom/Pan, New Image */}
        <div className="flex flex-wrap items-center gap-1.5">
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
              <div className="h-4 w-px bg-[#E5E7EB] mx-0.5" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyZoomStep(-0.2)}
                  aria-label={t.zoomOut}
                  title={t.zoomOut}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-testid="zoom-percent-btn"
                  onClick={resetViewToFit}
                  title={t.zoomReset}
                  className="min-w-[46px] rounded-md px-1.5 py-1 text-center text-xs font-semibold text-[#475569] hover:bg-[#F3F4F6] tabular-nums cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => applyZoomStep(0.2)}
                  aria-label={t.zoomIn}
                  title={t.zoomIn}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={resetViewToFit}
                  aria-label={t.zoomFit}
                  title={t.zoomFit}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    onClick={resetViewToFit}
                    aria-label={t.zoomReset}
                    title={t.zoomReset}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#1E293B] hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
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
        data-testid="studio-canvas-stage"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onPointerLeave={() =>
          setCursorPos((prev) => ({ ...prev, visible: false }))
        }
        className={`relative flex min-h-[380px] sm:min-h-[460px] lg:min-h-[580px] w-full flex-1 items-center justify-center overflow-hidden bg-[#F3F4F6] p-4 select-none touch-none ${
          !compareMode && (!brush.active || spacePressed)
            ? 'cursor-grab active:cursor-grabbing'
            : ''
        }`}
      >
        {isComparing && compareData && (
          <div className="w-full max-w-[720px]">
            <BeforeAfterCurtain
              beforeSrc={compareData.before}
              afterSrc={compareData.after}
              beforeLabel={t.compareBefore}
              afterLabel={t.compareAfter}
              alt="Studio cutout comparison"
              aspectRatio={compareData.aspectRatio}
              imageFit="contain"
            />
          </div>
        )}
        <div
          className={`relative flex items-center justify-center will-change-transform ${
            isComparing ? 'hidden' : ''
          }`}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] shadow-[0_10px_32px_rgba(15,23,42,0.08)] checkerboard-grid">
            <canvas
              ref={canvasRef}
              data-testid="studio-composite-canvas"
              style={{
                width: `${fittedDisplaySize.width}px`,
                height: `${fittedDisplaySize.height}px`,
              }}
              className={`block touch-none ${
                spacePressed
                  ? 'cursor-grab active:cursor-grabbing'
                  : brush.active
                  ? 'cursor-none'
                  : 'cursor-grab active:cursor-grabbing'
              }`}
            />
          </div>
        </div>

        {/* Live Brush Preview Ring */}
        {brush.active && !compareMode && !spacePressed && cursorPos.visible && (
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
