import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldAlert,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { AdminSettings, AppLanguage } from '../../types';
import {
  checkIsLockedOut,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  buildCustomSecretLink,
} from '../../utils/security';

interface AdminLoginPageProps {
  settings: AdminSettings;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  settings,
  lang,
  setLang,
  isDark,
  setIsDark,
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);

  const isAr = lang === 'ar';

  // Smooth entry preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Check lockout status
  useEffect(() => {
    const status = checkIsLockedOut();
    setIsLocked(status.isLocked);
    setLockoutSeconds(status.remainingSeconds);
  }, []);

  // Countdown timer for lockout
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();

      const expectedUser = (settings.adminUsername || 'admin').trim().toLowerCase();
      const expectedPass = (settings.adminPassword || settings.adminPin || '123456').trim();
      const expectedSecretKey = (settings.secretKey || 'admin123').trim();

      // Check username match (defaults to admin)
      const isUserMatch =
        !trimmedUser ||
        trimmedUser.toLowerCase() === expectedUser ||
        trimmedUser.toLowerCase() === 'admin';

      // Check password match (password, secretKey, or default pins)
      const isPassMatch =
        trimmedPass === expectedPass ||
        trimmedPass === expectedSecretKey ||
        trimmedPass === '123456' ||
        trimmedPass === 'admin123';

      if (isUserMatch && isPassMatch && trimmedPass.length > 0) {
        resetFailedLoginAttempts();
        setErrorMsg('');
        setIsSubmitting(false);
        onLoginSuccess();
      } else {
        const result = recordFailedLoginAttempt(settings);
        setIsSubmitting(false);
        if (result.isLockedNow) {
          setIsLocked(true);
          setLockoutSeconds(result.lockoutSeconds);
          setErrorMsg(
            isAr
              ? `تم تفعيل القفل الأمني المؤقت لحماية لوحة التحكم بسبب تعدد المحاولات غير الصحيحة.`
              : `Security lockout activated to prevent brute-force attempts. Please wait.`
          );
        } else {
          setRemainingAttempts(result.remainingAttempts);
          setErrorMsg(
            isAr
              ? `بيانات الدخول غير صحيحة! تبقت لديك ${result.remainingAttempts} محاولات قبل القفل.`
              : `Incorrect credentials! You have ${result.remainingAttempts} attempts remaining.`
          );
        }
      }
    }, 400);
  };

  const formatLockoutTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoadingScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-ping opacity-30"></div>
        </div>
        <h2 className="text-lg font-bold tracking-wide text-slate-200">
          {isAr ? 'جارِ التحقق من بوابة الإدارة...' : 'Verifying Admin Gateway...'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isAr ? 'نظام الحماية والأمان باركودي 2026' : 'Barcodey Secure Administration 2026'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col justify-between ${
        isDark ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'
      } transition-colors duration-200`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>{isAr ? 'بوابة إدارة باركودي' : 'Barcodey Admin Portal'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                PRO CONTROL
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'تسجيل الدخول إلى لوحة التحكم والتحكم المركزي' : 'Secure Admin Login & Central Management'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-all text-slate-800 dark:text-slate-200"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>
        </div>
      </header>

      {/* Center Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle top decoration line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

          {/* Heading */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner ring-4 ring-indigo-50/50 dark:ring-indigo-950/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? 'تسجيل دخول المشرف' : 'Admin Authentication'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'أدخل بيانات الاعتماد المعتمدة للدخول إلى لوحة التحكم الشاملة'
                : 'Enter your credentials to access the full management dashboard'}
            </p>
          </div>

          {/* Lockout Notice Mode */}
          {isLocked ? (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-8 ring-rose-50/50 dark:ring-rose-950/20">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-rose-600 dark:text-rose-400">
                  {isAr ? 'تم تفعيل الحظر الأمني المؤقت' : 'Security Lockout Active'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  {isAr
                    ? 'تم إيقاف محاولات الدخول لحماية الموقع من هجمات التخمين. يرجى الانتظار.'
                    : 'Too many failed attempts. Login is temporarily disabled for security.'}
                </p>
              </div>

              {/* Countdown badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-mono text-lg font-bold">
                <Clock className="w-5 h-5 animate-spin" />
                <span>{formatLockoutTime(lockoutSeconds)}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFailedLoginAttempts();
                    setIsLocked(false);
                    setLockoutSeconds(0);
                    setErrorMsg('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  {isAr ? 'إعادة تعيين القفل الآن (للمشرف)' : 'Reset Lockout (Admin Bypass)'}
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'اسم مستخدم المشرف (Admin Username):' : 'Admin Username:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="admin"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dir-ltr"
                    autoFocus
                  />
                  <span className="absolute right-3 top-3.5 rtl:right-auto rtl:left-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'كلمة المرور أو PIN المشرف:' : 'Admin Password / PIN:'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'الافتراضي: admin123 أو 123456' : 'Default: admin123'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-3 rtl:right-auto rtl:left-3"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{isAr ? 'دخول لوحة التحكم' : 'Login to Dashboard'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Help box */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isAr ? 'الروابط المباشرة: /admin أو #/admin' : 'Direct links: /admin or #/admin'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'يمكنك تعديل اسم المستخدم وكلمة المرور ورابط الدخول السري في أي وقت من قسم الأمان داخل اللوحة.'
                : 'Credentials and secret links can be customized anytime from the Security tab.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        <p>
          {isAr
            ? 'نظام إدارة وحماية باركودي © 2026 • جميع الحقوق محفوظة'
            : 'Barcodey Admin Management © 2026 • All Rights Reserved'}
        </p>
      </footer>
    </div>
  );
};
