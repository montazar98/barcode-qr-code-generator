import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LogIn,
  UserPlus,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AppLanguage, AuthModalMode } from '../../types';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signInAsGuest,
  getFirebaseAuthErrorMessage,
} from '../../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
  initialMode?: AuthModalMode;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialMode = 'login',
  onSuccess,
}) => {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleModeSwitch = (newMode: AuthModalMode) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      setSuccessMsg(isAr ? 'تم تسجيل الدخول بحساب Google بنجاح!' : 'Successfully signed in with Google!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup intentionally, gracefully reset state without showing an intrusive red error
        setErrorMsg(null);
        return;
      }
      console.error('Google sign-in error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInAsGuest();
      setSuccessMsg(isAr ? 'تم الدخول كزائر سحابي بنجاح!' : 'Signed in as guest successfully!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      if (
        err?.code === 'auth/admin-restricted-operation' ||
        err?.code === 'auth/operation-not-allowed'
      ) {
        // If Anonymous Auth is disabled on the Firebase project, allow continuing in local mode seamlessly
        setSuccessMsg(
          isAr
            ? 'تمت المتابعة في الوضع المحلي! يمكنك إنشاء وتنزيل الرموز فوراً. للمزامنة السحابية، يرجى تسجيل الدخول بـ Google أو البريد.'
            : 'Switched to local mode! You can generate and download codes now. Sign in with Google or Email for cloud syncing.'
        );
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
        return;
      }
      console.error('Guest sign-in error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg(isAr ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }

    if (mode !== 'forgot-password' && (!password || password.length < 6)) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 خانات.' : 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        await signInWithEmail(email, password);
        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 700);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        setSuccessMsg(isAr ? 'تم إنشاء الحساب السحابي بنجاح!' : 'Account created successfully!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 700);
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccessMsg(
          isAr
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.'
            : 'Password reset link sent to your email.'
        );
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      setErrorMsg(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon / Banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 px-6 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              {mode === 'login' && <LogIn className="w-6 h-6 text-white" />}
              {mode === 'signup' && <UserPlus className="w-6 h-6 text-white" />}
              {mode === 'forgot-password' && <KeyRound className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">
                {mode === 'login' && (isAr ? 'تسجيل الدخول' : 'Sign In')}
                {mode === 'signup' && (isAr ? 'إنشاء حساب جديد' : 'Create Account')}
                {mode === 'forgot-password' && (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                {mode === 'login' &&
                  (isAr ? 'سجّل دخولك لحفظ ومزامنة رموزك سحابياً والوصول إليها من أي جهاز' : 'Access your cloud-saved QR codes and barcodes anywhere')}
                {mode === 'signup' &&
                  (isAr ? 'انضم مجاناً واحصل على تخزين سحابي غير محدود لرموزك' : 'Join free for unlimited cloud storage and instant syncing')}
                {mode === 'forgot-password' &&
                  (isAr ? 'سنرسل رابطاً آمناً لإعادة تعيين كلمة المرور' : 'We will email you a secure link to reset your password')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Auth (Google 1-Click) */}
          {mode !== 'forgot-password' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {/* Google Multicolor Vector Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isAr ? 'المتابعة باستخدام حساب Google' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {isAr ? 'أو عبر البريد الإلكتروني' : 'Or with email'}
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name for SignUp */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الاسم الكامل أو اسم العرض:' : 'Full Name or Display Name:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dir-ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot-password')}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جارِ المعالجة...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  {mode === 'login' && <LogIn className="w-4 h-4" />}
                  {mode === 'signup' && <UserPlus className="w-4 h-4" />}
                  {mode === 'forgot-password' && <KeyRound className="w-4 h-4" />}
                  <span>
                    {mode === 'login' && (isAr ? 'تسجيل الدخول' : 'Sign In')}
                    {mode === 'signup' && (isAr ? 'إنشاء الحساب ومزامنة الرموز' : 'Create Cloud Account')}
                    {mode === 'forgot-password' && (isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Quick Anonymous Guest Login */}
          {mode !== 'forgot-password' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'أو تابع كزائر مؤقت (دخول سريع كضيف)' : 'Or continue as guest (Quick access)'}</span>
              </button>
            </div>
          )}

          {/* Mode Switch Footers */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
            {mode === 'login' && (
              <p>
                {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isAr ? 'إنشاء حساب جديد مجاناً' : 'Sign up free'}
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isAr ? 'تسجيل الدخول هنا' : 'Sign in here'}
                </button>
              </p>
            )}

            {mode === 'forgot-password' && (
              <p>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</span>
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
