import React, { useCallback, useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterCurtainProps {
  beforeSrc: string;
  afterSrc?: string;
  afterOverlayNode?: React.ReactNode;
  beforeLabel: string;
  afterLabel: string;
  alt: string;
  aspectClass?: string;
  aspectRatio?: number;
  imageFit?: 'contain' | 'cover';
  initialPosition?: number;
}

/**
 * Interactive draggable split-screen comparison curtain over a subtle checkerboard transparency grid.
 * Uses matching object-fit for Before & After so pixels align 1:1 under the curtain in both RTL and LTR.
 */
export function BeforeAfterCurtain({
  beforeSrc,
  afterSrc,
  afterOverlayNode,
  beforeLabel,
  afterLabel,
  alt,
  aspectClass = 'aspect-[4/3]',
  aspectRatio,
  imageFit = 'contain',
  initialPosition = 50,
}: BeforeAfterCurtainProps) {
  const [position, setPosition] = useState(initialPosition);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(4, Math.min(96, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(4, p - 4));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(96, p + 4));
    }
  };

  const fitClass = imageFit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div
      ref={containerRef}
      dir="ltr"
      role="slider"
      tabIndex={0}
      aria-label={`${beforeLabel} / ${afterLabel}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={
        aspectRatio && Number.isFinite(aspectRatio)
          ? { aspectRatio: String(aspectRatio) }
          : undefined
      }
      className={`relative w-full ${
        aspectRatio ? 'max-h-[520px] mx-auto' : aspectClass
      } overflow-hidden rounded-xl border border-[#E5E7EB] checkerboard-grid select-none touch-none cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]`}
    >
      {/* After layer */}
      <div className="absolute inset-0">
        {afterOverlayNode ? (
          afterOverlayNode
        ) : afterSrc ? (
          <img
            src={afterSrc}
            alt={`${alt} - ${afterLabel}`}
            draggable={false}
            className={`h-full w-full ${fitClass}`}
          />
        ) : null}
      </div>

      {/* Before layer (clipped from right edge to current curtain position) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={`${alt} - ${beforeLabel}`}
          draggable={false}
          className={`h-full w-full ${fitClass}`}
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-[#111827]/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-[#0D9488]/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Curtain divider hairline & tactile handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-white shadow-[0_0_12px_rgba(15,23,42,0.35)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1E293B] shadow-md">
          <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
