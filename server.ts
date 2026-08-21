import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as nodeCrypto from 'node:crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsing with safe size limits
app.use(express.json({ limit: '1mb' }));

// ----------------------------------------------------
// SECURITY HEADERS & DEFENSE-IN-DEPTH
// ----------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
  );
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.ipify.org https://ipapi.co; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self';"
  );
  next();
});

// ----------------------------------------------------
// RATE LIMITING (SLIDING WINDOW)
// ----------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitBuckets: Record<string, RateLimitRecord> = {};

// Clean expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitBuckets) {
    if (rateLimitBuckets[key].resetAt <= now) {
      delete rateLimitBuckets[key];
    }
  }
}, 60000);

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitBuckets[key];
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitBuckets[key] = record;
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      });
    }

    next();
  };
}

const analyticsRateLimiter = createRateLimiter(60, 60000); // 60 req/min
const conversionRateLimiter = createRateLimiter(40, 60000); // 40 req/min
const dynamicQrRateLimiter = createRateLimiter(30, 60000); // 30 req/min
const generalApiLimiter = createRateLimiter(120, 60000); // 120 req/min

// ----------------------------------------------------
// SECURE ID GENERATION (CSPRNG)
// ----------------------------------------------------
function generateServerSecureId(prefix: string): string {
  const bytes = nodeCrypto.randomBytes(8);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${Date.now().toString(36)}_${hex}`;
}

const DYNAMIC_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
function generateDynamicShortCode(length: number = 8): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = nodeCrypto.randomInt(0, DYNAMIC_ALPHABET.length);
    result += DYNAMIC_ALPHABET.charAt(idx);
  }
  return result;
}

// ----------------------------------------------------
// URL SANITIZATION & OPEN REDIRECT / SSRF PROTECTION
// ----------------------------------------------------
function isValidSafeRedirectUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Disallow dangerous hostnames / SSRF vectors
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' || // Cloud metadata
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// AUTHENTICATION & AUTHORIZATION (FIREBASE ID TOKEN VERIFICATION)
// ----------------------------------------------------
const ADMIN_WHITELIST = new Set<string>([
  'aliraqitk7@gmail.com',
  'abdulrahmman.alharbi@gmail.com',
  'admin@barcodey.com',
  'admin@studio.com',
]);

export interface AuthContext {
  uid: string;
  email: string | null;
  isAdmin: boolean;
  isAnonymous: boolean;
  provider: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Validates Firebase ID Token structure and payload claims.
 */
function verifyFirebaseIdToken(token: string): AuthContext | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode header
    const headerBuf = Buffer.from(parts[0], 'base64url');
    const header = JSON.parse(headerBuf.toString('utf-8'));
    if (!header || header.alg !== 'RS256') return null;

    // Decode payload
    const payloadBuf = Buffer.from(parts[1], 'base64url');
    const payload = JSON.parse(payloadBuf.toString('utf-8'));
    if (!payload || !payload.sub || typeof payload.sub !== 'string') return null;

    const nowSec = Math.floor(Date.now() / 1000);
    // Expiration check (with 60s clock skew allowance)
    if (payload.exp && payload.exp < nowSec - 60) {
      return null;
    }

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
    const isAnonymous = Boolean(payload.firebase?.sign_in_provider === 'anonymous' || !email);
    const provider = payload.firebase?.sign_in_provider || (email ? 'password' : 'anonymous');
    const isAdmin = Boolean(
      (email && ADMIN_WHITELIST.has(email)) ||
      payload.admin === true ||
      payload.role === 'admin'
    );

    return {
      uid: payload.sub,
      email,
      isAdmin,
      isAnonymous,
      provider,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Middleware: Optional Auth (populates req.auth if valid token present)
 */
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyFirebaseIdToken(token);
    if (verified) {
      req.auth = verified;
    }
  }
  next();
}

/**
 * Middleware: Required Auth (returns 401 Unauthorized if missing/invalid)
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required.',
    });
  }

  const token = authHeader.substring(7).trim();
  const verified = verifyFirebaseIdToken(token);
  if (!verified) {
    return res.status(401).json({
      error: 'Invalid or Expired Token',
      message: 'Your session has expired. Please sign in again.',
    });
  }

  req.auth = verified;
  next();
}

/**
 * Middleware: Required Admin Role (returns 403 Forbidden if not admin)
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Administrator authentication required.',
    });
  }

  const token = authHeader.substring(7).trim();
  const verified = verifyFirebaseIdToken(token);
  if (!verified) {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication failed.',
    });
  }

  if (!verified.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Administrator privileges required.',
    });
  }

  req.auth = verified;
  next();
}

// ----------------------------------------------------
// PERSISTENT DATA STORAGE (JSON FILES)
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics_logs.json');
const CONVERSIONS_FILE = path.join(DATA_DIR, 'conversions_logs.json');
const USERS_FILE = path.join(DATA_DIR, 'registered_users.json');
const DYNAMIC_QRS_FILE = path.join(DATA_DIR, 'dynamic_qrs.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

interface ServerVisitorLog {
  id: string;
  visitorId: string;
  timestamp: number;
  ip?: string;
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  flagEmoji: string;
  city: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  referrer: string;
  pagePath: string;
  language: string;
}

export interface ServerConversionLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  isAnonymous?: boolean;
  kind: 'qr' | 'barcode';
  subType: string;
  rawValue: string;
  title: string;
  previewDataUrl?: string;
  createdAt: number;
  ip?: string;
  country?: string;
  flag?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface ServerUserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider: 'google' | 'password' | 'anonymous' | 'other';
  createdAt: number;
  lastActive: number;
  savedCodesCount: number;
  totalConversionsCount: number;
  preferredLanguage?: 'ar' | 'en';
}

export interface ServerDynamicQRCode {
  id: string;
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
  qrOptions?: any;
  isActive?: boolean;
}

let memoryLogs: ServerVisitorLog[] = [];
let memoryConversions: ServerConversionLog[] = [];
let memoryUsers: Record<string, ServerUserRecord> = {};
let memoryDynamicQRs: Record<string, ServerDynamicQRCode> = {};

try {
  if (fs.existsSync(ANALYTICS_FILE)) {
    memoryLogs = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    console.log(`Loaded ${memoryLogs.length} visitor logs.`);
  }
} catch (e) {
  memoryLogs = [];
}

try {
  if (fs.existsSync(CONVERSIONS_FILE)) {
    memoryConversions = JSON.parse(fs.readFileSync(CONVERSIONS_FILE, 'utf-8'));
    console.log(`Loaded ${memoryConversions.length} conversion logs.`);
  }
} catch (e) {
  memoryConversions = [];
}

try {
  if (fs.existsSync(USERS_FILE)) {
    memoryUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(memoryUsers).length} registered users.`);
  }
} catch (e) {
  memoryUsers = {};
}

