import { AnalyticsSummary, CountryStat, DailyVisitStat, VisitorLogEntry } from '../types';
import { generateSecureId } from './crypto';
import { auth } from '../lib/firebase';

// Storage Keys
const VISITOR_ID_KEY = 'barcodey_analytics_visitor_id';
const LOGS_STORAGE_KEY = 'barcodey_analytics_logs_v2';
const GEO_CACHE_KEY = 'barcodey_geo_cache';

// Country info dictionary with Arabic, English names and Flags
export const COUNTRY_NAMES: Record<string, { ar: string; en: string }> = {
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

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'XX' || countryCode === 'UNKNOWN') return '🌐';
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '🌐';
  const codePoints = code
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getCountryNames(code: string): { ar: string; en: string } {
  const upper = (code || '').toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  return { ar: upper || 'دولي', en: upper || 'International' };
}

// Timezone to Country fallback mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Riyadh': 'SA',
  'Asia/Baghdad': 'IQ',
  'Africa/Cairo': 'EG',
  'Asia/Dubai': 'AE',
  'Asia/Amman': 'JO',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Muscat': 'OM',
  'Asia/Bahrain': 'BH',
  'Asia/Beirut': 'LB',
  'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Tripoli': 'LY',
  'Africa/Khartoum': 'SD',
  'Asia/Aden': 'YE',
  'Asia/Gaza': 'PS',
  'Asia/Hebron': 'PS',
  'Asia/Damascus': 'SY',
  'Europe/Istanbul': 'TR',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
};

// Device & Browser parser
function detectClientDetails() {
  const ua = navigator.userAgent || '';
  
  // Device
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'mobile';
  } else if (window.innerWidth < 768) {
    deviceType = 'mobile';
  }

  // OS
  let os = 'Windows';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Browser
  let browser = 'Google Chrome';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Browser';

  // Referrer
  let referrer = 'Direct / مباشر';
  const ref = document.referrer;
  if (ref) {
    try {
      const url = new URL(ref);
      const host = url.hostname.toLowerCase();
      if (host.includes('google')) referrer = 'Google Search';
      else if (host.includes('bing')) referrer = 'Bing Search';
      else if (host.includes('facebook') || host.includes('fb.')) referrer = 'Facebook';
      else if (host.includes('t.co') || host.includes('twitter') || host.includes('x.com')) referrer = 'Twitter / X';
      else if (host.includes('instagram')) referrer = 'Instagram';
      else if (host.includes('whatsapp')) referrer = 'WhatsApp';
      else if (host.includes('t.me') || host.includes('telegram')) referrer = 'Telegram';
      else if (host.includes('youtube')) referrer = 'YouTube';
      else if (host.includes('linkedin')) referrer = 'LinkedIn';
      else if (host.includes('tiktok')) referrer = 'TikTok';
      else referrer = url.hostname;
    } catch {
      referrer = 'Direct / مباشر';
    }
  }

  return { deviceType, os, browser, referrer };
}

// Fetch Real Geo Country
async function fetchCountryInfo(): Promise<{ countryCode: string; city: string }> {
  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://api.country.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      if (data && data.country) {
        const result = { countryCode: data.country.toUpperCase(), city: '' };
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(result));
        return result;
      }
    }
  } catch {}

  // Fallback
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      const result = { countryCode: TIMEZONE_TO_COUNTRY[tz], city: tz.split('/')[1]?.replace(/_/g, ' ') || '' };
      return result;
    }
  } catch {}

  return { countryCode: 'XX', city: '' };
}

// Generate or retrieve persistent unique visitor ID
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = generateSecureId('v');
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// In-Memory summary cache
let lastServerSummary: AnalyticsSummary | null = null;

// Track 100% Real Visit to the Central Server
let isTracking = false;
export async function trackVisit(pagePath: string = '/'): Promise<VisitorLogEntry | null> {
  if (isTracking) return null;
  isTracking = true;

  try {
    const visitorId = getVisitorId();
    const clientDetails = detectClientDetails();
    const geo = await fetchCountryInfo();
    const countryNames = getCountryNames(geo.countryCode);
    const flag = getFlagEmoji(geo.countryCode);

    const newEntry: VisitorLogEntry = {
      id: generateSecureId('vis'),
      visitorId,
      timestamp: Date.now(),
      countryCode: geo.countryCode,
      countryNameAr: countryNames.ar,
      countryNameEn: countryNames.en,
      flagEmoji: flag,
      city: geo.city,
      deviceType: clientDetails.deviceType,
      browser: clientDetails.browser,
      os: clientDetails.os,
      referrer: clientDetails.referrer,
      pagePath: pagePath || window.location.pathname || '/',
      language: navigator.language || 'ar',
    };

    // Send visit payload to the central backend server
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
        keepalive: true,
      });
    } catch (err) {
      console.debug('Backend track API fallback:', err);
    }

    return newEntry;
  } catch (err) {
    console.error('Failed to track visit:', err);
    return null;
  } finally {
    isTracking = false;
  }
}

// Fetch Global Real Analytics Summary from Central Server
export async function fetchServerAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        console.debug('Failed to get token for analytics summary:', tokenErr);
      }
    }

    const res = await fetch('/api/analytics/summary', {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const data: AnalyticsSummary = await res.json();
      lastServerSummary = data;
      return data;
    }
  } catch (err) {
    console.debug('Server summary fetch notice:', err);
  }

  // If server is not ready or network fails, return cached summary or blank default
  return lastServerSummary || getEmptyAnalyticsSummary();
}

// Synchronous getter for current summary
export function getAnalyticsSummary(): AnalyticsSummary {
  return lastServerSummary || getEmptyAnalyticsSummary();
}

function getEmptyAnalyticsSummary(): AnalyticsSummary {
  const dailyHistory: DailyVisitStat[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    dailyHistory.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      visits: 0,
      uniqueVisitors: 0,
    });
  }

  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    yesterdayVisits: 0,
    thisWeekVisits: 0,
    thisMonthVisits: 0,
    topCountries: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    browserBreakdown: {},
    osBreakdown: {},
    referrerBreakdown: {},
    dailyHistory,
    recentLogs: [],
  };
}

// Clear all analytics data from central server and client
export async function clearAnalyticsData(): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    await fetch('/api/analytics/clear', {
      method: 'POST',
      headers,
    });
    lastServerSummary = getEmptyAnalyticsSummary();
    localStorage.removeItem(LOGS_STORAGE_KEY);
    sessionStorage.removeItem(GEO_CACHE_KEY);
  } catch (err) {
    console.error('Error clearing analytics:', err);
  }
}

// Export Helper: CSV
export function exportAnalyticsCSV(): void {
  const summary = getAnalyticsSummary();
  const rows: string[] = [
    'Timestamp,Date,Time,CountryCode,CountryArabic,CountryEnglish,City,Device,OS,Browser,Referrer',
  ];

  summary.recentLogs.forEach((log) => {
    const d = new Date(log.timestamp);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0];
    rows.push(
      [
        log.timestamp,
        dateStr,
        timeStr,
        `"${log.countryCode}"`,
        `"${log.countryNameAr}"`,
        `"${log.countryNameEn}"`,
        `"${log.city || ''}"`,
        `"${log.deviceType}"`,
        `"${log.os}"`,
        `"${log.browser}"`,
        `"${log.referrer}"`,
      ].join(',')
    );
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `barcodey_real_visitors_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
