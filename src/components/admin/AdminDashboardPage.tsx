import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  FileText,
  Cookie,
  Search,
  Key,
  Database,
  Save,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Eye,
  FilePlus,
  Palette,
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  EyeOff,
  User,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  Languages,
  Sun,
  Moon,
  ChevronRight,
  Home,
  CheckCheck,
  BookOpen,
  Copy as DuplicateIcon,
  Tag,
  Clock,
  Calendar,
  Users,
  Link2,
} from 'lucide-react';
import {
  AdminSettings,
  AppLanguage,
  Article,
  CustomPage,
  FAQSchemaItem,
  LegalPageType,
  SecurityLogEntry,
} from '../../types';
import { DEFAULT_ADMIN_SETTINGS } from '../../utils/adminSettings';
import {
  evaluatePasswordStrength,
  buildCustomSecretLink,
  getSecurityAuditLogs,
  clearSecurityLogs,
} from '../../utils/security';
import {
  generateSitemapXml,
  generateRobotsTxt,
  generateLlmsTxt,
} from '../../utils/seoHelper';
import { AnalyticsView } from './AnalyticsView';
import { ArticleEditorModal } from './ArticleEditorModal';
import { UserManagementView } from './UserManagementView';
import { GlobalConversionsView } from './GlobalConversionsView';
import { AdminDynamicQRView } from './AdminDynamicQRView';

interface AdminDashboardPageProps {
  settings: AdminSettings;
  onSaveSettings: (newSettings: AdminSettings) => void;
  onResetSettings: () => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenLegalPage: (page: LegalPageType) => void;
  onLogout: () => void;
  onReturnToHome: () => void;
}

