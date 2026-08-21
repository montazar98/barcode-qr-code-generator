import React from 'react';
import { QrCode, Barcode, Layers, Scan, History, BookOpen, Languages, Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { AdminSettings, AppLanguage, AppTab, CloudSavedCode } from '../types';
import { translations } from '../constants/translations';
import { User as FirebaseUser } from 'firebase/auth';
import { UserMenu } from './auth/UserMenu';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  savedCount: number;
  settings: AdminSettings;
  onOpenAdminLogin: () => void;
  currentUser: FirebaseUser | null;
  cloudCodes: CloudSavedCode[];
  onOpenAuthModal: (mode?: 'login' | 'signup') => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isDark,
  setIsDark,
  savedCount,
  settings,
  onOpenAdminLogin,
  currentUser,
  cloudCodes,
  onOpenAuthModal,
  onOpenProfileModal,
}) => {
  const t = translations[lang];

  const allTabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: number | string; enabled: boolean }[] = [
    { id: 'qr', label: t.tabs.qr, icon: <QrCode className="w-4 h-4" />, enabled: settings.enableQrGenerator },
    {
      id: 'dynamic_qr',
      label: lang === 'ar' ? 'QR ديناميكي' : 'Dynamic QR',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: lang === 'ar' ? 'ذكي' : 'Smart',
      enabled: true,
    },
    { id: 'barcode', label: t.tabs.barcode, icon: <Barcode className="w-4 h-4" />, enabled: settings.enableBarcodeGenerator },
    { id: 'batch', label: t.tabs.batch, icon: <Layers className="w-4 h-4" />, enabled: settings.enableBatchGenerator },
    { id: 'scanner', label: t.tabs.scanner, icon: <Scan className="w-4 h-4" />, enabled: settings.enableScanner },
    {
      id: 'history',
      label: t.tabs.history,
      icon: <History className="w-4 h-4" />,
      badge: savedCount > 0 ? savedCount : undefined,
      enabled: settings.enableHistory,
    },
    {
      id: 'articles',
      label: t.tabs.articles,
      icon: <BookOpen className="w-4 h-4" />,
      badge: settings.articles && settings.articles.filter((a) => a.isPublished).length > 0
        ? settings.articles.filter((a) => a.isPublished).length
        : undefined,
      enabled: settings.enableArticles !== false,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.enabled);

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {settings.customLogoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                <img
                  src={settings.customLogoUrl}
                  alt={lang === 'ar' ? settings.siteNameAr || settings.siteName : settings.siteNameEn || settings.siteName}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <QrCode className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {lang === 'ar'
                    ? settings.siteNameAr || settings.siteName || t.appName
                    : settings.siteNameEn || settings.siteName || t.appName}
                </h1>
                {settings.siteBadgeText !== '' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                    {settings.siteBadgeText || 'PRO'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {lang === 'ar'
                  ? settings.siteSubtitleAr || t.appSubTitle
                  : settings.siteSubtitleEn || t.appSubTitle}
              </p>
            </div>
          </div>

          {/* Right Action Tools: User Auth, Language, Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Firebase Auth User Menu / Sign In Button */}
            <UserMenu
              user={currentUser}
              cloudCodes={cloudCodes}
              lang={lang}
              onOpenAuthModal={onOpenAuthModal}
              onOpenProfileModal={onOpenProfileModal}
              onOpenCloudCodesTab={() => setActiveTab('history')}
            />

            {/* Language switch */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="تغيير اللغة / Change Language"
            >
              <Languages className="w-4 h-4 text-indigo-500" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Admin Login Quick Link Button */}
            <button
              onClick={onOpenAdminLogin}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title={lang === 'ar' ? 'بوابة المشرف ولوحة التحكم (/admin)' : 'Admin Control Panel Portal (/admin)'}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {visibleTabs.length > 0 && (
          <div className="flex items-center space-x-1 space-x-reverse overflow-x-auto pb-2 scrollbar-none">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
