import { useEffect, useRef } from 'react';
import { BRAND_CONFIG } from '../config';
import type { TranslationDictionary } from '../i18n/translations';

interface AdSlotProps {
  slotKey: 'topBanner' | 'belowStudio';
  t: TranslationDictionary;
}

/**
 * Clean, CLS-free Monetization / Google AdSense container controlled from BRAND_CONFIG.ads.
 * Renders real AdSense markup when publisher & slot IDs are configured, or an unobtrusive
 * Alabaster studio placement guide when unconfigured.
 */
export function AdSlot({ slotKey, t }: AdSlotProps) {
  const pushedRef = useRef(false);
  const { enabled, adsenseClientId, slots } = BRAND_CONFIG.ads;
  const slotId = slots[slotKey];

  useEffect(() => {
    if (!enabled || !adsenseClientId || !slotId || pushedRef.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // Ignore AdSense script absent in local preview
    }
  }, [enabled, adsenseClientId, slotId]);

  if (!enabled) return null;

  const isBanner = slotKey === 'topBanner';

  return (
    <aside
      aria-label={t.adSlotLabel}
      className={`mx-auto w-full max-w-[1200px] ${
        isBanner ? 'min-h-[72px]' : 'min-h-[104px]'
      } flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F3F4F6]/65 px-4 py-3 text-center`}
    >
      {adsenseClientId && slotId ? (
        <ins
          className="adsbygoogle block w-full"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-xs text-[#64748B]">
          <span className="font-semibold text-[#475569]">{t.adSlotLabel}</span>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span>{t.adSlotHint}</span>
        </div>
      )}
    </aside>
  );
}
