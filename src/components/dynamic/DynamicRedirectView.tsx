import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  QrCode,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { AppLanguage } from '../../types';
import { recordDynamicQRScan, getDynamicQRDirect } from '../../lib/firebase';

interface DynamicRedirectViewProps {
  code: string;
  lang: AppLanguage;
  onNotFound: () => void;
  onNavigateHome: () => void;
}

export const DynamicRedirectView: React.FC<DynamicRedirectViewProps> = ({
  code,
  lang,
  onNotFound,
  onNavigateHome,
}) => {
  const isAr = lang === 'ar';
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const resolveDynamicCode = async () => {
      if (!code || !code.trim()) {
        onNotFound();
        return;
      }

      try {
        // 1. Fetch from Firestore / Server
        const qrData = await getDynamicQRDirect(code.trim());

        if (isCancelled) return;

        if (!qrData || !qrData.targetUrl) {
          setStatus('error');
          setErrorMessage(
            isAr
              ? 'رمز QR الديناميكي المطلوب غير موجود أو تم حذفه من قِبل صاحبه.'
              : 'The requested dynamic QR code was not found or has been deleted.'
          );
          setTimeout(() => {
            if (!isCancelled) onNotFound();
          }, 2000);
          return;
        }

        if (qrData.isActive === false) {
          setStatus('error');
          setErrorMessage(
            isAr
              ? 'تم تعطيل هذا الرابط الديناميكي مؤقتاً من قِبل منشئه.'
              : 'This dynamic QR link has been temporarily disabled by its creator.'
          );
          return;
        }

        let destination = qrData.targetUrl.trim();
        if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
          destination = 'https://' + destination;
        }

        setTargetUrl(destination);
        setQrTitle(qrData.title || (isAr ? 'رابط ديناميكي' : 'Dynamic Link'));
        setStatus('redirecting');

        // 2. Record scan count in background (non-blocking)
        recordDynamicQRScan(code.trim()).catch((err) => {
          console.warn('Scan count recording noticed:', err);
        });

        // 3. Perform immediate redirect
        const timer = setTimeout(() => {
          if (!isCancelled) {
            window.location.replace(destination);
          }
        }, 400);

        return () => clearTimeout(timer);
      } catch (err: any) {
        console.error('Error resolving dynamic QR:', err);
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(
            isAr
              ? 'حدث خطأ أثناء فك تشفير الرابط الديناميكي. يرجى المحاولة لاحقاً.'
              : 'An error occurred while resolving dynamic destination.'
          );
        }
      }
    };

    resolveDynamicCode();

    return () => {
      isCancelled = true;
    };
  }, [code, isAr, onNotFound]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-radial from-indigo-600/15 via-transparent to-transparent opacity-60 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative z-10 space-y-6">
        
        {/* Animated Icon Box */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <QrCode className="w-10 h-10 animate-pulse" />
          </div>
          {status === 'redirecting' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {status === 'error' && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Title & Status */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>{isAr ? 'توجيه آمن عبر باركودي' : 'Secure Dynamic Redirection'}</span>
          </h1>

          {qrTitle && (
            <p className="text-xs font-semibold text-indigo-300 truncate max-w-xs mx-auto">
              {qrTitle}
            </p>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            {status === 'loading'
              ? isAr
                ? 'جارِ التحقق من الرابط المستهدف وتسجيل إحصائية المسح...'
                : 'Verifying destination link and logging scan metrics...'
              : status === 'redirecting'
              ? isAr
                ? 'جارِ تحويلك إلى الموقع المستهدف الآن...'
                : 'Redirecting to target destination now...'
              : errorMessage}
          </p>
        </div>

        {/* Target URL Preview & Loading Indicator */}
        {status === 'redirecting' && targetUrl && (
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-start space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isAr ? 'الوجهة المستهدفة:' : 'Destination:'}
            </span>
            <div className="text-xs font-mono text-indigo-300 truncate flex items-center gap-1.5" dir="ltr">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{targetUrl}</span>
            </div>
          </div>
        )}

        {/* Progress Spinner or Manual Fallback Link */}
        {status !== 'error' ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isAr ? 'جارِ التحويل التلقائي...' : 'Redirecting automatically...'}</span>
            </div>

            {targetUrl && (
              <a
                href={targetUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>{isAr ? 'اضغط هنا إذا لم يتم التحويل' : 'Click here if not redirected'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
