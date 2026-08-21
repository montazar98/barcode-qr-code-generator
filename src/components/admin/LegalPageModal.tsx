import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Info,
  Mail,
  X,
  Copy,
  Check,
  Code2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { AdminSettings, AppLanguage, LegalPageType } from '../../types';

interface LegalPageModalProps {
  pageType: LegalPageType | null;
  onClose: () => void;
  settings: AdminSettings;
  lang: AppLanguage;
}

export const LegalPageModal: React.FC<LegalPageModalProps> = ({
  pageType,
  onClose,
  settings,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  if (!pageType) return null;

  const isAr = lang === 'ar';

  const customPage = settings.customPages?.find((p) => p.id === pageType);

  const titles: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
    privacy: {
      ar: 'سياسة الخصوصية (Privacy Policy)',
      en: 'Privacy Policy',
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
    },
    terms: {
      ar: 'شروط الاستخدام (Terms of Service)',
      en: 'Terms of Service',
      icon: <FileText className="w-5 h-5 text-blue-500" />,
    },
    about: {
      ar: 'من نحن (About Us)',
      en: 'About Us',
      icon: <Info className="w-5 h-5 text-indigo-500" />,
    },
    contact: {
      ar: 'اتصل بنا (Contact Us)',
      en: 'Contact Us',
      icon: <Mail className="w-5 h-5 text-amber-500" />,
    },
    adsTxt: {
      ar: 'ملف ads.txt الرسمي للعلامة التجارية',
      en: 'Official ads.txt File',
      icon: <Code2 className="w-5 h-5 text-purple-500" />,
    },
    disclaimer: {
      ar: 'إخلاء المسؤولية (Disclaimer)',
      en: 'Disclaimer',
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
    },
  };

  const pageMeta = customPage
    ? {
        title: isAr ? customPage.titleAr || customPage.titleEn : customPage.titleEn || customPage.titleAr,
        icon: <FileText className="w-5 h-5 text-indigo-500" />,
      }
    : titles[pageType]
    ? {
        title: isAr ? titles[pageType].ar : titles[pageType].en,
        icon: titles[pageType].icon,
      }
    : {
        title: pageType,
        icon: <FileText className="w-5 h-5 text-slate-500" />,
      };

  const getContent = () => {
    if (customPage) {
      return isAr ? customPage.contentAr || customPage.contentEn : customPage.contentEn || customPage.contentAr;
    }
    switch (pageType) {
      case 'privacy':
        return isAr ? settings.privacyPolicyAr : settings.privacyPolicyEn;
      case 'terms':
        return isAr ? settings.termsOfServiceAr : settings.termsOfServiceEn;
      case 'about':
        return isAr ? settings.aboutUsAr : settings.aboutUsEn;
      case 'disclaimer':
        return isAr ? settings.disclaimerAr : settings.disclaimerEn;
      case 'adsTxt':
        return settings.adsTxtContent;
      default:
        return '';
    }
  };

  const handleCopyAdsTxt = () => {
    navigator.clipboard.writeText(settings.adsTxtContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {pageMeta.icon}
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {pageMeta.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {settings.siteName} • {isAr ? 'صفحات ومستندات الموقع' : 'Site Pages & Documents'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {pageType === 'contact' ? (
            <div>
              {contactSubmitted ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    {isAr ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent!'}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {isAr
                      ? `شكراً لتواصلك معنا. سنرد عليك على بريدك الإلكتروني قريباً.`
                      : `Thank you for contacting us. We will respond to your email shortly.`}
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
                  >
                    {isAr ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? `يمكنك التواصل مع فريق إدارة الموقع مباشرة لمزيد من الاستفسارات أو حول حقوق الخصوصية والعلانات عبر البريد: ${settings.contactEmail}`
                      : `You can reach out to our team directly regarding privacy or advertising inquiries via email: ${settings.contactEmail}`}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'الاسم' : 'Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        placeholder={isAr ? 'أدخل اسمك' : 'Your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm dir-ltr"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'موضوع الرسالة' : 'Subject'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      placeholder={isAr ? 'موضوع الاستفسار' : 'Inquiry subject'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'نص الرسالة' : 'Message'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                    {isAr ? 'إرسال الرسالة' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          ) : pageType === 'adsTxt' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'ملف ads.txt مطلوب من قِبل Google AdSense لربط حسابت الناشرين ومنع الاحتيال الإعلاني. يمكنك نسخ هذا النص ورفعه في جذور نطاقك (root domain).'
                  : 'The ads.txt file is required by Google AdSense to authorize publishers and prevent advertising fraud. Copy and place this file at your root domain.'}
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
                  {settings.adsTxtContent}
                </pre>
                <button
                  onClick={handleCopyAdsTxt}
                  className="absolute top-2 left-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}
                </button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-line leading-relaxed font-sans">
              {getContent()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-sm"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
