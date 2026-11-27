import { BRAND_CONFIG } from '../config';

interface BrandLogoProps {
  size?: number;
}

/**
 * Strictly 2D Flat Minimalist Vector Mark controlled via BRAND_CONFIG.
 * Depicts a clean geometric framing aperture and subject cutout silhouette.
 */
export function BrandLogo({ size = 32 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Flat slate base frame */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        fill={BRAND_CONFIG.colors.secondary}
      />
      {/* Cutout grid accent corner (top-right) */}
      <rect x="17" y="7" width="4" height="4" rx="1" fill="#334155" />
      <rect x="21" y="11" width="4" height="4" rx="1" fill="#334155" />
      <rect x="17" y="15" width="4" height="4" rx="1" fill="#334155" />
      {/* Sharp emerald geometric cutout plane */}
      <path
        d="M8 22V11.5C8 10.1193 9.11929 9 10.5 9H16.5L22 14.5V22C22 23.1046 21.1046 24 20 24H10C8.89543 24 8 23.1046 8 22Z"
        fill={BRAND_CONFIG.colors.primary}
      />
      {/* Pure white minimalist inner lens/cutout notch */}
      <circle cx="14.5" cy="17" r="3.2" fill="#FFFFFF" />
      <path d="M16.5 9L22 14.5H17.5C16.9477 14.5 16.5 14.0523 16.5 13.5V9Z" fill="#CCFBF1" />
    </svg>
  );
}