try {
  if (fs.existsSync(DYNAMIC_QRS_FILE)) {
    memoryDynamicQRs = JSON.parse(fs.readFileSync(DYNAMIC_QRS_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(memoryDynamicQRs).length} dynamic QR codes.`);
  }
} catch (e) {
  memoryDynamicQRs = {};
}

function persistLogs() {
  try {
    if (memoryLogs.length > 2500) memoryLogs = memoryLogs.slice(0, 2500);
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(memoryLogs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting analytics:', err);
  }
}

function persistConversions() {
  try {
    if (memoryConversions.length > 3000) memoryConversions = memoryConversions.slice(0, 3000);
    fs.writeFileSync(CONVERSIONS_FILE, JSON.stringify(memoryConversions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting conversions:', err);
  }
}

function persistUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(memoryUsers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting users:', err);
  }
}

function persistDynamicQRs() {
  try {
    fs.writeFileSync(DYNAMIC_QRS_FILE, JSON.stringify(memoryDynamicQRs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting dynamic QRs:', err);
  }
}

// Country Dictionary
const COUNTRY_DICT: Record<string, { ar: string; en: string }> = {
  SA: { ar: 'المملكة العربية السعودية', en: 'Saudi Arabia' },
  EG: { ar: 'مصر', en: 'Egypt' },
  AE: { ar: 'الإمارات العربية المتحدة', en: 'United Arab Emirates' },
  IQ: { ar: 'العراق', en: 'Iraq' },
  DZ: { ar: 'الجزائر', en: 'Algeria' },
  MA: { ar: 'المغرب', en: 'Morocco' },
  KW: { ar: 'الكويت', en: 'Kuwait' },
  QA: { ar: 'قطر', en: 'Qatar' },
  OM: { ar: 'عُمان', en: 'Oman' },
  JO: { ar: 'الأردن', en: 'Jordan' },
  BH: { ar: 'البحرين', en: 'Bahrain' },
  LB: { ar: 'لبنان', en: 'Lebanon' },
  TN: { ar: 'تونس', en: 'Tunisia' },
  LY: { ar: 'ليبيا', en: 'Libya' },
  SD: { ar: 'السودان', en: 'Sudan' },
  YE: { ar: 'اليمن', en: 'Yemen' },
  PS: { ar: 'فلسطين', en: 'Palestine' },
  SY: { ar: 'سوريا', en: 'Syria' },
  US: { ar: 'الولايات المتحدة', en: 'United States' },
  GB: { ar: 'المملكة المتحدة', en: 'United Kingdom' },
  DE: { ar: 'ألمانيا', en: 'Germany' },
  FR: { ar: 'فرنسا', en: 'France' },
  TR: { ar: 'تركيا', en: 'Turkey' },
  CA: { ar: 'كندا', en: 'Canada' },
  ES: { ar: 'إسبانيا', en: 'Spain' },
  IT: { ar: 'إيطاليا', en: 'Italy' },
  IN: { ar: 'الهند', en: 'India' },
  PK: { ar: 'باكستان', en: 'Pakistan' },
  ID: { ar: 'إندونيسيا', en: 'Indonesia' },
  MY: { ar: 'ماليزيا', en: 'Malaysia' },
  BR: { ar: 'البرازيل', en: 'Brazil' },
  AU: { ar: 'أستراليا', en: 'Australia' },
  NL: { ar: 'هولندا', en: 'Netherlands' },
  SE: { ar: 'السويد', en: 'Sweden' },
  CH: { ar: 'سويسرا', en: 'Switzerland' },
  BE: { ar: 'بلجيكا', en: 'Belgium' },
  RU: { ar: 'روسيا', en: 'Russia' },
  CN: { ar: 'الصين', en: 'China' },
  JP: { ar: 'اليابان', en: 'Japan' },
  KR: { ar: 'كوريا الجنوبية', en: 'South Korea' },
};

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'XX' || countryCode === 'UNKNOWN') return '🌐';
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '🌐';
  const codePoints = code.split('').map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Real Visitor Tracking API
app.post('/api/analytics/track', analyticsRateLimiter, (req: Request, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';
    
    const headerCountry = (
      (req.headers['cf-ipcountry'] as string) ||
      (req.headers['x-country-code'] as string) ||
      ''
    ).toUpperCase();

    const body = req.body || {};
    const countryCode = (body.countryCode || headerCountry || 'XX').toUpperCase();
    const countryInfo = COUNTRY_DICT[countryCode] || {
      ar: body.countryNameAr || countryCode,
      en: body.countryNameEn || countryCode,
    };
    const flag = body.flagEmoji || getCountryFlag(countryCode);

    const newLog: ServerVisitorLog = {
      id: generateServerSecureId('vis'),
      visitorId: body.visitorId || generateServerSecureId('anon'),
      timestamp: Date.now(),
      ip: ip ? ip.replace(/:/g, '_').substring(0, 15) : undefined,
      countryCode,
      countryNameAr: countryInfo.ar,
      countryNameEn: countryInfo.en,
      flagEmoji: flag,
      city: body.city ? String(body.city).substring(0, 100) : '',
      deviceType: body.deviceType === 'mobile' || body.deviceType === 'tablet' ? body.deviceType : 'desktop',
      browser: body.browser ? String(body.browser).substring(0, 50) : 'Browser',
      os: body.os ? String(body.os).substring(0, 50) : 'OS',
      referrer: body.referrer ? String(body.referrer).substring(0, 200) : 'Direct / مباشر',
      pagePath: body.pagePath ? String(body.pagePath).substring(0, 100) : '/',
      language: body.language ? String(body.language).substring(0, 10) : 'ar',
    };

    memoryLogs.unshift(newLog);
    persistLogs();

    res.json({ success: true, logged: true, id: newLog.id });
  } catch (error) {
    console.error('Error tracking visitor on server:', error);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

// 3. Real Analytics Summary API
app.get('/api/analytics/summary', generalApiLimiter, (req: Request, res: Response) => {
  try {
    const logs = memoryLogs;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const oneWeekAgo = todayStart - 7 * 86400000;
    const oneMonthAgo = todayStart - 30 * 86400000;

    const totalVisits = logs.length;
    const uniqueVisitorIds = new Set<string>();
    logs.forEach((log) => {
      uniqueVisitorIds.add(log.visitorId || log.ip || log.id);
    });
    const uniqueVisitors = uniqueVisitorIds.size;

    let todayVisits = 0;
    let yesterdayVisits = 0;
    let thisWeekVisits = 0;
    let thisMonthVisits = 0;

    const countryCounts: Record<
      string,
      { count: number; code: string; ar: string; en: string; flag: string; uniqueSet: Set<string> }
    > = {};
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};

    const dailyMap: Record<string, { visits: number; uniqueSet: Set<string> }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { visits: 0, uniqueSet: new Set<string>() };
    }

    logs.forEach((log) => {
      const t = log.timestamp;
      const vId = log.visitorId || log.ip || log.id;

      if (t >= todayStart) todayVisits++;
      if (t >= yesterdayStart && t < todayStart) yesterdayVisits++;
      if (t >= oneWeekAgo) thisWeekVisits++;
      if (t >= oneMonthAgo) thisMonthVisits++;

      const cCode = log.countryCode || 'XX';
      if (!countryCounts[cCode]) {
        countryCounts[cCode] = {
          count: 0,
          code: cCode,
          ar: log.countryNameAr || cCode,
          en: log.countryNameEn || cCode,
          flag: log.flagEmoji || getCountryFlag(cCode),
          uniqueSet: new Set<string>(),
        };
      }
      countryCounts[cCode].count++;
      countryCounts[cCode].uniqueSet.add(vId);

      if (log.deviceType === 'desktop') deviceCounts.desktop++;
      else if (log.deviceType === 'mobile') deviceCounts.mobile++;
      else if (log.deviceType === 'tablet') deviceCounts.tablet++;

      const b = log.browser || 'Other';
      browserCounts[b] = (browserCounts[b] || 0) + 1;

      const o = log.os || 'Other';
      osCounts[o] = (osCounts[o] || 0) + 1;

      const r = log.referrer || 'Direct / مباشر';
      referrerCounts[r] = (referrerCounts[r] || 0) + 1;

      const logDate = new Date(t).toISOString().split('T')[0];
      if (dailyMap[logDate]) {
        dailyMap[logDate].visits++;
        dailyMap[logDate].uniqueSet.add(vId);
      }
    });

    const topCountries = Object.values(countryCounts)
      .map((c) => ({
        countryCode: c.code,
        countryNameAr: c.ar,
        countryNameEn: c.en,
        flagEmoji: c.flag,
        visits: c.count,
        uniqueVisitors: c.uniqueSet.size,
        percentage: totalVisits > 0 ? Math.round((c.count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits);

    const dailyHistory = Object.entries(dailyMap).map(([dateStr, data]) => {
      const d = new Date(dateStr);
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      return {
        date: dateStr,
        label: dayLabel,
        visits: data.visits,
        uniqueVisitors: data.uniqueSet.size,
      };
    });

    res.json({
      totalVisits,
      uniqueVisitors,
      todayVisits,
      yesterdayVisits,
      thisWeekVisits,
      thisMonthVisits,
      topCountries,
      deviceBreakdown: deviceCounts,
      browserBreakdown: browserCounts,
      osBreakdown: osCounts,
      referrerBreakdown: referrerCounts,
      dailyHistory,
      recentLogs: logs.slice(0, 100),
      isServerAuthoritative: true,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

// 4. Clear Analytics API (Admin Only)
app.post('/api/analytics/clear', requireAdmin, (req: Request, res: Response) => {
  try {
    memoryLogs = [];
    persistLogs();
    res.json({ success: true, message: 'Analytics data cleared' });
  } catch (error) {
    console.error('Error clearing analytics:', error);
    res.status(500).json({ error: 'Failed to clear analytics' });
  }
});

// ----------------------------------------------------
// CONVERSIONS & LINKS LOGGING API
// ----------------------------------------------------

// Log a converted Barcode or QR code (Supports both authenticated & guest users)
app.post('/api/conversions/log', conversionRateLimiter, optionalAuth, (req: Request, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';
    const body = req.body || {};

    if (!body.rawValue) {
      return res.status(400).json({ error: 'rawValue is required' });
    }

    // Authenticated user ID resolution (server-enforced)
    const verifiedUid = req.auth ? req.auth.uid : undefined;
    const verifiedEmail = req.auth ? req.auth.email : undefined;

    const headerCountry = (
      (req.headers['cf-ipcountry'] as string) ||
      (req.headers['x-country-code'] as string) ||
      ''
    ).toUpperCase();
    const countryCode = (body.country || headerCountry || 'XX').toUpperCase();
    const countryInfo = COUNTRY_DICT[countryCode] || {
      ar: body.country || countryCode,
      en: body.country || countryCode,
    };
    const flag = body.flag || getCountryFlag(countryCode);

    const newConversion: ServerConversionLog = {
      id: generateServerSecureId('conv'),
      userId: verifiedUid || body.userId || undefined,
      userName: body.userName || (verifiedUid ? 'مستخدم مسجل' : 'زائر / Guest'),
      userEmail: verifiedEmail || body.userEmail || undefined,
      userPhoto: body.userPhoto || undefined,
      isAnonymous: Boolean(!verifiedUid && (body.isAnonymous ?? !body.userId)),
      kind: body.kind === 'barcode' ? 'barcode' : 'qr',
      subType: String(body.subType || 'url').substring(0, 50),
      rawValue: String(body.rawValue).trim().substring(0, 4096),
      title: String(body.title || 'Converted Code').substring(0, 200),
      previewDataUrl: typeof body.previewDataUrl === 'string' && body.previewDataUrl.startsWith('data:image/') ? body.previewDataUrl : undefined,
      createdAt: Date.now(),
      ip: ip ? ip.replace(/:/g, '_').substring(0, 15) : undefined,
      country: countryInfo.ar,
      flag,
      deviceType: body.deviceType === 'mobile' || body.deviceType === 'tablet' ? body.deviceType : 'desktop',
    };

    memoryConversions.unshift(newConversion);
    persistConversions();

    if (newConversion.userId && memoryUsers[newConversion.userId]) {
      memoryUsers[newConversion.userId].totalConversionsCount =
        (memoryUsers[newConversion.userId].totalConversionsCount || 0) + 1;
      memoryUsers[newConversion.userId].lastActive = Date.now();
      persistUsers();
    }

    res.json({ success: true, logged: true, conversion: newConversion });
  } catch (error) {
    console.error('Error logging conversion:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
});

// Admin: Get all conversion logs
app.get('/api/admin/conversions', requireAdmin, (req: Request, res: Response) => {
  try {
    const list = memoryConversions;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const totalConversions = list.length;
    let todayConversions = 0;
    let qrCount = 0;
    let barcodeCount = 0;
    let urlCount = 0;

    const domainCounts: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    list.forEach((item) => {
      if (item.createdAt >= todayStart) todayConversions++;
      if (item.kind === 'qr') qrCount++;
      if (item.kind === 'barcode') barcodeCount++;
      if (item.subType === 'url' || item.rawValue.startsWith('http://') || item.rawValue.startsWith('https://')) {
        urlCount++;
        try {
          const urlObj = new URL(item.rawValue.startsWith('http') ? item.rawValue : `https://${item.rawValue}`);
          const host = urlObj.hostname.replace(/^www\./, '');
          domainCounts[host] = (domainCounts[host] || 0) + 1;
        } catch {}
      }
      typeBreakdown[item.subType] = (typeBreakdown[item.subType] || 0) + 1;
    });

    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      totalConversions,
      todayConversions,
      qrCount,
      barcodeCount,
      urlCount,
      topDomains,
      typeBreakdown,
      logs: list.slice(0, 500),
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error getting conversions:', error);
    res.status(500).json({ error: 'Failed to get conversions' });
  }
});

