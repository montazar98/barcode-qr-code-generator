import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  DollarSign,
  FileText,
  Cookie,
  Search,
  Key,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Lock,
  ExternalLink,
  Wrench,
  Globe,
  Sparkles,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Eye,
  FilePlus,
  Palette,
  Image as ImageIcon,
  Bot,
  HelpCircle,
  Share2,
  Layers,
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Fingerprint,
  EyeOff,
  Radio,
  History,
  Link2,
  Users,
  QrCode,
} from 'lucide-react';
import {
  AdminSettings,
  AppLanguage,
  CustomPage,
  FAQSchemaItem,
  LegalPageType,
  SecurityLogEntry,
} from '../../types';
import { DEFAULT_ADMIN_SETTINGS } from '../../utils/adminSettings';
import { generateLlmsTxt, generateRobotsTxt } from '../../utils/seoHelper';
import {
  evaluatePasswordStrength,
  buildCustomSecretLink,
  getSecurityAuditLogs,
  clearSecurityLogs,
} from '../../utils/security';
import { AnalyticsView } from './AnalyticsView';
import { GlobalConversionsView } from './GlobalConversionsView';
import { UserManagementView } from './UserManagementView';
import { AdminDynamicQRView } from './AdminDynamicQRView';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onSaveSettings: (newSettings: AdminSettings) => void;
  onResetSettings: () => void;
  lang: AppLanguage;
  onOpenLegalPage: (page: LegalPageType) => void;
}

