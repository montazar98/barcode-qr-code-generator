export type AppLanguage = 'ar' | 'en';
export type AppTab = 'qr' | 'dynamic_qr' | 'barcode' | 'batch' | 'scanner' | 'history' | 'articles';

export interface Article {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string; // Markdown / Rich text format
  contentEn: string;
  coverImageUrl?: string;
  categoryAr: string;
  categoryEn: string;
  tags: string[];
  author: string;
  readTimeMinutes: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
  viewsCount?: number;
  metaKeywords?: string;
}

export type QRDataType =
  | 'url'
  | 'text'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'phone'
  | 'sms'
  | 'whatsapp'
  | 'event'
  | 'crypto'
  | 'location';

export type BarcodeFormat =
  | 'CODE128'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'CODE39'
  | 'ITF14'
  | 'MSI'
  | 'pharmacode'
  | 'codabar';

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phoneMobile: string;
  phoneWork: string;
  email: string;
  url: string;
  address: string;
  note: string;
}

export interface EmailData {
  email: string;
  subject: string;
  body: string;
}

export interface WhatsappData {
  phone: string;
  message: string;
}

export interface EventData {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CryptoData {
  coin: 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'BNB';
  address: string;
  amount: string;
}

export interface LocationData {
  latitude: string;
  longitude: string;
  label: string;
}

export interface QRStyleOptions {
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  size: number;
  margin: number;
  errorCorrectionLevel: QRErrorCorrection;
  logoUrl?: string;
  logoSizeRatio: number; // 0.1 to 0.3
  logoMargin: number;
  dotStyle: 'square' | 'rounded' | 'dots';
  eyeStyle: 'square' | 'rounded' | 'circle';
}

export interface BarcodeStyleOptions {
  format: BarcodeFormat;
  lineColor: string;
  bgColor: string;
  transparentBg: boolean;
  width: number; // bar width multiplier
  height: number; // bar height px
  margin: number;
  displayValue: boolean;
  fontSize: number;
  fontOptions: string; // bold, italic, etc.
  textPosition: 'bottom' | 'top';
  textAlign: 'center' | 'left' | 'right';
  text: string;
}

export interface CodeHistoryItem {
  id: string;
  title: string;
  kind: 'qr' | 'barcode';
  subType: string;
  rawValue: string;
  previewDataUrl: string;
  createdAt: number;
  qrOptions?: Partial<QRStyleOptions>;
  barcodeOptions?: Partial<BarcodeStyleOptions>;
}

export interface BatchItem {
  id: string;
  value: string;
  label?: string;
  status: 'pending' | 'done' | 'error';
  dataUrl?: string;
  errorMsg?: string;
}

export interface PresetTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  fgColor: string;
  bgColor: string;
  dotStyle: 'square' | 'rounded' | 'dots';
  eyeStyle: 'square' | 'rounded' | 'circle';
}

export type LegalPageType = 'privacy' | 'terms' | 'about' | 'contact' | 'adsTxt' | 'disclaimer' | string;

export interface CustomPage {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  showInFooter: boolean;
  updatedAt?: number;
}

export interface FAQSchemaItem {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: number;
  type: 'success' | 'failed' | 'lockout';
  messageAr: string;
  messageEn: string;
  device: string;
  browser: string;
  os: string;
  ipLocation?: string;
}

export interface AdminSettings {
  // Security & Secret Access (حماية وأمان لوحة التحكم)
  adminUsername?: string; // Username for admin login (e.g. 'admin')
  adminPassword?: string; // Password for admin login
  secretKey: string;
  secretParamName: string; // e.g. 'admin_key' or 'custom_key'
  secretAccessType: 'query' | 'hash'; // ?key=val or #secret_slug
  secretSlug: string; // e.g. 'my-ultra-secret-portal-2026'
  adminPin: string;
  requirePin: boolean;
  enableKeyboardShortcut: boolean; // Ctrl+Shift+A toggle
  sessionTimeoutMinutes: number; // Inactivity auto-logout (e.g. 15)
  maxFailedAttempts: number; // Max failed attempts before lockout (e.g. 4)
  lockoutDurationMinutes: number; // Lockout duration (e.g. 5)

  // Branding & Visual Identity (الهوية البصرية والمسميات)
  siteName: string;
  siteNameAr: string;
  siteNameEn: string;
  siteSubtitleAr: string;
  siteSubtitleEn: string;
  siteBadgeText: string;
  customLogoUrl: string; // Custom logo image / SVG / Data URL
  customFaviconUrl: string; // Custom favicon image / Data URL
  footerCopyrightTextAr: string;
  footerCopyrightTextEn: string;
  heroTaglineAr: string;
  heroTaglineEn: string;

