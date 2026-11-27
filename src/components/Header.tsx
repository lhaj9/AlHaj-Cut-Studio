import { Cpu, Globe, WifiOff } from 'lucide-react';
import { BRAND_CONFIG, type SupportedLocale } from '../config';
import type { TranslationDictionary } from '../i18n/translations';
import type { AiEngineId, RuntimeCapabilities, WorkspaceMode } from '../types/studio';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  t: TranslationDictionary;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  selectedEngine: AiEngineId;
  onEngineChange: (engine: AiEngineId) => void;
  capabilities: RuntimeCapabilities;
}

const LOCALE_OPTIONS: { code: SupportedLocale; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT-BR' },
  { code: 'fr', label: 'FR' },
];

export function Header({
  locale,
  onLocaleChange,
  t,
  mode,
  onModeChange,
  selectedEngine,
  onEngineChange,
  capabilities,
}: HeaderProps) {
  const brandName = BRAND_CONFIG.name[locale];
  const shortBrandName = BRAND_CONFIG.shortName[locale];

  const envBadgeLabel = capabilities.isFileProtocol
    ? t.envFileMode
    : !capabilities.isOnline
    ? t.envOffline
    : capabilities.hasWebGPU
    ? t.envWebGPU
    : capabilities.crossOriginIsolated && capabilities.hasSharedArrayBuffer
    ? t.envWasmMt
    : t.envWasmSt;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#E5E7EB] studio-glass">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark + Flat 2D Vector Mark */}
        <a
          href="#studio-top"
          onClick={(e) => {
            e.preventDefault();
            onModeChange('single');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-[#111827] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-lg"
        >
          <BrandLogo size={30} />
          <span dir="ltr" className="sm:hidden text-sm font-bold tracking-tight">
            {shortBrandName}
          </span>
          <span dir="ltr" className="hidden sm:inline text-base lg:text-lg font-bold tracking-tight">
            {brandName}
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#475569]"
        >
          <button
            type="button"
            onClick={() => {
              onModeChange('single');
              document
                .getElementById('studio-workspace')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              mode === 'single'
                ? 'border-[#0D9488] text-[#111827] font-semibold'
                : 'border-transparent hover:text-[#111827]'
            }`}
          >
            {t.navSingle}
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange('bulk');
              document
                .getElementById('studio-workspace')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              mode === 'bulk'
                ? 'border-[#0D9488] text-[#111827] font-semibold'
                : 'border-transparent hover:text-[#111827]'
            }`}
          >
            {t.navBulk}
          </button>
          <a
            href="#features"
            className="py-1 border-b-2 border-transparent hover:text-[#111827] transition-colors whitespace-nowrap shrink-0"
          >
            {t.navFeatures}
          </a>
          <a
            href="#faq"
            className="py-1 border-b-2 border-transparent hover:text-[#111827] transition-colors whitespace-nowrap shrink-0"
          >
            {t.navFaq}
          </a>
        </nav>

        {/* Zone 3: Capability Badge + AI Engine Selector + Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <span
            data-testid="runtime-capability-badge"
            title={capabilities.webgpuAdapterName || envBadgeLabel}
            className={`hidden xl:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
              capabilities.isFileProtocol
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : !capabilities.isOnline
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : capabilities.hasWebGPU
                ? 'border-[#0D9488]/30 bg-[#0D9488]/10 text-[#0F766E]'
                : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#475569]'
            }`}
          >
            {!capabilities.isOnline && !capabilities.isFileProtocol && (
              <WifiOff className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>{envBadgeLabel}</span>
          </span>

          {/* AI Engine Selector */}
          <div className="relative flex items-center min-w-0">
            <Cpu
              className="pointer-events-none absolute start-2 sm:start-2.5 h-3.5 w-3.5 text-[#0D9488]"
              aria-hidden="true"
            />
            <label htmlFor="ai-engine-select" className="sr-only">
              {t.engineLabel}
            </label>
            <select
              id="ai-engine-select"
              aria-label={t.engineLabel}
              value={selectedEngine}
              onChange={(e) => onEngineChange(e.target.value as AiEngineId)}
              className="h-9 w-[132px] sm:w-auto sm:max-w-[245px] truncate rounded-lg border border-[#E5E7EB] bg-white ps-7 sm:ps-8 pe-2 sm:pe-3 text-xs sm:text-[13px] font-medium text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
            >
              <option value="rmbg-local">{t.engineRmbgName}</option>
              <option value="imgly-local">{t.engineImglyName}</option>
              <option value="notlain-cloud">{t.engineCloudName}</option>
            </select>
          </div>

          {/* 4-Language Switcher */}
          <div className="relative flex items-center shrink-0">
            <Globe
              className="pointer-events-none hidden sm:block absolute start-2.5 h-3.5 w-3.5 text-[#64748B]"
              aria-hidden="true"
            />
            <label htmlFor="locale-select" className="sr-only">
              Language
            </label>
            <select
              id="locale-select"
              aria-label="Language"
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value as SupportedLocale)}
              className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 sm:ps-8 sm:pe-2.5 text-xs sm:text-[13px] font-semibold text-[#1E293B] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] cursor-pointer"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
