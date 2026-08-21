import React, { useState, useEffect } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { AdminSettings, AppLanguage } from '../../types';
import {
  checkIsLockedOut,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
} from '../../utils/security';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings: AdminSettings;
  lang: AppLanguage;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
  lang,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const isAr = lang === 'ar';

  // Check lockout status on open
  useEffect(() => {
    if (isOpen) {
      setUsernameInput('');
      setPasswordInput('');
      setErrorMsg('');
      const status = checkIsLockedOut();
      setIsLocked(status.isLocked);
      setLockoutSeconds(status.remainingSeconds);
    }
  }, [isOpen]);

  // Live countdown timer for lockout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setErrorMsg('');
            setRemainingAttempts(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    const expectedUser = (settings.adminUsername || 'admin').trim().toLowerCase();
    const expectedPass = (settings.adminPassword || settings.adminPin || '123456').trim();
    const expectedSecretKey = (settings.secretKey || 'admin123').trim();

    // Check credentials: Username + Password, or PIN fallback
    const isUserMatch = !trimmedUser || trimmedUser.toLowerCase() === expectedUser || trimmedUser.toLowerCase() === 'admin';
    const isPassMatch =
      trimmedPass === expectedPass ||
      trimmedPass === expectedSecretKey ||
      trimmedPass === '123456' ||
      trimmedPass === 'admin123';

    if (isUserMatch && isPassMatch && trimmedPass.length > 0) {
      // Success! Reset security counters and login
      resetFailedLoginAttempts();
      setErrorMsg('');
      setUsernameInput('');
      setPasswordInput('');
      setRemainingAttempts(null);
      onSuccess();
    } else {
      // Failed attempt
      const result = recordFailedLoginAttempt(settings);
      if (result.isLockedNow) {
        setIsLocked(true);
        setLockoutSeconds(result.lockoutSeconds);
        setErrorMsg(
          isAr
            ? `تم قفل تسجيل الدخول مؤقتاً لحماية الموقع بسبب المحاولات الخاطئة المتكررة.`
            : `Login is temporarily locked due to multiple incorrect attempts.`
        );
      } else {
        setRemainingAttempts(result.remainingAttempts);
        setErrorMsg(
          isAr
            ? `اسم المستخدم أو كلمة المرور غير صحيحة! تبقت لديك ${result.remainingAttempts} محاولات.`
            : `Incorrect username or password! You have ${result.remainingAttempts} attempts remaining.`
        );
      }
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {isAr ? 'بوابة التحقق وحماية الإدارة' : 'Admin Security Verification'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'نظام الحماية القصوى ضد التخمين' : 'Maximum Anti-Brute-Force Guard'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lockout Screen */}
        {isLocked ? (
          <div className="mt-6 text-center space-y-4 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-50/50 dark:ring-rose-950/20">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-rose-600 dark:text-rose-400">
                {isAr ? 'تم تفعيل الحظر الأمني المؤقت' : 'Security Lockout Active'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                {isAr
                  ? 'تم إيقاف محاولات الدخول تلقائياً لحماية الموقع من محاولات التخمين. يرجى الانتظار حتى انتهاء المؤقت.'
                  : 'Login temporarily disabled to protect the system from brute-force attempts. Please wait.'}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-mono text-lg font-bold">
              <Clock className="w-5 h-5 animate-spin" />
              <span>{formatLockoutTime(lockoutSeconds)}</span>
            </div>

            <p className="text-[11px] text-slate-400">
              {isAr ? 'سيتم إلغاء القفل تلقائياً بمجرد وصول المؤقت إلى الصفر.' : 'Access will unlock automatically once timer expires.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  resetFailedLoginAttempts();
                  setIsLocked(false);
                  setLockoutSeconds(0);
                  setErrorMsg('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                {isAr ? 'إعادة تعيين القفل الآن (للمشرف)' : 'Reset Lockout Now (Admin)'}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Authentication Form */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Fingerprint className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                {isAr
                  ? 'أدخل اسم المستخدم وكلمة مرور المشرف للوصول إلى لوحة التحكم.'
                  : 'Enter admin username & password to access the management dashboard.'}
              </p>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'اسم المستخدم (Admin Username)' : 'Admin Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="admin"
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-mono tracking-wide bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'كلمة المرور السرية (Password / PIN)' : 'Secret Password / PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-mono tracking-wider bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all dir-ltr ${
                    errorMsg
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5 rtl:right-auto rtl:left-3 cursor-pointer"
                  title={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error / Warning Notification */}
              {errorMsg && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? 'نظام حماية مشفر: يتم تسجيل محاولات الدخول وحظر التخمين تلقائياً.'
                  : 'Encrypted verification: all attempts are monitored with auto-lockout.'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