export type AdminTab =
  | 'analytics'
  | 'dynamic_qr'
  | 'users'
  | 'conversions'
  | 'branding'
  | 'seo'
  | 'features'
  | 'articles'
  | 'adsense'
  | 'legal'
  | 'cookie'
  | 'security'
  | 'backup';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  settings,
  onSaveSettings,
  onResetSettings,
  lang,
  setLang,
  isDark,
  setIsDark,
  onOpenLegalPage,
  onLogout,
  onReturnToHome,
}) => {
  const [formData, setFormData] = useState<AdminSettings>(settings);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Articles CMS State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('all');

  // Custom Pages State
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState<CustomPage>({
    id: '',
    titleAr: '',
    titleEn: '',
    contentAr: '',
    contentEn: '',
    showInFooter: true,
  });

  // FAQ Schema State
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<FAQSchemaItem>({
    id: '',
    questionAr: '',
    questionEn: '',
    answerAr: '',
    answerEn: '',
  });

  const [showAdminPin, setShowAdminPin] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);

  // SEO & Google Search Console Action States
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [copiedRobots, setCopiedRobots] = useState(false);
  const [copiedLlms, setCopiedLlms] = useState(false);
  const [copiedArticleUrls, setCopiedArticleUrls] = useState(false);
  const [showSitemapModal, setShowSitemapModal] = useState(false);

  useEffect(() => {
    setFormData(settings);
    setSecurityLogs(getSecurityAuditLogs());
  }, [settings]);

  const isAr = lang === 'ar';

  const handleChange = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من إعادة كافة خيارات وإعدادات لوحة التحكم للقيم الافتراضية؟'
          : 'Are you sure you want to reset all admin settings to factory defaults?'
      )
    ) {
      setFormData(DEFAULT_ADMIN_SETTINGS);
      onResetSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const directSecretLink = buildCustomSecretLink(formData);
  const passwordStrength = evaluatePasswordStrength(formData.adminPassword || formData.adminPin);

  const handleRefreshSecurityLogs = () => {
    setSecurityLogs(getSecurityAuditLogs());
  };

  const handleClearSecurityLogs = () => {
    if (window.confirm(isAr ? 'هل تريد مسح سجل تدقيق الأمان بالكامل؟' : 'Clear all security audit logs?')) {
      clearSecurityLogs();
      setSecurityLogs([]);
    }
  };

  const handleCopySecretLink = () => {
    navigator.clipboard.writeText(directSecretLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'customLogoUrl' | 'customFaviconUrl' | 'ogImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(isAr ? 'حجم الصورة كبير جداً، يفضل أقل من 2 ميغابايت.' : 'File size too large. Under 2MB recommended.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handleChange(field, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `admin_settings_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setFormData((prev) => ({ ...prev, ...imported }));
          alert(isAr ? 'تم استيراد الإعدادات بنجاح!' : 'Settings imported successfully!');
        } catch (err) {
          alert(isAr ? 'خطأ في ملف JSON المرفق.' : 'Invalid JSON configuration file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Article Management Handlers
  const handleOpenNewArticle = () => {
    setEditingArticle(null);
    setIsArticleModalOpen(true);
  };

  const handleEditArticle = (art: Article) => {
    setEditingArticle(art);
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (savedArticle: Article) => {
    const currentArticles = formData.articles || [];
    const index = currentArticles.findIndex((a) => a.id === savedArticle.id);
    let updated: Article[];
    if (index >= 0) {
      updated = [...currentArticles];
      updated[index] = savedArticle;
    } else {
      updated = [savedArticle, ...currentArticles];
    }
    handleChange('articles', updated);
  };

  const handleDeleteArticle = (id: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا المقال نهائياً؟' : 'Are you sure you want to delete this article?')) {
      const currentArticles = formData.articles || [];
      const updated = currentArticles.filter((a) => a.id !== id);
      handleChange('articles', updated);
    }
  };

  const handleDuplicateArticle = (art: Article) => {
    const duplicated: Article = {
      ...art,
      id: `art_${Date.now()}`,
      slug: `${art.slug}-copy-${Date.now().toString().slice(-4)}`,
      titleAr: art.titleAr ? `${art.titleAr} (${isAr ? 'نسخة' : 'Copy'})` : '',
      titleEn: art.titleEn ? `${art.titleEn} (Copy)` : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublished: false,
    };
    const currentArticles = formData.articles || [];
    handleChange('articles', [duplicated, ...currentArticles]);
  };

  const handleTogglePublishArticle = (id: string) => {
    const currentArticles = formData.articles || [];
    const updated = currentArticles.map((a) => {
      if (a.id === id) {
        return { ...a, isPublished: !a.isPublished, updatedAt: Date.now() };
      }
      return a;
    });
    handleChange('articles', updated);
  };

  // Extract categories for article filtering
  const articleCategories = React.useMemo(() => {
    const cats = new Set<string>();
    (formData.articles || []).forEach((a) => {
      if (a.categoryAr) cats.add(a.categoryAr);
      if (a.categoryEn) cats.add(a.categoryEn);
    });
    return Array.from(cats);
  }, [formData.articles]);

  const filteredArticlesList = React.useMemo(() => {
    return (formData.articles || []).filter((art) => {
      const title = (isAr ? art.titleAr : art.titleEn) || art.titleAr || art.titleEn || '';
      const cat = (isAr ? art.categoryAr : art.categoryEn) || art.categoryAr || art.categoryEn || '';
      const tags = (art.tags || []).join(' ');

      const matchesSearch =
        articleSearch.trim() === '' ||
        title.toLowerCase().includes(articleSearch.toLowerCase()) ||
        cat.toLowerCase().includes(articleSearch.toLowerCase()) ||
        tags.toLowerCase().includes(articleSearch.toLowerCase());

      const matchesStatus =
        articleStatusFilter === 'all' ||
        (articleStatusFilter === 'published' && art.isPublished) ||
        (articleStatusFilter === 'draft' && !art.isPublished);

      const matchesCategory =
        articleCategoryFilter === 'all' ||
        art.categoryAr === articleCategoryFilter ||
        art.categoryEn === articleCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [formData.articles, articleSearch, articleStatusFilter, articleCategoryFilter, isAr]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'analytics',
      label: isAr ? 'إحصائيات الزوار والدول' : 'Visitor Analytics',
      icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
      badge: isAr ? 'مباشر' : 'Live',
    },
    {
      id: 'dynamic_qr',
      label: isAr ? 'نظام QR الديناميكي الذكي' : 'Dynamic QR Codes',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      badge: isAr ? 'ديناميكي' : 'Dynamic',
    },
    {
      id: 'users',
      label: isAr ? 'الحسابات والمستخدمين المسجلين' : 'Registered Accounts',
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      badge: isAr ? 'جديد' : 'Users',
    },
    {
      id: 'conversions',
      label: isAr ? 'سجل الروابط والباركودات المنشأة' : 'Links & Barcodes Conversion Log',
      icon: <Link2 className="w-5 h-5 text-emerald-500" />,
      badge: isAr ? 'سجل شامل' : 'Audit Log',
    },
    {
      id: 'branding',
      label: isAr ? 'الهوية والشعار والمظهر' : 'Branding & Logo',
      icon: <Palette className="w-5 h-5 text-purple-500" />,
    },
    {
      id: 'seo',
      label: isAr ? 'السيو والذكاء الاصطناعي' : 'SEO & AI Search (GEO)',
      icon: <Search className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: 'features',
      label: isAr ? 'إدارة أدوات الموقع' : 'Feature Toggles',
      icon: <Sliders className="w-5 h-5 text-blue-500" />,
    },
    {
      id: 'articles',
      label: isAr ? 'المقالات والمدونة' : 'Articles & Guides',
      icon: <BookOpen className="w-5 h-5 text-sky-500" />,
      badge: formData.articles ? `${formData.articles.length}` : undefined,
    },
    {
      id: 'adsense',
      label: isAr ? 'إعلانات Google AdSense' : 'Google AdSense',
      icon: <DollarSign className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'legal',
      label: isAr ? 'الصفحات والمستندات' : 'Pages & Policies',
      icon: <FileText className="w-5 h-5 text-teal-500" />,
    },
    {
      id: 'cookie',
      label: isAr ? 'إشعار الكوكيز و GDPR' : 'Cookie CMP Banner',
      icon: <Cookie className="w-5 h-5 text-orange-500" />,
    },
    {
      id: 'security',
      label: isAr ? 'الأمان واليوزر والباسورد' : 'Security & Credentials',
      icon: <Key className="w-5 h-5 text-rose-500" />,
      badge: isAr ? 'حماية' : 'Auth',
    },
    {
      id: 'backup',
      label: isAr ? 'النسخ والضبط التلقائي' : 'Backup & Reset',
      icon: <Database className="w-5 h-5 text-slate-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left Section: Sidebar Toggle & Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle Navigation Sidebar"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      {isAr ? 'لوحة التحكم والإدارة المستقلة' : 'Admin Control Dashboard'}
                    </h1>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      v2.5 Full-Page
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                    {isAr
                      ? `تسجيل الدخول باسم: ${formData.adminUsername || 'admin'} • جلسة إدارة آمنة`
                      : `Logged in as: ${formData.adminUsername || 'admin'} • Secure Admin Session`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section: Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {savedSuccess && (
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-fade-in shadow-sm">
                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {isAr ? 'تم حفظ التغييرات!' : 'Saved successfully!'}
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ الإعدادات' : 'Save Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="تغيير اللغة / Change Language"
              >
                <Languages className="w-4 h-4 text-indigo-500" />
                <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

              <button
                type="button"
                onClick={onReturnToHome}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isAr ? 'العودة للموقع الرئيسي' : 'Return to Home'}
              >
                <Home className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">{isAr ? 'الموقع الرئيسي' : 'Home'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                title={isAr ? 'تسجيل الخروج من لوحة التحكم' : 'Log out'}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isAr ? 'خروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Full-Page Layout: Sidebar Navigation + Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 gap-6 overflow-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}

        {/* Navigation Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 ${
            isAr ? 'right-0' : 'left-0'
          } z-30 w-72 md:w-64 lg:w-72 bg-white dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-slate-800 md:border-0 p-4 md:p-0 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
            isSidebarOpen
              ? 'translate-x-0 shadow-2xl'
              : isAr
              ? 'translate-x-full md:translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Sidebar Header in Mobile */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'قائمة أقسام الإدارة' : 'Dashboard Menu'}
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Admin User Card */}
          <div className="p-3.5 mb-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {formData.adminUsername || 'admin'}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isAr ? 'مشرف متصل (نشط)' : 'Admin Online'}
              </p>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 rtl:pr-0 rtl:pl-1 scrollbar-thin">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isAr ? 'أقسام الإدارة والتحكم' : 'Navigation Menu'}
            </p>
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold scale-[1.01]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : ''}>{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer in Sidebar */}
          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ التعديلات' : 'Save All Settings'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: VISITOR & COUNTRY ANALYTICS */}
          {activeTab === 'analytics' && <AnalyticsView lang={lang} />}

          {/* TAB: DYNAMIC QR CODES SYSTEM */}
          {activeTab === 'dynamic_qr' && <AdminDynamicQRView lang={lang} />}

          {/* TAB: REGISTERED ACCOUNTS & USERS */}
          {activeTab === 'users' && <UserManagementView lang={lang} />}

          {/* TAB: CONVERTED LINKS & AUDIT LOG */}
          {activeTab === 'conversions' && <GlobalConversionsView lang={lang} />}

          {/* TAB 2: BRANDING & LOGO */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-500" />
                  {isAr ? 'الهوية البصرية، الشعار، والعناوين' : 'Site Identity, Custom Logo & Headlines'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'قم بتخصيص اسم الموقع، رفع لوغو خاص، تغيير أيقونة المتصفح (Favicon)، وتعديل العناوين والشارات الظاهرة للزوار.'
                    : 'Customize site brand names, upload custom logos and browser favicon, and edit user-facing taglines.'}
                </p>
              </div>

              {/* Site Names */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isAr ? 'اسم الموقع الأساسي' : 'Site Name'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اسم الموقع (بالعربية):' : 'Site Name (Arabic):'}
                    </label>
                    <input
                      type="text"
                      value={formData.siteNameAr || ''}
                      onChange={(e) => handleChange('siteNameAr', e.target.value)}
                      placeholder="e.g. باركودي - مولد الباركود و QR"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اسم الموقع (بالإنكليزية):' : 'Site Name (English):'}
                    </label>
                    <input
                      type="text"
                      value={formData.siteNameEn || ''}
                      onChange={(e) => handleChange('siteNameEn', e.target.value)}
                      placeholder="e.g. Barcode & QR Studio Pro"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dir-ltr"
                    />
                  </div>
                </div>

                {/* Subtitle & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'شارة الموقع (Badge):' : 'Site Badge Text:'}
                    </label>
                    <input
                      type="text"
                      value={formData.siteBadgeText || ''}
                      onChange={(e) => handleChange('siteBadgeText', e.target.value)}
                      placeholder="e.g. PRO / مجاناً / Free"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الوصف الفرعي بالهيدر (عربي):' : 'Header Subtitle (Arabic):'}
                    </label>
                    <input
                      type="text"
                      value={formData.siteSubtitleAr || ''}
                      onChange={(e) => handleChange('siteSubtitleAr', e.target.value)}
                      placeholder="الوصف المختصر تحت الاسم"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Logo & Favicon Upload */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isAr ? 'شعار الموقع والأيقونة (Logo & Favicon)' : 'Site Logo & Browser Icon'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'شعار الموقع المخصص (Logo):' : 'Custom Site Logo:'}
                    </label>
                    <div className="flex items-center gap-3">
                      {formData.customLogoUrl ? (
                        <div className="w-14 h-14 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 shadow-sm">
                          <img src={formData.customLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <Palette className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'رفع شعار من جهازك' : 'Upload Image'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'customLogoUrl')} />
                        </label>
                        {formData.customLogoUrl && (
                          <button
                            type="button"
                            onClick={() => handleChange('customLogoUrl', '')}
                            className="block text-[11px] text-rose-500 hover:underline"
                          >
                            {isAr ? 'إزالة الشعار والرجوع للافتراضي' : 'Reset to Default'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'أيقونة لسان المتصفح (Favicon):' : 'Browser Tab Favicon:'}
                    </label>
                    <div className="flex items-center gap-3">
                      {formData.customFaviconUrl ? (
                        <div className="w-14 h-14 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 shadow-sm">
                          <img src={formData.customFaviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <Palette className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'رفع أيقونة Favicon' : 'Upload Favicon'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'customFaviconUrl')} />
                        </label>
                        {formData.customFaviconUrl && (
                          <button
                            type="button"
                            onClick={() => handleChange('customFaviconUrl', '')}
                            className="block text-[11px] text-rose-500 hover:underline"
                          >
                            {isAr ? 'إزالة واسترجاع الافتراضي' : 'Reset Favicon'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Copyright */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {isAr ? 'حقوق النشر في أسفل الصفحة (Footer Copyright)' : 'Footer Copyright Text'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'النص بالعربية:' : 'Arabic Text:'}
                    </label>
                    <input
                      type="text"
                      value={formData.footerCopyrightTextAr || ''}
                      onChange={(e) => handleChange('footerCopyrightTextAr', e.target.value)}
                      placeholder="جميع الحقوق محفوظة ©"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'النص بالإنكليزية:' : 'English Text:'}
                    </label>
                    <input
                      type="text"
                      value={formData.footerCopyrightTextEn || ''}
                      onChange={(e) => handleChange('footerCopyrightTextEn', e.target.value)}
                      placeholder="All rights reserved ©"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEO & GOOGLE SEARCH CONSOLE & AI SEARCH (GEO) */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-500" />
                  {isAr ? 'إعدادات السيو، Google Search Console، والأرشفة السريعة' : 'SEO, Google Search Console & Fast Indexing'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'إثبات ملكية موقعك في Google Search Console، توليد خريطة الموقع XML، التحكم في الفهرسة السريعة، وأرشفة المقالات التخصصية.'
                    : 'Verify site ownership in Google Search Console, generate XML Sitemap, manage fast indexing, and submit all published articles.'}
                </p>
              </div>

              {/* SECTION 1: Google Search Console Verification & Fast Indexing Directives */}
              <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isAr ? 'إثبات ملكية Google Search Console & Bing' : 'Search Engine Verification & Directives'}
                  </h4>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Google Search Console
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Google Site Verification */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'رمز إثبات ملكية Google Search Console:' : 'Google Verification Tag / Token:'}
                    </label>
                    <input
                      type="text"
                      value={formData.googleSiteVerification || ''}
                      onChange={(e) => handleChange('googleSiteVerification', e.target.value)}
                      placeholder='e.g. 7mE5j_... أو كود meta الكامل'
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? 'انسخ رمز التحقق من Google Search Console (طريقة HTML tag)، وسيتم حقنه فوراً في وسم <head>.'
                        : 'Paste your HTML tag verification code or token from Google Search Console.'}
                    </p>
                  </div>

                  {/* Bing Webmaster Verification */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'رمز إثبات ملكية Bing Webmaster Tools:' : 'Bing Webmaster Verification Code:'}
                    </label>
                    <input
                      type="text"
                      value={formData.bingSiteVerification || ''}
                      onChange={(e) => handleChange('bingSiteVerification', e.target.value)}
                      placeholder="e.g. 3C8F..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? 'اختياري: لتأكيد الملكية والأرشفة في محرك Bing و Yahoo.'
                        : 'Optional: For Bing Webmaster Tools & Yahoo verification.'}
                    </p>
                  </div>
                </div>

                {/* Indexing Robots Directive */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'توجيهات الفهرسة السريعة (Robots Directives):' : 'Fast Indexing Robots Directive:'}
                    </label>
                    <select
                      value={formData.robotsIndexing || 'all'}
                      onChange={(e) => handleChange('robotsIndexing', e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value="all">{isAr ? 'أرشفة كاملة وفورية لجميع الصفحات والمقالات (index, follow - مستحسن)' : 'Index & Follow All (Recommended for fast SEO)'}</option>
                      <option value="noindex">{isAr ? 'عدم الأرشفة مؤقتاً (noindex, follow)' : 'No-Index (Draft Mode)'}</option>
                      <option value="nofollow">{isAr ? 'أرشفة بدون تتبع الروابط (index, nofollow)' : 'No-Follow Links'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الرابط الأساسي المعتمد (Canonical URL):' : 'Canonical Site Base URL:'}
                    </label>
                    <input
                      type="text"
                      value={formData.canonicalUrl || ''}
                      onChange={(e) => handleChange('canonicalUrl', e.target.value.trim())}
                      placeholder="https://www.evar-cademy.online"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: XML Sitemap & Fast Google Indexing Suite for the 13 Articles */}
              <div className="p-5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      {isAr ? 'خريطة الموقع XML وأرشفة المقالات الـ 13' : 'XML Sitemap & 13 SEO Articles Indexing Suite'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? `يتضمن الموقع حالياً ${(formData.articles || []).length} مقالاً مهيأً ببيانات Schema.org و JSON-LD الجاهزة للأرشفة الفورية.`
                        : `Platform includes ${(formData.articles || []).length} SEO-optimized articles with ready JSON-LD Schema.org rich snippets.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Copy XML Sitemap */}
                    <button
                      type="button"
                      onClick={() => {
                        const xml = generateSitemapXml(formData);
                        navigator.clipboard.writeText(xml);
                        setCopiedSitemap(true);
                        setTimeout(() => setCopiedSitemap(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedSitemap ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSitemap ? (isAr ? 'تم نسخ sitemap.xml!' : 'Sitemap Copied!') : (isAr ? 'نسخ ملف Sitemap.xml' : 'Copy Sitemap.xml')}</span>
                    </button>

                    {/* Copy All 13 Article URLs for Search Console Inspection */}
                    <button
                      type="button"
                      onClick={() => {
                        const origin = formData.canonicalUrl || window.location.origin;
                        const urls = (formData.articles || [])
                          .map((a) => `${origin}/#article-${a.slug || a.id}`)
                          .join('\n');
                        navigator.clipboard.writeText(urls);
                        setCopiedArticleUrls(true);
                        setTimeout(() => setCopiedArticleUrls(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedArticleUrls ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedArticleUrls ? (isAr ? 'تم نسخ روابط المقالات!' : 'URLs Copied!') : (isAr ? 'نسخ روابط كافة المقالات لفحص Google' : 'Copy All Article URLs')}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Inspection Guide */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {isAr ? 'خطوات الأرشفة السريعة في Google Search Console:' : 'Fast Indexing Steps in Google Search Console:'}
                  </p>
                  <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-1 pr-1 rtl:pr-0 rtl:pl-1">
                    <li>{isAr ? 'أدخل رمز التحقق في الحقل أعلاه واضغط "حفظ الإعدادات".' : 'Enter the verification token above and click "Save Changes".'}</li>
                    <li>{isAr ? 'في لوحة Google Search Console، اذهب لقسم Sitemaps وقدم الرابط: sitemap.xml' : 'In Search Console Sitemaps menu, submit sitemap.xml.'}</li>
                    <li>{isAr ? 'استخدم أداة "فحص أي عنوان URL" واضغط "طلب الفهرسة" (Request Indexing) لروابط المقالات لتتصدر خلال ساعات.' : 'Use "URL Inspection" tool and click "Request Indexing" for rapid crawling.'}</li>
                  </ol>
                </div>
              </div>

              {/* SECTION 3: Standard Search Meta Titles & Descriptions */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'عناوين ووصف محركات البحث (Meta Tags)' : 'Search Meta Tags'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'عنوان Meta Title (عربي):' : 'Meta Title (Arabic):'}
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitleAr}
                      onChange={(e) => handleChange('metaTitleAr', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'عنوان Meta Title (إنكليزي):' : 'Meta Title (English):'}
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitleEn}
                      onChange={(e) => handleChange('metaTitleEn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'وصف Meta Description (عربي):' : 'Meta Description (Arabic):'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.metaDescriptionAr}
                      onChange={(e) => handleChange('metaDescriptionAr', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'وصف Meta Description (إنكليزي):' : 'Meta Description (English):'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.metaDescriptionEn}
                      onChange={(e) => handleChange('metaDescriptionEn', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الكلمات المفتاحية (Meta Keywords):' : 'Meta Keywords:'}
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) => handleChange('metaKeywords', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* SECTION 4: AI Optimization (GEO) & Schema.org */}
              <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
                        {isAr ? 'تحسين محركات الذكاء الاصطناعي التوليدي (GEO) وملف llms.txt' : 'Generative AI Engine Optimization (GEO)'}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {isAr
                          ? 'تضمين مخططات Schema.org والمقالات وملف llms.txt لروبوتات ChatGPT, Claude, Perplexity'
                          : 'Includes Schema.org rich graph and llms.txt format for AI crawlers.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const txt = generateLlmsTxt(formData);
                        navigator.clipboard.writeText(txt);
                        setCopiedLlms(true);
                        setTimeout(() => setCopiedLlms(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {copiedLlms ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLlms ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ llms.txt' : 'Copy llms.txt')}</span>
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableAiSearchGeo}
                        onChange={(e) => handleChange('enableAiSearchGeo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURE TOGGLES */}
          {activeTab === 'features' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-500" />
                  {isAr ? 'إدارة أقسام وأدوات الموقع' : 'Feature & Tool Toggles'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'يمكنك تفعيل أو إخفاء أي قسم أو ميزة في الموقع بنقرة واحدة.'
                    : 'Enable or disable any tool or section across the application.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'enableQrGenerator', labelAr: 'مولد رموز QR', labelEn: 'QR Code Generator' },
                  { key: 'enableBarcodeGenerator', labelAr: 'مولد الباركود الخطي', labelEn: 'Linear Barcode Generator' },
                  { key: 'enableBatchGenerator', labelAr: 'إنشاء الأكواد دفعة واحدة', labelEn: 'Batch Generator' },
                  { key: 'enableScanner', labelAr: 'ماسح الرموز بالكاميرا', labelEn: 'Camera Scanner' },
                  { key: 'enableHistory', labelAr: 'سجل المحفوظات', labelEn: 'Saved History List' },
                  { key: 'enableArticles', labelAr: 'صفحة وتبويب المقالات والأدلة (Articles)', labelEn: 'Articles & Guides Page' },
                  { key: 'enableLogoUpload', labelAr: 'إمكانية إدراج لوغو داخل QR', labelEn: 'QR Logo Upload' },
                  { key: 'enablePdfExport', labelAr: 'تصدير PDF عالي الدقة', labelEn: 'PDF Export' },
                  { key: 'enablePrint', labelAr: 'زر الطباعة المباشرة', labelEn: 'Direct Print Button' },
                  { key: 'enablePresetTemplates', labelAr: 'قوالب التصميم الجاهزة', labelEn: 'Preset Design Templates' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[item.key as keyof AdminSettings]}
                        onChange={(e) =>
                          handleChange(item.key as keyof AdminSettings, e.target.checked as any)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Maintenance Mode */}
              <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                      {isAr ? 'وضع الصيانة للموقع (Maintenance Mode)' : 'Maintenance Mode'}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      {isAr
                        ? 'إظهار شاشة الصيانة المؤقتة للزوار العاديين بينما تبقى لوحة التحكم متاحة للمشرف'
                        : 'Displays maintenance notice to visitors'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ARTICLES & GUIDES CMS */}
          {activeTab === 'articles' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header & New Article Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-500" />
                    <span>{isAr ? 'إدارة المقالات والأدلة الإرشادية (CMS)' : 'Articles & Guides CMS'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'إنشاء وتحرير مقالات احترافية مع دعم التنسيق المتقدم والوسوم لتعزيز السيو وظهور محركات البحث.'
                      : 'Create and edit SEO-rich guides with markdown formatting, tags, and custom slugs.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenNewArticle}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'كتابة مقال جديد' : 'Write New Article'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي المقالات' : 'Total Articles'}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {(formData.articles || []).length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{isAr ? 'المقالات المنشورة' : 'Published'}</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {(formData.articles || []).filter((a) => a.isPublished !== false).length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{isAr ? 'مسودات قيد الإعداد' : 'Drafts'}</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {(formData.articles || []).filter((a) => a.isPublished === false).length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{isAr ? 'حالة التبويب بالواجهة' : 'Navbar Tab'}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
                    {formData.enableArticles ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        {isAr ? 'مفعّل بالرئيسية' : 'Active'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">{isAr ? 'معطل' : 'Disabled'}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    placeholder={isAr ? 'بحث بالعنوان أو الوسم...' : 'Search title or tag...'}
                    className="w-full pl-9 pr-4 rtl:pl-4 rtl:pr-9 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Status Filter */}
                  <select
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="all">{isAr ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="published">{isAr ? 'المنشورة فقط' : 'Published'}</option>
                    <option value="draft">{isAr ? 'المسودات فقط' : 'Drafts'}</option>
                  </select>

                  {/* Category Filter */}
                  {articleCategories.length > 0 && (
                    <select
                      value={articleCategoryFilter}
                      onChange={(e) => setArticleCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="all">{isAr ? 'كافة التصنيفات' : 'All Categories'}</option>
                      {articleCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Articles Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                {filteredArticlesList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/70 text-slate-500 font-bold">
                          <th className="py-3 px-4 text-start">{isAr ? 'المقال والغلاف' : 'Article & Cover'}</th>
                          <th className="py-3 px-4 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                          <th className="py-3 px-4 text-start">{isAr ? 'الكاتب والتاريخ' : 'Author & Date'}</th>
                          <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredArticlesList.map((art) => {
                          const title = (isAr ? art.titleAr : art.titleEn) || art.titleAr || art.titleEn || (isAr ? 'مقال بدون عنوان' : 'Untitled Article');
                          const cat = (isAr ? art.categoryAr : art.categoryEn) || art.categoryAr || art.categoryEn || 'عام';
                          const dateStr = new Date(art.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });

                          return (
                            <tr key={art.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    {art.coverImageUrl ? (
                                      <img src={art.coverImageUrl} alt={title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                                        <BookOpen className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 max-w-sm sm:max-w-md">
                                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                      {title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-mono line-clamp-1 dir-ltr">
                                      /{art.slug || art.id}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  <Tag className="w-3 h-3" />
                                  {cat}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-900 dark:text-white text-[11px]">
                                    {art.author || formData.brandName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {dateStr}
                                  </p>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublishArticle(art.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                                    art.isPublished !== false
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                      : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                  }`}
                                  title={isAr ? 'اضغط لتبديل حالة النشر' : 'Click to toggle status'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${art.isPublished !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  <span>{art.isPublished !== false ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}</span>
                                </button>
                              </td>

                              <td className="py-3 px-4 text-end whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditArticle(art)}
                                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                                    title={isAr ? 'تحرير المقال' : 'Edit Article'}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateArticle(art)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
                                    title={isAr ? 'تكرار المقال' : 'Duplicate Article'}
                                  >
                                    <DuplicateIcon className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteArticle(art.id)}
                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title={isAr ? 'حذف المقال' : 'Delete Article'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'لا توجد مقالات مسجلة تطابق البحث' : 'No articles found'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'ابدأ بكتابة أول مقال أو دليل إرشادي الآن لنشره لزوار موقعك.' : 'Get started by creating your first guide.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenNewArticle}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'كتابة مقال جديد' : 'Write First Article'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE ADSENSE */}
          {activeTab === 'adsense' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  {isAr ? 'إدارة وتكامل Google AdSense' : 'Google AdSense Monetization'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'ربط حساب أدسنس، الإعلانات التلقائية، وحدات الإعلانات المخصصة، وملف ads.txt.'
                    : 'AdSense publisher ID, Auto Ads, custom banner slots, and ads.txt.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'معرف ناشر أدسنس (Publisher ID / Client ID):' : 'Publisher ID (ca-pub-xxxxxxxx):'}
                  </label>
                  <input
                    type="text"
                    value={formData.adsenseClientId || ''}
                    onChange={(e) => handleChange('adsenseClientId', e.target.value.trim())}
                    placeholder="ca-pub-1234567890123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr
                      ? 'بمجرد إدخال المعرف، سيتم حقن كود أدسنس تلقائياً في رأس الصفحة.'
                      : 'AdSense script is automatically injected into document head upon entering ID.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'تفعيل الإعلانات التلقائية (Auto Ads)' : 'Enable Auto Ads'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableAutoAds}
                      onChange={(e) => handleChange('enableAutoAds', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PAGES & POLICIES */}
          {activeTab === 'legal' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-500" />
                  {isAr ? 'الصفحات القانونية والمستندات والصفحات المخصصة' : 'Legal Pages & Custom Documents'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'تعديل سياسة الخصوصية، شروط الاستخدام، من نحن، أو إنشاء صفحات إضافية جديدة.'
                    : 'Manage Privacy Policy, Terms of Service, and custom pages.'}
                </p>
              </div>

              {/* Privacy Policy */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {isAr ? 'سياسة الخصوصية (Privacy Policy)' : 'Privacy Policy'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenLegalPage('privacy')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'معاينة الصفحة' : 'Preview'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <textarea
                    rows={4}
                    value={formData.privacyPolicyAr}
                    onChange={(e) => handleChange('privacyPolicyAr', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={4}
                    value={formData.privacyPolicyEn}
                    onChange={(e) => handleChange('privacyPolicyEn', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white dir-ltr"
                  />
                </div>
              </div>

              {/* Terms of Service */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {isAr ? 'شروط الخدمة والاستخدام (Terms of Service)' : 'Terms of Service'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenLegalPage('terms')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'معاينة الصفحة' : 'Preview'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <textarea
                    rows={4}
                    value={formData.termsOfServiceAr}
                    onChange={(e) => handleChange('termsOfServiceAr', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <textarea
                    rows={4}
                    value={formData.termsOfServiceEn}
                    onChange={(e) => handleChange('termsOfServiceEn', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white dir-ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: COOKIE CMP */}
          {activeTab === 'cookie' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-orange-500" />
                  {isAr ? 'شريط الموافقة على الكوكيز (GDPR & CMP)' : 'Cookie Consent CMP Banner'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'شريط أمان وتوافق قانوني مطلوب لإعلانات Google AdSense وقوانين الخصوصية العالمية.'
                    : 'Mandatory cookie banner required for EU consent and Google AdSense compliance.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {isAr ? 'تفعيل شريط الكوكيز أسفل الموقع' : 'Enable Bottom Cookie Banner'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableCookieConsent}
                      onChange={(e) => handleChange('enableCookieConsent', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SECURITY & CREDENTIALS (USERNAME & PASSWORD) */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-rose-500" />
                    {isAr ? 'بيانات المشرف (اليوزر والباسورد) وحماية لوحة التحكم' : 'Admin Credentials & Security Gate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'تعديل اسم المستخدم (Username) وكلمة المرور (Password) وتخصيص رابط الوصول وحظر التخمين.'
                      : 'Set admin username & password, configure secret access link, and review security logs.'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAr ? 'الحماية باليوزر والباسورد مفعّلة' : 'Auth Active'}
                </span>
              </div>

              {/* Section 1: Username & Password Configuration */}
              <div className="p-6 rounded-3xl border-2 border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                  <User className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'بيانات تسجيل الدخول للوحة التحكم (اليوزر والباسورد):' : 'Admin Login Credentials (Username & Password):'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Admin Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'اسم المستخدم (Admin Username):' : 'Admin Username:'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.adminUsername || ''}
                        onChange={(e) => handleChange('adminUsername', e.target.value)}
                        placeholder="admin"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 rtl:right-auto rtl:left-3 text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr ? 'اسم الحساب لتسجيل الدخول (الافتراضي: admin)' : 'Login account username (Default: admin)'}
                    </p>
                  </div>

                  {/* Admin Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'كلمة المرور السرية (Admin Password):' : 'Admin Password / PIN:'}
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        value={formData.adminPassword || formData.adminPin || ''}
                        onChange={(e) => {
                          handleChange('adminPassword', e.target.value);
                          handleChange('adminPin', e.target.value);
                        }}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5 rtl:right-auto rtl:left-3 cursor-pointer"
                        title={showAdminPin ? 'إخفاء' : 'إظهار'}
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr ? 'كلمة المرور المطلوبة للدخول (الافتراضي: admin123 أو 123456)' : 'Secret password required to authenticate'}
                    </p>
                  </div>
                </div>

                {/* Password Strength Meter */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {isAr ? 'مستوى قوة كلمة المرور:' : 'Password Security Strength:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`w-6 h-1.5 rounded-full transition-all ${
                            step <= passwordStrength.score
                              ? passwordStrength.score === 4
                                ? 'bg-emerald-500'
                                : passwordStrength.score === 3
                                ? 'bg-indigo-500'
                                : passwordStrength.score === 2
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`font-bold ${passwordStrength.color}`}>
                      {isAr ? passwordStrength.labelAr : passwordStrength.labelEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Custom Secret Route Link & URL Customizer */}
              <div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-slate-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-purple-950/20 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {isAr ? 'تخصيص رابط دخول المشرف الوحيد (Secret Login URL):' : 'Customize Admin Access URL (Single Secret Link):'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? 'اختر شكل الرابط الذي تريد اعتماده حصرياً لفتح نافذة الدخول باليوزر والباسورد (لن يعمل أي رابط آخر غيره).'
                        : 'Configure your single custom admin entry URL. Only this exact URL will open the login gateway.'}
                    </p>
                  </div>
                </div>

                {/* URL Style Chooser (Hash vs Query) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('secretAccessType', 'hash')}
                    className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                      formData.secretAccessType === 'hash'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'رابط الهاش المختصر (#hash)' : 'Hash URL (#slug)'}
                      </span>
                      {formData.secretAccessType === 'hash' && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 dir-ltr">
                      /#{(formData.secretSlug || 'portal-access-2026').replace(/^#/, '')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('secretAccessType', 'query')}
                    className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                      formData.secretAccessType === 'query'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'رابط المعامل السري (?key=value)' : 'Query Parameter (?param=key)'}
                      </span>
                      {formData.secretAccessType === 'query' && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 dir-ltr">
                      ?{formData.secretParamName || 'admin_key'}={formData.secretKey || 'admin123'}
                    </p>
                  </button>
                </div>

                {/* Dynamic Inputs based on type */}
                {formData.secretAccessType === 'hash' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'اسم الهاش السري (Slug بعد علامة #):' : 'Secret Hash Slug (after #):'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.secretSlug || ''}
                        onChange={(e) =>
                          handleChange('secretSlug', e.target.value.replace(/^#/, '').trim())
                        }
                        placeholder="my-secret-portal"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-slate-400 text-sm font-mono font-bold">
                        #
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr
                        ? 'مثال: اكتب portal-2026 ليصبح الرابط: https://site.com/#portal-2026'
                        : 'Example: write portal-2026 to make URL: https://site.com/#portal-2026'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isAr ? 'اسم المتغير (Param Name):' : 'Query Param Name:'}
                      </label>
                      <input
                        type="text"
                        value={formData.secretParamName || ''}
                        onChange={(e) => handleChange('secretParamName', e.target.value.trim())}
                        placeholder="secret_portal"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isAr ? 'القيمة السرية (Secret Value):' : 'Secret Key Value:'}
                      </label>
                      <input
                        type="text"
                        value={formData.secretKey || ''}
                        onChange={(e) => handleChange('secretKey', e.target.value.trim())}
                        placeholder="pass9988"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Final Generated Live URL Box */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                    {isAr ? 'الرابط المعتمد النهائي المباشر:' : 'Live Direct Admin URL:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={directSecretLink}
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono bg-white dark:bg-slate-900 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 dir-ltr select-all shadow-inner font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecretLink}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr
                        ? 'الحماية مفعّلة: هذا الرابط هو الوحيد المصرح له بفتح نافذة تسجيل الدخول للمشرف.'
                        : 'Strict security enabled: Only this specific URL is authorized to trigger the login modal.'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: BACKUP & RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-slate-500" />
                  {isAr ? 'النسخ الاحتياطي وإعادة الضبط' : 'Backup & Factory Reset'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAr
                    ? 'تصدير نسخة كاملة من إعداداتك بملف JSON أو استيراد إعدادات سابقة.'
                    : 'Export or import full configuration JSON file.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>{isAr ? 'تصدير ملف الإعدادات (JSON)' : 'Export Backup JSON'}</span>
                  </button>

                  <label className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    <Database className="w-4 h-4" />
                    <span>{isAr ? 'استيراد ملف إعدادات (JSON)' : 'Import Backup JSON'}</span>
                    <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ml-auto rtl:ml-0 rtl:mr-auto"
                  >
                    <span>{isAr ? 'إعادة ضبط المصنع الافتراضي' : 'Reset to Defaults'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Rich Article Editor Modal */}
      <ArticleEditorModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onSave={handleSaveArticle}
        articleToEdit={editingArticle}
        lang={lang}
        existingCategories={articleCategories.map((c) => ({ ar: c, en: c }))}
      />
    </div>
  );
};