  // Feature Toggles
  enableQrGenerator: boolean;
  enableBarcodeGenerator: boolean;
  enableBatchGenerator: boolean;
  enableScanner: boolean;
  enableHistory: boolean;
  enableArticles: boolean;
  articles?: Article[];
  enableLogoUpload: boolean;
  enablePdfExport: boolean;
  enablePrint: boolean;
  enablePresetTemplates: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Google AdSense
  adsenseClientId: string;
  enableAutoAds: boolean;
  enableHeaderAd: boolean;
  headerAdCode: string;
  enableSidebarAd: boolean;
  sidebarAdCode: string;
  enableInContentAd: boolean;
  inContentAdCode: string;
  enableFooterAd: boolean;
  footerAdCode: string;
  adsTxtContent: string;

  // Privacy & GDPR Cookie CMP
  enableCookieConsent: boolean;
  cookieConsentTextAr: string;
  cookieConsentTextEn: string;

  // Legal Pages & Custom Pages
  contactEmail: string;
  privacyPolicyAr: string;
  privacyPolicyEn: string;
  termsOfServiceAr: string;
  termsOfServiceEn: string;
  aboutUsAr: string;
  aboutUsEn: string;
  disclaimerAr: string;
  disclaimerEn: string;
  customPages?: CustomPage[];

  // SEO, AI Search (GEO), Google Search Console & Meta Tags
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  googleSiteVerification?: string; // Google Search Console verification token / code
  bingSiteVerification?: string; // Bing Webmaster Tools verification code
  robotsTxtContent?: string; // Custom robots.txt directives
  robotsIndexing?: 'all' | 'noindex' | 'nofollow' | 'none'; // Fast global indexing directives
  sitemapUrl?: string; // Custom XML Sitemap URL
  enableStructuredData: boolean; // JSON-LD Schema.org
  enableAiSearchGeo: boolean; // LLM & Generative Engine Optimization
  faqSchemaList: FAQSchemaItem[];
  customHeaderScripts: string;
  customFooterScripts: string;

  // Analytics & Visitor Tracking
  enableAnalytics: boolean;
}

export interface VisitorLogEntry {
  id: string;
  visitorId?: string;
  timestamp: number;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  flagEmoji: string;
  city?: string;
  region?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  referrer: string;
  pagePath: string;
  language: string;
}

export interface CountryStat {
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  flagEmoji: string;
  visits: number;
  uniqueVisitors: number;
  percentage: number;
}

export interface DailyVisitStat {
  date: string; // YYYY-MM-DD
  label: string;
  visits: number;
  uniqueVisitors: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  yesterdayVisits: number;
  thisWeekVisits: number;
  thisMonthVisits: number;
  topCountries: CountryStat[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  referrerBreakdown: Record<string, number>;
  dailyHistory: DailyVisitStat[];
  recentLogs: VisitorLogEntry[];
  source?: string;
  isServerAuthoritative?: boolean;
  lastUpdated?: number;
}

// Firebase Auth & Cloud Storage Types
export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider?: 'google' | 'password' | 'anonymous' | 'other';
  createdAt: number;
  updatedAt?: number;
  lastActive?: number;
  preferredLanguage?: AppLanguage;
  preferredTheme?: 'light' | 'dark';
}

export interface CloudSavedCode {
  id: string;
  userId: string;
  title: string;
  kind: 'qr' | 'barcode';
  subType: string;
  rawValue: string;
  previewDataUrl: string;
  createdAt: number;
  qrOptions?: Partial<QRStyleOptions>;
  barcodeOptions?: Partial<BarcodeStyleOptions>;
}

export type AuthModalMode = 'login' | 'signup' | 'forgot-password' | 'profile';

// Admin Registered Accounts & Conversions Log Types
export interface ConversionLogItem {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  isAnonymous?: boolean;
  kind: 'qr' | 'barcode';
  subType: string; // 'url', 'text', 'wifi', 'vcard', 'EAN13', 'CODE128', etc.
  rawValue: string; // The URL or text converted
  title: string;
  previewDataUrl?: string;
  createdAt: number;
  ip?: string;
  country?: string;
  flag?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface RegisteredAccountItem {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider: 'google' | 'password' | 'anonymous' | 'other';
  createdAt: number;
  lastActive: number;
  savedCodesCount?: number;
  totalConversionsCount?: number;
  preferredLanguage?: AppLanguage;
}

export interface DynamicQRCode {
  id: string; // The short unique secure code e.g. "k8X2pQ9m"
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  title: string;
  targetUrl: string;
  shortUrl: string;
  createdAt: number;
  updatedAt: number;
  scansCount: number;
  lastScannedAt?: number;
  previewDataUrl?: string;
  qrOptions?: Partial<QRStyleOptions>;
  isActive?: boolean;
}

export interface DynamicQRStats {
  totalDynamicQRs: number;
  totalScans: number;
  activeQRs: number;
  recentDynamicQRs: DynamicQRCode[];
}





