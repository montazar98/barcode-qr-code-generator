import React, { useState, useEffect } from 'react';
import {
  AdminSettings,
  AppLanguage,
  AppTab,
  BarcodeStyleOptions,
  CodeHistoryItem,
  CloudSavedCode,
  LegalPageType,
  QRStyleOptions,
} from './types';
import { Header } from './components/Header';
import { QRGenerator } from './components/QRGenerator';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { BatchGenerator } from './components/BatchGenerator';
import { Scanner } from './components/Scanner';
import { HistoryList } from './components/HistoryList';
import { ArticlesView } from './components/ArticlesView';
import { DynamicQRManager } from './components/dynamic/DynamicQRManager';
import {
  getAdminSettings,
  saveAdminSettings,
  resetAdminSettings,
} from './utils/adminSettings';
import { applyHeadMetadata } from './utils/seoHelper';
import { trackVisit } from './utils/analytics';
import { isCurrentUrlMatchingAdminRoute } from './utils/security';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { CookieConsentBanner } from './components/admin/CookieConsentBanner';
import { LegalPageModal } from './components/admin/LegalPageModal';
import { AdBanner } from './components/admin/AdBanner';
import { MaintenanceView } from './components/admin/MaintenanceView';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  saveCodeToCloud,
  deleteCodeFromCloud,
  subscribeToSavedCodes,
  logConversion,
} from './lib/firebase';

import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { NotFoundView } from './components/NotFoundView';
import { LoginPage } from './components/auth/LoginPage';
import { DynamicRedirectView } from './components/dynamic/DynamicRedirectView';
import { AdminLoginPage } from './components/admin/AdminLoginPage';