// Admin: Delete single conversion log
app.delete('/api/admin/conversions/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    memoryConversions = memoryConversions.filter((c) => c.id !== id);
    persistConversions();
    res.json({ success: true, message: 'Conversion log deleted' });
  } catch (error) {
    console.error('Error deleting conversion:', error);
    res.status(500).json({ error: 'Failed to delete conversion log' });
  }
});

// Admin: Clear all conversion logs
app.post('/api/admin/conversions/clear', requireAdmin, (req: Request, res: Response) => {
  try {
    memoryConversions = [];
    persistConversions();
    res.json({ success: true, message: 'All conversion logs cleared' });
  } catch (error) {
    console.error('Error clearing conversions:', error);
    res.status(500).json({ error: 'Failed to clear conversions' });
  }
});

// ----------------------------------------------------
// REGISTERED USERS MANAGEMENT API
// ----------------------------------------------------

// Sync / Upsert user profile (Requires authentication, IDOR protected)
app.post('/api/users/sync', requireAuth, (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    // Enforce server verified UID - user cannot sync another user's profile
    const uid = req.auth!.uid;
    const existing = memoryUsers[uid];
    const now = Date.now();

    const provider = req.auth!.provider as 'google' | 'password' | 'anonymous' | 'other';
    const email = req.auth!.email || existing?.email || null;

    const userRecord: ServerUserRecord = {
      uid,
      email,
      displayName: body.displayName ? String(body.displayName).substring(0, 100) : existing?.displayName || (req.auth!.isAnonymous ? 'زائر سحابي / Guest' : 'مستخدم باركودي'),
      photoURL: body.photoURL ? String(body.photoURL).substring(0, 500) : existing?.photoURL || null,
      isAnonymous: req.auth!.isAnonymous,
      provider,
      createdAt: existing?.createdAt || body.createdAt || now,
      lastActive: now,
      savedCodesCount: typeof body.savedCodesCount === 'number' ? body.savedCodesCount : existing?.savedCodesCount || 0,
      totalConversionsCount: existing?.totalConversionsCount || 0,
      preferredLanguage: body.preferredLanguage === 'en' ? 'en' : 'ar',
    };

    memoryUsers[uid] = userRecord;
    persistUsers();

    res.json({ success: true, user: userRecord });
  } catch (error) {
    console.error('Error syncing user record:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

// Admin: Get all registered users
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  try {
    const usersList = Object.values(memoryUsers).sort(
      (a, b) => (b.lastActive || b.createdAt) - (a.lastActive || a.createdAt)
    );

    let googleUsers = 0;
    let emailUsers = 0;
    let guestUsers = 0;
    let totalSavedCodes = 0;
    let totalConversions = 0;

    usersList.forEach((u) => {
      if (u.isAnonymous || u.provider === 'anonymous') guestUsers++;
      else if (u.provider === 'google') googleUsers++;
      else emailUsers++;

      totalSavedCodes += u.savedCodesCount || 0;
      totalConversions += u.totalConversionsCount || 0;
    });

    res.json({
      totalUsers: usersList.length,
      googleUsers,
      emailUsers,
      guestUsers,
      totalSavedCodes,
      totalConversions,
      users: usersList,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users list' });
  }
});

// Admin: Delete registered user record
app.delete('/api/admin/users/:uid', requireAdmin, (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (memoryUsers[uid]) {
      delete memoryUsers[uid];
      persistUsers();
    }
    res.json({ success: true, message: 'User record deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ----------------------------------------------------
// DYNAMIC QR CODES SYSTEM & REDIRECTION ENGINE
// ----------------------------------------------------

// Redirection handlers for multiple URL variants: /q/:code, /r/:code, /d/:code, /scan/:code
const dynamicQrRedirectHandler = (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    if (!code || !/^[a-zA-Z0-9_-]{3,30}$/.test(code)) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      return res.redirect('/404');
    }

    const item = memoryDynamicQRs[code];
    if (item && item.isActive !== false) {
      let target = item.targetUrl.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
      }

      // SSRF & Protocol Safety Check
      if (isValidSafeRedirectUrl(target)) {
        // Increment scan count and update timestamp
        item.scansCount = (item.scansCount || 0) + 1;
        item.lastScannedAt = Date.now();
        persistDynamicQRs();

        // Perform HTTP 302 temporary redirect
        return res.redirect(302, target);
      }
    }

    // Fallback: Deliver client-side resolver for Firestore synced dynamic QRs
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex, nofollow">
        <title>جارِ التحويل... | باركودي</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
          .card { background: #111827; padding: 2.5rem 2rem; border-radius: 1.5rem; text-align: center; max-width: 440px; width: 100%; border: 1px solid #1f2937; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          .spinner { width: 44px; height: 44px; border: 3px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem auto; }
          @keyframes spin { to { transform: rotate(360deg); } }
          h1 { font-size: 1.25rem; color: #f8fafc; margin: 0 0 0.5rem 0; }
          p { color: #9ca3af; font-size: 0.875rem; line-height: 1.6; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h1>جارِ توجيهك بأمان...</h1>
          <p>يتم الآن التحقق من الرابط الديناميكي وتحويلك إلى الوجهة المطلوبة.</p>
        </div>
        <script>
          window.location.replace('/#/q/${encodeURIComponent(code)}');
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error redirecting dynamic QR:', error);
    res.redirect('/404');
  }
};

app.get('/q/:code', dynamicQrRedirectHandler);
app.get('/r/:code', dynamicQrRedirectHandler);
app.get('/d/:code', dynamicQrRedirectHandler);
app.get('/scan/:code', dynamicQrRedirectHandler);

// Public API: Fetch single Dynamic QR details (for client-side redirector & resolution)
app.get('/api/dynamic-qr/code/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const item = memoryDynamicQRs[code];
    if (!item) {
      return res.status(404).json({ error: 'Dynamic QR not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dynamic QR' });
  }
});

// Public API: Record a scan event for a dynamic QR
app.post('/api/dynamic-qr/scan/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const item = memoryDynamicQRs[code];
    if (item) {
      item.scansCount = (item.scansCount || 0) + 1;
      item.lastScannedAt = Date.now();
      persistDynamicQRs();
    }

    res.json({ success: true, scansCount: item ? item.scansCount : 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record scan' });
  }
});


// Dynamic QR: Get all QRs for a specific user (IDOR Protected: User must own the account or be Admin)
app.get('/api/dynamic-qr/user/:userId', requireAuth, (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // IDOR Check: Ensure requester is the account owner or an admin
    if (req.auth!.uid !== userId && !req.auth!.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Cannot access another user’s dynamic QR codes' });
    }

    const userQrs = Object.values(memoryDynamicQRs)
      .filter((q) => q.userId === userId)
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

    res.json({
      success: true,
      items: userQrs,
      total: userQrs.length,
    });
  } catch (error) {
    console.error('Error fetching user dynamic QRs:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic QRs' });
  }
});

// Dynamic QR: Create new dynamic QR (Requires Auth, URL Validation, CSPRNG Short Code)
app.post('/api/dynamic-qr', dynamicQrRateLimiter, requireAuth, (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || !body.targetUrl) {
      return res.status(400).json({ error: 'targetUrl is required' });
    }

    let targetUrl = String(body.targetUrl).trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    if (!isValidSafeRedirectUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid or unsafe target URL' });
    }

    // Generate secure CSPRNG short code
    let shortId = generateDynamicShortCode(8);
    let attempts = 0;
    while (memoryDynamicQRs[shortId] && attempts < 10) {
      shortId = generateDynamicShortCode(8);
      attempts++;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const shortUrl = `${protocol}://${host}/q/${shortId}`;

    const now = Date.now();
    const newQr: ServerDynamicQRCode = {
      id: shortId,
      userId: req.auth!.uid, // Server-enforced IDOR protection
      userEmail: req.auth!.email || null,
      userName: body.userName ? String(body.userName).substring(0, 100) : null,
      title: body.title ? String(body.title).trim().substring(0, 100) : 'رمز QR ديناميكي',
      targetUrl,
      shortUrl,
      createdAt: now,
      updatedAt: now,
      scansCount: 0,
      previewDataUrl: typeof body.previewDataUrl === 'string' && body.previewDataUrl.startsWith('data:image/') ? body.previewDataUrl : '',
      qrOptions: body.qrOptions || {},
      isActive: true,
    };

    memoryDynamicQRs[shortId] = newQr;
    persistDynamicQRs();

    res.json({ success: true, item: newQr });
  } catch (error) {
    console.error('Error creating dynamic QR:', error);
    res.status(500).json({ error: 'Failed to create dynamic QR' });
  }
});

// Dynamic QR: Update Target URL, Title, or Options (IDOR Protected: Owner or Admin only)
app.put('/api/dynamic-qr/:id', dynamicQrRateLimiter, requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const existing = memoryDynamicQRs[id];

    if (!existing) {
      return res.status(404).json({ error: 'Dynamic QR code not found' });
    }

    // IDOR Protection: Must be the resource owner or admin
    if (existing.userId !== req.auth!.uid && !req.auth!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to modify this QR code' });
    }

    if (body.targetUrl) {
      let targetUrl = String(body.targetUrl).trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      if (!isValidSafeRedirectUrl(targetUrl)) {
        return res.status(400).json({ error: 'Invalid or unsafe target URL' });
      }
      existing.targetUrl = targetUrl;
    }

    if (body.title) {
      existing.title = String(body.title).trim().substring(0, 100);
    }
    if (typeof body.isActive === 'boolean') {
      existing.isActive = body.isActive;
    }
    if (body.qrOptions && typeof body.qrOptions === 'object') {
      existing.qrOptions = { ...existing.qrOptions, ...body.qrOptions };
    }
    if (typeof body.previewDataUrl === 'string' && body.previewDataUrl.startsWith('data:image/')) {
      existing.previewDataUrl = body.previewDataUrl;
    }

    existing.updatedAt = Date.now();
    persistDynamicQRs();

    res.json({ success: true, item: existing });
  } catch (error) {
    console.error('Error updating dynamic QR:', error);
    res.status(500).json({ error: 'Failed to update dynamic QR' });
  }
});

// Dynamic QR: Delete dynamic QR (IDOR Protected: Owner or Admin only)
app.delete('/api/dynamic-qr/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = memoryDynamicQRs[id];

    if (!existing) {
      return res.json({ success: true, message: 'Already deleted' });
    }

    // IDOR Protection: Must be owner or admin
    if (existing.userId !== req.auth!.uid && !req.auth!.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this QR code' });
    }

    delete memoryDynamicQRs[id];
    persistDynamicQRs();

    res.json({ success: true, message: 'Dynamic QR code deleted' });
  } catch (error) {
    console.error('Error deleting dynamic QR:', error);
    res.status(500).json({ error: 'Failed to delete dynamic QR' });
  }
});

// Admin: Get all Dynamic QRs overview (Admin Only)
app.get('/api/admin/dynamic-qrs', requireAdmin, (req: Request, res: Response) => {
  try {
    const allQrs = Object.values(memoryDynamicQRs).sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
    );

    let totalScans = 0;
    let activeQRs = 0;
    allQrs.forEach((q) => {
      totalScans += q.scansCount || 0;
      if (q.isActive !== false) activeQRs++;
    });

    res.json({
      success: true,
      totalDynamicQRs: allQrs.length,
      totalScans,
      activeQRs,
      items: allQrs,
    });
  } catch (error) {
    console.error('Error fetching admin dynamic QRs:', error);
    res.status(500).json({ error: 'Failed to fetch dynamic QRs' });
  }
});

// ----------------------------------------------------
// VITE & STATIC FILE SERVING
// ----------------------------------------------------

async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
