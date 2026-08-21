import { AdminSettings, Article } from '../types';
import { DEFAULT_ARTICLES } from '../data/articlesData';

export { DEFAULT_ARTICLES };

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  // Security & Secret Portal Access (أمان لوحة التحكم ورابط الدخول الموحد)
  adminUsername: 'admin',
  adminPassword: '',
  secretKey: 'admin123',
  secretParamName: 'admin_key',
  secretAccessType: 'query',
  secretSlug: 'portal-access-2026',
  adminPin: '123456',
  requirePin: true,
  enableKeyboardShortcut: false,
  sessionTimeoutMinutes: 15,
  maxFailedAttempts: 4,
  lockoutDurationMinutes: 5,

  // Branding & Visual Identity (الهوية البصرية والمسميات)
  siteName: 'باركودي',
  siteNameAr: 'باركودي',
  siteNameEn: 'Barcodey',
  siteSubtitleAr: 'صمّم، تخصّص، وتنزّل رموز QR والباركود الاحترافية مجانًا وبأعلى دقة 2026',
  siteSubtitleEn: 'Design, customize, and download high-resolution QR codes and barcodes for free',
  siteBadgeText: 'PRO',
  customLogoUrl: '',
  customFaviconUrl: '',
  footerCopyrightTextAr: 'جميع الحقوق محفوظة © 2026 باركودي - أدوات الباركود والـ QR الذكية',
  footerCopyrightTextEn: '© 2026 Barcodey. All Rights Reserved.',
  heroTaglineAr: 'أنشئ، خصص، واطبع رموزك بدقة متناهية وبدون قيود',
  heroTaglineEn: 'Generate, Customize, and Print Flawless Codes Without Limits',

  // Feature Toggles (إدارة المميزات)
  enableQrGenerator: true,
  enableBarcodeGenerator: true,
  enableBatchGenerator: true,
  enableScanner: true,
  enableHistory: true,
  enableArticles: true,
  articles: DEFAULT_ARTICLES,
  enableLogoUpload: true,
  enablePdfExport: true,
  enablePrint: true,
  enablePresetTemplates: true,
  maintenanceMode: false,
  maintenanceMessage:
    'الموقع يخضع لبعض الصيانة والتحديثات الدورية لضمان أفضل تجربة للمستخدم. سنعود للعمل قريباً جداً!',

  // Google AdSense Settings (إعدادات أدسنز)
  adsenseClientId: '',
  enableAutoAds: false,
  enableHeaderAd: false,
  headerAdCode: '',
  enableSidebarAd: false,
  sidebarAdCode: '',
  enableInContentAd: false,
  inContentAdCode: '',
  enableFooterAd: false,
  footerAdCode: '',
  adsTxtContent: `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`,

  // Privacy & GDPR Cookie CMP (الموافقة على الكوكيز)
  enableCookieConsent: true,
  cookieConsentTextAr:
    'نحن نستخدم ملفات تعريف الارتباط (Cookies) وتقنيات التتبع من Google AdSense لتحسين تجربتك، وتقديم إعلانات مخصصة وتحليل حركة المرور وفقاً لسياسة الخصوصية الخاصة بنا.',
  cookieConsentTextEn:
    'We use cookies and tracking technologies from Google AdSense to personalize content and ads, provide social media features, and analyze our traffic.',

  // Legal Pages for AdSense Compliance (الصفحات القانونية لمتطلبات أدسنز)
  contactEmail: 'support@example.com',

  privacyPolicyAr: `سياسة الخصوصية (Privacy Policy)

أهلاً بكم في موقعنا. نحن نولي أهمية قصوى لخصوصية زوارنا. توضح هذه الوثيقة أنواع المعلومات الشخصية التي يتم جمعها وتلقيها وكيفية استخدامها.

1. ملفات تعريف الارتباط (Cookies) وسجلات الشبكة:
يستخدم موقعنا ملفات تعريف الارتباط لتخزين المعلومات حول تفضيلات الزوار، وتسجيل المعلومات الخاصة بالمستخدم حول الصفحات التي يصل إليها أو يزورها.

2. إعلانات Google AdSense وشريك الدفع:
- تستخدم Google بصفتها مورّداً خارجياً ملفات تعريف الارتباط لتحديد الإعلانات على موقعنا.
- يتيح استخدام Google لملف تعريف الارتباط DART لعرض الإعلانات للمستخدمين استناداً إلى زيارتهم لموقعنا والمواقع الأخرى على الإنترنت.
- يجوز للمستخدمين اختيار عدم استخدام ملف تعريف الارتباط DART عن طريق زيارة سياسة الخصوصية الخاصة بمدونة Google للإعلانات والشبكات المحتواة على الرابط التالي: https://policies.google.com/technologies/ads

3. حقوق المستخدم والتواصل:
إذا كنت بحاجة إلى أي مزيد من المعلومات أو لديك أية أسئلة عن سياسة الخصوصية الخاصة بنا، يرجى لا تتردد في الاتصال بنا عبر البريد الإلكتروني الموضح في صفحة اتصل بنا.`,

  privacyPolicyEn: `Privacy Policy

Welcome to our platform. Respecting and protecting your privacy is our top priority. This document outlines the types of personal information collected and received and how it is utilized.

1. Cookies & Log Files:
Like many other web sites, we make use of log files and cookies to store visitor preferences and record user-specific information.

2. Google AdSense & DART Cookies:
- Google, as a third-party vendor, uses cookies to serve ads on our site.
- Google's use of the DART cookie enables it to serve ads to users based on their visit to our site and other sites on the Internet.
- Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy at: https://policies.google.com/technologies/ads

3. Contact Information:
If you require any more information or have any questions about our privacy policy, please feel free to contact us by email.`,

  termsOfServiceAr: `شروط الاستخدام (Terms of Service)

باستخدامك لهذا الموقع، فإنك توافق على الالتزام بشروط وأحكام الاستخدام التالية:

1. الاستخدام المسموح:
تُقدم جميع أدوات توليد الباركود ورموز QR مجاناً للاستخدام الشخصي والتجاري المشروعة. يمنع استخدام الخدمة في أي أنشطة غير قانونية أو انتهاك حقوق الملكية الفكرية.

2. إخلاء المسؤولية:
يتم تقديم الأدوات "كما هي" دون أي ضمانات صريحة أو ضمنية. لا نتحمل المسؤولية عن أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام الرموز التي تم إنشاؤها.`,

  termsOfServiceEn: `Terms of Service

By accessing or using this website, you agree to be bound by these Terms of Service:

1. Permitted Usage:
All QR code and barcode generation tools are provided free of charge for legitimate personal and commercial purposes. Illegal usage or intellectual property infringement is strictly prohibited.

2. Disclaimer of Liability:
All utilities are provided "as is" without warranty of any kind. We are not liable for any direct or consequential damages resulting from the use of generated codes.`,

  aboutUsAr: `من نحن (About Us)

نحن منصة متخصصة تُقدم أدوات رقمية مجانية وعالية الجودة لتصميم وتوليد وقراءة رموز QR والباركود الخطي. تهدف منصتنا إلى مساعدة الأفراد والأعمال في إنشاء رموز دقيقة وقابلة للطباعة بدقة عالية مع دعم تخصيص الألوان والأشكال والشعارات بسهولة وبسرعة فائقة.`,

  aboutUsEn: `About Us

We are a specialized platform providing free, high-quality digital tools for designing, generating, and scanning QR codes and linear barcodes. Our mission is to empower individuals and businesses to generate accurate, print-ready codes with customizable colors, shapes, and logos.`,

  disclaimerAr: `إخلاء المسؤولية

جميع الرموز المنشأة يتم معالجتها وإنشاؤها محلياً داخل متصفحك لضمان أقصى درجات الخصوصية والأمان. لا نقوم بتخزين بياناتك الخاصة على خوادم خارجية.`,

  disclaimerEn: `Disclaimer

All codes are generated locally inside your browser ensuring maximum privacy and security. We do not store your private code content on remote servers.`,

  customPages: [],

  // SEO & Meta Tags (التهيئة لشبكات البحث واشتراطات Google Search Console ومحركات الذكاء الاصطناعي)
  metaTitleAr: 'باركودي | مولد ومسح رموز QR والباركود مجاناً وبأعلى دقة 2026',
  metaTitleEn: 'Free Professional Barcode & QR Code Generator | Design & Scan Studio 2026',
  metaDescriptionAr: 'أداة مجانية واحترافية لإنشاء رموز QR والباركود بمختلف الأنواع، إضافة شعار، طباعة عالية الدقة وتصدير بصيغ PNG, SVG, PDF مع 33 مقالاً ودليلاً شاملاً للأرشفة والتصدر.',
  metaDescriptionEn: 'Free online professional QR code and barcode generator. Customize colors, add logos, export in HD PNG, SVG, and PDF formats with 33 comprehensive SEO guides.',
  metaKeywords: 'باركود, رمز QR, مولد باركود مجاني, تصميم باركود, مقالات باركود, qr code generator, barcode generator, ean13, code128, qr logo generator, svg barcode, zatca qr, wifi qr code',
  canonicalUrl: '',
  ogImageUrl: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  robotsTxtContent: `User-agent: *
Allow: /
Sitemap: https://www.evar-cademy.online/sitemap.xml`,
  robotsIndexing: 'all',
  sitemapUrl: '/sitemap.xml',
  enableStructuredData: true,
  enableAiSearchGeo: true,
  faqSchemaList: [
    {
      id: 'faq_1',
      questionAr: 'كيف يمكنني إنشاء رمز QR مخصص مجاناً مع شعار؟',
      questionEn: 'How can I generate a custom QR code with a logo for free?',
      answerAr: 'يمكنك اختيار تبويب "رمز QR"، وإدخال الرابط أو النص، ثم التوجه لقسم "التخصيص والألوان" لرفع صورة الشعار وتحديد ألوان وشكل النقاط والعيون بدقة عالية، ثم تنزيل الرمز بصيغة PNG أو SVG.',
      answerEn: 'Select the QR code tab, enter your link or data, upload your center logo under customization options, adjust colors and styles, and export directly in HD PNG or SVG vector format.',
    },
    {
      id: 'faq_2',
      questionAr: 'ما هي أنواع الباركود الخطي المدعومة وما الفرق بينها؟',
      questionEn: 'What linear barcode formats are supported and how do they differ?',
      answerAr: 'يدعم موقع باركودي أشهر المعايير العالمية مثل EAN-13 و UPC-A للمنتجات التجارية، و Code 128 للنصوص والأرقام الشاملة، و Code 39 للصناعة، و ITF-14 للشحن والتخزين، و Pharmacode للصيدلة.',
      answerEn: 'Barcodey supports global industry standards including EAN-13 and UPC-A for retail, Code 128 for alphanumeric data, Code 39 for industrial usage, ITF-14 for logistics, and Pharmacode.',
    },
    {
      id: 'faq_3',
      questionAr: 'هل بياناتي والرموز التي أقوم بإنشائها آمنة ومحمية؟',
      questionEn: 'Is my data secure when generating QR codes and barcodes?',
      answerAr: 'نعم تماماً، تتم جميع عمليات معالجة وتوليد الرموز محلياً بنسبة 100% داخل متصفح جهازك دون تخزين الرموز أو كلمات مرور الواي فاي في أي خوادم خارجية.',
      answerEn: 'Yes, 100% of the code generation logic runs locally inside your browser client. No private data or Wi-Fi credentials are stored or sent to remote servers.',
    },
    {
      id: 'faq_4',
      questionAr: 'كيف يمكنني طباعة الباركود أو تصديره بجودة عالية للطباعة؟',
      questionEn: 'How can I print or export barcodes in print-ready vector resolution?',
      answerAr: 'يوفر الموقع تصديراً بصيغة SVG متجهة فائقة الدقة لا تفقد جودتها أبداً، بالإضافة إلى التصدير إلى مستند PDF جاهز للطباعة أو خيار الطباعة المباشرة مع تخصيص القياسات.',
      answerEn: 'You can download scalable vector SVG files that maintain infinite crispness at any print size, export ready-to-print PDF documents, or print directly from your browser.',
    },
  ],
  customHeaderScripts: '',
  customFooterScripts: '',
  enableAnalytics: true,
};

const SETTINGS_STORAGE_KEY = 'admin_studio_settings_v1';

export function getAdminSettings(): AdminSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let mergedArticles: Article[] = parsed.articles && parsed.articles.length > 0 ? parsed.articles : DEFAULT_ARTICLES;

      // If user had previous small set of articles, seamlessly backfill the 13 SEO articles
      if (mergedArticles.length < DEFAULT_ARTICLES.length) {
        const existingSlugs = new Set(mergedArticles.map((a) => a.slug || a.id));
        const missing = DEFAULT_ARTICLES.filter((a) => !existingSlugs.has(a.slug) && !existingSlugs.has(a.id));
        mergedArticles = [...mergedArticles, ...missing];
      }

      return {
        ...DEFAULT_ADMIN_SETTINGS,
        ...parsed,
        enableArticles: parsed.enableArticles !== undefined ? parsed.enableArticles : true,
        articles: mergedArticles,
      };
    }
  } catch (e) {
    console.error('Failed to load admin settings:', e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save admin settings:', e);
  }
}

export function resetAdminSettings(): AdminSettings {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (e) {}
  return DEFAULT_ADMIN_SETTINGS;
}
