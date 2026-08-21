import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, FileText } from 'lucide-react';
import { AppLanguage, LegalPageType } from '../../types';

interface CookieConsentBannerProps {
  enabled: boolean;
  textAr: string;
  textEn: string;
  lang: AppLanguage;
  onOpenLegalPage: (page: LegalPageType) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  enabled,
  textAr,
  textEn,
  lang,
  onOpenLegalPage,
}) => {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cookie_consent_accepted');
      if (saved === 'true') {
        setAccepted(true);
      } else {
        setAccepted(false);
      }
    } catch (e) {
      setAccepted(false);
    }
  }, []);

  if (!enabled || accepted) return null;

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie_consent_accepted', 'true');
    } catch (e) {}
    setAccepted(true);
  };

  const isAr = lang === 'ar';
  const text = isAr ? textAr : textEn;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-100 shadow-2xl animate-fade-in-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>{text}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <button
                onClick={() => onOpenLegalPage('privacy')}
                className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                {isAr ? 'سياسة الخصوصية و Google AdSense' : 'Privacy Policy & Google AdSense'}
              </button>
              <span>•</span>
              <button
                onClick={() => onOpenLegalPage('terms')}
                className="text-slate-400 hover:text-slate-300 underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            {isAr ? 'موافق وقبول جميع الكوكيز' : 'Accept All Cookies'}
          </button>
        </div>
      </div>
    </div>
  );
};