type AdminTab =
  | 'conversions'
  | 'dynamic_qr'
  | 'users'
  | 'analytics'
  | 'branding'
  | 'features'
  | 'seo'
  | 'adsense'
  | 'legal'
  | 'cookie'
  | 'security'
  | 'backup';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSettings,
  lang,
  onOpenLegalPage,
}) => {
  const [formData, setFormData] = useState<AdminSettings>(settings);
  const [activeTab, setActiveTab] = useState<AdminTab>('branding');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeAiFileView, setActiveAiFileView] = useState<'llms' | 'robots' | null>(null);

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

  // Sync settings when opened
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setSecurityLogs(getSecurityAuditLogs());
    }
  }, [isOpen, settings]);

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
  const passwordStrength = evaluatePasswordStrength(formData.adminPin);

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

  if (!isOpen) return null;

  // Image Upload Helper (converts file to Base64)
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

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'conversions', label: isAr ? 'سجل الروابط والباركودات' : 'Links & Barcodes Log', icon: <Link2 className="w-4 h-4 text-emerald-500" /> },
    { id: 'dynamic_qr', label: isAr ? 'الباركود الذكي (Dynamic QR)' : 'Dynamic QR Codes', icon: <QrCode className="w-4 h-4 text-purple-500" /> },
    { id: 'users', label: isAr ? 'المستخدمين المسجلين' : 'Registered Users', icon: <Users className="w-4 h-4 text-cyan-500" /> },
    { id: 'analytics', label: isAr ? 'إحصائيات الزوار والدول' : 'Visitor Analytics', icon: <BarChart3 className="w-4 h-4 text-indigo-500" /> },
    { id: 'branding', label: isAr ? 'الهوية والشعار' : 'Branding & Logo', icon: <Palette className="w-4 h-4" /> },
    { id: 'seo', label: isAr ? 'السيو والذكاء الاصطناعي' : 'SEO & AI Search', icon: <Search className="w-4 h-4" /> },
    { id: 'features', label: isAr ? 'إدارة المميزات' : 'Feature Toggles', icon: <Sliders className="w-4 h-4" /> },
    { id: 'adsense', label: isAr ? 'Google AdSense' : 'Google AdSense', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'legal', label: isAr ? 'الصفحات والمستندات' : 'Pages & Policies', icon: <FileText className="w-4 h-4" /> },
    { id: 'cookie', label: isAr ? 'إشعار الكوكيز' : 'Cookie CMP', icon: <Cookie className="w-4 h-4" /> },
    { id: 'security', label: isAr ? 'الرابط والأمان' : 'Secret Link & PIN', icon: <Key className="w-4 h-4" /> },
    { id: 'backup', label: isAr ? 'النسخ والضبط' : 'Backup & Reset', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isAr ? 'لوحة تحكم الموقع والسيطرة الشاملة' : 'Website Admin Control Center'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  AdSense & AI Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'تخصيص الهوية واللوغو، زيادة الظهور في محركات البحث والـ AI، إدارة الروابط والصفحات'
                  : 'Customize branding, SEO & AI visibility, direct access links, and ads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {isAr ? 'تم حفظ التعديلات!' : 'Saved successfully!'}
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isAr ? 'حفظ التغييرات' : 'Save All Settings'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Body with Tabs Sidebar + View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Menu */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 flex md:flex-col gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all text-right ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB: CONVERSIONS AUDIT LOG */}
            {activeTab === 'conversions' && (
              <GlobalConversionsView
                lang={lang}
                onNotification={(msg) => alert(msg)}
              />
            )}

            {/* TAB: DYNAMIC QR MANAGEMENT */}
            {activeTab === 'dynamic_qr' && (
              <AdminDynamicQRView
                lang={lang}
                onNotification={(msg) => alert(msg)}
              />
            )}

            {/* TAB: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <UserManagementView
                lang={lang}
                onNotification={(msg) => alert(msg)}
              />
            )}

            {/* TAB: VISITOR & COUNTRY ANALYTICS */}
            {activeTab === 'analytics' && <AnalyticsView lang={lang} />}

            {/* TAB 1: BRANDING & LOGO & USER TITLES */}
            {activeTab === 'branding' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-500" />
                    {isAr ? 'الهوية البصرية، الشعار، والعناوين' : 'Site Identity, Custom Logo & Headlines'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'قم بتخصيص اسم الموقع، رفع لوغو خاص، تغيير أيقونة المتصفح (Favicon)، وتعديل العناوين والشارات الظاهرة للزوار.'
                      : 'Customize site brand names, upload custom logos and browser favicon, and edit user-facing taglines.'}
                  </p>
                </div>

                {/* Section 1: Site Names */}
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
                        value={formData.siteNameAr || formData.siteName}
                        onChange={(e) => {
                          handleChange('siteNameAr', e.target.value);
                          handleChange('siteName', e.target.value);
                        }}
                        placeholder="مثال: باركودي"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'اسم الموقع (بالإنكليزية):' : 'Site Name (English):'}
                      </label>
                      <input
                        type="text"
                        value={formData.siteNameEn}
                        onChange={(e) => handleChange('siteNameEn', e.target.value)}
                        placeholder="e.g. Barcodey"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Browser Tab Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'عنوان تبويب المتصفح (Page Title - عربي):' : 'Browser Tab Title (Arabic):'}
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitleAr}
                        onChange={(e) => handleChange('metaTitleAr', e.target.value)}
                        placeholder="مثال: باركودي - مولد وقارئ الباركود ورموز QR الاحترافي"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isAr ? 'هذا النص هو ما يظهر في أعلى نافذة وتبويب المتصفح ومحركات البحث.' : 'Displays in browser tab and search results.'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'عنوان تبويب المتصفح (Page Title - إنكليزي):' : 'Browser Tab Title (English):'}
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitleEn}
                        onChange={(e) => handleChange('metaTitleEn', e.target.value)}
                        placeholder="e.g. Barcodey - Free QR & Barcode Generator"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Logo & Favicon Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Header Logo */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        {isAr ? 'شعار الموقع (Logo)' : 'Header Logo'}
                      </h4>
                      {formData.customLogoUrl && (
                        <button
                          type="button"
                          onClick={() => handleChange('customLogoUrl', '')}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          {isAr ? 'استعادة الافتراضي' : 'Reset to Default'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.customLogoUrl ? (
                          <img
                            src={formData.customLogoUrl}
                            alt="Logo Preview"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                            LOGO
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          {isAr ? 'رفع صورة الشعار' : 'Upload Logo'}
                          <input
                            type="file"
                            accept="image/*,.svg"
                            onChange={(e) => handleFileUpload(e, 'customLogoUrl')}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={formData.customLogoUrl}
                          onChange={(e) => handleChange('customLogoUrl', e.target.value)}
                          placeholder={isAr ? 'أو أدخل رابط الشعار URL' : 'Or paste Logo URL'}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white dir-ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Favicon */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        {isAr ? 'أيقونة التبويب (Favicon)' : 'Browser Favicon'}
                      </h4>
                      {formData.customFaviconUrl && (
                        <button
                          type="button"
                          onClick={() => handleChange('customFaviconUrl', '')}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          {isAr ? 'استعادة الافتراضي' : 'Reset'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.customFaviconUrl ? (
                          <img
                            src={formData.customFaviconUrl}
                            alt="Favicon Preview"
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Globe className="w-7 h-7 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          {isAr ? 'رفع أيقونة Favicon' : 'Upload Favicon'}
                          <input
                            type="file"
                            accept="image/*,.ico,.svg"
                            onChange={(e) => handleFileUpload(e, 'customFaviconUrl')}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={formData.customFaviconUrl}
                          onChange={(e) => handleChange('customFaviconUrl', e.target.value)}
                          placeholder={isAr ? 'أو أدخل رابط Favicon URL' : 'Or paste Favicon URL'}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white dir-ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Subtitles, Badges and User Headings */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {isAr ? 'العناوين والوصف والشارات المعروضة للزوار' : 'Headlines, Subtitles & Badges'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'الوصف الترويجي أسفل العنوان (بالعربية):' : 'Header Subtitle (Arabic):'}
                      </label>
                      <input
                        type="text"
                        value={formData.siteSubtitleAr}
                        onChange={(e) => handleChange('siteSubtitleAr', e.target.value)}
                        placeholder="صمّم، تخصّص، وتنزّل رموز QR والباركود الاحترافية..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'الوصف الترويجي أسفل العنوان (بالإنكليزية):' : 'Header Subtitle (English):'}
                      </label>
                      <input
                        type="text"
                        value={formData.siteSubtitleEn}
                        onChange={(e) => handleChange('siteSubtitleEn', e.target.value)}
                        placeholder="Design, customize, and download high-resolution QR codes..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'نص الشارة بجانب الشعار (Badge):' : 'Header Badge Label:'}
                      </label>
                      <input
                        type="text"
                        value={formData.siteBadgeText}
                        onChange={(e) => handleChange('siteBadgeText', e.target.value)}
                        placeholder="مثال: PRO أو مجاني (اتركه فارغاً للإخفاء)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'حقوق النشر في الفوتر (عربي):' : 'Footer Copyright (Arabic):'}
                      </label>
                      <input
                        type="text"
                        value={formData.footerCopyrightTextAr}
                        onChange={(e) => handleChange('footerCopyrightTextAr', e.target.value)}
                        placeholder="اتركه فارغاً للاعتماد التلقائي"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'حقوق النشر في الفوتر (إنكليزي):' : 'Footer Copyright (English):'}
                      </label>
                      <input
                        type="text"
                        value={formData.footerCopyrightTextEn}
                        onChange={(e) => handleChange('footerCopyrightTextEn', e.target.value)}
                        placeholder="Leave empty for auto generation"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADVANCED SEO & AI SEARCH OPTIMIZATION (GEO) */}
            {activeTab === 'seo' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-500" />
                    {isAr
                      ? 'التهيئة لمحركات البحث ومحركات الذكاء الاصطناعي (SEO & AI GEO)'
                      : 'SEO & Generative Engine Optimization (GEO)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'أدوات موسعة لرفع ترتيب الموقع في الصفحة الأولى لجوجل ومحركات الذكاء الاصطناعي (ChatGPT Search, Gemini, Perplexity, Claude).'
                      : 'Comprehensive tools for high ranking in Google Search and AI answer engines via Schema.org and LLM indexing.'}
                  </p>
                </div>

                {/* AI & Rich Data Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        {isAr ? 'البيانات المنظمة Schema.org (JSON-LD)' : 'Structured Data (Schema.org)'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'لظهور الموقع في النتائج الغنية والبطاقات في Google' : 'Enables Rich Snippets in Search'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableStructuredData}
                        onChange={(e) => handleChange('enableStructuredData', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-purple-600" />
                        {isAr ? 'تهيئة نماذج الـ AI واقتباسات الإجابات' : 'AI Model & LLM Citations (GEO)'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'لاقتباس الموقع في ChatGPT و Gemini و Perplexity' : 'Optimized for LLM retrieval and answers'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableAiSearchGeo}
                        onChange={(e) => handleChange('enableAiSearchGeo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Meta Titles & Descriptions */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {isAr ? 'عناوين ووصف محركات البحث (Meta Tags)' : 'Search Meta Tags'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'عنوان الصفحة لمحركات البحث (Meta Title - عربي):' : 'Meta Title (Arabic):'}
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
                        {isAr ? 'عنوان الصفحة لمحركات البحث (Meta Title - إنكليزي):' : 'Meta Title (English):'}
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
                        {isAr ? 'وصف الموقع لمحركات البحث (Meta Description - عربي):' : 'Meta Description (Arabic):'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.metaDescriptionAr}
                        onChange={(e) => handleChange('metaDescriptionAr', e.target.value)}
                        className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'وصف الموقع لمحركات البحث (Meta Description - إنكليزي):' : 'Meta Description (English):'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.metaDescriptionEn}
                        onChange={(e) => handleChange('metaDescriptionEn', e.target.value)}
                        className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الكلمات المفتاحية (Keywords مفصولة بفواصل):' : 'Meta Keywords (comma separated):'}
                    </label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => handleChange('metaKeywords', e.target.value)}
                      placeholder="باركود, رمز QR, qr code generator, ean13, code128..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'الرابط المعتمد الأساسي (Canonical URL):' : 'Canonical URL:'}
                      </label>
                      <input
                        type="url"
                        value={formData.canonicalUrl}
                        onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                        placeholder="https://your-domain.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'صورة المشاركة على السوشيال ميديا (OG Image URL):' : 'Social Share Image (OG Image):'}
                      </label>
                      <input
                        type="text"
                        value={formData.ogImageUrl}
                        onChange={(e) => handleChange('ogImageUrl', e.target.value)}
                        placeholder="https://your-domain.com/og-image.png"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* FAQ Schema for Google Rich Snippets & AI LLMs */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        {isAr ? 'مخطط الأسئلة الشائعة (FAQ Schema للمركز الأول والـ AI)' : 'FAQ Schema Builder for Rich Snippets'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr
                          ? 'هذه الأسئلة تُحقن تلقائياً كـ JSON-LD وتساعد جوجل والذكاء الاصطناعي على عرض إجابات موقعك مباشرة للباحثين.'
                          : 'Rich questions and answers injected as JSON-LD for search engines and AI assistants.'}
                      </p>
                    </div>

                    {!editingFaqId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFaqId('new');
                          setFaqForm({
                            id: 'faq_' + Date.now(),
                            questionAr: '',
                            questionEn: '',
                            answerAr: '',
                            answerEn: '',
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAr ? 'إضافة سؤال FAQ' : 'Add FAQ'}
                      </button>
                    )}
                  </div>

                  {/* FAQ Editing Form */}
                  {editingFaqId && (
                    <div className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {editingFaqId === 'new'
                            ? (isAr ? 'إضافة سؤال جديد إلى Schema' : 'Add New FAQ Schema Item')
                            : (isAr ? 'تعديل السؤال' : 'Edit FAQ Schema Item')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingFaqId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'السؤال (بالعربية):' : 'Question (Arabic):'}
                          </label>
                          <input
                            type="text"
                            value={faqForm.questionAr}
                            onChange={(e) => setFaqForm({ ...faqForm, questionAr: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'السؤال (بالإنكليزية):' : 'Question (English):'}
                          </label>
                          <input
                            type="text"
                            value={faqForm.questionEn}
                            onChange={(e) => setFaqForm({ ...faqForm, questionEn: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'الإجابة (بالعربية):' : 'Answer (Arabic):'}
                        </label>
                        <textarea
                          rows={2}
                          value={faqForm.answerAr}
                          onChange={(e) => setFaqForm({ ...faqForm, answerAr: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'الإجابة (بالإنكليزية):' : 'Answer (English):'}
                        </label>
                        <textarea
                          rows={2}
                          value={faqForm.answerEn}
                          onChange={(e) => setFaqForm({ ...faqForm, answerEn: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFaqId(null)}
                          className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!faqForm.questionAr && !faqForm.questionEn) {
                              alert(isAr ? 'يرجى كتابة نص السؤال.' : 'Please enter question text.');
                              return;
                            }
                            const existing = formData.faqSchemaList ? [...formData.faqSchemaList] : [];
                            const idx = existing.findIndex((f) => f.id === faqForm.id);
                            if (idx >= 0) {
                              existing[idx] = faqForm;
                            } else {
                              existing.push({ ...faqForm, id: faqForm.id || 'faq_' + Date.now() });
                            }
                            handleChange('faqSchemaList', existing);
                            setEditingFaqId(null);
                          }}
                          className="px-3.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow"
                        >
                          {isAr ? 'حفظ السؤال' : 'Save FAQ'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAQ List */}
                  <div className="space-y-2">
                    {(!formData.faqSchemaList || formData.faqSchemaList.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-3">
                        {isAr ? 'لا توجد أسئلة FAQ حالياً' : 'No FAQ schema items added yet'}
                      </p>
                    ) : (
                      formData.faqSchemaList.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {isAr ? item.questionAr || item.questionEn : item.questionEn || item.questionAr}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {isAr ? item.answerAr || item.answerEn : item.answerEn || item.answerAr}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFaqId(item.id);
                                setFaqForm({ ...item });
                              }}
                              className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleChange(
                                  'faqSchemaList',
                                  formData.faqSchemaList.filter((f) => f.id !== item.id)
                                );
                              }}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LLMs.txt & Robots.txt Generator & Viewer */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        {isAr ? 'ملفات الذكاء الاصطناعي (llms.txt & robots.txt)' : 'AI Indexing Files (llms.txt & robots.txt)'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'ملف llms.txt هو المعيار الحديث الذي تعتمده نماذج الذكاء الاصطناعي لقراءة وفهم موقعك بشكل دقيق.'
                          : 'Standard files for search engine bots and AI LLMs web-browsing crawlers.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAiFileView(activeAiFileView === 'llms' ? null : 'llms')}
                        className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-50"
                      >
                        {isAr ? 'معاينة llms.txt' : 'View llms.txt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAiFileView(activeAiFileView === 'robots' ? null : 'robots')}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {isAr ? 'معاينة robots.txt' : 'View robots.txt'}
                      </button>
                    </div>
                  </div>

                  {activeAiFileView && (
                    <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-2 dir-ltr">
                      <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                        <span>{activeAiFileView === 'llms' ? 'llms.txt (AI Knowledge Context)' : 'robots.txt (Crawler Directives)'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const content = activeAiFileView === 'llms' ? generateLlmsTxt(formData) : generateRobotsTxt(formData);
                            navigator.clipboard.writeText(content);
                            alert(isAr ? 'تم نسخ المحتوى إلى الحافظة!' : 'Copied to clipboard!');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {isAr ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                        {activeAiFileView === 'llms' ? generateLlmsTxt(formData) : generateRobotsTxt(formData)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Custom Head Scripts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'أكواد هيدر مخصصة (Google Search Console Verification, Analytics):' : 'Custom Head Scripts (<head>):'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.customHeaderScripts}
                    onChange={(e) => handleChange('customHeaderScripts', e.target.value)}
                    placeholder="<!-- Google Search Console verification meta tag, Google Analytics, Bing Webmaster -->"
                    className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 dir-ltr"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FEATURE TOGGLES */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                    {isAr ? 'إدارة أقسام وأدوات الموقع' : 'Module & Feature Management'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'التحكم الفوري في إظهار أو إخفاء التبويبات والمميزات (مثل رمز QR، الباركود، الماسح، وضع الصيانة).'
                      : 'Toggle on/off any tools or tabs instantly.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* QR Generator Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {isAr ? 'مولد رموز QR المخصص' : 'QR Code Generator'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'التبويب الأساسي لإنشاء رموز QR' : 'Main QR generation tool'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableQrGenerator}
                        onChange={(e) => handleChange('enableQrGenerator', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Barcode Generator Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {isAr ? 'مولد الباركود الخطي (EAN, Code128...)' : 'Linear Barcode Generator'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'توليد الباركود بمختلف الصيغ والمعايير' : 'Standard 1D barcode formats'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableBarcodeGenerator}
                        onChange={(e) => handleChange('enableBarcodeGenerator', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Batch Generator Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {isAr ? 'التوليد الجماعي والدفعات (Batch)' : 'Batch Bulk Generator'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'إنشاء مئات الرموز دفعة واحدة وتصديرها' : 'Bulk generation & CSV import'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableBatchGenerator}
                        onChange={(e) => handleChange('enableBatchGenerator', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Live Scanner Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {isAr ? 'ماسح الرمز بالكاميرا والصور' : 'Barcode & QR Scanner'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'قراءة الرموز عبر الكاميرا أو رفع الصور' : 'Scan via camera or uploaded file'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableScanner}
                        onChange={(e) => handleChange('enableScanner', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {/* Maintenance Mode Section */}
                <div className="p-5 rounded-2xl border-2 border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {isAr ? 'تفعيل وضع الصيانة (Maintenance Mode)' : 'Enable Maintenance Mode'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isAr
                            ? 'إظهار شاشة صيانة أنيقة للزوار وحجب أدوات الموقع'
                            : 'Displays maintenance view to public visitors'}
                        </p>
                      </div>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'رسالة الصيانة الموجهة للزوار:' : 'Maintenance Message:'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.maintenanceMessage}
                      onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GOOGLE ADSENSE */}
            {activeTab === 'adsense' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    {isAr ? 'إعلانات Google AdSense وإدارة الأماكن' : 'Google AdSense Monetization'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'ربط حساب الناشر، تفعيل الإعلانات التلقائية، والتحكم في إعلانات الهيدر والفوتر وداخل الصفحة.'
                      : 'Configure Publisher Client ID, Auto Ads, and custom responsive ad slots.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'معرّف الناشر (Publisher Client ID):' : 'Google AdSense Publisher ID:'}
                    </label>
                    <input
                      type="text"
                      value={formData.adsenseClientId}
                      onChange={(e) => handleChange('adsenseClientId', e.target.value)}
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'محتوى ملف ads.txt الخاص بك:' : 'ads.txt Content:'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.adsTxtContent}
                      onChange={(e) => handleChange('adsTxtContent', e.target.value)}
                      className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 dir-ltr"
                    />
                  </div>
                </div>

                {/* Ad Slots Toggles */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    {isAr ? 'أماكن عرض الإعلانات' : 'Ad Banner Placements'}
                  </h4>

                  {/* Header Ad */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {isAr ? 'إعلان أعلى الصفحة (أعلى الهيدر)' : 'Header Banner Ad (Top)'}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.enableHeaderAd}
                        onChange={(e) => handleChange('enableHeaderAd', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </div>
                    {formData.enableHeaderAd && (
                      <textarea
                        rows={2}
                        value={formData.headerAdCode}
                        onChange={(e) => handleChange('headerAdCode', e.target.value)}
                        placeholder="<!-- Paste <ins class='adsbygoogle'> code here -->"
                        className="w-full p-2 font-mono text-[11px] bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 dir-ltr"
                      />
                    )}
                  </div>

                  {/* In-Content / Middle Ad */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {isAr ? 'إعلان وسط الصفحة (بين الأدوات والتاريخ)' : 'In-Content Banner Ad (Middle)'}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.enableInContentAd}
                        onChange={(e) => handleChange('enableInContentAd', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </div>
                    {formData.enableInContentAd && (
                      <textarea
                        rows={2}
                        value={formData.inContentAdCode}
                        onChange={(e) => handleChange('inContentAdCode', e.target.value)}
                        placeholder="<!-- Paste <ins class='adsbygoogle'> code here -->"
                        className="w-full p-2 font-mono text-[11px] bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 dir-ltr"
                      />
                    )}
                  </div>

                  {/* Footer Ad */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {isAr ? 'إعلان أسفل الصفحة (قبل الفوتر)' : 'Footer Banner Ad (Bottom)'}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.enableFooterAd}
                        onChange={(e) => handleChange('enableFooterAd', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </div>
                    {formData.enableFooterAd && (
                      <textarea
                        rows={2}
                        value={formData.footerAdCode}
                        onChange={(e) => handleChange('footerAdCode', e.target.value)}
                        placeholder="<!-- Paste <ins class='adsbygoogle'> code here -->"
                        className="w-full p-2 font-mono text-[11px] bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 dir-ltr"
                      />
                    )}
                  </div>
                </div>

                {/* AdSense 100% Compatibility & Checklist Box */}
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                      {isAr ? 'فحص وتوافق معايير Google AdSense بنسبة 100%' : 'AdSense 100% Compliance Checklist'}
                    </h4>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>{isAr ? 'تم تضمين ملف ads.txt و robots.txt التلقائي في المسار الرئيسي للموقع.' : 'ads.txt and robots.txt auto-configured at root.'}</li>
                    <li>{isAr ? 'الصفحات القانونية (سياسة الخصوصية، شروط الاستخدام، من نحن، اتصل بنا) مفعلة ومتوافقة مع شروط إعلانات Google.' : 'Privacy Policy, Terms, About, and Contact pages enabled.'}</li>
                    <li>{isAr ? 'شريط الموافقة على ملفات الكوكيز (GDPR/CMP Consent) مدمج ومفعل.' : 'GDPR Cookie consent banner active.'}</li>
                    <li>{isAr ? 'محرك الإعلانات يدعم تطبيقات الصفحة الواحدة (React SPA) وتفعيل adsbygoogle.push() التلقائي.' : 'React SPA compatible ad renderer with safe push initialization.'}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: LEGAL & CUSTOM PAGES */}
            {activeTab === 'legal' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    {isAr ? 'الصفحات القانونية والسياسات والمستندات' : 'Legal Policies & Custom Pages'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'تعديل نصوص سياسة الخصوصية، شروط الاستخدام، من نحن، وإنشاء صفحات مخصصة إضافية.'
                      : 'Edit Privacy Policy, Terms, About Us, and create new custom pages.'}
                  </p>
                </div>

                {/* Quick preview buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenLegalPage('privacy')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    {isAr ? 'معاينة سياسة الخصوصية' : 'Preview Privacy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalPage('terms')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    {isAr ? 'معاينة شروط الاستخدام' : 'Preview Terms'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalPage('about')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    {isAr ? 'معاينة من نحن' : 'Preview About'}
                  </button>
                </div>

                {/* Privacy Policy */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {isAr ? 'سياسة الخصوصية (Privacy Policy)' : 'Privacy Policy'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      rows={4}
                      value={formData.privacyPolicyAr}
                      onChange={(e) => handleChange('privacyPolicyAr', e.target.value)}
                      placeholder="سياسة الخصوصية بالعربية..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <textarea
                      rows={4}
                      value={formData.privacyPolicyEn}
                      onChange={(e) => handleChange('privacyPolicyEn', e.target.value)}
                      placeholder="Privacy Policy in English..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white dir-ltr"
                    />
                  </div>
                </div>

                {/* Custom Pages Manager */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <FilePlus className="w-4 h-4" />
                        {isAr ? 'إدارة الصفحات المخصصة الإضافية' : 'Custom Pages Manager'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr
                          ? 'إنشاء صفحات جديدة وتحديد إمكانية ظهور الرابط في أسفل الموقع.'
                          : 'Create custom pages with optional footer links.'}
                      </p>
                    </div>
                    {!editingPageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPageId('new');
                          setPageForm({
                            id: 'page_' + Date.now(),
                            titleAr: '',
                            titleEn: '',
                            contentAr: '',
                            contentEn: '',
                            showInFooter: true,
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAr ? 'إضافة صفحة جديدة' : 'Add New Page'}
                      </button>
                    )}
                  </div>

                  {editingPageId && (
                    <div className="p-4 rounded-2xl border-2 border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {editingPageId === 'new'
                            ? (isAr ? 'إنشاء صفحة مخصصة جديدة' : 'Create Custom Page')
                            : (isAr ? 'تعديل الصفحة' : 'Edit Custom Page')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingPageId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'عنوان الصفحة (بالعربية):' : 'Page Title (Arabic):'}
                          </label>
                          <input
                            type="text"
                            value={pageForm.titleAr}
                            onChange={(e) => setPageForm({ ...pageForm, titleAr: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'عنوان الصفحة (بالإنكليزية):' : 'Page Title (English):'}
                          </label>
                          <input
                            type="text"
                            value={pageForm.titleEn}
                            onChange={(e) => setPageForm({ ...pageForm, titleEn: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white dir-ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'محتوى الصفحة (بالعربية):' : 'Content (Arabic):'}
                        </label>
                        <textarea
                          rows={4}
                          value={pageForm.contentAr}
                          onChange={(e) => setPageForm({ ...pageForm, contentAr: e.target.value })}
                          className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'محتوى الصفحة (بالإنكليزية):' : 'Content (English):'}
                        </label>
                        <textarea
                          rows={3}
                          value={pageForm.contentEn}
                          onChange={(e) => setPageForm({ ...pageForm, contentEn: e.target.value })}
                          className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white dir-ltr"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={pageForm.showInFooter}
                            onChange={(e) => setPageForm({ ...pageForm, showInFooter: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          {isAr ? 'إظهار في الفوتر' : 'Show in footer'}
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPageId(null)}
                            className="px-3 py-1 text-xs text-slate-500"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!pageForm.titleAr && !pageForm.titleEn) {
                                alert(isAr ? 'يرجى كتابة عنوان الصفحة.' : 'Please enter title.');
                                return;
                              }
                              const existing = formData.customPages ? [...formData.customPages] : [];
                              const idx = existing.findIndex((p) => p.id === pageForm.id);
                              if (idx >= 0) {
                                existing[idx] = { ...pageForm, updatedAt: Date.now() };
                              } else {
                                existing.push({ ...pageForm, id: pageForm.id || 'page_' + Date.now(), updatedAt: Date.now() });
                              }
                              handleChange('customPages', existing);
                              setEditingPageId(null);
                            }}
                            className="px-3.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow"
                          >
                            {isAr ? 'حفظ الصفحة' : 'Save Page'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List of Custom Pages */}
                  <div className="space-y-2">
                    {(!formData.customPages || formData.customPages.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        {isAr ? 'لم تقم بإنشاء أي صفحات مخصصة بعد' : 'No custom pages created yet'}
                      </p>
                    ) : (
                      formData.customPages.map((page) => (
                        <div
                          key={page.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {isAr ? page.titleAr || page.titleEn : page.titleEn || page.titleAr}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {page.showInFooter ? (isAr ? 'معروض في الفوتر' : 'In footer') : (isAr ? 'مخفي من الفوتر' : 'Hidden from footer')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenLegalPage(page.id)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              title={isAr ? 'معاينة' : 'Preview'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPageId(page.id);
                                setPageForm({ ...page });
                              }}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleChange(
                                  'customPages',
                                  formData.customPages?.filter((p) => p.id !== page.id) || []
                                );
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: COOKIE CMP */}
            {activeTab === 'cookie' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-amber-500" />
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
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {isAr ? 'تفعيل شريط الكوكيز أسفل الموقع' : 'Enable Bottom Cookie Banner'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isAr ? 'يظهر للزوار الجدد للحصول على الموافقة' : 'Displays consent bar for new visitors'}
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'نص إشعار الكوكيز (بالعربية):' : 'Cookie Banner Text (Arabic):'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.cookieConsentTextAr}
                      onChange={(e) => handleChange('cookieConsentTextAr', e.target.value)}
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'نص إشعار الكوكيز (بالإنكليزية):' : 'Cookie Banner Text (English):'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.cookieConsentTextEn}
                      onChange={(e) => handleChange('cookieConsentTextEn', e.target.value)}
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 dir-ltr text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SECRET LINK & ADMIN SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                      {isAr ? 'تخصيص رابط المشرف السري والحماية القصوى' : 'Custom Admin URL Route & Maximum Security'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isAr
                        ? 'تخصيص كامل لرابط الدخول السري، وإلغاء أي دخول مباشر بدون مصادقة، مع حماية متقدمة ضد التخمين.'
                        : 'Full customization of secret access URL, zero unauthenticated bypass, and anti-brute-force protection.'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                    <Shield className="w-3.5 h-3.5" />
                    {isAr ? 'الحماية القصوى مفعّلة' : 'Maximum Security Active'}
                  </span>
                </div>

                {/* Security Guarantee Notice */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold">
                      {isAr
                        ? 'تم إلغاء أي دخول مباشر للموقع بدون كلمة المرور!'
                        : 'Direct unauthenticated bypass is permanently disabled!'}
                    </p>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      {isAr
                        ? 'الرابط السري يقوم فقط بإظهار نافذة التحقق المشفرة ويطلب دائماً إدخال كلمة المرور / رمز PIN. بمجرد فتح الرابط، يتم تنظيف شريط المتصفح تلقائياً لعدم ترك أي أثر في السجل.'
                        : 'The secret URL only opens the encrypted verification gate and always requires PIN/Password. URL parameters are scrubbed upon entry for maximum privacy.'}
                    </p>
                  </div>
                </div>

                {/* Section 1: Custom Secret Link Builder */}
                <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {isAr ? 'رابط الدخول السري المخصص للوحة التحكم:' : 'Your Customized Secret Access Link:'}
                      </h4>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                        {isAr
                          ? 'هذا هو الرابط الوحيد الذي يفتح بوابة لوحة التحكم:'
                          : 'This is the dedicated secret URL that triggers the admin portal login:'}
                      </p>
                    </div>
                    <a
                      href={directSecretLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isAr ? 'تجربة الرابط' : 'Test URL'}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={directSecretLink}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 dir-ltr select-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecretLink}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-all"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
                    </button>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'هيكل وصيغة الرابط السري المفضلة لديك:' : 'Preferred Secret Route Format:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          (formData.secretAccessType || 'query') === 'query'
                            ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="secretAccessType"
                          checked={(formData.secretAccessType || 'query') === 'query'}
                          onChange={() => handleChange('secretAccessType', 'query')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {isAr ? 'معلمة استعلام (Query Parameter)' : 'Query Parameter (?param=key)'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono dir-ltr text-left">
                            /?param=secret_key
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          formData.secretAccessType === 'hash'
                            ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="secretAccessType"
                          checked={formData.secretAccessType === 'hash'}
                          onChange={() => handleChange('secretAccessType', 'hash')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {isAr ? 'مسار هاش مخصص (Hash Slug)' : 'Hash Path (#custom-slug)'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono dir-ltr text-left">
                            /#my-secret-portal-2026
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Route Customization Inputs */}
                  {(formData.secretAccessType || 'query') === 'query' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'اسم معلمة الرابط السري (Query Param Name):' : 'Secret Parameter Name:'}
                        </label>
                        <input
                          type="text"
                          value={formData.secretParamName || 'admin_key'}
                          onChange={(e) =>
                            handleChange('secretParamName', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                          }
                          placeholder="e.g. portal, mykey, auth_gate, x_control"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isAr ? 'اسم المتغير في الرابط' : 'URL parameter name'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'قيمة المفتاح السري (Secret Key Value):' : 'Secret Key Value:'}
                        </label>
                        <input
                          type="text"
                          value={formData.secretKey || 'admin123'}
                          onChange={(e) => handleChange('secretKey', e.target.value)}
                          placeholder="e.g. secret_token_xyz_2026"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isAr ? 'المفتاح السري للرابط' : 'Token value in URL'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isAr ? 'اسم مسار الهاش السري (Secret Hash Slug):' : 'Secret Hash Slug:'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">#</span>
                        <input
                          type="text"
                          value={(formData.secretSlug || 'portal-access-2026').replace(/^#/, '')}
                          onChange={(e) =>
                            handleChange('secretSlug', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                          }
                          placeholder="portal-access-2026"
                          className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white dir-ltr"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isAr
                          ? 'الرابط سيبدو كالتالي: yoursite.com/#your-slug'
                          : 'URL will look like: yoursite.com/#your-slug'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 2: Master Password / PIN */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4 text-indigo-500" />
                        {isAr ? 'كلمة المرور الرئيسية ورمز PIN للمشرف:' : 'Master Admin PIN & Password:'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'يُطلب هذا الرمز دائماً لتسجيل الدخول إلى لوحة التحكم.'
                          : 'Required on every admin panel login attempt.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        value={formData.adminPin}
                        onChange={(e) => handleChange('adminPin', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono tracking-wider text-slate-900 dark:text-white dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5 rtl:right-auto rtl:left-3 cursor-pointer"
                        title={showAdminPin ? 'إخفاء' : 'إظهار'}
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{isAr ? 'مستوى قوة الحماية:' : 'Security Strength:'}</span>
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
                </div>

                {/* Section 3: Hardening & Anti-Brute-Force Options */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    {isAr ? 'خيارات القفل الأمني والحماية المتقدمة:' : 'Security Lockout & Hardening Controls:'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Keyboard Shortcut Toggle */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {isAr ? 'اختصار المفاتيح (Ctrl+Shift+A)' : 'Shortcut (Ctrl+Shift+A)'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'يمكنك إيقافه للتخفي التام' : 'Disable for complete stealth'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.enableKeyboardShortcut ?? true}
                          onChange={(e) => handleChange('enableKeyboardShortcut', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Auto Session Inactivity Timeout */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {isAr ? 'تسجيل الخروج التلقائي عند الخمول' : 'Inactivity Auto-Logout'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'قفل اللوحة عند تركها دون استخدام' : 'Locks dashboard when inactive'}
                        </p>
                      </div>
                      <select
                        value={formData.sessionTimeoutMinutes || 15}
                        onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      >
                        <option value={5}>5 {isAr ? 'دقائق' : 'min'}</option>
                        <option value={10}>10 {isAr ? 'دقائق' : 'min'}</option>
                        <option value={15}>15 {isAr ? 'دقيقة' : 'min'}</option>
                        <option value={30}>30 {isAr ? 'دقيقة' : 'min'}</option>
                        <option value={60}>60 {isAr ? 'دقيقة' : 'min'}</option>
                      </select>
                    </div>

                    {/* Max Failed Attempts */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {isAr ? 'أقصى عدد محاولات قبل الحظر' : 'Max Failed Attempts'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'صد محاولات التخمين الآلي' : 'Blocks brute-force bots'}
                        </p>
                      </div>
                      <select
                        value={formData.maxFailedAttempts || 4}
                        onChange={(e) => handleChange('maxFailedAttempts', Number(e.target.value))}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      >
                        <option value={3}>3 {isAr ? 'محاولات' : 'attempts'}</option>
                        <option value={4}>4 {isAr ? 'محاولات' : 'attempts'}</option>
                        <option value={5}>5 {isAr ? 'محاولات' : 'attempts'}</option>
                        <option value={10}>10 {isAr ? 'محاولات' : 'attempts'}</option>
                      </select>
                    </div>

                    {/* Lockout Duration */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {isAr ? 'مدة الحظر المؤقت بعد الخطأ' : 'Lockout Freeze Duration'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'زمن القفل عند تكرار المحاولات' : 'Cooldown before retry'}
                        </p>
                      </div>
                      <select
                        value={formData.lockoutDurationMinutes || 5}
                        onChange={(e) => handleChange('lockoutDurationMinutes', Number(e.target.value))}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      >
                        <option value={3}>3 {isAr ? 'دقائق' : 'min'}</option>
                        <option value={5}>5 {isAr ? 'دقائق' : 'min'}</option>
                        <option value={10}>10 {isAr ? 'دقائق' : 'min'}</option>
                        <option value={30}>30 {isAr ? 'دقيقة' : 'min'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Security Audit Logs */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <History className="w-4 h-4 text-indigo-500" />
                        {isAr ? 'سجل تدقيق الأمان ومحاولات الدخول' : 'Security Audit & Login Activity Logs'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {isAr ? 'رصد حي لجميع محاولات الدخول الناجحة والمحجوبة' : 'Live monitor of successful and blocked login attempts'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshSecurityLogs}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {isAr ? 'تحديث' : 'Refresh'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSecurityLogs}
                        className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {(securityLogs.length === 0 ? getSecurityAuditLogs() : securityLogs).length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {isAr ? 'لا توجد أي أحداث أمنية مسجلة حتى الآن' : 'No security events recorded yet'}
                      </div>
                    ) : (
                      (securityLogs.length === 0 ? getSecurityAuditLogs() : securityLogs).map((log) => (
                        <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {log.type === 'success' ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : log.type === 'lockout' ? (
                              <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {isAr ? log.messageAr : log.messageEn}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>{log.device}</span>
                                <span>•</span>
                                <span>{log.browser} ({log.os})</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: BACKUP & RESTORE */}
            {activeTab === 'backup' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    {isAr ? 'النسخ الاحتياطي وإعادة ضبط المصنع' : 'Backup & Reset Configuration'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'تصدير كامل إعدادات الموقع والهوية والسيو كملف JSON أو استيرادها في أي وقت.'
                      : 'Export or import site configuration JSON backup file.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleExportJson}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-2 text-center transition-all group cursor-pointer"
                  >
                    <Download className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'تصدير نسخة احتياطية (JSON)' : 'Export Backup JSON'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isAr ? 'تنزيل ملف الإعدادات كاملاً' : 'Download settings backup'}
                    </span>
                  </button>

                  <label className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all group">
                    <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'استيراد نسخة احتياطية' : 'Import Backup JSON'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isAr ? 'رفع ملف الإعدادات المحفوظ' : 'Upload JSON backup'}
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={handleResetDefaults}
                    className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isAr ? 'استعادة ضبط المصنع لجميع الإعدادات' : 'Reset All Settings to Factory Defaults'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
