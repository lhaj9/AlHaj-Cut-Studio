/**
 * Central Brand & Monetization Configuration
 * Edit this single object to rebrand the entire application instantly.
 */
export const BRAND_CONFIG = {
  id: 'noorcut-studio',
  name: {
    ar: 'نور كات ستوديو',
    en: 'NoorCut Studio',
    pt: 'NoorCut Studio',
    fr: 'NoorCut Studio',
  },
  shortName: {
    ar: 'نور كات',
    en: 'NoorCut',
    pt: 'NoorCut',
    fr: 'NoorCut',
  },
  domain: 'noorcut.studio',
  contactEmail: 'hello@noorcut.studio',
  colors: {
    primary: '#0D9488',
    secondary: '#1E293B',
    surface: '#FFFFFF',
    canvas: '#F9FAFB',
  },
  /**
   * Monetization & Google AdSense Configuration
   * Set `enabled: true` and enter your real Google AdSense publisher ID and slot IDs
   * to activate live ad rendering on your shared hosting domain.
   */
  ads: {
    enabled: true,
    adsenseClientId: '', // e.g., 'ca-pub-XXXXXXXXXXXXXXXX'
    slots: {
      topBanner: '', // Horizontal leaderboard slot ID
      belowStudio: '', // Responsive rectangle / multiplex slot ID
    },
  },
} as const;

export type SupportedLocale = 'ar' | 'en' | 'pt' | 'fr';

export const DEFAULT_LOCALE: SupportedLocale = 'ar';
