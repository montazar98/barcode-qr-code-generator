import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Link2,
  Lock,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Eye,
  RefreshCw,
  QrCode,
  AlertCircle,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  Globe,
  Sliders,
  CheckCircle2,
  LogIn,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { AppLanguage, DynamicQRCode, QRStyleOptions } from '../../types';
import {
  createDynamicQR,
  getUserDynamicQRs,
  updateDynamicQR,
  deleteDynamicQR,
} from '../../lib/firebase';
import { generateQRCanvas, generateQRSVG } from '../../utils/qrGenerator';
import { isValidSafeUrl } from '../../utils/crypto';
import { User as FirebaseUser } from 'firebase/auth';

interface DynamicQRManagerProps {
  lang: AppLanguage;
  currentUser: FirebaseUser | null;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onLogConversion?: (rawValue: string, title: string, previewUrl?: string) => void;
}

export const DynamicQRManager: React.FC<DynamicQRManagerProps> = ({
  lang,
  currentUser,
  onOpenAuthModal,
  onLogConversion,
}) => {
  const isAr = lang === 'ar';

  const [items, setItems] = useState<DynamicQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for creating new Dynamic QR
  const [newTitle, setNewTitle] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('https://');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editing State
  const [editingItem, setEditingItem] = useState<DynamicQRCode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Preview & Download Modal State
  const [previewModalItem, setPreviewModalItem] = useState<DynamicQRCode | null>(null);
  const [modalDataUrl, setModalDataUrl] = useState<string | null>(null);
  const [modalSvg, setModalSvg] = useState<string | null>(null);

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load user's dynamic QRs
  const loadUserQRs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const list = await getUserDynamicQRs(currentUser.uid);
      setItems(list);
    } catch (err) {
      console.error('Error fetching dynamic QRs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUserQRs();
    } else {
      setItems([]);
    }
  }, [currentUser]);

  // Handle Create Dynamic QR
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal('login');
      return;
    }

    if (!newTargetUrl || !newTargetUrl.trim() || newTargetUrl === 'https://') {
      setErrorMsg(isAr ? 'يرجى إدخال الرابط المستهدف بشكل صحيح.' : 'Please enter a valid target URL.');
      return;
    }

    let validUrl = newTargetUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    if (!isValidSafeUrl(validUrl)) {
      setErrorMsg(isAr ? 'الرابط غير آمن أو غير صالح. يرجى استخدام رابط يبدأ بـ https:// أو http://' : 'Invalid or unsafe URL. Must start with http:// or https://');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const defaultQrOptions: QRStyleOptions = {
        fgColor: '#1e1b4b',
        bgColor: '#ffffff',
        transparentBg: false,
        size: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        logoSizeRatio: 0.2,
        logoMargin: 2,
        dotStyle: 'square',
        eyeStyle: 'square',
      };

      // 1. Create on Server / Firestore to get permanent short code
      const result = await createDynamicQR({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        title: newTitle.trim() || (isAr ? 'رمز QR ديناميكي' : 'Dynamic QR Code'),
        targetUrl: validUrl,
        qrOptions: defaultQrOptions,
      });

      // 2. Generate permanent QR image containing the short URL
      if (result && result.shortUrl) {
        const canvas = await generateQRCanvas(result.shortUrl, defaultQrOptions);
        const dataUrl = canvas.toDataURL('image/png');

        // Update item with previewDataUrl
        await updateDynamicQR(result.id, currentUser.uid, {
          previewDataUrl: dataUrl,
        });

        result.previewDataUrl = dataUrl;

        // Log conversion
        if (onLogConversion) {
          onLogConversion(result.shortUrl, result.title, dataUrl);
        }
      }

      setItems((prev) => [result, ...prev]);
      setNewTitle('');
      setNewTargetUrl('https://');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Failed to create dynamic QR:', err);
      setErrorMsg(err?.message || (isAr ? 'فشل إنشاء رمز QR الديناميكي.' : 'Failed to create dynamic QR.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingItem || !currentUser) return;
    if (!editTargetUrl.trim()) return;

    let validUrl = editTargetUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    if (!isValidSafeUrl(validUrl)) {
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateDynamicQR(editingItem.id, currentUser.uid, {
        title: editTitle.trim() || editingItem.title,
        targetUrl: validUrl,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, title: editTitle.trim() || item.title, targetUrl: validUrl, updatedAt: Date.now() }
            : item
        )
      );

      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update dynamic QR:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDynamicQR(id, currentUser.uid);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeletingId(null);
      if (previewModalItem?.id === id) {
        setPreviewModalItem(null);
      }
    } catch (err) {
      console.error('Failed to delete dynamic QR:', err);
    }
  };

  // Copy Link to clipboard
  const handleCopyLink = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Preview Modal
  const handleOpenPreview = async (item: DynamicQRCode) => {
    setPreviewModalItem(item);
    const options: QRStyleOptions = {
      fgColor: item.qrOptions?.fgColor || '#1e1b4b',
      bgColor: item.qrOptions?.bgColor || '#ffffff',
      transparentBg: false,
      size: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      logoSizeRatio: 0.2,
      logoMargin: 2,
      dotStyle: 'square',
      eyeStyle: 'square',
    };

    try {
      const canvas = await generateQRCanvas(item.shortUrl, options);
      setModalDataUrl(canvas.toDataURL('image/png'));
      const svg = await generateQRSVG(item.shortUrl, options);
      setModalSvg(svg);
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  // Download PNG
  const handleDownloadPNG = () => {
    if (!modalDataUrl || !previewModalItem) return;
    const a = document.createElement('a');
    a.href = modalDataUrl;
    a.download = `dynamic-qr-${previewModalItem.id}.png`;
    a.click();
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!modalSvg || !previewModalItem) return;
    const blob = new Blob([modalSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynamic-qr-${previewModalItem.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Total statistics
  const totalScans = items.reduce((acc, curr) => acc + (curr.scansCount || 0), 0);

  // If user is not logged in: Show Premium / Account Required Hero
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-indigo-700/50">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isAr ? 'ميزة حصرية للمستخدمين المسجلين' : 'Exclusive for Registered Accounts'}
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              {isAr ? 'نظام QR Code الديناميكي الذكي' : 'Smart Dynamic QR Code System'}
            </h2>

            <p className="text-indigo-100 text-base md:text-lg leading-relaxed mb-8">
              {isAr
                ? 'أنشئ رمز QR مرة واحدة واطبعه على بطاقاتك أو منتجاتك، وعدّل الرابط المستهدف في أي وقت ومن أي مكان دون الحاجة لإعادة طباعة الرمز إطلاقاً!'
                : 'Generate a QR code once, print it anywhere, and update the destination URL at any time without ever reprinting your materials!'}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <LogIn className="w-5 h-5" />
                {isAr ? 'تسجيل حساب مجاناً للبدء' : 'Create Free Account to Start'}
              </button>
              <button
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold transition-all border border-indigo-400/30"
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'تعديل الرابط في أي وقت' : 'Change Target URL Anytime'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'غيّر الرابط المستهدف متى شئت. صورة الرمز المطبوعة تظل كما هي وتوجه الزائر فوراً للرابط الجديد.'
                : 'Update the destination URL unlimited times without changing the printed QR image.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'إحصائيات المسح والزيارات' : 'Scan & Click Analytics'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'تتبع عدد المرات التي تم فيها مسح كل رمز QR وتوقيت آخر مسح في الوقت الفعلي.'
                : 'Track total scans and monitor when users interact with your physical barcodes and QR codes.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'حماية وأمان عالي' : 'Secure & Unguessable'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'معرفات عشوائية مشفرة غير قابلة للتخمين، مع صلاحيات تعديل خاصة بصاحب الحساب فقط.'
                : 'Cryptographically generated identifiers preventing enumeration and unauthorized tampering.'}
            </p>
          </div>
        </div>

        {/* Free QR info */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
          <span>
            {isAr
              ? 'ملاحظة: يمكنك الاستمرار في استخدام رموز QR العادية (الثابتة) وتوليد الباركود مجاناً بدون تسجيل حساب من التبويب الرئيسي.'
              : 'Note: You can always use standard static QR codes and barcodes for free without creating an account from the main tab.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Dashboard Metrics */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-700/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isAr ? 'نظام الرموز الديناميكية القابلة للتعديل' : 'Dynamic QR Management Studio'}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isAr ? 'رموز QR الديناميكية الخاصة بك' : 'Your Dynamic QR Codes'}
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              {isAr
                ? 'عـدّل الروابط المستهدفة في أي وقت وتابع إحصائيات المسح دون تغيير صورة الرمز الأصلية'
                : 'Modify destination URLs anytime and monitor scan metrics without changing the original QR'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              {isAr ? 'إنشاء QR ديناميكي جديد' : 'New Dynamic QR'}
            </button>
            <button
              onClick={loadUserQRs}
              disabled={isLoading}
              title={isAr ? 'تحديث' : 'Refresh'}
              className="p-3 rounded-xl bg-indigo-700/50 hover:bg-indigo-700 text-white border border-indigo-500/30 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-700/50">
          <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/20">
            <span className="text-xs text-indigo-300 font-medium block">
              {isAr ? 'إجمالي الرموز النشطة' : 'Total Active QRs'}
            </span>
            <span className="text-2xl font-black text-white mt-1 block">{items.length}</span>
          </div>
          <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/20">
            <span className="text-xs text-indigo-300 font-medium block">
              {isAr ? 'إجمالي عمليات المسح' : 'Total Scans'}
            </span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{totalScans}</span>
          </div>
          <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/20 col-span-2 sm:col-span-1">
            <span className="text-xs text-indigo-300 font-medium block">
              {isAr ? 'الحساب المرتبط' : 'Connected Account'}
            </span>
            <span className="text-sm font-semibold text-indigo-100 truncate mt-1 block">
              {currentUser.email || currentUser.displayName || 'مستخدم مسجل'}
            </span>
          </div>
        </div>
      </div>

      {/* CREATE FORM COLLAPSIBLE / MODAL */}
      {isCreating && (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isAr ? 'إنشاء رمز QR ديناميكي جديد' : 'Create New Dynamic QR'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'سيتم توليد رابط ثابت فريد مشفر داخل رمز QR يتيح لك تعديل الوجهة متى شئت'
                    : 'A unique permanent short link will be encoded into the QR allowing endless destination edits'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم أو عنوان رمز QR (لتمييزه في قائمتك)' : 'QR Title or Label'}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={isAr ? 'مثال: قائمة الطعام، صفحة الانستغرام، موقع الشركة...' : 'e.g. Menu, Instagram, Landing Page'}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الرابط المستهدف الأولي (يمكنك تغييره لاحقاً بأي وقت)' : 'Initial Destination URL (Editable later)'}
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="https://example.com/your-destination"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                  dir="ltr"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAr ? 'إنشاء وتوليد الرمز الآن' : 'Create & Generate QR'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ITEMS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            {isAr ? 'قائمة الرموز الديناميكية' : 'Dynamic QRs List'}
            <span className="text-xs font-normal text-slate-400">({items.length})</span>
          </h3>
        </div>

        {items.length === 0 && !isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <QrCode className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لم تنشئ أي رمز QR ديناميكي بعد' : 'No Dynamic QR Codes Yet'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'أنشئ أول رمز QR ديناميكي لك الآن واطبع رمزه دون قلق من تغيير الرابط مستقبلاً!'
                : 'Create your first dynamic QR code and never worry about reprinting physical materials again!'}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إنشاء أول رمز ديناميكي' : 'Create First Dynamic QR'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Top Item Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail preview */}
                    <div
                      onClick={() => handleOpenPreview(item)}
                      className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden p-1 hover:border-indigo-500 transition-colors shrink-0"
                    >
                      {item.previewDataUrl ? (
                        <img
                          src={item.previewDataUrl}
                          alt="QR Thumbnail"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-7 h-7 text-indigo-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold">
                          /q/{item.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scans Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{item.scansCount || 0} {isAr ? 'مسح' : 'scans'}</span>
                  </div>
                </div>

                {/* Target URL Card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      {isAr ? 'الرابط المستهدف الحالي:' : 'Current Destination:'}
                    </span>
                    <a
                      href={item.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      {isAr ? 'زيارة الرابط' : 'Open Link'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800" dir="ltr">
                    {item.targetUrl}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(item.shortUrl, item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenPreview(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحميل QR' : 'Download'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditTitle(item.title);
                        setEditTargetUrl(item.targetUrl);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-all"
                      title={isAr ? 'تعديل الرابط المستهدف' : 'Edit destination URL'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 dark:hover:text-rose-400 transition-all"
                      title={isAr ? 'حذف الرمز' : 'Delete QR'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تعديل الرابط المستهدف' : 'Edit Target Destination'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'صورة QR المطبوعة ستبقى كما هي وتوجه فوراً للرابط الجديد'
                      : 'The QR image remains intact and immediately points to your new link'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'تسمية الرمز' : 'QR Label / Title'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الرابط المستهدف الجديد' : 'New Target URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={editTargetUrl}
                    onChange={(e) => setEditTargetUrl(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                    dir="ltr"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center gap-3 text-xs text-indigo-700 dark:text-indigo-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {isAr
                    ? 'التغيير فوري وسيسري في المرة القادمة التي يمسح فيها أي شخص الرمز!'
                    : 'Updates take effect instantly upon save on next scan!'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & DOWNLOAD MODAL */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6 text-center animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {previewModalItem.title}
              </h3>
              <button
                onClick={() => setPreviewModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {/* QR Canvas Display */}
            <div className="p-6 bg-white rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center max-w-[280px] mx-auto">
              {modalDataUrl ? (
                <img
                  src={modalDataUrl}
                  alt="Dynamic QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 truncate" dir="ltr">
                {previewModalItem.shortUrl}
              </div>
              <div className="text-slate-400">
                {isAr ? 'الوجهة الحالية: ' : 'Target: '}
                <span className="text-indigo-600 dark:text-indigo-400 font-mono truncate inline-block max-w-[220px] align-bottom" dir="ltr">
                  {previewModalItem.targetUrl}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadPNG}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                {isAr ? 'تحميل PNG' : 'Download PNG'}
              </button>
              <button
                onClick={handleDownloadSVG}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all"
              >
                <Download className="w-4 h-4" />
                {isAr ? 'تحميل SVG' : 'Download SVG'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'هل أنت متأكد من حذف هذا الرمز؟' : 'Confirm Deletion'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'عند الحذف، سيتوقف رمز QR هذا عن التحويل ولن يتمكن أي شخص من الوصول للرابط المستهدف.'
                : 'Deleting this dynamic QR will permanently deactivate the short redirection link.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
              >
                {isAr ? 'تأكيد الحذف' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
