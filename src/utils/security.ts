import { AdminSettings, SecurityLogEntry } from '../types';
import { generateSecureId } from './crypto';

const SECURITY_LOGS_KEY = 'barcodey_security_audit_logs_v1';
const FAILED_ATTEMPTS_KEY = 'barcodey_security_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'barcodey_security_lockout_until';

// Calculate Password / PIN Strength
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  labelAr: string;
  labelEn: string;
  color: string;
} {
  if (!password) {
    return { score: 0, labelAr: 'فارغ', labelEn: 'Empty', color: 'text-slate-400' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 0:
    case 1:
      return { score: 1, labelAr: 'ضعيف جداً', labelEn: 'Very Weak', color: 'text-rose-500' };
    case 2:
      return { score: 2, labelAr: 'متوسط', labelEn: 'Moderate', color: 'text-amber-500' };
    case 3:
      return { score: 3, labelAr: 'قوي', labelEn: 'Strong', color: 'text-indigo-500' };
    case 4:
    default:
      return { score: 4, labelAr: 'حماية فائقة (خارق)', labelEn: 'Ultra Strong', color: 'text-emerald-500' };
  }
}

// Client info detector
export function getClientSecurityContext(): {
  device: string;
  browser: string;
  os: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  let device = 'Desktop';
  if (/Mobile|Android|iP(hone|od)/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

  let os = 'Windows';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Chrome';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return { device, browser, os };
}

// Security Audit Logs
export function getSecurityAuditLogs(): SecurityLogEntry[] {
  try {
    const raw = localStorage.getItem(SECURITY_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading security logs:', e);
  }
  return [];
}

export function logSecurityEvent(
  type: 'success' | 'failed' | 'lockout',
  messageAr: string,
  messageEn: string
): void {
  try {
    const context = getClientSecurityContext();
    const entry: SecurityLogEntry = {
      id: generateSecureId('sec'),
      timestamp: Date.now(),
      type,
      messageAr,
      messageEn,
      device: context.device,
      browser: context.browser,
      os: context.os,
    };

    const current = getSecurityAuditLogs();
    const updated = [entry, ...current.slice(0, 49)]; // keep max 50 events
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving security log:', e);
  }
}

export function clearSecurityLogs(): void {
  try {
    localStorage.removeItem(SECURITY_LOGS_KEY);
  } catch {}
}

// Lockout & Rate Limiting Management
export function checkIsLockedOut(): { isLocked: boolean; remainingSeconds: number } {
  try {
    const lockoutUntil = Number(localStorage.getItem(LOCKOUT_UNTIL_KEY) || 0);
    const now = Date.now();
    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    } else if (lockoutUntil > 0 && lockoutUntil <= now) {
      // Lockout expired
      localStorage.removeItem(LOCKOUT_UNTIL_KEY);
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    }
  } catch {}
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedLoginAttempt(settings: AdminSettings): {
  isLockedNow: boolean;
  failedCount: number;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  try {
    const maxAttempts = settings.maxFailedAttempts || 4;
    const lockoutMinutes = settings.lockoutDurationMinutes || 5;

    const currentFailed = Number(localStorage.getItem(FAILED_ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, currentFailed.toString());

    if (currentFailed >= maxAttempts) {
      const lockoutMs = lockoutMinutes * 60 * 1000;
      const lockoutUntil = Date.now() + lockoutMs;
      localStorage.setItem(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());

      logSecurityEvent(
        'lockout',
        `تم قفل محاولات الدخول تلقائياً لمدة ${lockoutMinutes} دقائق لتجاوز الحد المسموح (${currentFailed} محاولات خاطئة)`,
        `Login locked for ${lockoutMinutes} minutes after exceeding maximum failed attempts (${currentFailed} attempts)`
      );

      return {
        isLockedNow: true,
        failedCount: currentFailed,
        remainingAttempts: 0,
        lockoutSeconds: lockoutMinutes * 60,
      };
    } else {
      const remaining = maxAttempts - currentFailed;
      logSecurityEvent(
        'failed',
        `محاولة دخول غير مصرح بها بكلمة مرور/PIN خاطئ. المتبقي: ${remaining} محاولات`,
        `Unauthorized login attempt with invalid PIN/Password. Remaining: ${remaining} attempts`
      );

      return {
        isLockedNow: false,
        failedCount: currentFailed,
        remainingAttempts: remaining,
        lockoutSeconds: 0,
      };
    }
  } catch {
    return { isLockedNow: false, failedCount: 1, remainingAttempts: 3, lockoutSeconds: 0 };
  }
}

export function resetFailedLoginAttempts(): void {
  try {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    logSecurityEvent(
      'success',
      'تم التحقق وتسجيل الدخول بنجاح إلى لوحة التحكم بصلاحيات المشرف الكاملة',
      'Successfully authenticated and logged into admin control panel'
    );
  } catch {}
}

// Generate the customized Secret Link based on user settings
export function buildCustomSecretLink(settings: AdminSettings): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  if (settings.secretAccessType === 'hash') {
    const slug = (settings.secretSlug || 'portal-access-2026').replace(/^#/, '').trim();
    return `${origin}${pathname}#${slug}`;
  }

  // Default query type (?param=key)
  const param = (settings.secretParamName || 'admin_key').trim();
  const key = (settings.secretKey || 'admin123').trim();
  return `${origin}${pathname}?${encodeURIComponent(param)}=${encodeURIComponent(key)}`;
}

// Strict validator: checks if current URL exactly matches the single configured admin access route
export function isCurrentUrlMatchingAdminRoute(settings: AdminSettings): boolean {
  if (typeof window === 'undefined') return false;

  const accessType = settings.secretAccessType || 'hash';

  if (accessType === 'hash') {
    const rawHash = window.location.hash ? window.location.hash.replace(/^#/, '').trim() : '';
    const configuredSlug = (settings.secretSlug || 'portal-access-2026').replace(/^#/, '').trim();
    return rawHash !== '' && rawHash === configuredSlug;
  }

  // Query parameter mode (?param=key)
  const params = new URLSearchParams(window.location.search);
  const configuredParam = (settings.secretParamName || 'admin_key').trim();
  const configuredKey = (settings.secretKey || 'admin123').trim();

  const actualVal = params.get(configuredParam);
  return actualVal !== null && actualVal.trim() === configuredKey;
}

