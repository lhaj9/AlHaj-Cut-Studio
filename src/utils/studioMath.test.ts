import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanvasFilterString,
  computeCanvasDimensions,
  computeCoverRect,
  computeSubjectRect,
  createHistoryStack,
  DEFAULT_COLOR_ADJUSTMENTS,
  formatFileSize,
  getExtensionForFormat,
  pushHistory,
  redoHistory,
  resolveFallbackEngines,
  sanitizeExportBaseName,
  undoHistory,
} from './studioMath';

test('computeCanvasDimensions handles original and all e-commerce aspect presets', () => {
  assert.deepEqual(computeCanvasDimensions(3840, 2160, 'original'), {
    width: 3840,
    height: 2160,
  });
  assert.deepEqual(computeCanvasDimensions(2000, 1500, 'amazon-square'), {
    width: 1080,
    height: 1080,
  });
  assert.deepEqual(computeCanvasDimensions(1200, 1200, 'youtube-16-9'), {
    width: 1920,
    height: 1080,
  });
  assert.deepEqual(computeCanvasDimensions(1200, 1200, 'reels-9-16'), {
    width: 1080,
    height: 1920,
  });
  assert.deepEqual(computeCanvasDimensions(1200, 1200, 'passport-35-45'), {
    width: 1050,
    height: 1350,
  });
});

test('computeSubjectRect centers and fits wide subject inside square canvas', () => {
  const rect = computeSubjectRect(1600, 800, 1080, 1080, 1, 0, 0);
  assert.equal(rect.width, 1080);
  assert.equal(rect.height, 540);
  assert.equal(rect.x, 0);
  assert.equal(rect.y, 270);
});

test('computeCoverRect covers canvas with bleed margin for DSLR bokeh', () => {
  const rect = computeCoverRect(1000, 1000, 1000, 500, 20);
  assert.equal(rect.width, 1040);
  assert.equal(rect.height, 1040);
  assert.equal(rect.x, -20);
  assert.equal(rect.y, -270);
});

test('buildCanvasFilterString returns none for neutral adjustments and valid filters otherwise', () => {
  assert.equal(buildCanvasFilterString(DEFAULT_COLOR_ADJUSTMENTS), 'none');
  assert.equal(
    buildCanvasFilterString(
      { brightness: 115, contrast: 90, saturation: 120, warmth: 20 },
      12
    ),
    'brightness(115%) contrast(90%) saturate(120%) sepia(18%) blur(12px)'
  );
  assert.equal(
    buildCanvasFilterString({ ...DEFAULT_COLOR_ADJUSTMENTS, warmth: -20 }),
    'hue-rotate(-9deg)'
  );
});

test('formatFileSize, extension mapping, and filename sanitization work across Arabic and Latin', () => {
  assert.equal(formatFileSize(0), '0 KB');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(48 * 1024), '48.0 KB');
  assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.50 MB');
  assert.equal(getExtensionForFormat('image/png'), 'png');
  assert.equal(getExtensionForFormat('image/webp'), 'webp');
  assert.equal(getExtensionForFormat('image/jpeg'), 'jpg');
  assert.equal(sanitizeExportBaseName('صورة منتج 2026.jpg'), 'صورة-منتج-2026');
  assert.equal(sanitizeExportBaseName('  my photo (final).png '), 'my-photo-final');
  assert.equal(sanitizeExportBaseName('...'), 'noorcut-studio');
});

test('resolveFallbackEngines guarantees automatic local fallback for all 3 engines', () => {
  assert.deepEqual(resolveFallbackEngines('notlain-cloud'), [
    'notlain-cloud',
    'rmbg-local',
    'imgly-local',
  ]);
  assert.deepEqual(resolveFallbackEngines('imgly-local'), ['imgly-local', 'rmbg-local']);
  assert.deepEqual(resolveFallbackEngines('rmbg-local'), ['rmbg-local', 'imgly-local']);
});

test('history stack supports push, undo, redo, and bounded maxSteps', () => {
  let stack = createHistoryStack('v0');
  stack = pushHistory(stack, 'v1', 2);
  stack = pushHistory(stack, 'v2', 2);
  stack = pushHistory(stack, 'v3', 2);

  assert.equal(stack.present, 'v3');
  assert.deepEqual(stack.past, ['v1', 'v2']);

  stack = undoHistory(stack);
  assert.equal(stack.present, 'v2');
  assert.deepEqual(stack.future, ['v3']);

  stack = redoHistory(stack);
  assert.equal(stack.present, 'v3');
  assert.deepEqual(stack.future, []);
});
