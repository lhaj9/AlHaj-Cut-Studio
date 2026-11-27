/**
 * Central Brand & Monetization Configuration
 * Edit this single object to update branding or configure AdSense.
 */
export const BRAND_CONFIG = {
  id: 'alhaj-cut-studio',
  name: {
    ar: 'AIHAJ Cut Studio',
    en: 'AlHaj Cut Studio',
    pt: 'AlHaj Cut Studio',
    fr: 'AlHaj Cut Studio',
  },
  shortName: {
    ar: 'AIHAJ Cut',
    en: 'AlHaj Cut',
    pt: 'AlHaj Cut',
    fr: 'AlHaj Cut',
  },
  colors: {
    primary: '#0D9488',
    secondary: '#1E293B',
    surface: '#FFFFFF',
    canvas: '#F9FAFB',
  },
  /**
   * Monetization & Google AdSense Configuration
   * Disabled by default until real Google AdSense publisher & slot IDs are configured.
   */
  ads: {
    enabled: false,
    adsenseClientId: '', // e.g., 'ca-pub-XXXXXXXXXXXXXXXX'
    slots: {
      topBanner: '',
      belowStudio: '',
    },
  },
} as const;

export type SupportedLocale = 'ar' | 'en' | 'pt' | 'fr';

export const DEFAULT_LOCALE: SupportedLocale = 'ar';
