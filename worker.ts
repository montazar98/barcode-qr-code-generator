/**
 * Cloudflare Worker Entry Point for Barcode & QR Studio
 * - Serves production assets via env.ASSETS (Vite build output)
 * - Provides server-side Analytics API backed by Cloudflare D1 Database (binding: DB)
 */

/// <reference types="@cloudflare/workers-types" />

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: any; error?: string }>;
  all<T = unknown>(): Promise<{ results?: T[]; success: boolean; meta?: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

export interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DB?: D1Database;
  ASSETS: Fetcher;
  [key: string]: any;
}

// In-memory fallback if D1 is not yet bound during local tests
let memoryFallbackLogs: any[] = [];

// Arab & Global Country Dictionary
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
  const codePoints = code
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateWorkerId(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `${prefix}_${Date.now().toString(36)}_${hex}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for APIs
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ----------------------------------------------------
    // API ENDPOINTS
    // ----------------------------------------------------

    // 1. Health Check
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        timestamp: Date.now(),
        platform: 'Cloudflare Workers',
        d1Connected: Boolean(env.DB),
      });
    }

    // 2. Track Real Visitor: POST /api/analytics/track
    if (url.pathname === '/api/analytics/track' && request.method === 'POST') {
      try {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        // Extract Cloudflare Edge Geo and Request properties
        const cf: any = (request as any).cf || {};
        const cfCountry = cf.country || request.headers.get('cf-ipcountry') || '';
        const cfCity = cf.city || '';
        const cfRegion = cf.region || cf.regionCode || '';

        const countryCode = (body.countryCode || cfCountry || 'XX').toUpperCase();
        const countryInfo = COUNTRY_DICT[countryCode] || {
          ar: body.countryNameAr || countryCode,
          en: body.countryNameEn || countryCode,
        };
        const flag = body.flagEmoji || getCountryFlag(countryCode);
        const city = body.city || cfCity || '';
        const region = body.region || cfRegion || '';

        const visitorId = body.visitorId || generateWorkerId('anon');
        const timestamp = Date.now();
        const id = generateWorkerId('vis');

        const deviceType = body.deviceType || 'desktop';
        const browser = body.browser || 'Other';
        const os = body.os || 'Other';
        const referrer = body.referrer || request.headers.get('referer') || 'Direct / مباشر';
        const pagePath = body.pagePath || '/';
        const language = body.language || request.headers.get('accept-language')?.split(',')[0] || 'ar';
        const userAgent = request.headers.get('user-agent') || body.userAgent || '';

        // Privacy hash for IP if available
        const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
        const ipHash = rawIp ? 'ip_' + rawIp.split('.').slice(0, 2).join('.') : '';

        // Store into Cloudflare D1
        if (env.DB) {
          try {
            await env.DB.prepare(
              `INSERT INTO analytics_visits (
                id, visitor_id, timestamp, ip_hash,
                country_code, country_name_ar, country_name_en, flag_emoji,
                city, region, device_type, browser, os,
                referrer, page_path, language, user_agent
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                id,
                visitorId,
                timestamp,
                ipHash,
                countryCode,
                countryInfo.ar,
                countryInfo.en,
                flag,
                city,
                region,
                deviceType,
                browser,
                os,
                referrer,
                pagePath,
                language,
                userAgent.substring(0, 255)
              )
              .run();
          } catch (dbErr) {
            console.error('D1 Insert error:', dbErr);
          }
        } else {
          // Memory fallback
          memoryFallbackLogs.unshift({
            id,
            visitorId,
            timestamp,
            countryCode,
            countryNameAr: countryInfo.ar,
            countryNameEn: countryInfo.en,
            flagEmoji: flag,
            city,
            region,
            deviceType,
            browser,
            os,
            referrer,
            pagePath,
            language,
          });
          if (memoryFallbackLogs.length > 2000) memoryFallbackLogs = memoryFallbackLogs.slice(0, 2000);
        }

        return jsonResponse({
          success: true,
          logged: true,
          id,
          storage: env.DB ? 'cloudflare-d1' : 'worker-memory',
        });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to record visit', details: err?.message }, 500);
      }
    }

    // 3. Real Analytics Summary API: GET /api/analytics/summary
    if (url.pathname === '/api/analytics/summary' && request.method === 'GET') {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 86400000;
        const oneWeekAgo = todayStart - 7 * 86400000;
        const oneMonthAgo = todayStart - 30 * 86400000;

        if (env.DB) {
          // 1. Overall counts
          const totalsResult: any = await env.DB.prepare(
            `SELECT 
              COUNT(*) as total_visits,
              COUNT(DISTINCT visitor_id) as unique_visitors,
              SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) as today_visits,
              SUM(CASE WHEN timestamp >= ? AND timestamp < ? THEN 1 ELSE 0 END) as yesterday_visits,
              SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) as week_visits,
              SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) as month_visits
            FROM analytics_visits`
          )
            .bind(todayStart, yesterdayStart, todayStart, oneWeekAgo, oneMonthAgo)
            .first();

          const totalVisits = totalsResult?.total_visits || 0;
          const uniqueVisitors = totalsResult?.unique_visitors || 0;
          const todayVisits = totalsResult?.today_visits || 0;
          const yesterdayVisits = totalsResult?.yesterday_visits || 0;
          const thisWeekVisits = totalsResult?.week_visits || 0;
          const thisMonthVisits = totalsResult?.month_visits || 0;

          // 2. Top Countries
          const countriesResult: any = await env.DB.prepare(
            `SELECT 
              country_code,
              country_name_ar,
              country_name_en,
              flag_emoji,
              COUNT(*) as visits,
              COUNT(DISTINCT visitor_id) as unique_visitors
            FROM analytics_visits
            GROUP BY country_code
            ORDER BY visits DESC
            LIMIT 50`
          ).all();

          const topCountries = (countriesResult?.results || []).map((row: any) => ({
            countryCode: row.country_code || 'XX',
            countryNameAr: row.country_name_ar || row.country_code,
            countryNameEn: row.country_name_en || row.country_code,
            flagEmoji: row.flag_emoji || getCountryFlag(row.country_code),
            visits: row.visits || 0,
            uniqueVisitors: row.unique_visitors || 0,
            percentage: totalVisits > 0 ? Math.round((row.visits / totalVisits) * 100) : 0,
          }));

          // 3. Device Breakdown
          const devicesResult: any = await env.DB.prepare(
            `SELECT device_type, COUNT(*) as count FROM analytics_visits GROUP BY device_type`
          ).all();

          const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
          (devicesResult?.results || []).forEach((row: any) => {
            const dev = row.device_type as 'desktop' | 'mobile' | 'tablet';
            if (dev === 'desktop' || dev === 'mobile' || dev === 'tablet') {
              deviceBreakdown[dev] = row.count || 0;
            }
          });

          // 4. Browsers Breakdown
          const browsersResult: any = await env.DB.prepare(
            `SELECT browser, COUNT(*) as count FROM analytics_visits GROUP BY browser ORDER BY count DESC LIMIT 10`
          ).all();
          const browserBreakdown: Record<string, number> = {};
          (browsersResult?.results || []).forEach((row: any) => {
            if (row.browser) browserBreakdown[row.browser] = row.count || 0;
          });

          // 5. OS Breakdown
          const osResult: any = await env.DB.prepare(
            `SELECT os, COUNT(*) as count FROM analytics_visits GROUP BY os ORDER BY count DESC LIMIT 10`
          ).all();
          const osBreakdown: Record<string, number> = {};
          (osResult?.results || []).forEach((row: any) => {
            if (row.os) osBreakdown[row.os] = row.count || 0;
          });

          // 6. Referrers Breakdown
          const refResult: any = await env.DB.prepare(
            `SELECT referrer, COUNT(*) as count FROM analytics_visits GROUP BY referrer ORDER BY count DESC LIMIT 10`
          ).all();
          const referrerBreakdown: Record<string, number> = {};
          (refResult?.results || []).forEach((row: any) => {
            if (row.referrer) referrerBreakdown[row.referrer] = row.count || 0;
          });

          // 7. 14-Day Timeline
          const dailyMap: Record<string, { visits: number; uniqueVisitors: number }> = {};
          for (let i = 13; i >= 0; i--) {
            const d = new Date(todayStart - i * 86400000);
            const key = d.toISOString().split('T')[0];
            dailyMap[key] = { visits: 0, uniqueVisitors: 0 };
          }

          const fourteenDaysAgo = todayStart - 13 * 86400000;
          const dailyResult: any = await env.DB.prepare(
            `SELECT 
              strftime('%Y-%m-%d', datetime(timestamp / 1000, 'unixepoch')) as visit_date,
              COUNT(*) as visits,
              COUNT(DISTINCT visitor_id) as unique_visitors
            FROM analytics_visits
            WHERE timestamp >= ?
            GROUP BY visit_date
            ORDER BY visit_date ASC`
          )
            .bind(fourteenDaysAgo)
            .all();

          (dailyResult?.results || []).forEach((row: any) => {
            if (row.visit_date && dailyMap[row.visit_date]) {
              dailyMap[row.visit_date] = {
                visits: row.visits || 0,
                uniqueVisitors: row.unique_visitors || 0,
              };
            }
          });

          const dailyHistory = Object.entries(dailyMap).map(([dateStr, data]) => {
            const d = new Date(dateStr);
            return {
              date: dateStr,
              label: `${d.getMonth() + 1}/${d.getDate()}`,
              visits: data.visits,
              uniqueVisitors: data.uniqueVisitors,
            };
          });

          // 8. Recent 100 Logs
          const logsResult: any = await env.DB.prepare(
            `SELECT 
              id,
              visitor_id as visitorId,
              timestamp,
              country_code as countryCode,
              country_name_ar as countryNameAr,
              country_name_en as countryNameEn,
              flag_emoji as flagEmoji,
              city,
              region,
              device_type as deviceType,
              browser,
              os,
              referrer,
              page_path as pagePath,
              language
            FROM analytics_visits
            ORDER BY timestamp DESC
            LIMIT 100`
          ).all();

          return jsonResponse({
            totalVisits,
            uniqueVisitors,
            todayVisits,
            yesterdayVisits,
            thisWeekVisits,
            thisMonthVisits,
            topCountries,
            deviceBreakdown,
            browserBreakdown,
            osBreakdown,
            referrerBreakdown,
            dailyHistory,
            recentLogs: logsResult?.results || [],
            source: 'Cloudflare D1',
            lastUpdated: Date.now(),
          });
        }

        // Memory fallback calculation if D1 is not bound
        const logs = memoryFallbackLogs;
        const totalVisits = logs.length;
        const uniqueSet = new Set(logs.map((l) => l.visitorId || l.id));

        return jsonResponse({
          totalVisits,
          uniqueVisitors: uniqueSet.size,
          todayVisits: logs.filter((l) => l.timestamp >= todayStart).length,
          yesterdayVisits: logs.filter((l) => l.timestamp >= yesterdayStart && l.timestamp < todayStart).length,
          thisWeekVisits: logs.filter((l) => l.timestamp >= oneWeekAgo).length,
          thisMonthVisits: logs.filter((l) => l.timestamp >= oneMonthAgo).length,
          topCountries: [],
          deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
          browserBreakdown: {},
          osBreakdown: {},
          referrerBreakdown: {},
          dailyHistory: [],
          recentLogs: logs.slice(0, 100),
          source: 'Worker Memory (D1 unbound)',
          lastUpdated: Date.now(),
        });
      } catch (err: any) {
        console.error('Analytics summary error:', err);
        return jsonResponse({ error: 'Failed to generate analytics summary', details: err?.message }, 500);
      }
    }

    // 4. Clear Analytics API: POST /api/analytics/clear
    if (url.pathname === '/api/analytics/clear' && request.method === 'POST') {
      try {
        if (env.DB) {
          await env.DB.prepare(`DELETE FROM analytics_visits`).run();
        }
        memoryFallbackLogs = [];
        return jsonResponse({ success: true, message: 'Analytics data cleared from Cloudflare D1' });
      } catch (err: any) {
        return jsonResponse({ error: 'Failed to clear analytics', details: err?.message }, 500);
      }
    }

    // ----------------------------------------------------
    // STATIC ASSETS SERVING VIA VITE BUILD (env.ASSETS)
    // ----------------------------------------------------
    return env.ASSETS.fetch(request);
  },
};