export default function App() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getAdminSettings());
  const [activeTab, setActiveTab] = useState<AppTab>('qr');
  const [lang, setLang] = useState<AppLanguage>('ar');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Current view mode: 'main', 'admin', 'admin_login', '404', 'login', or 'dynamic_redirect'
  const [currentView, setCurrentView] = useState<
    'main' | 'admin' | 'admin_login' | '404' | 'login' | 'dynamic_redirect'
  >('main');
  const [redirectCode, setRedirectCode] = useState<string>('');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [cloudCodes, setCloudCodes] = useState<CloudSavedCode[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Admin Auth Modals State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageType | null>(null);

  const [history, setHistory] = useState<CodeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('barcode_qr_studio_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Firebase Auth State Listener & Real-time Cloud Codes Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time saved codes when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setCloudCodes([]);
      return;
    }

    const unsubscribeCodes = subscribeToSavedCodes(currentUser.uid, (codes) => {
      setCloudCodes(codes);
    });

    return () => unsubscribeCodes();
  }, [currentUser]);

  // Check URL path, query, or hash for dedicated routes (Login, Dynamic QR, 404, Admin)
  useEffect(() => {
    const checkAppRoutes = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      // 1. Check Admin Login Dedicated Routes (/admin, /admin-login, #/admin, #admin, #/admin-login, ?page=admin)
      if (
        path === '/admin' ||
        path === '/admin-login' ||
        path === '/admin/login' ||
        path === '/dashboard/login' ||
        hash === '#/admin' ||
        hash === '#admin' ||
        hash === '#/admin-login' ||
        hash === '#admin-login' ||
        search.includes('page=admin') ||
        search.includes('view=admin')
      ) {
        setCurrentView('admin_login');
        return;
      }

      // 2. Check User Login routes (/login, /auth, #/login, #login, #/auth, ?page=login)
      if (
        path === '/login' ||
        path === '/auth' ||
        hash === '#/login' ||
        hash === '#login' ||
        hash === '#/auth' ||
        hash === '#auth' ||
        search.includes('page=login') ||
        search.includes('view=login')
      ) {
        setCurrentView('login');
        return;
      }

      // 3. Check Dynamic QR redirect routes (/q/:code, /r/:code, #/q/:code, #/r/:code, #q/:code)
      const qMatch =
        window.location.pathname.match(/^\/(?:q|r|d|scan)\/([a-zA-Z0-9_-]+)/i) ||
        window.location.hash.match(/^#\/?(?:q|r|d|scan)\/([a-zA-Z0-9_-]+)/i);
      if (qMatch && qMatch[1]) {
        setRedirectCode(qMatch[1]);
        setCurrentView('dynamic_redirect');
        return;
      }

      // 4. Check 404 routes (/404, /not-found, #404, #/404, #not-found)
      if (
        path === '/404' ||
        path === '/not-found' ||
        hash === '#404' ||
        hash === '#/404' ||
        hash === '#not-found'
      ) {
        setCurrentView('404');
        return;
      }

      // 5. Default to main if on root path without hash or special routes
      if (
        (currentView === 'login' || currentView === 'admin_login') &&
        !hash.includes('login') &&
        !hash.includes('admin') &&
        !path.includes('login') &&
        !path.includes('admin') &&
        !search.includes('login') &&
        !search.includes('admin')
      ) {
        setCurrentView('main');
      }
    };

    checkAppRoutes();
    window.addEventListener('hashchange', checkAppRoutes);
    window.addEventListener('popstate', checkAppRoutes);
    return () => {
      window.removeEventListener('hashchange', checkAppRoutes);
      window.removeEventListener('popstate', checkAppRoutes);
    };
  }, [currentView]);

  // Check URL query parameters or hash for admin entry (Strictly matching the single configured secret URL)
  useEffect(() => {
    const checkAdminUrlAccess = () => {
      if (isCurrentUrlMatchingAdminRoute(adminSettings)) {
        setIsAdminLoginOpen(true);
      }
    };

    checkAdminUrlAccess();
    window.addEventListener('hashchange', checkAdminUrlAccess);
    window.addEventListener('popstate', checkAdminUrlAccess);
    return () => {
      window.removeEventListener('hashchange', checkAdminUrlAccess);
      window.removeEventListener('popstate', checkAdminUrlAccess);
    };
  }, [
    adminSettings.secretKey,
    adminSettings.secretParamName,
    adminSettings.secretAccessType,
    adminSettings.secretSlug,
  ]);

  // Keyboard shortcut (Ctrl+Shift+A or Cmd+Shift+A) to trigger Admin Login
  useEffect(() => {
    if (adminSettings.enableKeyboardShortcut === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminSettings.enableKeyboardShortcut]);

  // Inactivity Auto-Logout when Admin Dashboard is active
  useEffect(() => {
    if (currentView !== 'admin') return;

    const timeoutMinutes = adminSettings.sessionTimeoutMinutes || 20;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setCurrentView('main');
      }, timeoutMs);
    };

    resetInactivityTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer));

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [currentView, adminSettings.sessionTimeoutMinutes]);

  // Update document title, meta tags, schema.org JSON-LD, and Favicon dynamically
  useEffect(() => {
    applyHeadMetadata(adminSettings, lang);
  }, [adminSettings, lang]);

  // Automatically track visitor country & page entrance
  useEffect(() => {
    if (adminSettings.enableAnalytics !== false) {
      trackVisit(window.location.pathname || '/');
    }
  }, [adminSettings.enableAnalytics]);

  // Auto-inject AdSense Script if Publisher ID is configured
  useEffect(() => {
    const rawId = (adminSettings.adsenseClientId || '').trim();
    if (rawId) {
      const formattedClientId = rawId.startsWith('ca-pub-')
        ? rawId
        : rawId.startsWith('pub-')
        ? `ca-${rawId}`
        : `ca-pub-${rawId}`;

      const scriptId = 'google-adsense-script';
      let existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
      const targetSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formattedClientId}`;

      if (!existingScript) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = targetSrc;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      } else if (existingScript.src !== targetSrc) {
        existingScript.src = targetSrc;
      }
    }
  }, [adminSettings.adsenseClientId]);

  // Handle dark mode class toggle on document HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle document dir attribute for RTL / LTR
  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('barcode_qr_studio_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Auto fallback if activeTab gets disabled by admin
  useEffect(() => {
    const isQrEnabled = adminSettings.enableQrGenerator;
    const isBarcodeEnabled = adminSettings.enableBarcodeGenerator;
    const isBatchEnabled = adminSettings.enableBatchGenerator;
    const isScannerEnabled = adminSettings.enableScanner;
    const isHistoryEnabled = adminSettings.enableHistory;

    if (activeTab === 'qr' && !isQrEnabled) {
      if (isBarcodeEnabled) setActiveTab('barcode');
      else if (isBatchEnabled) setActiveTab('batch');
      else if (isScannerEnabled) setActiveTab('scanner');
      else if (isHistoryEnabled) setActiveTab('history');
    } else if (activeTab === 'barcode' && !isBarcodeEnabled) {
      if (isQrEnabled) setActiveTab('qr');
      else if (isBatchEnabled) setActiveTab('batch');
      else if (isScannerEnabled) setActiveTab('scanner');
    } else if (activeTab === 'batch' && !isBatchEnabled) {
      if (isQrEnabled) setActiveTab('qr');
      else if (isBarcodeEnabled) setActiveTab('barcode');
    } else if (activeTab === 'scanner' && !isScannerEnabled) {
      if (isQrEnabled) setActiveTab('qr');
      else if (isBarcodeEnabled) setActiveTab('barcode');
    } else if (activeTab === 'history' && !isHistoryEnabled) {
      if (isQrEnabled) setActiveTab('qr');
    }
  }, [activeTab, adminSettings]);

  // Save item handler (Local)
  const handleSaveToHistory = (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    qrOptions?: QRStyleOptions | BarcodeStyleOptions
  ) => {
    const newItem: CodeHistoryItem = {
      id: Date.now().toString(),
      title,
      kind: activeTab === 'qr' ? 'qr' : 'barcode',
      subType,
      rawValue,
      previewDataUrl: dataUrl,
      createdAt: Date.now(),
    };

    setHistory((prev) => [newItem, ...prev.filter((x) => x.rawValue !== rawValue)]);

    // Automatically record conversion to log for admin & analytics
    logConversion({
      kind: newItem.kind,
      subType,
      rawValue,
      title,
      previewDataUrl: dataUrl,
      user: currentUser,
    }).catch((e) => console.warn('Conversion log notice:', e));

    // If user is logged in, auto-save to cloud too!
    if (currentUser) {
      saveCodeToCloud(currentUser.uid, {
        id: newItem.id,
        title,
        kind: newItem.kind,
        subType,
        rawValue,
        previewDataUrl: dataUrl,
        createdAt: newItem.createdAt,
      }).catch((e) => console.warn('Auto cloud sync notice:', e));
    }
  };

  // Explicit Save to Cloud Handler
  const handleSaveToCloud = async (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    options?: any
  ) => {
    if (!currentUser) {
      setAuthModalMode('login');
      setCurrentView('login');
      window.location.hash = '#/login';
      return;
    }

    try {
      const codeId = Date.now().toString();
      await saveCodeToCloud(currentUser.uid, {
        id: codeId,
        title: title || 'Saved Code',
        kind: activeTab === 'qr' ? 'qr' : 'barcode',
        subType: subType || 'default',
        rawValue,
        previewDataUrl: dataUrl,
        createdAt: Date.now(),
      });

      // Record conversion log
      logConversion({
        kind: activeTab === 'qr' ? 'qr' : 'barcode',
        subType: subType || 'default',
        rawValue,
        title: title || 'Saved Code',
        previewDataUrl: dataUrl,
        user: currentUser,
      }).catch((e) => console.warn('Conversion log notice:', e));
    } catch (err) {
      console.error('Failed to save to cloud:', err);
    }
  };


  // Delete Code from Cloud Firestore
  const handleDeleteCloudCode = async (codeId: string) => {
    if (!currentUser) return;
    try {
      await deleteCodeFromCloud(currentUser.uid, codeId);
    } catch (err) {
      console.error('Failed to delete cloud code:', err);
    }
  };

  // Sync All Local items to Cloud
  const handleSyncAllLocalToCloud = async () => {
    if (!currentUser || history.length === 0) return;
    for (const item of history) {
      try {
        await saveCodeToCloud(currentUser.uid, {
          id: item.id,
          title: item.title,
          kind: item.kind,
          subType: item.subType,
          rawValue: item.rawValue,
          previewDataUrl: item.previewDataUrl,
          createdAt: item.createdAt,
        });
      } catch (err) {
        console.error('Error syncing item to cloud:', err);
      }
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((x) => x.id !== id));
  };

  const handleSaveSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  const handleResetSettings = () => {
    const reset = resetAdminSettings();
    setAdminSettings(reset);
  };

  const isAr = lang === 'ar';

  // If Dedicated Login Page View is active (Standalone Page)
  if (currentView === 'login') {
    return (
      <LoginPage
        lang={lang}
        setLang={setLang}
        isDark={isDark}
        setIsDark={setIsDark}
        onNavigateHome={() => {
          setCurrentView('main');
          if (window.location.hash.includes('login')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onLoginSuccess={() => {
          setCurrentView('main');
          if (window.location.hash.includes('login')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        initialMode={authModalMode}
      />
    );
  }

  // If Dynamic Redirect View is active (Standalone Page)
  if (currentView === 'dynamic_redirect') {
    return (
      <DynamicRedirectView
        code={redirectCode}
        lang={lang}
        onNotFound={() => setCurrentView('404')}
        onNavigateHome={() => {
          setCurrentView('main');
          window.history.replaceState(null, '', '/');
        }}
      />
    );
  }

  // If Dedicated Admin Login Page View is active (Standalone Page)
  if (currentView === 'admin_login') {
    return (
      <AdminLoginPage
        settings={adminSettings}
        lang={lang}
        setLang={setLang}
        isDark={isDark}
        setIsDark={setIsDark}
        onLoginSuccess={() => {
          setCurrentView('admin');
          if (window.location.hash.includes('admin')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onNavigateHome={() => {
          setCurrentView('main');
          if (window.location.hash.includes('admin')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // If Admin Dashboard View is active (Standalone Page)
  if (currentView === 'admin') {
    return (
      <>
        <AdminDashboardPage
          settings={adminSettings}
          onSaveSettings={handleSaveSettings}
          onResetSettings={handleResetSettings}
          lang={lang}
          setLang={setLang}
          isDark={isDark}
          setIsDark={setIsDark}
          onOpenLegalPage={(page) => setActiveLegalPage(page)}
          onLogout={() => setCurrentView('main')}
          onReturnToHome={() => setCurrentView('main')}
        />

        {/* Legal Pages Modal when previewed */}
        <LegalPageModal
          pageType={activeLegalPage}
          onClose={() => setActiveLegalPage(null)}
          settings={adminSettings}
          lang={lang}
        />
      </>
    );
  }

  // Render Maintenance Mode if enabled
  if (adminSettings.maintenanceMode) {
    return (
      <>
        <MaintenanceView
          message={adminSettings.maintenanceMessage}
          lang={lang}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
        />
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={() => {
            setIsAdminLoginOpen(false);
            setCurrentView('admin');
          }}
          settings={adminSettings}
          lang={lang}
        />
      </>
    );
  }

  // Check if all core features are disabled
  const noFeaturesEnabled =
    !adminSettings.enableQrGenerator &&
    !adminSettings.enableBarcodeGenerator &&
    !adminSettings.enableBatchGenerator &&
    !adminSettings.enableScanner &&
    !adminSettings.enableHistory &&
    !adminSettings.enableArticles;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        isDark={isDark}
        setIsDark={setIsDark}
        savedCount={history.length + cloudCodes.length}
        settings={adminSettings}
        onOpenAdminLogin={() => {
          setCurrentView('admin_login');
          window.location.hash = '#/admin';
        }}
        currentUser={currentUser}
        cloudCodes={cloudCodes}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode || 'login');
          setCurrentView('login');
          window.location.hash = '#/login';
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Top Header Ad Banner (AdSense Header Unit) */}
      <AdBanner
        enabled={adminSettings.enableHeaderAd}
        codeHtml={adminSettings.headerAdCode}
        clientId={adminSettings.adsenseClientId}
        position="header"
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentView === '404' ? (
          <NotFoundView
            lang={lang}
            onNavigateHome={() => {
              setCurrentView('main');
              setActiveTab('qr');
              if (window.location.hash.toLowerCase().includes('404')) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
            onNavigateToTab={(tab) => {
              setCurrentView('main');
              setActiveTab(tab);
              if (window.location.hash.toLowerCase().includes('404')) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
          />
        ) : noFeaturesEnabled ? (
          <div className="text-center py-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {isAr ? 'جميع المميزات معطلة حالياً' : 'All features are currently disabled'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تم إيقاف تشغيل أدوات الموقع مؤقتاً بواسطة المشرف. يمكنك الدخول للوحة التحكم لإعادة تفعيل الميزات.'
                : 'Site utilities have been temporarily disabled by the administrator.'}
            </p>
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <Lock className="w-4 h-4" />
              {isAr ? 'دخول لوحة التحكم لتفعيل الميزات' : 'Admin Control Panel'}
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'qr' && adminSettings.enableQrGenerator && (
              <QRGenerator
                lang={lang}
                onSaveToHistory={handleSaveToHistory}
                onSaveToCloud={handleSaveToCloud}
              />
            )}

            {activeTab === 'dynamic_qr' && (
              <DynamicQRManager
                lang={lang}
                currentUser={currentUser}
                onOpenAuthModal={(mode) => {
                  setAuthModalMode(mode || 'login');
                  setCurrentView('login');
                  window.location.hash = '#/login';
                }}
                onLogConversion={(rawVal, title, preview) => {
                  logConversion({
                    kind: 'qr',
                    subType: 'dynamic_url',
                    rawValue: rawVal,
                    title,
                    previewDataUrl: preview,
                    user: currentUser,
                  });
                }}
              />
            )}

            {activeTab === 'barcode' && adminSettings.enableBarcodeGenerator && (
              <BarcodeGenerator
                lang={lang}
                onSaveToHistory={handleSaveToHistory}
                onSaveToCloud={handleSaveToCloud}
              />
            )}

            {activeTab === 'batch' && adminSettings.enableBatchGenerator && (
              <BatchGenerator lang={lang} />
            )}

            {activeTab === 'scanner' && adminSettings.enableScanner && (
              <Scanner lang={lang} />
            )}

            {activeTab === 'history' && adminSettings.enableHistory && (
              <HistoryList
                history={history}
                cloudCodes={cloudCodes}
                currentUser={currentUser}
                lang={lang}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                onDeleteCloudCode={handleDeleteCloudCode}
                onOpenAuthModal={(mode) => {
                  setAuthModalMode(mode || 'login');
                  setCurrentView('login');
                  window.location.hash = '#/login';
                }}
                onSyncAllLocalToCloud={handleSyncAllLocalToCloud}
              />
            )}

            {activeTab === 'articles' && adminSettings.enableArticles !== false && (
              <ArticlesView
                articles={adminSettings.articles || []}
                lang={lang}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                siteName={adminSettings.siteName || (isAr ? 'باركودي' : 'Barcodey')}
              />
            )}
          </>
        )}

        {/* In-Content AdSense Unit */}
        <AdBanner
          enabled={adminSettings.enableInContentAd}
          codeHtml={adminSettings.inContentAdCode}
          clientId={adminSettings.adsenseClientId}
          position="inContent"
        />
      </main>

      {/* Footer Banner Ad Unit */}
      <AdBanner
        enabled={adminSettings.enableFooterAd}
        codeHtml={adminSettings.footerAdCode}
        clientId={adminSettings.adsenseClientId}
        position="footer"
      />

      {/* Footer & AdSense Compliance Links */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {adminSettings.siteName || (isAr ? 'باركودي' : 'Barcodey')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAr
                  ? 'أداة احترافية ومجانية 100% لتوليد وقراءة وتخصيص رموز QR والباركود بدقة عالية وبأمان تام محلياً.'
                  : 'Pro 100% free tool for generating and scanning QR codes and barcodes locally with maximum security.'}
              </p>
            </div>

            {/* AdSense Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              <button
                onClick={() => setActiveLegalPage('privacy')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveLegalPage('terms')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveLegalPage('about')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isAr ? 'من نحن' : 'About Us'}
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveLegalPage('contact')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isAr ? 'اتصل بنا' : 'Contact Us'}
              </button>

              {/* Render custom pages links if enabled for footer */}
              {adminSettings.customPages &&
                adminSettings.customPages
                  .filter((page) => page.showInFooter !== false)
                  .map((page) => (
                    <React.Fragment key={page.id}>
                      <span>•</span>
                      <button
                        onClick={() => setActiveLegalPage(page.id)}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {isAr ? page.titleAr || page.titleEn : page.titleEn || page.titleAr}
                      </button>
                    </React.Fragment>
                  ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>
              {isAr
                ? adminSettings.footerCopyrightTextAr ||
                  `© ${new Date().getFullYear()} ${adminSettings.siteNameAr || adminSettings.siteName}. جميع الحقوق محفوظة.`
                : adminSettings.footerCopyrightTextEn ||
                  `© ${new Date().getFullYear()} ${adminSettings.siteNameEn || adminSettings.siteName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>

      {/* Cookie CMP Consent Banner */}
      <CookieConsentBanner
        enabled={adminSettings.enableCookieConsent}
        textAr={adminSettings.cookieConsentTextAr}
        textEn={adminSettings.cookieConsentTextEn}
        lang={lang}
        onOpenLegalPage={(page) => setActiveLegalPage(page)}
      />

      {/* Firebase Authentication Modal (Google, Email/Password, Signup, Forgot Password, Guest) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        initialMode={authModalMode}
      />

      {/* Firebase User Profile & Cloud Codes Management Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        cloudCodes={cloudCodes}
        lang={lang}
      />

      {/* Admin Login Modal (Username + Password authentication) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setCurrentView('admin');
        }}
        settings={adminSettings}
        lang={lang}
      />

      {/* Legal Pages Viewer Modal */}
      <LegalPageModal
        pageType={activeLegalPage}
        onClose={() => setActiveLegalPage(null)}
        settings={adminSettings}
        lang={lang}
      />
    </div>
  );
}
