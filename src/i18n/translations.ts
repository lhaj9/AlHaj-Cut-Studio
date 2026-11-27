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
  envWebGPU: string;
  envWasmMt: string;
  envWasmSt: string;
  envFileMode: string;
  envOffline: string;
  fileModeNotice: string;
  fileModeAiBlocked: string;
  offlineNoModelNotice: string;
  cloudPrivacyNotice: string;
  cloudPrivacyConfirm: string;
  cloudPrivacyCancel: string;
  openManualStudio: string;
  manualModeBadge: string;
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
  processingCancel: string;
  processingCanceled: string;
  processingRetry: string;
  processingDoneIn: string;
  processingEngineUsed: string;
  reprocessWithEngine: string;
  newImage: string;
  compareToggle: string;
  undo: string;
  redo: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
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
  exportScaleLabel: string;
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
  bulkStopping: string;
  bulkRetryFailed: string;
  bulkSelectAll: string;
  bulkDeselectAll: string;
  bulkDeleteSelected: string;
  bulkClearAll: string;
  bulkDownloadZip: string;
  bulkDownloadSelectedZip: string;
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
  bulkSelectedCount: string;
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
    metaTitle: 'AIHAJ Cut Studio – إزالة الخلفية بالذكاء الاصطناعي وستوديو التصميم الإبداعي',
    navSingle: 'الستوديو الفردي',
    navBulk: 'المعالجة الجماعية',
    navFeatures: 'المميزات',
    navFaq: 'الأسئلة الشائعة',
    uploadAction: 'رفع صورة',
    engineLabel: 'محرك الذكاء',
    engineRmbgName: 'RMBG-1.4 / MODNet محلي (موصى به)',
    engineRmbgDesc:
      'يعمل محلياً داخل متصفحك عبر WebGPU أو WebAssembly بدقة عالية للشعر والتفاصيل بدون إرسال صورك لأي خادم',
    engineImglyName: 'IMG.LY ISNet محلي',
    engineImglyDesc:
      'محرك عزل ستوديو محلي بالكامل على جهازك عبر WebGPU/WASM بدون رفع أي صور',
    engineCloudName: 'not-lain سحابي (اختياري)',
    engineCloudDesc:
      'معالجة سحابية اختيارية عبر Hugging Face ZeroGPU — تغادر الصورة جهازك عند اختياره مع بديل محلي عند التوقف',
    envWebGPU: 'WebGPU مسرّع',
    envWasmMt: 'WASM متعدد الخيوط',
    envWasmSt: 'WASM متوافق (خيط واحد)',
    envFileMode: 'وضع فتح مباشر (file://)',
    envOffline: 'وضع عدم الاتصال',
    fileModeNotice:
      'أنت تشغّل التطبيق عبر فتح ملف index.html مباشرة (file://): جميع أدوات التصميم والفرشاة والتصدير والصور تعمل بالكامل، بينما تتطلب محركات الذكاء الاصطناعي المحلية خادماً محلياً عبر START.bat بسبب قيود أمان المتصفح.',
    fileModeAiBlocked:
      'محركات الذكاء الاصطناعي المحلية (WASM/WebGPU) محجوبة في المتصفح عند الفتح المباشر file://. شغّل ملف START.bat لفتح التطبيق عبر localhost مجاناً بدون Node.js، أو افتح الصورة في محرر الاستوديو اليدوي.',
    offlineNoModelNotice:
      'لا يوجد اتصال بالإنترنت ولم يتم تخزين أوزان هذا النموذج في ذاكرة المتصفح بعد. يمكنك الاتصال بالإنترنت لمرة واحدة لتنزيل النموذج وحفظه مؤقتاً، أو فتح الصورة في المحرر اليدوي.',
    cloudPrivacyNotice:
      'تنبيه الخصوصية: المحرك السحابي (Hugging Face ZeroGPU) يرسل صورتك إلى خادم خارجي للمعالجة. المحركات المحلية لا ترسل أي بيانات خارج جهازك. هل تريد المتابعة بالمعالجة السحابية؟',
    cloudPrivacyConfirm: 'موافق، عالج الصورة سحابياً',
    cloudPrivacyCancel: 'إلغاء واستخدام المحرك المحلي',
    openManualStudio: 'فتح في الاستوديو بدون ذكاء اصطناعي (تعديل يدوي)',
    manualModeBadge: 'وضع التعديل اليدوي',
    heroTitle: 'اعزل الخلفيات بدقة الاستوديو، وصمّم صورك مباشرة من متصفحك',
    heroSubtitle:
      'ذكاء اصطناعي محلي مسرّع بـ WebGPU وWebAssembly بدون خادم، معالجة جماعية لأكثر من 50 صورة، النص خلف العنصر، وعزل البوكيه الاحترافي.',
    dropHeadline: 'اسحب صورتك هنا أو انقر للاختيار',
    dropSubline: 'تعمل المعالجة المحلية على جهازك بخصوصية تامة — يدعم دقة حتى 4K',
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
    processingInitRmbg: 'جاري تهيئة محرك الذكاء الاصطناعي المحلي لأول مرة...',
    processingDownloading: 'جاري تنزيل أوزان النموذج وتخزينها محلياً في المتصفح',
    processingInferring: 'جاري تحليل الحواف والشعر وعزل الخلفية بدقة...',
    processingRefining: 'جاري بناء القناع الشفاف عالي الدقة...',
    processingFallbackNotice:
      'تعذّر تشغيل المحرك المختار — تم التحويل تلقائياً إلى المحرك المحلي البديل.',
    processingCancel: 'إلغاء المعالجة',
    processingCanceled: 'تم إلغاء عملية المعالجة.',
    processingRetry: 'إعادة المحاولة',
    processingDoneIn: 'اكتمل في',
    processingEngineUsed: 'المحرك المستخدم',
    reprocessWithEngine: 'إعادة العزل بالمحرك المحدد',
    newImage: 'صورة جديدة',
    compareToggle: 'مقارنة قبل/بعد',
    undo: 'تراجع',
    redo: 'إعادة',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    zoomReset: '100% حجم فعلي',
    zoomFit: 'ملاءمة الشاشة',
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
    bgBokehHint:
      'يموّه خلفية الصورة الأصلية بدقة عدسة كاميرا احترافية مع بقاء العنصر حاداً.',
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
    textEmptyHint:
      'أضف نصاً عربياً أو إنجليزياً وضعه خلف العنصر بضغطة واحدة لتصميم أغلفة يوتيوب والملصقات.',
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
    brushHint:
      'فعّل الفرشاة ثم ارسم مباشرة فوق الصورة للمسح أو الاستعادة بدقة مع دعم Ctrl+Z.',
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
    exportScaleLabel: 'دقة التصدير',
    exportEstimatedSize: 'الحجم المتوقع',
    exportDimensions: 'الأبعاد النهائية',
    exportDownloadBtn: 'تحميل التصميم عالي الدقة',
    exportFileNameLabel: 'اسم الملف',
    bulkTitle: 'المعالجة الجماعية للصور (حتى 50+ صورة)',
    bulkSubtitle:
      'ارفع عشرات الصور دفعة واحدة، طبّق خلفية موحّدة أو علامة مائية، وحمّلها جميعاً في ملف ZIP واحد.',
    bulkDropHeadline: 'اسحب عدة صور هنا أو انقر لاختيار الصور',
    bulkDropSubline: 'معالجة متسلسلة ذكية تحافظ على ذاكرة جهازك وتعمل بدون خادم',
    bulkLoadSamples: 'إضافة 3 صور تجريبية',
    bulkStartQueue: 'بدء المعالجة الجماعية',
    bulkPauseQueue: 'إيقاف المعالجة',
    bulkStopping: 'جاري الإيقاف...',
    bulkRetryFailed: 'إعادة محاولة الفاشلة',
    bulkSelectAll: 'تحديد الكل',
    bulkDeselectAll: 'إلغاء التحديد',
    bulkDeleteSelected: 'حذف المحددة',
    bulkClearAll: 'مسح القائمة',
    bulkDownloadZip: 'تحميل الكل كملف ZIP',
    bulkDownloadSelectedZip: 'تحميل المحددة في ZIP',
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
    bulkSelectedCount: 'محددة',
    showcaseTitle: 'دقة استوديو حقيقية في عزل الشعر والحواف المعقدة',
    showcaseSubtitle: 'قارن النتيجة مباشرة عبر الستارة التفاعلية قبل وبعد المعالجة.',
    featuresTitle: 'مصمم لمتاجر التجارة الإلكترونية وصنّاع المحتوى',
    featuresSubtitle:
      'سرعة فائقة، خصوصية تامة داخل المتصفح، وأدوات تصميم متعددة الطبقات بدون اشتراكات.',
    feat1Title: 'خصوصية 100% على جهازك',
    feat1Desc:
      'تُعالج صورك محلياً داخل المتصفح عبر WebGPU وWebAssembly دون إرسالها لأي خادم خارجي، مع خيار سحابي طوعي فقط عند الطلب.',
    feat2Title: 'محركات ذكاء متعددة ومرنة',
    feat2Desc:
      'يكتشف التطبيق تلقائياً WebGPU وWASM متعدد أو أحادي الخيط للتبديل السلس بين RMBG-1.4 وMODNet وIMG.LY ISNet.',
    feat3Title: 'ستوديو تصميم متعدد الطبقات',
    feat3Desc:
      'ضع النص خلف العنصر، أضف إطار ملصقات يوتيوب، فعّل عزل بوكيه DSLR، وصدّر بصيغ PNG أو WebP أو JPG.',
    faqTitle: 'الأسئلة الشائعة',
    faqItems: [
      {
        q: 'هل AIHAJ Cut Studio مجاني بالكامل وهل يضع علامة مائية؟',
        a: 'نعم، الأداة مجانية ولا تفرض أي علامة مائية إجبارية. جميع المحركات المحلية تعمل مباشرة عبر متصفحك بدون مفاتيح API أو خادم خاص.',
      },
      {
        q: 'لماذا يستغرق أول تشغيل بضع ثوانٍ إضافية؟',
        a: 'في المرة الأولى فقط، يقوم المتصفح بتحميل ملفات نموذج الذكاء الاصطناعي وتخزينها محلياً في ذاكرة التخزين المؤقت (Cache). بعد ذلك يمكن معالجة الصور بسرعة ودون إعادة تنزيل.',
      },
      {
        q: 'كيف أضع النص خلف الشخص أو المنتج؟',
        a: 'بعد عزل الصورة في الستوديو الفردي، افتح تبويب "النص خلف العنصر"، أضف نصك العربي أو الإنجليزي، واضغط على خيار "النص خلف العنصر" مع إمكانية سحب النص مباشرة على اللوحة.',
      },
      {
        q: 'كم صورة يمكنني معالجتها في الوضع الجماعي (Bulk)؟',
        a: 'يمكنك إضافة عشرات الصور دفعة واحدة. يقوم المحرك بمعالجتها بالتتابع لحماية ذاكرة RAM ثم يتيح تنزيلها في ملف ZIP واحد.',
      },
    ],
    adSlotLabel: 'مساحة إعلانية قابلة للتخصيص',
    adSlotHint: 'الإعلانات معطلة حتى إضافة معرّفات Google AdSense.',
    footerPrivacyNote:
      'تعمل المعالجة المحلية بالكامل داخل متصفحك بدون حفظ الصور على أي خادم.',
    footerRights: 'جميع الحقوق محفوظة.',
  },
  en: {
    metaTitle: 'AlHaj Cut Studio – AI Background Remover & Creative Photo Studio',
    navSingle: 'Single Studio',
    navBulk: 'Bulk Batch',
    navFeatures: 'Features',
    navFaq: 'FAQ',
    uploadAction: 'Upload Photo',
    engineLabel: 'AI Engine',
    engineRmbgName: 'RMBG-1.4 / MODNet Local (Recommended)',
    engineRmbgDesc:
      'Runs locally in your browser via WebGPU or WebAssembly — zero server uploads with crisp hair & edge matting',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc:
      'On-device studio alpha matting directly in your browser via WebGPU/WASM with zero uploads',
    engineCloudName: 'not-lain Cloud (Optional)',
    engineCloudDesc:
      'Optional Hugging Face ZeroGPU processing — image leaves your device when used, with local fallback if busy',
    envWebGPU: 'WebGPU Ready',
    envWasmMt: 'WASM Multi-Thread',
    envWasmSt: 'WASM Single-Thread',
    envFileMode: 'Direct File Mode (file://)',
    envOffline: 'Offline Mode',
    fileModeNotice:
      'Running directly via file:// — all Studio editing, brush, text, effects, and export tools work locally. Local WASM/WebGPU AI engines require HTTP localhost via START.bat due to browser security restrictions.',
    fileModeAiBlocked:
      'Local WASM/WebGPU AI models cannot be loaded over file:// due to browser CORS/Worker rules. Launch START.bat for zero-Node localhost mode, or open the photo directly in Manual Studio.',
    offlineNoModelNotice:
      'You are offline and this AI model is not cached in your browser yet. Connect once to cache the weights, or open the photo in Manual Studio.',
    cloudPrivacyNotice:
      'Privacy Notice: The Cloud engine sends your image to an external Hugging Face ZeroGPU server for processing. Local engines never send images off your device. Continue with cloud processing?',
    cloudPrivacyConfirm: 'Yes, Process via Cloud',
    cloudPrivacyCancel: 'Cancel & Use Local Engine',
    openManualStudio: 'Open in Studio Manually (No AI)',
    manualModeBadge: 'Manual Studio Mode',
    heroTitle: 'Studio-grade background removal and layered photo design in your browser',
    heroSubtitle:
      'WebGPU & WebAssembly on-device AI with zero backend, 50+ bulk ZIP cutout processing, text behind subject, and DSLR portrait bokeh.',
    dropHeadline: 'Drop your image here or click to browse',
    dropSubline: 'Local processing runs privately on your device — full support up to 4K',
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
    processingInitRmbg: 'Initializing local AI runtime (first time only)...',
    processingDownloading: 'Downloading AI model weights to browser cache',
    processingInferring: 'Analyzing subject edges and fine hair alpha matte...',
    processingRefining: 'Compositing high-resolution transparent cutout...',
    processingFallbackNotice:
      'Selected engine was unavailable — completed automatically via Local AI fallback.',
    processingCancel: 'Cancel',
    processingCanceled: 'Background processing was canceled.',
    processingRetry: 'Retry',
    processingDoneIn: 'Done in',
    processingEngineUsed: 'Engine',
    reprocessWithEngine: 'Re-cut with selected engine',
    newImage: 'New Image',
    compareToggle: 'Compare',
    undo: 'Undo',
    redo: 'Redo',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    zoomReset: 'Reset 100%',
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
    textEmptyHint:
      'Add bold typography and place it behind your subject in one click for YouTube thumbnails and posters.',
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
    exportScaleLabel: 'Export Resolution',
    exportEstimatedSize: 'Estimated Size',
    exportDimensions: 'Output Dimensions',
    exportDownloadBtn: 'Download High-Res Export',
    exportFileNameLabel: 'File Name',
    bulkTitle: 'Bulk Batch Cutout Processor (50+ Images)',
    bulkSubtitle:
      'Drop dozens of product or portrait photos, apply unified backgrounds or watermarks, and export all as a single ZIP.',
    bulkDropHeadline: 'Drop multiple images here or click to select',
    bulkDropSubline: 'Sequential RAM-safe queue runs entirely in your browser',
    bulkLoadSamples: 'Add 3 Studio Samples',
    bulkStartQueue: 'Start Batch Queue',
    bulkPauseQueue: 'Stop Queue',
    bulkStopping: 'Stopping...',
    bulkRetryFailed: 'Retry Failed',
    bulkSelectAll: 'Select All',
    bulkDeselectAll: 'Deselect All',
    bulkDeleteSelected: 'Delete Selected',
    bulkClearAll: 'Clear Queue',
    bulkDownloadZip: 'Download All as ZIP',
    bulkDownloadSelectedZip: 'Download Selected ZIP',
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
    bulkSelectedCount: 'selected',
    showcaseTitle: 'Hair-strand precision and effortless edge refinement',
    showcaseSubtitle:
      'Drag the interactive curtain to compare original photography with instant neural alpha matting.',
    featuresTitle: 'Built for e-commerce teams and visual creators',
    featuresSubtitle:
      'Zero backend infrastructure, complete on-device privacy, and multi-layer creative finishing.',
    feat1Title: '100% On-Device Privacy',
    feat1Desc:
      'Local neural engines run inside your browser via WebGPU and WebAssembly so sensitive files stay on your computer. Cloud processing is strictly opt-in.',
    feat2Title: 'Adaptive Multi-Engine AI',
    feat2Desc:
      'Automatically detects WebGPU, multi-threaded WASM, or single-threaded WASM across RMBG-1.4, MODNet, and IMG.LY ISNet.',
    feat3Title: 'Non-Destructive Layer Studio',
    feat3Desc:
      'Layer typography behind subjects, add crisp YouTube sticker outlines, dial in DSLR bokeh, and export PNG, WebP, or JPG.',
    faqTitle: 'Frequently Asked Questions',
    faqItems: [
      {
        q: 'Is AlHaj Cut Studio completely free without watermarks?',
        a: 'Yes. It runs statically in your browser with no backend, no API keys, and no forced watermarks.',
      },
      {
        q: 'Why does the very first image take a few seconds to initialize?',
        a: 'On first run only, your browser downloads and caches the neural model weights locally. Subsequent images reuse the cached model rapidly.',
      },
      {
        q: 'How does Text Behind Subject work?',
        a: 'Because the compositor keeps the background, subject alpha mask, and text layers strictly separate, toggling "Behind Subject" places typography cleanly behind the cutout.',
      },
      {
        q: 'Can I process 50+ product photos at once?',
        a: 'Yes. Bulk Batch Mode processes images sequentially to keep memory usage steady, supports selection & retry, and packages results into a ZIP file.',
      },
    ],
    adSlotLabel: 'Configurable Sponsor / Ad Slot',
    adSlotHint: 'AdSense slots are disabled until real IDs are configured.',
    footerPrivacyNote:
      'Local AI processing runs inside your browser — no images are uploaded unless you explicitly choose the cloud engine.',
    footerRights: 'All rights reserved.',
  },
  pt: {
    metaTitle: 'AlHaj Cut Studio – Removedor de Fundo IA e Estúdio Criativo de Fotos',
    navSingle: 'Estúdio Único',
    navBulk: 'Lote em Massa',
    navFeatures: 'Recursos',
    navFaq: 'Perguntas',
    uploadAction: 'Enviar Foto',
    engineLabel: 'Motor de IA',
    engineRmbgName: 'RMBG-1.4 / MODNet Local (Recomendado)',
    engineRmbgDesc:
      'Executa localmente no navegador via WebGPU ou WebAssembly sem enviar suas fotos para servidores',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc:
      'Recorte alfa de estúdio direto no dispositivo via WebGPU/WASM sem envio de arquivos',
    engineCloudName: 'not-lain Nuvem (Opcional)',
    engineCloudDesc:
      'Processamento opcional via Hugging Face ZeroGPU — a imagem sai do dispositivo quando selecionado',
    envWebGPU: 'WebGPU Ativo',
    envWasmMt: 'WASM Multi-Thread',
    envWasmSt: 'WASM Thread Única',
    envFileMode: 'Modo Arquivo Direto (file://)',
    envOffline: 'Modo Offline',
    fileModeNotice:
      'Executando via file:// — todas as ferramentas de edição, pincel, texto, efeitos e exportação funcionam normalmente. Os motores IA locais requerem localhost via START.bat.',
    fileModeAiBlocked:
      'Motores locais WASM/WebGPU são bloqueados pelo navegador em file://. Execute START.bat para abrir em localhost sem Node.js ou abra a foto no Estúdio Manual.',
    offlineNoModelNotice:
      'Você está offline e este modelo de IA ainda não está no cache. Conecte-se uma vez para armazenar em cache ou abra a foto no Estúdio Manual.',
    cloudPrivacyNotice:
      'Aviso de Privacidade: O motor em nuvem envia sua imagem ao servidor Hugging Face ZeroGPU. Os motores locais nunca enviam dados fora do dispositivo. Deseja continuar?',
    cloudPrivacyConfirm: 'Continuar na Nuvem',
    cloudPrivacyCancel: 'Cancelar e Usar Local',
    openManualStudio: 'Abrir no Estúdio Manual (Sem IA)',
    manualModeBadge: 'Modo Estúdio Manual',
    heroTitle: 'Remova fundos com precisão de estúdio e edite em camadas no navegador',
    heroSubtitle:
      'IA local acelerada por WebGPU e WebAssembly sem servidor, processamento em lote de 50+ imagens em ZIP, texto atrás do objeto e desfoque DSLR.',
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
    processingInitRmbg: 'Inicializando motor de IA local (apenas na primeira vez)...',
    processingDownloading: 'Baixando pesos do modelo neural para o cache do navegador',
    processingInferring: 'Analisando contornos e fios de cabelo com precisão...',
    processingRefining: 'Gerando máscara alfa transparente em alta resolução...',
    processingFallbackNotice:
      'O motor selecionado estava indisponível — concluído automaticamente via IA Local.',
    processingCancel: 'Cancelar',
    processingCanceled: 'Processamento cancelado.',
    processingRetry: 'Tentar Novamente',
    processingDoneIn: 'Concluído em',
    processingEngineUsed: 'Motor',
    reprocessWithEngine: 'Recortar com motor atual',
    newImage: 'Nova Imagem',
    compareToggle: 'Comparar',
    undo: 'Desfazer',
    redo: 'Refazer',
    zoomIn: 'Ampliar',
    zoomOut: 'Reduzir',
    zoomReset: '100%',
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
    textEmptyHint:
      'Adicione textos impactantes atrás do sujeito com 1 clique para capas do YouTube e pôsteres.',
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
    brushHint:
      'Ative o pincel e pinte diretamente sobre a imagem. Suporta Ctrl+Z e Ctrl+Y.',
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
    exportScaleLabel: 'Resolução de Exportação',
    exportEstimatedSize: 'Tamanho Estimado',
    exportDimensions: 'Dimensões',
    exportDownloadBtn: 'Baixar Arte em Alta Resolução',
    exportFileNameLabel: 'Nome do Arquivo',
    bulkTitle: 'Processamento em Lote (50+ Imagens)',
    bulkSubtitle:
      'Envie dezenas de fotos de uma vez, aplique fundo padronizado ou marca d’água e baixe tudo em ZIP.',
    bulkDropHeadline: 'Arraste várias imagens aqui ou clique para selecionar',
    bulkDropSubline: 'Fila sequencial segura para a memória RAM do navegador',
    bulkLoadSamples: 'Adicionar 3 Amostras',
    bulkStartQueue: 'Iniciar Fila',
    bulkPauseQueue: 'Parar Fila',
    bulkStopping: 'Parando...',
    bulkRetryFailed: 'Repetir Falhas',
    bulkSelectAll: 'Selecionar Tudo',
    bulkDeselectAll: 'Desmarcar Tudo',
    bulkDeleteSelected: 'Excluir Selecionadas',
    bulkClearAll: 'Limpar Tudo',
    bulkDownloadZip: 'Baixar Tudo em ZIP',
    bulkDownloadSelectedZip: 'Baixar Selecionadas (ZIP)',
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
    bulkSelectedCount: 'selecionadas',
    showcaseTitle: 'Recorte limpo em fios de cabelo e contornos complexos',
    showcaseSubtitle:
      'Arraste a cortina interativa para comparar o original e o recorte em tempo real.',
    featuresTitle: 'Feito para lojas online e criadores de conteúdo',
    featuresSubtitle:
      'Sem custos de servidor, privacidade local e composição profissional em camadas.',
    feat1Title: '100% Privado no Dispositivo',
    feat1Desc:
      'Os modelos locais executam direto no navegador via WebGPU e WebAssembly sem enviar fotos a terceiros.',
    feat2Title: 'IA Multi-Motor Adaptativa',
    feat2Desc:
      'Detecta automaticamente WebGPU e WASM entre RMBG-1.4, MODNet e IMG.LY ISNet com fallback seguro.',
    feat3Title: 'Estúdio Criativo em Camadas',
    feat3Desc:
      'Coloque texto atrás do objeto, aplique borda de adesivo, desfoque DSLR e exporte em PNG, WebP ou JPG.',
    faqTitle: 'Perguntas Frequentes',
    faqItems: [
      {
        q: 'O AlHaj Cut Studio é gratuito e sem marca d’água?',
        a: 'Sim! Roda estaticamente no navegador sem servidor, sem chaves de API pagas e sem marca d’água obrigatória.',
      },
      {
        q: 'Por que o primeiro recorte leva alguns segundos a mais?',
        a: 'Apenas no primeiro uso o navegador baixa e salva o modelo de IA no cache local. Depois disso, os recortes são muito rápidos.',
      },
      {
        q: 'Como colocar texto atrás da pessoa ou do produto?',
        a: 'No Estúdio Único, abra a aba "Texto Atrás", adicione sua camada de texto e clique em "Atrás do Objeto". Arraste o texto livremente na tela.',
      },
      {
        q: 'Posso recortar mais de 50 fotos de produtos de uma vez?',
        a: 'Sim. O Modo em Lote processa sequencialmente para economizar memória RAM e gera um arquivo ZIP.',
      },
    ],
    adSlotLabel: 'Espaço Publicitário Configurável',
    adSlotHint: 'Anúncios desativados até configuração do Google AdSense.',
    footerPrivacyNote:
      'Todo o processamento local ocorre no navegador — nenhuma imagem sai do dispositivo sem escolha explícita.',
    footerRights: 'Todos os direitos reservados.',
  },
  fr: {
    metaTitle: 'AlHaj Cut Studio – Suppression de Fond IA & Studio Photo Créatif',
    navSingle: 'Studio Solo',
    navBulk: 'Traitement Lot',
    navFeatures: 'Fonctionnalités',
    navFaq: 'FAQ',
    uploadAction: 'Importer',
    engineLabel: 'Moteur IA',
    engineRmbgName: 'RMBG-1.4 / MODNet Local (Recommandé)',
    engineRmbgDesc:
      'Exécution locale via WebGPU ou WebAssembly sans aucun envoi serveur, détourage précis',
    engineImglyName: 'IMG.LY ISNet Local',
    engineImglyDesc:
      'Détourage studio sur votre appareil via WebGPU/WASM sans téléversement externe',
    engineCloudName: 'not-lain Cloud (Optionnel)',
    engineCloudDesc:
      'Traitement optionnel via Hugging Face ZeroGPU — votre image quitte l’appareil lorsque sélectionné',
    envWebGPU: 'WebGPU Actif',
    envWasmMt: 'WASM Multi-Thread',
    envWasmSt: 'WASM Mono-Thread',
    envFileMode: 'Mode Fichier Direct (file://)',
    envOffline: 'Mode Hors Ligne',
    fileModeNotice:
      'Ouverture directe en file:// — tous les outils d’édition, pinceau, texte, effets et export fonctionnent localement. Les moteurs IA locaux requièrent localhost via START.bat.',
    fileModeAiBlocked:
      'Les moteurs IA locaux (WASM/WebGPU) sont bloqués par le navigateur sur file://. Lancez START.bat pour le mode localhost sans Node.js ou ouvrez la photo dans le Studio Manuel.',
    offlineNoModelNotice:
      'Vous êtes hors ligne et ce modèle IA n’est pas encore en cache. Connectez-vous une fois pour le mettre en cache ou utilisez le Studio Manuel.',
    cloudPrivacyNotice:
      'Avis de confidentialité : Le moteur Cloud envoie votre image vers Hugging Face ZeroGPU. Les moteurs locaux gardent tout sur votre appareil. Continuer vers le Cloud ?',
    cloudPrivacyConfirm: 'Oui, traiter via le Cloud',
    cloudPrivacyCancel: 'Annuler et rester en Local',
    openManualStudio: 'Ouvrir en Studio Manuel (Sans IA)',
    manualModeBadge: 'Mode Studio Manuel',
    heroTitle: 'Détourage IA qualité studio et création multicouche dans votre navigateur',
    heroSubtitle:
      'IA locale WebGPU et WebAssembly sans serveur, traitement par lot de 50+ photos en ZIP, texte derrière le sujet et bokeh reflex.',
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
    processingInitRmbg: 'Initialisation du moteur IA local (première fois uniquement)...',
    processingDownloading: 'Téléchargement du modèle neuronal dans le cache du navigateur',
    processingInferring: 'Analyse précise des contours et des détails fins...',
    processingRefining: 'Composition du masque transparent haute résolution...',
    processingFallbackNotice:
      'Le moteur choisi était indisponible — détourage terminé via le moteur IA local.',
    processingCancel: 'Annuler',
    processingCanceled: 'Traitement annulé.',
    processingRetry: 'Réessayer',
    processingDoneIn: 'Terminé en',
    processingEngineUsed: 'Moteur',
    reprocessWithEngine: 'Recalculer avec ce moteur',
    newImage: 'Nouvelle image',
    compareToggle: 'Comparer',
    undo: 'Annuler',
    redo: 'Rétablir',
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    zoomReset: '100%',
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
    textEmptyHint:
      'Placez votre typographie derrière le sujet en un clic pour miniatures YouTube et affiches.',
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
    brushHint:
      'Activez le pinceau et peignez sur l’image. Raccourcis Ctrl+Z / Ctrl+Y pris en charge.',
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
    exportScaleLabel: 'Résolution d’Export',
    exportEstimatedSize: 'Taille Estimée',
    exportDimensions: 'Dimensions',
    exportDownloadBtn: 'Télécharger en Haute Définition',
    exportFileNameLabel: 'Nom du Fichier',
    bulkTitle: 'Détourage par Lot (50+ Images)',
    bulkSubtitle:
      'Importez des dizaines de photos, appliquez un fond uniforme ou filigrane et téléchargez tout en ZIP.',
    bulkDropHeadline: 'Déposez plusieurs images ici ou cliquez pour choisir',
    bulkDropSubline: 'File séquentielle optimisée pour préserver la RAM du navigateur',
    bulkLoadSamples: 'Ajouter 3 Exemples',
    bulkStartQueue: 'Lancer le Traitement',
    bulkPauseQueue: 'Arrêter la File',
    bulkStopping: 'Arrêt...',
    bulkRetryFailed: 'Réessayer Échecs',
    bulkSelectAll: 'Tout Sélectionner',
    bulkDeselectAll: 'Tout Désélectionner',
    bulkDeleteSelected: 'Supprimer Sélection',
    bulkClearAll: 'Tout Effacer',
    bulkDownloadZip: 'Tout Télécharger en ZIP',
    bulkDownloadSelectedZip: 'Télécharger Sélection (ZIP)',
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
    bulkSelectedCount: 'sélectionnées',
    showcaseTitle: 'Précision capillaire et bords impeccables',
    showcaseSubtitle:
      'Faites glisser le rideau interactif pour comparer avant et après le détourage IA.',
    featuresTitle: 'Conçu pour l’e-commerce et les créateurs visuels',
    featuresSubtitle:
      'Zéro serveur, confidentialité totale sur l’appareil et finition multicouche.',
    feat1Title: 'Confidentialité 100% Locale',
    feat1Desc:
      'Les moteurs locaux s’exécutent dans votre navigateur via WebGPU et WebAssembly : vos photos restent sur votre appareil.',
    feat2Title: 'IA Multi-Moteur Adaptative',
    feat2Desc:
      'Détection automatique WebGPU et WASM sur RMBG-1.4, MODNet et IMG.LY ISNet avec bascule locale fiable.',
    feat3Title: 'Studio Créatif Multicouche',
    feat3Desc:
      'Placez du texte derrière le sujet, ajoutez un contour sticker, appliquez un bokeh reflex et exportez en PNG, WebP ou JPG.',
    faqTitle: 'Questions Fréquentes',
    faqItems: [
      {
        q: 'AlHaj Cut Studio est-il gratuit et sans filigrane ?',
        a: 'Oui. Tout fonctionne en mode statique dans votre navigateur sans serveur, sans clé API et sans filigrane imposé.',
      },
      {
        q: 'Pourquoi la toute première image prend-elle quelques secondes ?',
        a: 'Lors du premier lancement uniquement, le navigateur met le modèle IA en cache local. Les images suivantes sont traitées beaucoup plus vite.',
      },
      {
        q: 'Comment placer un texte derrière le sujet ?',
        a: 'Ouvrez l’onglet « Texte Derrière », ajoutez votre calque et cliquez sur « Derrière le Sujet », puis déplacez-le librement sur le canevas.',
      },
      {
        q: 'Combien d’images puis-je traiter en mode lot ?',
        a: 'Vous pouvez importer des dizaines d’images. La file séquentielle préserve la mémoire et génère une archive ZIP prête à l’emploi.',
      },
    ],
    adSlotLabel: 'Emplacement Publicitaire Configurable',
    adSlotHint: 'Publicités désactivées jusqu’à configuration Google AdSense.',
    footerPrivacyNote:
      'Le traitement IA local s’effectue dans votre navigateur — aucune image n’est envoyée sans choix explicite.',
    footerRights: 'Tous droits réservés.',
  },
};
