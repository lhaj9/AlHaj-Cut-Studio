import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanvasFilterString,
  canvasToMaskPoint,
  clampPanOffset,
  computeCanvasDimensions,
  computeCoverRect,
  computeExportDimensions,
  computeFittedDisplaySize,
  computeScreenBrushDiameter,
  computeSubjectRect,
  computeZoomAroundPoint,
  createHistoryStack,
  DEFAULT_COLOR_ADJUSTMENTS,
  formatFileSize,
  getExtensionForFormat,
  getUniqueExportBaseName,
  pushHistory,
  redoHistory,
  resolveFallbackEngines,
  sanitizeExportBaseName,
  screenToCanvasPoint,
  undoHistory,
} from './studioMath.ts';

test('computeCanvasDimensions and computeExportDimensions handle aspect presets and scale', () => {
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
  assert.deepEqual(computeExportDimensions(2000, 1000, 'original', 0.5), {
    width: 1000,
    height: 500,
  });
  assert.deepEqual(computeExportDimensions(2000, 1000, 'youtube-16-9', 0.75), {
    width: 1440,
    height: 810,
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

test('computeFittedDisplaySize preserves exact aspect ratio for large, small, portrait, and landscape images', () => {
  const wide = computeFittedDisplaySize(3840, 2160, 800, 600, 40, 4);
  assert.equal(wide.width, 760);
  assert.equal(wide.height, 428);

  const tall = computeFittedDisplaySize(1080, 1920, 800, 600, 40, 4);
  assert.equal(tall.height, 560);
  assert.equal(tall.width, 315);

  const tiny = computeFittedDisplaySize(100, 100, 800, 600, 40, 4);
  assert.equal(tiny.width, 400);
  assert.equal(tiny.height, 400);
});

test('clampPanOffset prevents losing canvas outside viewport and computeZoomAroundPoint keeps cursor anchored', () => {
  const clamped = clampPanOffset(9999, -9999, 600, 400, 2, 800, 600);
  assert.ok(clamped.x < 9999 && clamped.x > 0);
  assert.ok(clamped.y > -9999 && clamped.y < 0);

  const zoomed = computeZoomAroundPoint(
    1,
    2,
    { x: 0, y: 0 },
    500,
    400,
    800,
    600,
    600,
    400
  );
  assert.equal(zoomed.zoom, 2);
  assert.equal(zoomed.pan.x, -100);
  assert.equal(zoomed.pan.y, -100);
});

test('screen/canvas/mask coordinate mapping and brush preview size remain accurate under zoom and aspect presets', () => {
  const cPt = screenToCanvasPoint(
    300,
    200,
    { left: 100, top: 100, width: 400, height: 200 },
    1920,
    1080
  );
  assert.deepEqual(cPt, { cx: 960, cy: 540 });

  const mPt = canvasToMaskPoint(
    960,
    540,
    { x: 420, y: 0, width: 1080, height: 1080 },
    1000,
    1000
  );
  assert.deepEqual(mPt, { mx: 500, my: 500 });

  const diam = computeScreenBrushDiameter(40, 1000, 1000, 1000, 1080, 1920, 800);
  assert.equal(diam, 18);
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

test('formatFileSize, extension mapping, filename sanitization, and collision-free batch names work cleanly', () => {
  assert.equal(formatFileSize(0), '0 KB');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(48 * 1024), '48.0 KB');
  assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.50 MB');
  assert.equal(getExtensionForFormat('image/png'), 'png');
  assert.equal(getExtensionForFormat('image/webp'), 'webp');
  assert.equal(getExtensionForFormat('image/jpeg'), 'jpg');
  assert.equal(sanitizeExportBaseName('صورة منتج 2026.jpg'), 'صورة-منتج-2026');
  assert.equal(sanitizeExportBaseName('  my photo (final).png '), 'my-photo-final');
  assert.equal(sanitizeExportBaseName('...'), 'alhaj-cut-studio');

  const used = new Set<string>();
  assert.equal(getUniqueExportBaseName('photo-2.jpg', used), 'photo-2');
  assert.equal(getUniqueExportBaseName('photo.jpg', used), 'photo');
  assert.equal(getUniqueExportBaseName('photo.png', used), 'photo-3');
});

test('resolveFallbackEngines never sends local-engine images to cloud fallback', () => {
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
