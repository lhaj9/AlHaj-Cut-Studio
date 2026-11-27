import samplePortraitUrl from '../assets/images/sample-portrait.jpg';
import samplePortraitCutoutUrl from '../assets/images/sample-portrait2.png';
import sampleProductUrl from '../assets/images/sample-product.jpg';
import sampleSneakerUrl from '../assets/images/sample-sneaker.jpg';
import type { SamplePhoto } from '../types/studio';

export const HERO_SHOWCASE_AFTER_URL = samplePortraitCutoutUrl;

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'portrait',
    labelKey: 'samplePortrait',
    url: samplePortraitUrl,
    fileName: 'studio-portrait.jpg',
  },
  {
    id: 'product',
    labelKey: 'sampleProduct',
    url: sampleProductUrl,
    fileName: 'botanical-serum.jpg',
  },
  {
    id: 'sneaker',
    labelKey: 'sampleSneaker',
    url: sampleSneakerUrl,
    fileName: 'emerald-sneaker.jpg',
  },
];
