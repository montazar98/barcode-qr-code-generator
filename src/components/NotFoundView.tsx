import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Home,
  QrCode,
  Barcode,
  Sparkles,
  Scan,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Search,
  HelpCircle,
  RefreshCw,
  Compass,
  FileQuestion,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppLanguage, AppTab } from '../types';

interface NotFoundViewProps {
  lang: AppLanguage;
  onNavigateHome: () => void;
  onNavigateToTab: (tab: AppTab) => void;
  missingUrl?: string;
  customReason?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  lang,
  onNavigateHome,
  onNavigateToTab,
  missingUrl,
  customReason,
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showSoft404Guide, setShowSoft404Guide] = useState(false);

  // SEO: Update page title and set noindex, nofollow meta tag to prevent Soft 404 penalties
  useEffect(() => {
    const originalTitle = document.title;
    document.title = isAr ? '404 - لم يتم العثور على الصفحة | باركودي' : '404 - Page Not Found | Barcodey';

    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !metaRobots;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    const previousContent = metaRobots.getAttribute('content');
    metaRobots.setAttribute('content', 'noindex, nofollow');

    return () => {
      document.title = originalTitle;
      if (metaRobots) {
        if (created) {
          metaRobots.remove();
        } else if (previousContent) {
          metaRobots.setAttribute('content', previousContent);
        } else {
          metaRobots.removeAttribute('content');
        }
      }
    };
  }, [isAr]);

  const quickTools = [
    {
      id: 'qr' as AppTab,
      title: isAr ? 'مولد رمز QR' : 'QR Code Generator',
      desc: isAr ? 'توليد رموز استجابة سريعة للروابط والواي فاي وبطاقات الأعمال' : 'Create QR codes for URLs, WiFi, and vCards',
      icon: <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badge: isAr ? 'شائع' : 'Popular',
    },
    {
      id: 'dynamic_qr' as AppTab,
      title: isAr ? 'QR ديناميكي ذكي' : 'Dynamic QR Codes',
      desc: isAr ? 'روابط ذكية قابلة للتعديل والتتبع في أي وقت بعد الطباعة' : 'Editable target URLs with real-time scan analytics',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      badge: isAr ? 'ذكي' : 'Smart',
    },
    {
      id: 'barcode' as AppTab,
      title: isAr ? 'مولد الباركود' : 'Barcode Generator',
      desc: isAr ? 'توليد باركود المنتجات (Code 128, EAN-13, UPC) بجودة طباعة عالية' : 'Generate retail & product barcodes (EAN-13, Code 128)',
      icon: <Barcode className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    },
    {
      id: 'scanner' as AppTab,
      title: isAr ? 'الماسح الضوئي' : 'Code Scanner',
      desc: isAr ? 'قراءة وتحليل الباركود ورموز QR عبر الكاميرا أو رفع الصور' : 'Scan & decode QR and barcodes via camera or image upload',
      icon: <Scan className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
    {
      id: 'articles' as AppTab,
      title: isAr ? 'دليل المقالات والشروحات' : 'Guides & Articles',
      desc: isAr ? 'شروحات ونصائح احترافية لاستخدام الباركود وتصميم الرموز' : 'Comprehensive tutorials on QR codes, barcodes, and print setups',
      icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
  ];

  const filteredTools = quickTools.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
  });

  const displayUrl = missingUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/404');

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        
        {/* Main Error Banner & Graphical Badge */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-50/80 via-white to-white dark:from-slate-850 dark:via-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xl shadow-indigo-500/5">
          
          {/* Subtle Background Glows */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Icon with Error Badge */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <FileQuestion className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.5]" />
            </div>
            <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-red-500 text-white font-black text-xs sm:text-sm tracking-wider shadow-md uppercase">
              404
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-3 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'لم يتم العثور على الصفحة (404)' : 'Page Not Found (404 Error)'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {customReason ||
                (isAr
                  ? 'عذراً، الصفحة أو الرابط الذي تبحث عنه غير موجود حالياً، أو ربما تم حذفه أو نقله إلى مسار آخر.'
                  : 'Sorry, the page or resource you are looking for does not exist, has been moved, or has expired.')}
            </p>
          </div>

          {/* Requested Path Box */}
          {displayUrl && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-mono text-xs max-w-full overflow-x-auto border border-slate-200 dark:border-slate-700/60">
              <span className="text-indigo-500 font-semibold">{isAr ? 'المسار المطلوب:' : 'Requested URL:'}</span>
              <span className="truncate">{displayUrl}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>{isAr ? 'العودة إلى الرئيسية' : 'Return to Home'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('qr')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-sm inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'توليد رمز QR' : 'Create QR Code'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('articles')}
              className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-sm inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>{isAr ? 'تصفح المقالات' : 'Browse Guides'}</span>
            </button>
          </div>
        </div>

        {/* Search within the site */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'هل تبحث عن إحدى أدواتنا؟' : 'Looking for one of our tools?'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'اختر الأداة المطلوبة من القائمة أدناه أو ابحث بالاسم:'
                  : 'Quickly access any generator or scanner tool below:'}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن أداة (مثل: باركود، واي فاي، EAN-13، مسح...)' : 'Search tools (e.g. Barcode, WiFi, vCard, Scanner...)'}
              className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onNavigateToTab(tool.id)}
                className="group p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/80 text-start flex items-start gap-3.5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.title}
                    </span>
                    {tool.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                {isAr ? (
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all shrink-0 self-center" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 self-center" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Soft 404 Educational & Technical Guide (SEO / Webmaster Accordion) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden shadow-sm">
          <button
            onClick={() => setShowSoft404Guide(!showSoft404Guide)}
            className="w-full p-4.5 flex items-center justify-between text-start hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {isAr ? 'ما هو خطأ 404 و Soft 404؟ ولماذا يحدث؟' : 'What is a 404 & Soft 404 Error? Why does it happen?'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'إرشادات تقنية وتوضيحية للزوار ومحركات البحث' : 'Technical guidance for visitors and web search engines'}
                </p>
              </div>
            </div>
            {showSoft404Guide ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {showSoft404Guide && (
            <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{isAr ? 'خطأ 404 الحقيقي (Hard 404)' : 'Standard 404 (Hard 404)'}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'يحدث عندما يطلب المتصفح ملفاً أو مساراً غير موجود نهائياً على الخادم، فيعيد الخادم رمز الحالة 404 Not Found رسمياً ليعلم محرك البحث بعدم فهرسته.'
                      : 'Occurs when the server officially returns HTTP Status 404 Not Found for a missing path or resource, instructing search crawlers not to index it.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{isAr ? 'خطأ Soft 404' : 'Soft 404 Error'}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'يحدث عندما تكون الصفحة تفتقر للمحتوى أو منتهية الصلاحية ولكن الخادم يرسل رمز 200 OK بدلاً من 404. يمنع نظامنا هذا الخطأ عبر توفير ترويسات NOINDEX ومسارات واضحة.'
                      : 'Occurs when a page displays missing-content message but returns 200 OK. Our system guards against soft 404s via clean canonical routes and noindex tags.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr
                    ? 'إذا كنت قادماً من رمز QR ديناميكي مطبوع، فقد يكون صاحب الرمز قد عطل الرابط أو غيره من لوحة التحكم الخاصة به.'
                    : 'If you scanned a printed dynamic QR code, the owner may have paused or deleted the campaign target.'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
