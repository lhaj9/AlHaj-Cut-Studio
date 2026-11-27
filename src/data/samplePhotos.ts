import samplePortraitUrl from '../assets/images/sample_portrait_1795738780064.jpg';
import sampleProductUrl from '../assets/images/sample_product_1795738780558.jpg';
import sampleSneakerUrl from '../assets/images/sample_sneaker_1795738780068.jpg';
import type { SamplePhoto } from '../types/studio';

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
