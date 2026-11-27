import React, { useRef, useState } from 'react';
import {
  Download,
  Eraser,
  Image as ImageIcon,
  Layers,
  Paintbrush,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import type { TranslationDictionary } from '../i18n/translations';
import type {
  AspectPresetId,
  BrushSettings,
  ExportFormat,
  InspectorTab,
  StudioEditState,
  StudioFontFamily,
  TextLayer,
} from '../types/studio';
import {
  DEFAULT_COLOR_ADJUSTMENTS,
  formatFileSize,
  GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
} from '../utils/studioMath';

interface StudioInspectorProps {
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  state: StudioEditState;
  onUpdateState: (updater: (prev: StudioEditState) => StudioEditState) => void;
  brush: BrushSettings;
  onUpdateBrush: (updater: (prev: BrushSettings) => BrushSettings) => void;
  onResetMask: () => void;
  onUploadCustomBg: (file: File) => void;
  estimatedBytes: number;
  outputDimensions: { width: number; height: number };
  isExporting: boolean;
  onDownloadExport: () => void;
  t: TranslationDictionary;
}

const FONT_OPTIONS: StudioFontFamily[] = [
  'Cairo',
  'Tajawal',
  'Readex Pro',
  'Anton',
  'Plus Jakarta Sans',
  'Playfair Display',
];

const STICKER_SWATCHES = ['#FFFFFF', '#0D9488', '#111827', '#FACC15', '#E11D48', '#2563EB'];

export function StudioInspector({
  activeTab,
  onTabChange,
  state,
  onUpdateState,
  brush,
  onUpdateBrush,
  onResetMask,
  onUploadCustomBg,
  estimatedBytes,
  outputDimensions,
  isExporting,
  onDownloadExport,
  t,
}: StudioInspectorProps) {
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<'subject' | 'bg'>('subject');

  const tabs: { id: InspectorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'background', label: t.tabBackground, icon: ImageIcon },
    { id: 'text', label: t.tabText, icon: Type },
    { id: 'effects', label: t.tabEffects, icon: Sparkles },
    { id: 'brush', label: t.tabBrush, icon: Paintbrush },
    { id: 'adjust', label: t.tabAdjust, icon: SlidersHorizontal },
    { id: 'export', label: t.tabExport, icon: Download },
  ];

  const selectedText =
    state.textLayers.find((l) => l.id === state.selectedTextId) ||
    state.textLayers[state.textLayers.length - 1] ||
    null;

  const handleAddText = () => {
    const id = `txt-${Date.now()}`;
    const newLayer: TextLayer = {
      id,
      content: t.textDefaultContent,
      placement: 'behind',
      fontFamily: 'Cairo',
      fontSize: 132,
      fontWeight: 800,
      color: '#1E293B',
      strokeWidth: 0,
      strokeColor: '#FFFFFF',
      shadowBlur: 12,
      shadowColor: 'rgba(15, 23, 42, 0.28)',
      rotation: 0,
      x: 0.5,
      y: 0.34,
      opacity: 1,
    };
    onUpdateState((prev) => ({
      ...prev,
      textLayers: [...prev.textLayers, newLayer],
      selectedTextId: id,
    }));
  };

  const updateSelectedText = (patch: Partial<TextLayer>) => {
    if (!selectedText) return;
    onUpdateState((prev) => ({
      ...prev,
      textLayers: prev.textLayers.map((l) =>
        l.id === selectedText.id ? { ...l, ...patch } : l
      ),
    }));
  };

  const deleteSelectedText = () => {
    if (!selectedText) return;
    onUpdateState((prev) => {
      const remaining = prev.textLayers.filter((l) => l.id !== selectedText.id);
      return {
        ...prev,
        textLayers: remaining,
        selectedTextId: remaining.length > 0 ? remaining[remaining.length - 1].id : null,
      };
    });
  };

  const activeAdjust =
    adjustTarget === 'subject' ? state.subjectAdjust : state.bgAdjust;

  const setActiveAdjustField = (
    field: 'brightness' | 'contrast' | 'saturation' | 'warmth',
    value: number
  ) => {
    onUpdateState((prev) =>
      adjustTarget === 'subject'
        ? { ...prev, subjectAdjust: { ...prev.subjectAdjust, [field]: value } }
        : { ...prev, bgAdjust: { ...prev.bgAdjust, [field]: value } }
    );
  };

  const aspectPresets: { id: AspectPresetId; label: string; dims: string }[] = [
    { id: 'original', label: t.ratioOriginal, dims: 'Auto' },
    { id: 'amazon-square', label: t.ratioAmazon, dims: '1080×1080' },
    { id: 'youtube-16-9', label: t.ratioYoutube, dims: '1920×1080' },
    { id: 'reels-9-16', label: t.ratioReels, dims: '1080×1920' },
    { id: 'passport-35-45', label: t.ratioPassport, dims: '1050×1350' },
  ];

  return (
    <aside className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
      {/* Tool Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Studio Tools"
        className="grid grid-cols-3 gap-1 border-b border-[#E5E7EB] bg-[#F9FAFB] p-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                onTabChange(tab.id);
                if (tab.id !== 'brush' && brush.active) {
                  onUpdateBrush((prev) => ({ ...prev, active: false }));
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0D9488] shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-[#E5E7EB]'
                  : 'text-[#475569] hover:text-[#111827] hover:bg-white/60'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Inspector Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 max-h-[590px]">
        {/* 1. BACKGROUND STUDIO & DSLR BOKEH */}
        {activeTab === 'background' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
              {(
                [
                  { id: 'transparent', label: t.bgTransparent },
                  { id: 'solid', label: t.bgSolid },
                  { id: 'gradient', label: t.bgGradient },
                  { id: 'image', label: t.bgImage },
                  { id: 'bokeh', label: t.bgBokeh },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      background: { ...prev.background, mode: item.id },
                    }))
                  }
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    state.background.mode === item.id
                      ? 'bg-white text-[#0D9488] shadow-sm'
                      : 'text-[#475569] hover:text-[#111827]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {state.background.mode === 'solid' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {SOLID_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            mode: 'solid',
                            solidColor: preset.color,
                          },
                        }))
                      }
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        state.background.solidColor.toLowerCase() ===
                        preset.color.toLowerCase()
                          ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#111827]'
                          : 'border-[#E5E7EB] bg-white text-[#475569] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="truncate">{t[preset.labelKey]}</span>
                    </button>
                  ))}
                </div>

                <label className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#1E293B]">
                  <span>{t.bgSolid}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#64748B] uppercase">
                      {state.background.solidColor}
                    </span>
                    <input
                      type="color"
                      aria-label={t.bgSolid}
                      value={state.background.solidColor}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            mode: 'solid',
                            solidColor: e.target.value,
                          },
                        }))
                      }
                      className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                    />
                  </div>
                </label>
              </div>
            )}

            {state.background.mode === 'gradient' && (
              <div className="grid grid-cols-2 gap-2.5">
                {GRADIENT_PRESETS.map((grad) => {
                  const cssGrad = `linear-gradient(${grad.angle}deg, ${grad.stops
                    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                    .join(', ')})`;
                  const isActive = state.background.gradientId === grad.id;
                  return (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            mode: 'gradient',
                            gradientId: grad.id,
                          },
                        }))
                      }
                      className={`group overflow-hidden rounded-xl border text-start transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20'
                          : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="h-14 w-full" style={{ background: cssGrad }} />
                      <div className="bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E293B] truncate">
                        {t[grad.labelKey as keyof TranslationDictionary] as string}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {state.background.mode === 'image' && (
              <div className="space-y-3">
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadCustomBg(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#0D9488]/50 bg-[#0D9488]/5 px-4 py-6 text-sm font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>{t.bgUploadCustom}</span>
                </button>
              </div>
            )}

            {state.background.mode === 'bokeh' && (
              <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#111827]">
                  <label htmlFor="bokeh-blur-slider">{t.bgBokehIntensity}</label>
                  <span className="tabular-nums text-[#0D9488]">
                    {state.background.bokehBlur}px
                  </span>
                </div>
                <input
                  id="bokeh-blur-slider"
                  type="range"
                  min={2}
                  max={40}
                  value={state.background.bokehBlur}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      background: {
                        ...prev.background,
                        mode: 'bokeh',
                        bokehBlur: Number(e.target.value),
                      },
                    }))
                  }
                  className="studio-slider w-full"
                />
                <p className="text-xs leading-relaxed text-[#64748B]">
                  {t.bgBokehHint}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. TEXT BEHIND SUBJECT & ARABIC/LATIN TYPOGRAPHY */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleAddText}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t.textAddLayer}</span>
            </button>

            {state.textLayers.length === 0 ? (
              <p className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-xs leading-relaxed text-[#64748B]">
                {t.textEmptyHint}
              </p>
            ) : (
              <>
                {/* Layer Selector List */}
                <div className="space-y-1.5">
                  {state.textLayers.map((layer) => {
                    const isSelected = selectedText?.id === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() =>
                          onUpdateState((prev) => ({ ...prev, selectedTextId: layer.id }))
                        }
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#111827] font-semibold'
                            : 'border-[#E5E7EB] bg-white text-[#475569] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <span className="truncate max-w-[160px]">{layer.content || '...'}</span>
                        <span className="text-[11px] text-[#0D9488]">
                          {layer.placement === 'behind' ? t.textPlaceBehind : t.textPlaceFront}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedText && (
                  <div className="space-y-4 border-t border-[#E5E7EB] pt-4">
                    {/* 1-Click Behind vs In Front Toggle */}
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
                      <button
                        type="button"
                        onClick={() => updateSelectedText({ placement: 'behind' })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          selectedText.placement === 'behind'
                            ? 'bg-white text-[#0D9488] shadow-sm'
                            : 'text-[#475569] hover:text-[#111827]'
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.textPlaceBehind}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedText({ placement: 'front' })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          selectedText.placement === 'front'
                            ? 'bg-white text-[#0D9488] shadow-sm'
                            : 'text-[#475569] hover:text-[#111827]'
                        }`}
                      >
                        <Type className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.textPlaceFront}</span>
                      </button>
                    </div>

                    {/* Text Content Input */}
                    <textarea
                      rows={2}
                      aria-label={t.tabText}
                      value={selectedText.content}
                      onChange={(e) => updateSelectedText({ content: e.target.value })}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                    />

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="text-font-select"
                        className="block text-xs font-semibold text-[#475569]"
                      >
                        {t.textFontLabel}
                      </label>
                      <select
                        id="text-font-select"
                        value={selectedText.fontFamily}
                        onChange={(e) =>
                          updateSelectedText({
                            fontFamily: e.target.value as StudioFontFamily,
                          })
                        }
                        className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#111827]"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size & Color */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-[#475569]">
                        <label htmlFor="text-size-slider">{t.textSizeLabel}</label>
                        <span className="tabular-nums">{selectedText.fontSize}px</span>
                      </div>
                      <input
                        id="text-size-slider"
                        type="range"
                        min={32}
                        max={320}
                        value={selectedText.fontSize}
                        onChange={(e) =>
                          updateSelectedText({ fontSize: Number(e.target.value) })
                        }
                        className="studio-slider w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#475569]">
                        <span>{t.textColorLabel}</span>
                        <input
                          type="color"
                          value={selectedText.color}
                          onChange={(e) => updateSelectedText({ color: e.target.value })}
                          className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#475569]">
                        <span>{t.textStrokeLabel}</span>
                        <input
                          type="color"
                          value={selectedText.strokeColor}
                          onChange={(e) =>
                            updateSelectedText({ strokeColor: e.target.value })
                          }
                          className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                    </div>

                    {/* Stroke, Shadow, Rotation */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[#475569]">
                          <span>{t.textStrokeLabel}</span>
                          <span className="tabular-nums">{selectedText.strokeWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          value={selectedText.strokeWidth}
                          onChange={(e) =>
                            updateSelectedText({ strokeWidth: Number(e.target.value) })
                          }
                          className="studio-slider w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[#475569]">
                          <span>{t.textShadowLabel}</span>
                          <span className="tabular-nums">{selectedText.shadowBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={selectedText.shadowBlur}
                          onChange={(e) =>
                            updateSelectedText({ shadowBlur: Number(e.target.value) })
                          }
                          className="studio-slider w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[#475569]">
                          <span>{t.textRotationLabel}</span>
                          <span className="tabular-nums">{selectedText.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          value={selectedText.rotation}
                          onChange={(e) =>
                            updateSelectedText({ rotation: Number(e.target.value) })
                          }
                          className="studio-slider w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[#475569]">
                          <span>{t.textOpacityLabel}</span>
                          <span className="tabular-nums">
                            {Math.round(selectedText.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={selectedText.opacity}
                          onChange={(e) =>
                            updateSelectedText({ opacity: Number(e.target.value) })
                          }
                          className="studio-slider w-full"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#64748B]">{t.textDragHint}</p>

                    <button
                      type="button"
                      onClick={deleteSelectedText}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.textDeleteLayer}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. YOUTUBE STICKER STROKE & STUDIO DROP SHADOW */}
        {activeTab === 'effects' && (
          <div className="space-y-6">
            {/* Sticker Outline Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111827]">
                  {t.effectsStickerTitle}
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.effects.strokeEnabled}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, strokeEnabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded accent-[#0D9488]"
                  />
                  <span>{t.effectsStickerEnable}</span>
                </label>
              </div>

              {state.effects.strokeEnabled && (
                <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#475569]">
                      <span>{t.effectsStrokeWidth}</span>
                      <span className="tabular-nums">{state.effects.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={32}
                      value={state.effects.strokeWidth}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            strokeWidth: Number(e.target.value),
                          },
                        }))
                      }
                      className="studio-slider w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#475569]">{t.effectsStrokeColor}</span>
                    <div className="flex items-center gap-1.5">
                      {STICKER_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={`Stroke color ${swatch}`}
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              effects: { ...prev.effects, strokeColor: swatch },
                            }))
                          }
                          className={`h-6 w-6 rounded-full border cursor-pointer ${
                            state.effects.strokeColor.toLowerCase() ===
                            swatch.toLowerCase()
                              ? 'ring-2 ring-[#0D9488] ring-offset-1 border-black/20'
                              : 'border-black/15'
                          }`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                      <input
                        type="color"
                        aria-label={t.effectsStrokeColor}
                        value={state.effects.strokeColor}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            effects: { ...prev.effects, strokeColor: e.target.value },
                          }))
                        }
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-[#E5E7EB]" />

            {/* Studio Drop Shadow Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111827]">
                  {t.effectsShadowTitle}
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.effects.shadowEnabled}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        effects: { ...prev.effects, shadowEnabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded accent-[#0D9488]"
                  />
                  <span>{t.effectsShadowEnable}</span>
                </label>
              </div>

              {state.effects.shadowEnabled && (
                <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#475569]">
                      <span>{t.effectsShadowX}</span>
                      <span className="tabular-nums">{state.effects.shadowOffsetX}px</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={state.effects.shadowOffsetX}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            shadowOffsetX: Number(e.target.value),
                          },
                        }))
                      }
                      className="studio-slider w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#475569]">
                      <span>{t.effectsShadowY}</span>
                      <span className="tabular-nums">{state.effects.shadowOffsetY}px</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      value={state.effects.shadowOffsetY}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            shadowOffsetY: Number(e.target.value),
                          },
                        }))
                      }
                      className="studio-slider w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#475569]">
                      <span>{t.effectsShadowBlur}</span>
                      <span className="tabular-nums">{state.effects.shadowBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={64}
                      value={state.effects.shadowBlur}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            shadowBlur: Number(e.target.value),
                          },
                        }))
                      }
                      className="studio-slider w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-[#475569]">
                      <span>{t.effectsShadowOpacity}</span>
                      <span className="tabular-nums">
                        {Math.round(state.effects.shadowOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={state.effects.shadowOpacity}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            shadowOpacity: Number(e.target.value),
                          },
                        }))
                      }
                      className="studio-slider w-full"
                    />
                  </div>

                  <label className="flex items-center justify-between text-xs text-[#475569]">
                    <span>{t.effectsShadowColor}</span>
                    <input
                      type="color"
                      value={state.effects.shadowColor}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          effects: { ...prev.effects, shadowColor: e.target.value },
                        }))
                      }
                      className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. INTERACTIVE MAGIC BRUSH (ERASE & RESTORE ALPHA MASK) */}
        {activeTab === 'brush' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#111827]">{t.brushTitle}</h3>

            <button
              type="button"
              onClick={() => onUpdateBrush((prev) => ({ ...prev, active: !prev.active }))}
              aria-pressed={brush.active}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                brush.active
                  ? 'bg-[#0D9488] text-white'
                  : 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              <Paintbrush className="h-4 w-4" aria-hidden="true" />
              <span>{t.brushToggleActive}</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateBrush((prev) => ({ ...prev, active: true, mode: 'erase' }))
                }
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  brush.mode === 'erase'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-[#475569] hover:text-[#111827]'
                }`}
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.brushModeErase}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateBrush((prev) => ({ ...prev, active: true, mode: 'restore' }))
                }
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  brush.mode === 'restore'
                    ? 'bg-white text-[#0D9488] shadow-sm'
                    : 'text-[#475569] hover:text-[#111827]'
                }`}
              >
                <Paintbrush className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.brushModeRestore}</span>
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>{t.brushSize}</span>
                  <span className="tabular-nums">{brush.size}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={120}
                  value={brush.size}
                  onChange={(e) =>
                    onUpdateBrush((prev) => ({ ...prev, size: Number(e.target.value) }))
                  }
                  className="studio-slider w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>{t.brushSoftness}</span>
                  <span className="tabular-nums">{Math.round(brush.softness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={brush.softness}
                  onChange={(e) =>
                    onUpdateBrush((prev) => ({
                      ...prev,
                      softness: Number(e.target.value),
                    }))
                  }
                  className="studio-slider w-full"
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#64748B]">{t.brushHint}</p>

            <button
              type="button"
              onClick={onResetMask}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.brushResetMask}</span>
            </button>
          </div>
        )}

        {/* 5. COLOR ADJUSTMENTS & SMART E-COMMERCE RESIZER */}
        {activeTab === 'adjust' && (
          <div className="space-y-5">
            {/* Independent Subject vs Background Color Adjustments */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
                <button
                  type="button"
                  onClick={() => setAdjustTarget('subject')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    adjustTarget === 'subject'
                      ? 'bg-white text-[#0D9488] shadow-sm'
                      : 'text-[#475569]'
                  }`}
                >
                  {t.adjustTargetSubject}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustTarget('bg')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    adjustTarget === 'bg'
                      ? 'bg-white text-[#0D9488] shadow-sm'
                      : 'text-[#475569]'
                  }`}
                >
                  {t.adjustTargetBg}
                </button>
              </div>

              <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>{t.adjustBrightness}</span>
                    <span className="tabular-nums">{activeAdjust.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={activeAdjust.brightness}
                    onChange={(e) =>
                      setActiveAdjustField('brightness', Number(e.target.value))
                    }
                    className="studio-slider w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>{t.adjustContrast}</span>
                    <span className="tabular-nums">{activeAdjust.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={activeAdjust.contrast}
                    onChange={(e) =>
                      setActiveAdjustField('contrast', Number(e.target.value))
                    }
                    className="studio-slider w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>{t.adjustSaturation}</span>
                    <span className="tabular-nums">{activeAdjust.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={activeAdjust.saturation}
                    onChange={(e) =>
                      setActiveAdjustField('saturation', Number(e.target.value))
                    }
                    className="studio-slider w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#475569]">
                    <span>{t.adjustWarmth}</span>
                    <span className="tabular-nums">{activeAdjust.warmth}</span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={activeAdjust.warmth}
                    onChange={(e) =>
                      setActiveAdjustField('warmth', Number(e.target.value))
                    }
                    className="studio-slider w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) =>
                      adjustTarget === 'subject'
                        ? { ...prev, subjectAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS } }
                        : { ...prev, bgAdjust: { ...DEFAULT_COLOR_ADJUSTMENTS } }
                    )
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 text-xs font-medium text-[#475569] hover:text-[#111827] cursor-pointer"
                >
                  {t.adjustReset}
                </button>
              </div>
            </div>

            <div className="h-px bg-[#E5E7EB]" />

            {/* Smart E-Commerce Aspect Ratio Presets */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#111827]">{t.resizeTitle}</h3>
              <div className="space-y-1.5">
                {aspectPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({ ...prev, aspectPreset: preset.id }))
                    }
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer ${
                      state.aspectPreset === preset.id
                        ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#111827] font-semibold'
                        : 'border-[#E5E7EB] bg-white text-[#475569] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                      {preset.dims}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>{t.subjectScaleLabel}</span>
                  <span className="tabular-nums">
                    {Math.round(state.subjectScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.35}
                  step={0.05}
                  value={state.subjectScale}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      subjectScale: Number(e.target.value),
                    }))
                  }
                  className="studio-slider w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. SMART EXPORT & LIVE COMPRESSION CALCULATOR */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="export-filename"
                className="block text-xs font-semibold text-[#475569]"
              >
                {t.exportFileNameLabel}
              </label>
              <input
                id="export-filename"
                type="text"
                value={state.exportSettings.fileName}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    exportSettings: {
                      ...prev.exportSettings,
                      fileName: e.target.value,
                    },
                  }))
                }
                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#111827]"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#475569]">
                {t.exportFormatLabel}
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
                {(
                  [
                    { mime: 'image/png', label: 'PNG' },
                    { mime: 'image/webp', label: 'WebP' },
                    { mime: 'image/jpeg', label: 'JPG' },
                  ] as { mime: ExportFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.mime}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        exportSettings: { ...prev.exportSettings, format: fmt.mime },
                      }))
                    }
                    className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
                      state.exportSettings.format === fmt.mime
                        ? 'bg-white text-[#0D9488] shadow-sm'
                        : 'text-[#475569] hover:text-[#111827]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#475569]">
                {t.exportScaleLabel}
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
                {([1, 0.75, 0.5] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        exportSettings: { ...prev.exportSettings, scale: sc },
                      }))
                    }
                    className={`rounded-lg py-1.5 text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                      (state.exportSettings.scale || 1) === sc
                        ? 'bg-white text-[#0D9488] shadow-sm'
                        : 'text-[#475569] hover:text-[#111827]'
                    }`}
                  >
                    {Math.round(sc * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {state.exportSettings.format !== 'image/png' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>{t.exportQualityLabel}</span>
                  <span className="tabular-nums">
                    {Math.round(state.exportSettings.quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.02}
                  value={state.exportSettings.quality}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      exportSettings: {
                        ...prev.exportSettings,
                        quality: Number(e.target.value),
                      },
                    }))
                  }
                  className="studio-slider w-full"
                />
              </div>
            )}

            {/* Live Export Summary */}
            <div className="divide-y divide-[#E5E7EB] rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-1 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#64748B]">{t.exportDimensions}</span>
                <span className="font-mono font-semibold text-[#111827] tabular-nums">
                  {outputDimensions.width} × {outputDimensions.height} px
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[#64748B]">{t.exportEstimatedSize}</span>
                <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                  {estimatedBytes > 0 ? formatFileSize(estimatedBytes) : '...'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isExporting}
              onClick={onDownloadExport}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0F766E] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{t.exportDownloadBtn}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
