import { useState } from 'react';
import { ChevronDown, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { BRAND_CONFIG, type SupportedLocale } from '../config';
import type { TranslationDictionary } from '../i18n/translations';
import { AdSlot } from './AdSlot';
import { BrandLogo } from './BrandLogo';

interface LandingSectionsProps {
  locale: SupportedLocale;
  t: TranslationDictionary;
}

export function LandingSections({ locale, t }: LandingSectionsProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const brandName = BRAND_CONFIG.name[locale];

  const features = [
    {
      icon: ShieldCheck,
      title: t.feat1Title,
      desc: t.feat1Desc,
    },
    {
      icon: Cpu,
      title: t.feat2Title,
      desc: t.feat2Desc,
    },
    {
      icon: Layers,
      title: t.feat3Title,
      desc: t.feat3Desc,
    },
  ];

  return (
    <div className="pt-10">
      <div className="mx-auto max-w-[1440px] space-y-14 px-4 sm:px-6 lg:px-8 pb-16">
        {/* Configurable Monetization Slot below studio */}
        <AdSlot slotKey="belowStudio" t={t} />

        {/* Features & Architecture Section */}
        <section id="features" className="mx-auto max-w-[1200px] space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] [text-wrap:balance]">
              {t.featuresTitle}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#64748B]">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <article
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#0D9488]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-[#111827]">
                      0{idx + 1}. {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#64748B]">{feat.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <AdSlot slotKey="topBanner" t={t} />

        {/* Multilingual SEO FAQ Accordion */}
        <section id="faq" className="mx-auto max-w-[900px] space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            {t.faqTitle}
          </h2>

          <div className="divide-y divide-[#E5E7EB] rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
            {t.faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm sm:text-base font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0D9488]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-[#475569]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Quiet Editorial Studio Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-[#64748B]">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={24} />
            <span className="font-bold text-[#111827]">{brandName}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footerPrivacyNote}</span>
          </div>
          <p className="shrink-0">
            © {new Date().getFullYear()} {brandName}. {t.footerRights}
          </p>
        </div>
      </footer>
    </div>
  );
}
