import type { SupportedLocale } from '../config';

export interface TranslationDictionary {
  metaTitle: string;
  navSingle: string;
  navBulk: string;
  navFeatures: string;
  navFaq: string;
  uploadAction: string;
  engineLabel: string;
  engineRmbgName: string;
  engineRmbgDesc: string;
  engineImglyName: string;
  engineImglyDesc: string;
  engineCloudName: string;
  engineCloudDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  dropHeadline: string;
  dropSubline: string;
  dropButton: string;
  dropFormats: string;
  trySampleLabel: string;
  samplePortrait: string;
  sampleProduct: string;
  sampleSneaker: string;
  compareBefore: string;
  compareAfter: string;
  compareDragHint: string;
  modeSingle: string;
  modeBulk: string;
  processingInitRmbg: string;
  processingDownloading: string;
  processingInferring: string;
  processingRefining: string;
  processingFallbackNotice: string;
  processingDoneIn: string;
  processingEngineUsed: string;
  reprocessWithEngine: string;
  newImage: string;
  compareToggle: string;
  undo: string;
  redo: string;
  zoomFit: string;
  tabBackground: string;
  tabText: string;
  tabEffects: string;
  tabBrush: string;
  tabAdjust: string;
  tabExport: string;
  bgTransparent: string;
  bgSolid: string;
  bgGradient: string;
  bgImage: string;
  bgBokeh: string;
  bgUploadCustom: string;
  bgBokehIntensity: string;
  bgBokehHint: string;
  presetAmazonWhite: string;
  presetStudioGray: string;
  presetWarmSand: string;
  presetObsidian: string;
  presetEmerald: string;
  presetCobalt: string;
  gradAlabaster: string;
  gradEmerald: string;
  gradTravertine: string;
  gradObsidian: string;
  gradTerracotta: string;
  gradNordic: string;
  textAddLayer: string;
  textDefaultContent: string;
  textEmptyHint: string;
  textPlaceBehind: string;
  textPlaceFront: string;
  textFontLabel: string;
  textSizeLabel: string;
  textColorLabel: string;
  textStrokeLabel: string;
  textShadowLabel: string;
  textRotationLabel: string;
  textOpacityLabel: string;
  textDragHint: string;
  textDeleteLayer: string;
  effectsStickerTitle: string;
  effectsStickerEnable: string;
  effectsStrokeWidth: string;
  effectsStrokeColor: string;
  effectsShadowTitle: string;
  effectsShadowEnable: string;
  effectsShadowX: string;
  effectsShadowY: string;
  effectsShadowBlur: string;
  effectsShadowOpacity: string;
  effectsShadowColor: string;
  brushTitle: string;
  brushToggleActive: string;
  brushModeErase: string;
  brushModeRestore: string;
  brushSize: string;
  brushSoftness: string;
  brushResetMask: string;
  brushHint: string;
  adjustTargetSubject: string;
  adjustTargetBg: string;
  adjustBrightness: string;
  adjustContrast: string;
  adjustSaturation: string;
  adjustWarmth: string;
  adjustReset: string;
  resizeTitle: string;
  ratioOriginal: string;
  ratioAmazon: string;
  ratioYoutube: string;
  ratioReels: string;
  ratioPassport: string;
  subjectScaleLabel: string;
  exportFormatLabel: string;
  exportQualityLabel: string;
  exportEstimatedSize: string;
  exportDimensions: string;
  exportDownloadBtn: string;
  exportFileNameLabel: string;
  bulkTitle: string;
  bulkSubtitle: string;
  bulkDropHeadline: string;
  bulkDropSubline: string;
  bulkLoadSamples: string;
  bulkStartQueue: string;
  bulkPauseQueue: string;
  bulkClearAll: string;
  bulkDownloadZip: string;
  bulkZipPreparing: string;
  bulkGlobalBg: string;
  bulkGlobalRatio: string;
  bulkWatermarkPlaceholder: string;
  bulkWatermarkLabel: string;
  bulkStatusQueued: string;
  bulkStatusProcessing: string;
  bulkStatusDone: string;
  bulkStatusError: string;
  bulkOpenInStudio: string;
  bulkDownloadOne: string;
  bulkRemoveOne: string;
  bulkProcessedCount: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  featuresTitle: string;
  featuresSubtitle: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;
  faqTitle: string;
  faqItems: { q: string; a: string }[];
  adSlotLabel: string;
  adSlotHint: string;
  footerPrivacyNote: string;
  footerRights: string;
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  ar: {
    metaTitle: 'نور كات ستوديو – إزالة الخلفية بالذكاء الاصطناعي وستوديو التصميم الإبداعي',
    navSingle: 'الستوديو الفردي',
    navBulk: 'المعالجة الجماعية',
    navFeatures: 'المميزات',
    navFaq: 'الأسئلة الشائعة',
    uploadAction: 'رفع صورة',
    engineLabel: 'محرك الذكاء',
    engineRmbgName: 'RMBG-1.4 محلي (موصى به)',
    engineRmbgDesc: 'يعمل داخل متصفحك مجاناً للأبد عبر WebAssembly بدقة شعر وتفاصيل عالية',
    engineImglyName: 'IMG.LY ISNet محلي',
    engineImglyDesc: 'محرك عزل ستوديو محلي بالكامل على جهازك بدون رفع أي صور',
    engineCloudName: 'not-lain سحابي فائق',
    engineCloudDesc: 'عزل فائق عبر Hugging Face ZeroGPU مع تحوّل تلقائي فوري للمحرك المحلي عند الضغط',
    heroTitle: 'اعزل الخلفيات بدقة الاستوديو، وصمّم صورك مباشرة من متصفحك',
    heroSubtitle: 'ثلاثة محركات ذكاء اصطناعي مجانية للأبد بدون خادم، معالجة جماعية لأكثر من 50 صورة، النص خلف العنصر، وعزل البوكيه الاحترافي.',
    dropHeadline: 'اسحب صورتك هنا أو انقر للاختيار',
    dropSubline: 'تعمل المعالجة على جهازك بخصوصية تامة — يدعم دقة حتى 4K',
    dropButton: 'اختر صورة للبدء',
    dropFormats: 'JPG · PNG · WebP · AVIF',
    trySampleLabel: 'أو جرّب فوراً بإحدى صور الاستوديو:',
    samplePortrait: 'بورتريه (شعر وتفاصيل)',
    sampleProduct: 'منتج تجميل (متاجر)',
    sampleSneaker: 'حذاء رياضي (إعلانات)',
    compareBefore: 'قبل',
    compareAfter: 'بعد العزل',
    compareDragHint: 'اسحب الستارة للمقارنة',
    modeSingle: 'الستوديو الفردي',
    modeBulk: 'المعالجة الجماعية (Bulk)',
    processingInitRmbg: 'جاري تهيئة محرك الذكاء الاصطناعي لأول مرة فقط - يعمل مجاناً للأبد...',
    processingDownloading: 'جاري تحميل نموذج الذكاء الاصطناعي إلى ذاكرة المتصفح',
    processingInferring: 'جاري تحليل الحواف والشعر وعزل الخلفية بدقة...',
    processingRefining: 'جاري بناء القناع الشفاف عالي الدقة...',
    processingFallbackNotice: 'المحرك المختار مشغول حالياً — تم إكمال العزل تلقائياً عبر المحرك المحلي السريع.',
    processingDoneIn: 'اكتمل في',
    processingEngineUsed: 'المحرك المستخدم',
    reprocessWithEngine: 'إعادة العزل بالمحرك المحدد',
    newImage: 'صورة جديدة',
    compareToggle: 'مقارنة قبل/بعد',
    undo: 'تراجع',
    redo: 'إعادة',
    zoomFit: 'ملاءمة',
    tabBackground: 'الخلفية والبوكيه',
    tabText: 'النص خلف العنصر',
    tabEffects: 'الحدود والظلال',
    tabBrush: 'الفرشاة السحرية',
    tabAdjust: 'الألوان والمقاسات',
    tabExport: 'التصدير والحفظ',
    bgTransparent: 'شفاف',
    bgSolid: 'لون ثابت',
    bgGradient: 'تدرّج ناعم',
    bgImage: 'صورة خلفية',
    bgBokeh: 'عزل بوكيه DSLR',
    bgUploadCustom: 'رفع صورة خلفية مخصصة',
    bgBokehIntensity: 'قوة تمويه الخلفية (Bokeh)',
    bgBokehHint: 'يموّه خلفية الصورة الأصلية بدقة عدسة كاميرا احترافية مع بقاء العنصر حاداً.',
    presetAmazonWhite: 'أبيض أمازون',
    presetStudioGray: 'رمادي استوديو',
    presetWarmSand: 'رملي دافئ',
    presetObsidian: 'كحلي داكن',
    presetEmerald: 'زمردي',
    presetCobalt: 'أزرق ملكي',
    gradAlabaster: 'ضباب رخامي',
    gradEmerald: 'إشراقة زمردية',
    gradTravertine: 'دفء ذهبي',
    gradObsidian: 'استوديو داكن',
    gradTerracotta: 'شفق وردي',
    gradNordic: 'سماء صافية',
    textAddLayer: 'إضافة طبقة نص جديدة',
    textDefaultContent: 'إبداع بلا حدود',
    textEmptyHint: 'أضف نصاً عربياً أو إنجليزياً وضعه خلف العنصر بضغطة واحدة لتصميم أغلفة يوتيوب والملصقات.',
    textPlaceBehind: 'النص خلف العنصر',
    textPlaceFront: 'النص أمام العنصر',
    textFontLabel: 'نوع الخط',
    textSizeLabel: 'حجم الخط',
    textColorLabel: 'لون النص',
    textStrokeLabel: 'سمك الإطار الخارجي',
    textShadowLabel: 'نعومة الظل',
    textRotationLabel: 'زاوية التدوير',
    textOpacityLabel: 'الشفافية',
    textDragHint: 'يمكنك سحب النص وتحريكه مباشرة فوق اللوحة.',
    textDeleteLayer: 'حذف النص',
    effectsStickerTitle: 'إطار الملصقات (YouTube Sticker)',
    effectsStickerEnable: 'تفعيل إطار الملصق حول العنصر',
    effectsStrokeWidth: 'سمك الإطار',
    effectsStrokeColor: 'لون الإطار',
    effectsShadowTitle: 'ظل الاستوديو الواقعي',
    effectsShadowEnable: 'تفعيل ظل الاستوديو',
    effectsShadowX: 'الإزاحة الأفقية (X)',
    effectsShadowY: 'الإزاحة الرأسية (Y)',
    effectsShadowBlur: 'نعومة الظل',
    effectsShadowOpacity: 'كثافة الظل',
    effectsShadowColor: 'لون الظل',
    brushTitle: 'تعديل القناع يدوياً (الفرشاة السحرية)',
    brushToggleActive: 'تفعيل الرسم بالفرشاة على اللوحة',
    brushModeErase: 'مسح من العنصر',
    brushModeRestore: 'استعادة من الأصل',
    brushSize: 'حجم الفرشاة',
    brushSoftness: 'نعومة الحواف',
    brushResetMask: 'استعادة القناع الأصلي',
    brushHint: 'فعّل الفرشاة ثم ارسم مباشرة فوق الصورة للمسح أو الاستعادة بدقة مع دعم Ctrl+Z.',
    adjustTargetSubject: 'تعديل العنصر',
    adjustTargetBg: 'تعديل الخلفية',
    adjustBrightness: 'السطوع',
    adjustContrast: 'التباين',
    adjustSaturation: 'التشبع اللوني',
    adjustWarmth: 'دفء الألوان',
    adjustReset: 'إعادة ضبط الألوان',
    resizeTitle: 'مقاسات التجارة الإلكترونية والمنصات',
    ratioOriginal: 'المقاس الأصلي',
    ratioAmazon: 'مربع أمازون والمتاجر (1:1)',
    ratioYoutube: 'صورة مصغرة يوتيوب (16:9)',
    ratioReels: 'ريلز وتيك توك (9:16)',
    ratioPassport: 'صورة شخصية / جواز (3.5×4.5)',
    subjectScaleLabel: 'حجم العنصر داخل الإطار',
    exportFormatLabel: 'صيغة الملف',
    exportQualityLabel: 'جودة الضغط',
    exportEstimatedSize: 'الحجم المتوقع',
    exportDimensions: 'الأبعاد النهائية',
    exportDownloadBtn: 'تحميل التصميم عالي الدقة',
    exportFileNameLabel: 'اسم الملف',
    bulkTitle: 'المعالجة الجماعية للصور (حتى 50+ صورة)',
    bulkSubtitle: 'ارفع عشرات الصور دفعة واحدة، طبّق خلفية موحّدة أو علامة مائية، وحمّلها جميعاً في ملف ZIP واحد.',
    bulkDropHeadline: 'اسحب عدة صور هنا أو انقر لاختيار مجلد الصور',
    bulkDropSubline: 'معالجة متسلسلة ذكية تحافظ على ذاكرة جهازك وتعمل بدون حدود',
    bulkLoadSamples: 'إضافة 3 صور تجريبية',
    bulkStartQueue: 'بدء المعالجة الجماعية',
    bulkPauseQueue: 'إيقاف مؤقت',
    bulkClearAll: 'مسح القائمة',
    bulkDownloadZip: 'تحميل الكل كملف ZIP',
    bulkZipPreparing: 'جاري ضغط الصور في ZIP...',
    bulkGlobalBg: 'خلفية موحّدة للجميع',
    bulkGlobalRatio: 'مقاس موحّد',
    bulkWatermarkLabel: 'علامة مائية نصية (اختياري)',
    bulkWatermarkPlaceholder: 'مثال: @متجري',
    bulkStatusQueued: 'في الانتظار',
    bulkStatusProcessing: 'جاري العزل...',
    bulkStatusDone: 'جاهزة',
    bulkStatusError: 'تعذّر المعالجة',
    bulkOpenInStudio: 'تعديل بالستوديو',
    bulkDownloadOne: 'تحميل',
    bulkRemoveOne: 'حذف',
    bulkProcessedCount: 'مكتملة',
    showcaseTitle: 'دقة استوديو حقيقية في عزل الشعر والحواف المعقدة',
    showcaseSubtitle: 'قارن النتيجة مباشرة عبر الستارة التفاعلية قبل وبعد المعالجة.',
    featuresTitle: 'مصمم لمتاجر التجارة الإلكترونية وصنّاع المحتوى',
    featuresSubtitle: 'سرعة فائقة، خصوصية تامة داخل المتصفح، وأدوات تصميم متعددة الطبقات بدون اشتراكات.',
    feat1Title: 'خصوصية 100% على جهازك',
    feat1Desc: 'تُعالج صورك محلياً داخل المتصفح عبر WebAssembly دون إرسالها لأي خادم خارجي، مع دعم العمل المجاني الدائم.',
    feat2Title: 'ثلاثة محركات ذكاء اصطناعي',
    feat2Desc: 'اختر بين RMBG-1.4 و IMG.LY ISNet ومحرك ZeroGPU السحابي مع نظام حماية تلقائي يمنع التوقف أو الأخطاء.',
    feat3Title: 'ستوديو تصميم متعدد الطبقات',
    feat3Desc: 'ضع النص خلف العنصر، أضف إطار ملصقات يوتيوب، فعّل عزل بوكيه DSLR، وصدّر بصيغ PNG أو WebP أو JPG.',
    faqTitle: 'الأسئلة الشائعة',
    faqItems: [
      {
        q: 'هل الأداة مجانية بالكامل وهل تضع علامة مائية؟',
        a: 'نعم، الأداة مجانية 100% للأبد ولا تفرض أي علامة مائية إجبارية. جميع المحركات المحلية تعمل مباشرة عبر متصفحك بدون مفاتيح API مدفوعة.',
      },
      {
        q: 'لماذا يستغرق أول تشغيل بضع ثوانٍ إضافية؟',
        a: 'في المرة الأولى فقط، يقوم المتصفح بتحميل ملفات نموذج الذكاء الاصطناعي وتخزينها محلياً في الذاكرة المؤقتة (Cache). بعد ذلك تصبح كل صورة لاحقة فورية تقريباً.',
      },
      {
        q: 'كيف أضع النص خلف الشخص أو المنتج؟',
        a: 'بعد عزل الصورة في الستوديو الفردي، افتح تبويب "النص خلف العنصر"، أضف نصك العربي أو الإنجليزي، واضغط على خيار "النص خلف العنصر" مع إمكانية سحب النص مباشرة على اللوحة.',
      },
      {
        q: 'كم صورة يمكنني معالجتها في الوضع الجماعي (Bulk)؟',
        a: 'يمكنك إسقاط 50 صورة أو أكثر في المرة الواحدة. يقوم المحرك بمعالجتها بالتتابع لحماية ذاكرة RAM ثم يتيح تنزيلها كلها في ملف ZIP واحد.',
      },
    ],
    adSlotLabel: 'مساحة إعلانية قابلة للتخصيص',
    adSlotHint: 'أضف معرّف Google AdSense في src/config.ts لتفعيل الإعلانات مباشرة.',
    footerPrivacyNote: 'تعمل المعالجة المحلية بالكامل داخل متصفحك بدون حفظ الصور على أي خادم.',
    footerRights: 'جميع الحقوق محفوظة.',
  },
  en: {
    metaTitle: 'NoorCut Studio – AI Background Remover & Creative Photo Studio',
    navSingle: 'Single Studio',
    navBulk: 'Bulk Batch',
    navFeatures: 'Features',
    navFaq: 'FAQ',
    uploadAction: 'Upload Photo',
    engineLabel: 'AI Engine',
    engineRmbgName: 'RMBG-1.4 Local (Recommended)',
    engineRmbgDesc: 'Runs 100% on-device via WebAssembly — free forever with sharp hair & edge matting',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc: 'Precision studio alpha matting directly in your browser with zero server uploads',
    engineCloudName: 'not-lain Cloud Ultra',
    engineCloudDesc: 'Free Hugging Face ZeroGPU space with automatic local AI fallback if rate-limited',
    heroTitle: 'Studio-grade background removal and layered photo design in your browser',
    heroSubtitle: 'Three free AI engines with zero server costs, 50+ bulk ZIP cutout processing, text behind subject, and DSLR portrait bokeh.',
    dropHeadline: 'Drop your image here or click to browse',
    dropSubline: 'Processed privately on your device — full support up to 4K resolution',
    dropButton: 'Choose Image',
    dropFormats: 'JPG · PNG · WebP · AVIF',
    trySampleLabel: 'Or try immediately with a studio sample:',
    samplePortrait: 'Portrait (Hair Detail)',
    sampleProduct: 'Product Bottle (Store)',
    sampleSneaker: 'Sneaker (Ad Cutout)',
    compareBefore: 'Before',
    compareAfter: 'Cutout',
    compareDragHint: 'Drag curtain to compare',
    modeSingle: 'Single Studio',
    modeBulk: 'Bulk Batch Mode',
    processingInitRmbg: 'Initializing on-device AI engine (first time only — free forever)...',
    processingDownloading: 'Downloading neural model to browser cache',
    processingInferring: 'Analyzing subject edges and fine hair alpha matte...',
    processingRefining: 'Compositing high-resolution transparent cutout...',
    processingFallbackNotice: 'Selected engine was unavailable — completed automatically via Local AI.',
    processingDoneIn: 'Done in',
    processingEngineUsed: 'Engine',
    reprocessWithEngine: 'Re-cut with selected engine',
    newImage: 'New Image',
    compareToggle: 'Compare',
    undo: 'Undo',
    redo: 'Redo',
    zoomFit: 'Fit',
    tabBackground: 'Background & Bokeh',
    tabText: 'Text Behind Subject',
    tabEffects: 'Outline & Shadow',
    tabBrush: 'Magic Brush',
    tabAdjust: 'Color & Resize',
    tabExport: 'Export',
    bgTransparent: 'Transparent',
    bgSolid: 'Solid Color',
    bgGradient: 'Mesh Gradient',
    bgImage: 'Custom Image',
    bgBokeh: 'DSLR Bokeh',
    bgUploadCustom: 'Upload Background Image',
    bgBokehIntensity: 'Bokeh Blur Strength',
    bgBokehHint: 'Blurs the original photo background behind the crisp subject cutout.',
    presetAmazonWhite: 'Amazon White',
    presetStudioGray: 'Studio Gray',
    presetWarmSand: 'Warm Sand',
    presetObsidian: 'Obsidian',
    presetEmerald: 'Emerald',
    presetCobalt: 'Cobalt',
    gradAlabaster: 'Alabaster Mist',
    gradEmerald: 'Emerald Daylight',
    gradTravertine: 'Warm Travertine',
    gradObsidian: 'Obsidian Studio',
    gradTerracotta: 'Rose Horizon',
    gradNordic: 'Nordic Sky',
    textAddLayer: 'Add Text Layer',
    textDefaultContent: 'STUDIO EDITION',
    textEmptyHint: 'Add bold typography and place it behind your subject in one click for YouTube thumbnails and posters.',
    textPlaceBehind: 'Behind Subject',
    textPlaceFront: 'In Front',
    textFontLabel: 'Font Family',
    textSizeLabel: 'Font Size',
    textColorLabel: 'Text Color',
    textStrokeLabel: 'Outline Stroke',
    textShadowLabel: 'Drop Shadow',
    textRotationLabel: 'Rotation',
    textOpacityLabel: 'Opacity',
    textDragHint: 'Drag any text layer directly on the canvas to position it.',
    textDeleteLayer: 'Remove Layer',
    effectsStickerTitle: 'YouTube Sticker Border',
    effectsStickerEnable: 'Enable Cutout Sticker Outline',
    effectsStrokeWidth: 'Border Width',
    effectsStrokeColor: 'Border Color',
    effectsShadowTitle: 'Studio Drop Shadow',
    effectsShadowEnable: 'Enable Studio Shadow',
    effectsShadowX: 'Horizontal Offset (X)',
    effectsShadowY: 'Vertical Offset (Y)',
    effectsShadowBlur: 'Softness Blur',
    effectsShadowOpacity: 'Shadow Opacity',
    effectsShadowColor: 'Shadow Color',
    brushTitle: 'Manual Alpha Mask Touch-Up',
    brushToggleActive: 'Enable Brush Painting on Canvas',
    brushModeErase: 'Erase Mask',
    brushModeRestore: 'Restore Original',
    brushSize: 'Brush Size',
    brushSoftness: 'Edge Softness',
    brushResetMask: 'Reset Original Mask',
    brushHint: 'Enable brush mode and paint directly on the canvas. Supports Ctrl+Z / Ctrl+Y.',
    adjustTargetSubject: 'Subject',
    adjustTargetBg: 'Background',
    adjustBrightness: 'Brightness',
    adjustContrast: 'Contrast',
    adjustSaturation: 'Saturation',
    adjustWarmth: 'Warmth',
    adjustReset: 'Reset Adjustments',
    resizeTitle: 'Smart E-Commerce & Social Presets',
    ratioOriginal: 'Original Size',
    ratioAmazon: 'Amazon / Store Square (1:1)',
    ratioYoutube: 'YouTube Thumbnail (16:9)',
    ratioReels: 'Reels / TikTok (9:16)',
    ratioPassport: 'ID / Passport (3.5×4.5)',
    subjectScaleLabel: 'Subject Scale',
    exportFormatLabel: 'File Format',
    exportQualityLabel: 'Compression Quality',
    exportEstimatedSize: 'Estimated Size',
    exportDimensions: 'Output Dimensions',
    exportDownloadBtn: 'Download High-Res Export',
    exportFileNameLabel: 'File Name',
    bulkTitle: 'Bulk Batch Cutout Processor (50+ Images)',
    bulkSubtitle: 'Drop dozens of product or portrait photos, apply unified backgrounds or watermarks, and export all as a single ZIP.',
    bulkDropHeadline: 'Drop multiple images here or click to select',
    bulkDropSubline: 'Sequential RAM-safe queue runs entirely in your browser',
    bulkLoadSamples: 'Add 3 Studio Samples',
    bulkStartQueue: 'Start Batch Queue',
    bulkPauseQueue: 'Pause Queue',
    bulkClearAll: 'Clear Queue',
    bulkDownloadZip: 'Download All as ZIP',
    bulkZipPreparing: 'Packaging ZIP archive...',
    bulkGlobalBg: 'Global Background',
    bulkGlobalRatio: 'Global Aspect Ratio',
    bulkWatermarkLabel: 'Text Watermark (Optional)',
    bulkWatermarkPlaceholder: 'e.g. @yourstore',
    bulkStatusQueued: 'Queued',
    bulkStatusProcessing: 'Processing...',
    bulkStatusDone: 'Ready',
    bulkStatusError: 'Failed',
    bulkOpenInStudio: 'Edit in Studio',
    bulkDownloadOne: 'Download',
    bulkRemoveOne: 'Remove',
    bulkProcessedCount: 'completed',
    showcaseTitle: 'Hair-strand precision and effortless edge refinement',
    showcaseSubtitle: 'Drag the interactive curtain to compare original photography with instant neural alpha matting.',
    featuresTitle: 'Built for e-commerce teams and visual creators',
    featuresSubtitle: 'Zero backend infrastructure, complete on-device privacy, and multi-layer creative finishing.',
    feat1Title: '100% On-Device Privacy',
    feat1Desc: 'Local neural engines run inside your browser via WebAssembly so sensitive product and portrait files never leave your computer.',
    feat2Title: 'Triple-Engine Resilience',
    feat2Desc: 'Switch effortlessly between RMBG-1.4, IMG.LY ISNet, and Hugging Face ZeroGPU with automatic fallback protection.',
    feat3Title: 'Non-Destructive Layer Studio',
    feat3Desc: 'Layer typography behind subjects, add crisp YouTube sticker outlines, dial in DSLR bokeh, and export PNG, WebP, or JPG.',
    faqTitle: 'Frequently Asked Questions',
    faqItems: [
      {
        q: 'Is NoorCut Studio completely free without watermarks?',
        a: 'Yes. It runs 100% in your browser with no subscriptions, no API keys, and no forced watermarks.',
      },
      {
        q: 'Why does the very first image take a few seconds to initialize?',
        a: 'On first run only, your browser downloads and caches the neural model weights locally. Every image after that processes rapidly from browser cache.',
      },
      {
        q: 'How does Text Behind Subject work?',
        a: 'Because the compositor keeps the background, subject alpha mask, and text layers strictly separate, toggling "Behind Subject" places your typography cleanly between the background and subject silhouette.',
      },
      {
        q: 'Can I process 50+ product photos at once?',
        a: 'Yes. Bulk Batch Mode processes images sequentially to keep memory usage steady, lets you apply Amazon Pure White backgrounds globally, and packages every result into a ZIP file.',
      },
    ],
    adSlotLabel: 'Configurable Sponsor / Ad Slot',
    adSlotHint: 'Add your Google AdSense Publisher & Slot IDs in src/config.ts to activate live ads.',
    footerPrivacyNote: 'Local AI processing runs entirely inside your browser — no images are stored on external servers.',
    footerRights: 'All rights reserved.',
  },
  pt: {
    metaTitle: 'NoorCut Studio – Removedor de Fundo IA e Estúdio Criativo de Fotos',
    navSingle: 'Estúdio Único',
    navBulk: 'Lote em Massa',
    navFeatures: 'Recursos',
    navFaq: 'Perguntas',
    uploadAction: 'Enviar Foto',
    engineLabel: 'Motor de IA',
    engineRmbgName: 'RMBG-1.4 Local (Recomendado)',
    engineRmbgDesc: 'Roda 100% no navegador via WebAssembly — grátis para sempre com recorte preciso',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc: 'Recorte alfa de estúdio direto no dispositivo sem enviar arquivos para servidores',
    engineCloudName: 'not-lain Nuvem Ultra',
    engineCloudDesc: 'Espaço gratuito Hugging Face ZeroGPU com fallback automático para IA local',
    heroTitle: 'Remova fundos com precisão de estúdio e edite em camadas no navegador',
    heroSubtitle: 'Três motores de IA gratuitos sem servidor, processamento em lote de 50+ imagens com ZIP, texto atrás do objeto e desfoque DSLR.',
    dropHeadline: 'Arraste sua imagem aqui ou clique para escolher',
    dropSubline: 'Processado com privacidade total no dispositivo — suporte até 4K',
    dropButton: 'Escolher Imagem',
    dropFormats: 'JPG · PNG · WebP · AVIF',
    trySampleLabel: 'Ou teste agora com fotos de demonstração:',
    samplePortrait: 'Retrato (Cabelo)',
    sampleProduct: 'Produto (E-commerce)',
    sampleSneaker: 'Tênis (Anúncio)',
    compareBefore: 'Antes',
    compareAfter: 'Recortado',
    compareDragHint: 'Arraste para comparar',
    modeSingle: 'Estúdio Único',
    modeBulk: 'Modo em Lote (Bulk)',
    processingInitRmbg: 'Inicializando motor de IA local (apenas na primeira vez — grátis para sempre)...',
    processingDownloading: 'Baixando modelo neural para o cache do navegador',
    processingInferring: 'Analisando contornos e fios de cabelo com precisão...',
    processingRefining: 'Gerando máscara alfa transparente em alta resolução...',
    processingFallbackNotice: 'O motor selecionado estava ocupado — concluído automaticamente via IA Local.',
    processingDoneIn: 'Concluído em',
    processingEngineUsed: 'Motor',
    reprocessWithEngine: 'Recortar com motor atual',
    newImage: 'Nova Imagem',
    compareToggle: 'Comparar',
    undo: 'Desfazer',
    redo: 'Refazer',
    zoomFit: 'Ajustar',
    tabBackground: 'Fundo e Bokeh',
    tabText: 'Texto Atrás',
    tabEffects: 'Borda e Sombra',
    tabBrush: 'Pincel Mágico',
    tabAdjust: 'Cor e Tamanho',
    tabExport: 'Exportar',
    bgTransparent: 'Transparente',
    bgSolid: 'Cor Sólida',
    bgGradient: 'Gradiente',
    bgImage: 'Imagem Própria',
    bgBokeh: 'Bokeh DSLR',
    bgUploadCustom: 'Enviar Imagem de Fundo',
    bgBokehIntensity: 'Intensidade do Desfoque Bokeh',
    bgBokehHint: 'Desfoca o fundo original mantendo o objeto recortado totalmente nítido.',
    presetAmazonWhite: 'Branco Loja',
    presetStudioGray: 'Cinza Estúdio',
    presetWarmSand: 'Areia Quente',
    presetObsidian: 'Obsidiana',
    presetEmerald: 'Esmeralda',
    presetCobalt: 'Azul Cobalto',
    gradAlabaster: 'Névoa Alabastro',
    gradEmerald: 'Luz Esmeralda',
    gradTravertine: 'Travertino Quente',
    gradObsidian: 'Estúdio Escuro',
    gradTerracotta: 'Horizonte Rosa',
    gradNordic: 'Céu Nórdico',
    textAddLayer: 'Adicionar Camada de Texto',
    textDefaultContent: 'EDIÇÃO ESTÚDIO',
    textEmptyHint: 'Adicione textos impactantes atrás do sujeito com 1 clique para capas do YouTube e pôsteres.',
    textPlaceBehind: 'Atrás do Objeto',
    textPlaceFront: 'Na Frente',
    textFontLabel: 'Fonte',
    textSizeLabel: 'Tamanho',
    textColorLabel: 'Cor do Texto',
    textStrokeLabel: 'Contorno',
    textShadowLabel: 'Sombra',
    textRotationLabel: 'Rotação',
    textOpacityLabel: 'Opacidade',
    textDragHint: 'Arraste o texto diretamente na tela para posicionar.',
    textDeleteLayer: 'Excluir Camada',
    effectsStickerTitle: 'Borda Adesivo (YouTube)',
    effectsStickerEnable: 'Ativar Contorno de Adesivo',
    effectsStrokeWidth: 'Largura da Borda',
    effectsStrokeColor: 'Cor da Borda',
    effectsShadowTitle: 'Sombra Realista de Estúdio',
    effectsShadowEnable: 'Ativar Sombra',
    effectsShadowX: 'Deslocamento X',
    effectsShadowY: 'Deslocamento Y',
    effectsShadowBlur: 'Suavidade',
    effectsShadowOpacity: 'Opacidade',
    effectsShadowColor: 'Cor da Sombra',
    brushTitle: 'Retoque Manual da Máscara',
    brushToggleActive: 'Ativar Pincel na Tela',
    brushModeErase: 'Apagar Área',
    brushModeRestore: 'Restaurar Original',
    brushSize: 'Tamanho do Pincel',
    brushSoftness: 'Suavidade da Borda',
    brushResetMask: 'Restaurar Máscara Inicial',
    brushHint: 'Ative o pincel e pinte diretamente sobre a imagem. Suporta Ctrl+Z e Ctrl+Y.',
    adjustTargetSubject: 'Objeto',
    adjustTargetBg: 'Fundo',
    adjustBrightness: 'Brilho',
    adjustContrast: 'Contraste',
    adjustSaturation: 'Saturação',
    adjustWarmth: 'Temperatura',
    adjustReset: 'Redefinir Cores',
    resizeTitle: 'Formatos para E-commerce e Redes',
    ratioOriginal: 'Tamanho Original',
    ratioAmazon: 'Quadrado Loja / Amazon (1:1)',
    ratioYoutube: 'Capa YouTube (16:9)',
    ratioReels: 'Reels / TikTok (9:16)',
    ratioPassport: 'Foto 3×4 / Passaporte (3.5×4.5)',
    subjectScaleLabel: 'Escala do Objeto',
    exportFormatLabel: 'Formato',
    exportQualityLabel: 'Qualidade',
    exportEstimatedSize: 'Tamanho Estimado',
    exportDimensions: 'Dimensões',
    exportDownloadBtn: 'Baixar Arte em Alta Resolução',
    exportFileNameLabel: 'Nome do Arquivo',
    bulkTitle: 'Processamento em Lote (50+ Imagens)',
    bulkSubtitle: 'Envie dezenas de fotos de uma vez, aplique fundo padronizado ou marca d’água e baixe tudo em ZIP.',
    bulkDropHeadline: 'Arraste várias imagens aqui ou clique para selecionar',
    bulkDropSubline: 'Fila sequencial segura para a memória RAM do navegador',
    bulkLoadSamples: 'Adicionar 3 Amostras',
    bulkStartQueue: 'Iniciar Fila',
    bulkPauseQueue: 'Pausar Fila',
    bulkClearAll: 'Limpar Tudo',
    bulkDownloadZip: 'Baixar Tudo em ZIP',
    bulkZipPreparing: 'Gerando arquivo ZIP...',
    bulkGlobalBg: 'Fundo Global',
    bulkGlobalRatio: 'Proporção Global',
    bulkWatermarkLabel: 'Marca d’água (Opcional)',
    bulkWatermarkPlaceholder: 'ex: @sualoja',
    bulkStatusQueued: 'Na fila',
    bulkStatusProcessing: 'Processando...',
    bulkStatusDone: 'Pronto',
    bulkStatusError: 'Erro',
    bulkOpenInStudio: 'Editar no Estúdio',
    bulkDownloadOne: 'Baixar',
    bulkRemoveOne: 'Remover',
    bulkProcessedCount: 'concluídas',
    showcaseTitle: 'Recorte limpo em fios de cabelo e contornos complexos',
    showcaseSubtitle: 'Arraste a cortina interativa para comparar o original e o recorte em tempo real.',
    featuresTitle: 'Feito para lojas online e criadores de conteúdo',
    featuresSubtitle: 'Sem custos de servidor, privacidade local e composição profissional em camadas.',
    feat1Title: '100% Privado no Dispositivo',
    feat1Desc: 'Os modelos locais executam direto no seu navegador via WebAssembly sem enviar suas fotos a terceiros.',
    feat2Title: 'Três Motores de IA',
    feat2Desc: 'Alterne entre RMBG-1.4, IMG.LY ISNet e nuvem ZeroGPU com proteção automática contra falhas.',
    feat3Title: 'Estúdio Criativo em Camadas',
    feat3Desc: 'Coloque texto atrás do objeto, aplique borda de adesivo, desfoque DSLR e exporte em PNG, WebP ou JPG.',
    faqTitle: 'Perguntas Frequentes',
    faqItems: [
      {
        q: 'O NoorCut Studio é realmente gratuito e sem marca d’água?',
        a: 'Sim! Roda 100% no navegador sem mensalidades, sem chaves de API pagas e sem marca d’água obrigatória.',
      },
      {
        q: 'Por que o primeiro recorte leva alguns segundos a mais?',
        a: 'Apenas no primeiro uso o navegador baixa e salva o modelo de IA no cache local. Depois disso, os recortes ficam super rápidos.',
      },
      {
        q: 'Como colocar texto atrás da pessoa ou do produto?',
        a: 'No Estúdio Único, abra a aba "Texto Atrás", adicione sua camada de texto e clique em "Atrás do Objeto". Arraste o texto livremente na tela.',
      },
      {
        q: 'Posso recortar mais de 50 fotos de produtos de uma vez?',
        a: 'Sim. O Modo em Lote processa uma foto por vez para economizar memória RAM e permite baixar todas juntas em um único arquivo ZIP.',
      },
    ],
    adSlotLabel: 'Espaço Publicitário Configurável',
    adSlotHint: 'Insira seu ID do Google AdSense em src/config.ts para ativar anúncios reais.',
    footerPrivacyNote: 'Todo o processamento local ocorre no seu navegador — nenhuma imagem é armazenada em servidores.',
    footerRights: 'Todos os direitos reservados.',
  },
  fr: {
    metaTitle: 'NoorCut Studio – Suppression de Fond IA & Studio Photo Créatif',
    navSingle: 'Studio Solo',
    navBulk: 'Traitement Lot',
    navFeatures: 'Fonctionnalités',
    navFaq: 'FAQ',
    uploadAction: 'Importer',
    engineLabel: 'Moteur IA',
    engineRmbgName: 'RMBG-1.4 Local (Recommandé)',
    engineRmbgDesc: 'Exécution 100% locale via WebAssembly — gratuit à vie, détourage précis des cheveux',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc: 'Détourage studio directement dans le navigateur sans aucun envoi serveur',
    engineCloudName: 'not-lain Cloud Ultra',
    engineCloudDesc: 'Espace Hugging Face ZeroGPU gratuit avec bascule automatique locale en cas de limite',
    heroTitle: 'Détourage IA qualité studio et création multicouche dans votre navigateur',
    heroSubtitle: 'Trois moteurs IA gratuits sans serveur, traitement par lot de 50+ photos en ZIP, texte derrière le sujet et flou bokeh reflex.',
    dropHeadline: 'Glissez votre image ici ou cliquez pour parcourir',
    dropSubline: 'Traitement confidentiel sur votre appareil — jusqu’à la résolution 4K',
    dropButton: 'Choisir une image',
    dropFormats: 'JPG · PNG · WebP · AVIF',
    trySampleLabel: 'Ou essayez instantanément avec nos modèles studio :',
    samplePortrait: 'Portrait (Cheveux)',
    sampleProduct: 'Flacon Produit',
    sampleSneaker: 'Basket Studio',
    compareBefore: 'Avant',
    compareAfter: 'Détouré',
    compareDragHint: 'Faites glisser pour comparer',
    modeSingle: 'Studio Solo',
    modeBulk: 'Mode par Lot (Bulk)',
    processingInitRmbg: 'Initialisation du moteur IA local (première fois uniquement — gratuit à vie)...',
    processingDownloading: 'Téléchargement du modèle neuronal dans le cache du navigateur',
    processingInferring: 'Analyse précise des contours et des détails fins...',
    processingRefining: 'Composition du masque transparent haute résolution...',
    processingFallbackNotice: 'Le moteur choisi était indisponible — détourage terminé via le moteur IA local.',
    processingDoneIn: 'Terminé en',
    processingEngineUsed: 'Moteur',
    reprocessWithEngine: 'Recalculer avec ce moteur',
    newImage: 'Nouvelle image',
    compareToggle: 'Comparer',
    undo: 'Annuler',
    redo: 'Rétablir',
    zoomFit: 'Ajuster',
    tabBackground: 'Arrière-plan & Bokeh',
    tabText: 'Texte Derrière',
    tabEffects: 'Contour & Ombre',
    tabBrush: 'Pinceau Magique',
    tabAdjust: 'Couleur & Format',
    tabExport: 'Exporter',
    bgTransparent: 'Transparent',
    bgSolid: 'Couleur Unie',
    bgGradient: 'Dégradé',
    bgImage: 'Image Perso',
    bgBokeh: 'Bokeh Reflex',
    bgUploadCustom: 'Importer un Arrière-plan',
    bgBokehIntensity: 'Intensité du Flou Bokeh',
    bgBokehHint: 'Floute l’arrière-plan original tout en gardant le sujet parfaitement net.',
    presetAmazonWhite: 'Blanc E-commerce',
    presetStudioGray: 'Gris Studio',
    presetWarmSand: 'Sable Chaud',
    presetObsidian: 'Obsidienne',
    presetEmerald: 'Émeraude',
    presetCobalt: 'Bleu Cobalt',
    gradAlabaster: 'Brume Albâtre',
    gradEmerald: 'Éclat Émeraude',
    gradTravertine: 'Travertin Doré',
    gradObsidian: 'Studio Sombre',
    gradTerracotta: 'Horizon Rosé',
    gradNordic: 'Ciel Nordique',
    textAddLayer: 'Ajouter un Calque Texte',
    textDefaultContent: 'ÉDITION STUDIO',
    textEmptyHint: 'Placez votre typographie derrière le sujet en un clic pour miniatures YouTube et affiches.',
    textPlaceBehind: 'Derrière le Sujet',
    textPlaceFront: 'Au Premier Plan',
    textFontLabel: 'Police',
    textSizeLabel: 'Taille',
    textColorLabel: 'Couleur',
    textStrokeLabel: 'Contour',
    textShadowLabel: 'Ombre Portée',
    textRotationLabel: 'Rotation',
    textOpacityLabel: 'Opacité',
    textDragHint: 'Déplacez directement le texte sur le canevas à la souris.',
    textDeleteLayer: 'Supprimer',
    effectsStickerTitle: 'Contour Autocollant (YouTube)',
    effectsStickerEnable: 'Activer le Contour Sticker',
    effectsStrokeWidth: 'Épaisseur du Trait',
    effectsStrokeColor: 'Couleur du Contour',
    effectsShadowTitle: 'Ombre Studio Réaliste',
    effectsShadowEnable: 'Activer l’Ombre Studio',
    effectsShadowX: 'Décalage X',
    effectsShadowY: 'Décalage Y',
    effectsShadowBlur: 'Flou d’Ombre',
    effectsShadowOpacity: 'Opacité',
    effectsShadowColor: 'Couleur d’Ombre',
    brushTitle: 'Retouche Manuelle du Masque',
    brushToggleActive: 'Activer le Pinceau sur le Canevas',
    brushModeErase: 'Effacer',
    brushModeRestore: 'Restaurer l’Original',
    brushSize: 'Taille du Pinceau',
    brushSoftness: 'Douceur des Bords',
    brushResetMask: 'Réinitialiser le Masque',
    brushHint: 'Activez le pinceau et peignez sur l’image. Raccourcis Ctrl+Z / Ctrl+Y pris en charge.',
    adjustTargetSubject: 'Sujet',
    adjustTargetBg: 'Arrière-plan',
    adjustBrightness: 'Luminosité',
    adjustContrast: 'Contraste',
    adjustSaturation: 'Saturation',
    adjustWarmth: 'Chaleur',
    adjustReset: 'Réinitialiser',
    resizeTitle: 'Formats E-commerce & Réseaux',
    ratioOriginal: 'Format Original',
    ratioAmazon: 'Carré Boutique / Amazon (1:1)',
    ratioYoutube: 'Miniature YouTube (16:9)',
    ratioReels: 'Reels / TikTok (9:16)',
    ratioPassport: 'Photo Identité (3.5×4.5)',
    subjectScaleLabel: 'Échelle du Sujet',
    exportFormatLabel: 'Format de Fichier',
    exportQualityLabel: 'Qualité',
    exportEstimatedSize: 'Taille Estimée',
    exportDimensions: 'Dimensions',
    exportDownloadBtn: 'Télécharger en Haute Définition',
    exportFileNameLabel: 'Nom du Fichier',
    bulkTitle: 'Détourage par Lot (50+ Images)',
    bulkSubtitle: 'Importez des dizaines de photos, appliquez un fond uniforme ou filigrane et téléchargez tout en ZIP.',
    bulkDropHeadline: 'Déposez plusieurs images ici ou cliquez pour choisir',
    bulkDropSubline: 'File séquentielle optimisée pour préserver la RAM du navigateur',
    bulkLoadSamples: 'Ajouter 3 Exemples',
    bulkStartQueue: 'Lancer le Traitement',
    bulkPauseQueue: 'Mettre en Pause',
    bulkClearAll: 'Tout Effacer',
    bulkDownloadZip: 'Tout Télécharger en ZIP',
    bulkZipPreparing: 'Création de l’archive ZIP...',
    bulkGlobalBg: 'Fond Global',
    bulkGlobalRatio: 'Ratio Global',
    bulkWatermarkLabel: 'Filigrane Texte (Optionnel)',
    bulkWatermarkPlaceholder: 'ex : @maboutique',
    bulkStatusQueued: 'En attente',
    bulkStatusProcessing: 'Traitement...',
    bulkStatusDone: 'Prêt',
    bulkStatusError: 'Erreur',
    bulkOpenInStudio: 'Ouvrir au Studio',
    bulkDownloadOne: 'Télécharger',
    bulkRemoveOne: 'Retirer',
    bulkProcessedCount: 'terminées',
    showcaseTitle: 'Précision capillaire et bords impeccables',
    showcaseSubtitle: 'Faites glisser le rideau interactif pour comparer avant et après le détourage IA.',
    featuresTitle: 'Conçu pour l’e-commerce et les créateurs visuels',
    featuresSubtitle: 'Zéro serveur, confidentialité totale sur l’appareil et finition multicouche.',
    feat1Title: 'Confidentialité 100% Locale',
    feat1Desc: 'Les moteurs locaux s’exécutent dans votre navigateur via WebAssembly : vos photos ne quittent jamais votre appareil.',
    feat2Title: 'Triple Moteur Résilient',
    feat2Desc: 'Choisissez entre RMBG-1.4, IMG.LY ISNet et ZeroGPU avec bascule automatique anti-erreur.',
    feat3Title: 'Studio Créatif Multicouche',
    feat3Desc: 'Placez du texte derrière le sujet, ajoutez un contour sticker, appliquez un bokeh reflex et exportez en PNG, WebP ou JPG.',
    faqTitle: 'Questions Fréquentes',
    faqItems: [
      {
        q: 'NoorCut Studio est-il totalement gratuit et sans filigrane ?',
        a: 'Oui. Tout fonctionne dans votre navigateur gratuitement, sans abonnement, sans clé API et sans filigrane imposé.',
      },
      {
        q: 'Pourquoi la toute première image prend-elle quelques secondes ?',
        a: 'Lors du premier lancement uniquement, le navigateur télécharge le modèle IA en cache local. Toutes les images suivantes sont traitées très rapidement.',
      },
      {
        q: 'Comment placer un texte derrière le sujet ?',
        a: 'Ouvrez l’onglet « Texte Derrière », ajoutez votre calque et cliquez sur « Derrière le Sujet », puis déplacez-le librement sur le canevas.',
      },
      {
        q: 'Combien d’images puis-je traiter en mode lot ?',
        a: 'Vous pouvez importer 50 images ou plus. La file séquentielle protège votre mémoire et génère une archive ZIP prête à l’emploi.',
      },
    ],
    adSlotLabel: 'Emplacement Publicitaire Configurable',
    adSlotHint: 'Renseignez vos identifiants Google AdSense dans src/config.ts pour activer les annonces.',
    footerPrivacyNote: 'Le traitement IA local s’effectue intégralement dans votre navigateur — aucune image stockée sur serveur.',
    footerRights: 'Tous droits réservés.',
  },
};
