import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Home,
  QrCode,
  Fingerprint,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { AppLanguage } from '../../types';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  resetPassword,
  signInAsGuest,
  getFirebaseAuthErrorMessage,
} from '../../lib/firebase';

interface LoginPageProps {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
  initialMode?: 'login' | 'signup' | 'forgot-password';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  lang,
  setLang,
  isDark,
  setIsDark,
  onNavigateHome,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);
  const [isPreloading, setIsPreloading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(15);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Preloader transition animation on entry
  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingProgress(65), 150);
    const timer2 = setTimeout(() => setLoadingProgress(100), 350);
    const timer3 = setTimeout(() => setIsPreloading(false), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Update document title for SEO & Browser history
  useEffect(() => {
    const originalTitle = document.title;
    document.title = isAr
      ? 'تسجيل الدخول وإدارة الحساب السحابي | باركودي'
      : 'Sign In & Cloud Account Portal | Barcodey';
    return () => {
      document.title = originalTitle;
    };
  }, [isAr]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMsg(
        isAr
          ? 'تم تسجيل الدخول بنجاح بحساب Google! جارِ تحويلك...'
          : 'Signed in successfully with Google! Redirecting...'
      );
      setTimeout(() => {
        onLoginSuccess();
      }, 700);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        if (!password) {
          setErrorMsg(isAr ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.');
          setIsLoading(false);
          return;
        }
        await signInWithEmail(email, password);
        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح! مرحباً بك.' : 'Signed in successfully! Welcome.');
        setTimeout(() => onLoginSuccess(), 700);
      } else if (mode === 'signup') {
        if (!password || password.length < 6) {
          setErrorMsg(
            isAr
              ? 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل.'
              : 'Password must be at least 6 characters.'
          );
          setIsLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName.trim() || undefined);
        setSuccessMsg(
          isAr
            ? 'تم إنشاء حسابك الجديد بنجاح وتم تسجيل الدخول!'
            : 'Account created successfully! You are now signed in.'
        );
        setTimeout(() => onLoginSuccess(), 800);
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccessMsg(
          isAr
            ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.'
            : 'Password reset link sent to your email.'
        );
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGuestLoading(true);
    try {
      await signInAsGuest();
      setSuccessMsg(
        isAr
          ? 'تم تسجيل الدخول كضيف سحابي مؤقت.'
          : 'Signed in as guest.'
      );
      setTimeout(() => onLoginSuccess(), 600);
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setGuestLoading(false);
    }
  };

  // Preloader Screen
  if (isPreloading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-indigo-500/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
        <div className="w-full max-w-sm text-center space-y-6 relative z-10">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center animate-pulse">
              <QrCode className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
              ✓
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'بوابة تسجيل الدخول الآمنة' : 'Secure Login Portal'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'جارِ تجهيز بيئة المصادقة والاتصال السحابي المشفر...'
                : 'Initializing encrypted authentication environment...'}
            </p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      
      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
        >
          {isAr ? (
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:-translate-x-0.5" />
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-tight">{isAr ? 'باركودي' : 'Barcodey'}</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
            title={isDark ? 'الوضع الفاتح' : 'الوضع الليلي'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Return to Home Button */}
          <button
            onClick={onNavigateHome}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/5 dark:shadow-black/40 relative z-10 space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 mb-1">
              {mode === 'signup' ? (
                <UserPlus className="w-7 h-7" />
              ) : mode === 'forgot-password' ? (
                <KeyRound className="w-7 h-7" />
              ) : (
                <LogIn className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'signup'
                ? isAr
                  ? 'إنشاء حساب جديد'
                  : 'Create a New Account'
                : mode === 'forgot-password'
                ? isAr
                  ? 'استعادة كلمة المرور'
                  : 'Reset Your Password'
                : isAr
                ? 'تسجيل الدخول إلى باركودي'
                : 'Sign In to Barcodey'}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {mode === 'signup'
                ? isAr
                  ? 'انضم إلينا لحفظ جميع رموز الباركود و QR وإدارتها سحابياً بدقة عالية.'
                  : 'Join to save and manage all your barcodes and QR designs in the cloud.'
                : mode === 'forgot-password'
                ? isAr
                  ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط استعادة كلمة المرور.'
                  : 'Enter your registered email and we will send a password reset link.'
                : isAr
                ? 'سجّل دخولك للوصول إلى رموزك المحفوظة ومتابعة إحصائيات الروابط الديناميكية.'
                : 'Sign in to access your saved codes and dynamic link analytics.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Login / Sign Up) */}
          {mode !== 'forgot-password' && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
              </button>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button (Prominent) */}
          {mode !== 'forgot-password' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isLoading || guestLoading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {mode === 'signup'
                    ? isAr
                      ? 'التسجيل السريع بواسطة Google'
                      : 'Sign up with Google'
                    : isAr
                    ? 'المتابعة باستخدام حساب Google'
                    : 'Continue with Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'أو عبر البريد' : 'or via email'}
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Display Name Field (Only on Sign Up) */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الاسم أو اللقب (اختياري)' : 'Full Name (Optional)'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                    className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field (Login & Sign Up) */}
            {mode !== 'forgot-password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rtl:pr-10 ltr:pl-10 rtl:pl-10 ltr:pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 rtl:left-3 ltr:right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || googleLoading || guestLoading}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'signup'
                  ? isAr
                    ? 'إنشاء الحساب والمتابعة'
                    : 'Create Account & Proceed'
                  : mode === 'forgot-password'
                  ? isAr
                    ? 'إرسال رابط الاستعادة'
                    : 'Send Reset Link'
                  : isAr
                  ? 'تسجيل الدخول'
                  : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Forgot password Back to login button */}
          {mode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {isAr ? '← العودة إلى تسجيل الدخول' : '← Back to Sign In'}
            </button>
          )}

          {/* Guest Login Option */}
          {mode !== 'forgot-password' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={guestLoading || isLoading || googleLoading}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'أو المتابعة كزائر سحابي بدون كلمة مرور' : 'Or continue as guest without password'}</span>
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        <p>
          {isAr
            ? 'نظام التخزين والمصادقة محمي بواسطة Google Firebase بمعايير أمان عالية.'
            : 'Authentication & Cloud sync secured by Google Firebase with zero data exposure.'}
        </p>
      </footer>
    </div>
  );
};
