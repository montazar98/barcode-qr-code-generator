import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Link2,
  Lock,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Eye,
  RefreshCw,
  QrCode,
  Search,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Globe,
  Filter,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { AppLanguage, DynamicQRCode } from '../../types';
import { getAdminDynamicQRs, updateDynamicQR, deleteDynamicQR } from '../../lib/firebase';
import { generateQRCanvas } from '../../utils/qrGenerator';

interface AdminDynamicQRViewProps {
  lang: AppLanguage;
}

export const AdminDynamicQRView: React.FC<AdminDynamicQRViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [items, setItems] = useState<DynamicQRCode[]>([]);
  const [totalDynamicQRs, setTotalDynamicQRs] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [activeQRs, setActiveQRs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'scans' | 'title'>('latest');

  // Edit Modal
  const [editingItem, setEditingItem] = useState<DynamicQRCode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<DynamicQRCode | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDynamicQRs();
      setItems(data.items || []);
      setTotalDynamicQRs(data.totalDynamicQRs || 0);
      setTotalScans(data.totalScans || 0);
      setActiveQRs(data.activeQRs || 0);
    } catch (err) {
      console.error('Error fetching admin dynamic QRs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await updateDynamicQR(editingItem.id, editingItem.userId, {
        title: editTitle.trim() || editingItem.title,
        targetUrl: editTargetUrl.trim() || editingItem.targetUrl,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, title: editTitle.trim() || i.title, targetUrl: editTargetUrl.trim() || i.targetUrl }
            : i
        )
      );
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update dynamic QR:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الرمز الديناميكي نهائياً؟' : 'Delete this dynamic QR permanently?')) {
      return;
    }
    try {
      await deleteDynamicQR(id, userId, true);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalDynamicQRs((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete dynamic QR:', err);
    }
  };

  const handleOpenPreview = async (item: DynamicQRCode) => {
    setPreviewItem(item);
    try {
      const canvas = await generateQRCanvas(item.shortUrl, {
        fgColor: '#1e1b4b',
        bgColor: '#ffffff',
        transparentBg: false,
        size: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        logoSizeRatio: 0.2,
        logoMargin: 2,
        dotStyle: 'square',
        eyeStyle: 'square',
      });
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Error generating preview canvas:', err);
    }
  };

  // Filtered and sorted items
  const filteredItems = items
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        item.id.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.targetUrl.toLowerCase().includes(term) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(term)) ||
        (item.userName && item.userName.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (statusFilter === 'active') return item.isActive !== false;
      if (statusFilter === 'inactive') return item.isActive === false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'scans') return (b.scansCount || 0) - (a.scansCount || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">
              {isAr ? 'إجمالي الرموز الديناميكية' : 'Total Dynamic QRs'}
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block mt-0.5">
              {totalDynamicQRs}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">
              {isAr ? 'إجمالي عمليات المسح' : 'Total Scan Events'}
            </span>
            <span className="text-2xl font-black text-amber-500 block mt-0.5">
              {totalScans}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">
              {isAr ? 'الرموز النشطة والفعالة' : 'Active & Routing'}
            </span>
            <span className="text-2xl font-black text-emerald-500 block mt-0.5">
              {activeQRs}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، الرابط، الحساب، أو المعرف...' : 'Search by name, link, user, or ID...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs focus:outline-none"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Status'}</option>
              <option value="active">{isAr ? 'نشط فقط' : 'Active Only'}</option>
              <option value="inactive">{isAr ? 'معطل' : 'Inactive'}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs focus:outline-none"
            >
              <option value="latest">{isAr ? 'الأحدث تحديثاً' : 'Recently Updated'}</option>
              <option value="scans">{isAr ? 'الأكثر مسحاً' : 'Most Scanned'}</option>
              <option value="title">{isAr ? 'أبجدياً' : 'Alphabetical'}</option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={isAr ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic QRs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">{isAr ? 'الرمز والمعرف' : 'QR & Code ID'}</th>
                <th className="p-4">{isAr ? 'المستخدم المنشئ' : 'Created By'}</th>
                <th className="p-4">{isAr ? 'الرابط المستهدف الحالي' : 'Current Destination URL'}</th>
                <th className="p-4 text-center">{isAr ? 'المسحات' : 'Scans'}</th>
                <th className="p-4">{isAr ? 'آخر تحديث' : 'Last Updated'}</th>
                <th className="p-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {isLoading
                      ? isAr
                        ? 'جاري تحميل الرموز الديناميكية...'
                        : 'Loading dynamic QR codes...'
                      : isAr
                      ? 'لا توجد رموز ديناميكية مطابقة للبحث.'
                      : 'No dynamic QR codes found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* QR and Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => handleOpenPreview(item)}
                          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer p-0.5 hover:border-indigo-500 shrink-0 overflow-hidden"
                        >
                          {item.previewDataUrl ? (
                            <img src={item.previewDataUrl} alt="QR" className="w-full h-full object-contain" />
                          ) : (
                            <QrCode className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                              /q/{item.id}
                            </span>
                            <button
                              onClick={() => handleCopyLink(item.shortUrl, item.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title={isAr ? 'نسخ الرابط' : 'Copy short link'}
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Created By User */}
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {item.userName ? item.userName.charAt(0).toUpperCase() : item.userEmail ? item.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-semibold block text-slate-800 dark:text-slate-200 text-xs">
                            {item.userName || (isAr ? 'مستخدم مسجل' : 'Registered User')}
                          </span>
                          {item.userEmail && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.userEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target URL */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="font-mono text-slate-700 dark:text-slate-300 truncate text-[11px]" dir="ltr">
                          {item.targetUrl}
                        </span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Scans Count */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <TrendingUp className="w-3 h-3" />
                        {item.scansCount || 0}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(item.updatedAt || item.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditTitle(item.title);
                            setEditTargetUrl(item.targetUrl);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                          title={isAr ? 'تعديل الوجهة' : 'Edit destination'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.userId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                          title={isAr ? 'حذف الرمز' : 'Delete QR'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isAr ? 'تعديل رمز QR الديناميكي' : 'Edit Dynamic QR Code'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الرابط المستهدف الجديد' : 'New Destination URL'}
                </label>
                <input
                  type="url"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                {isAr ? 'حفظ التعديل' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {previewItem.title}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center max-w-[220px] mx-auto">
              {previewDataUrl && (
                <img src={previewDataUrl} alt="QR Preview" className="w-full h-full object-contain" />
              )}
            </div>

            <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700" dir="ltr">
              {previewItem.shortUrl}
            </div>

            <button
              onClick={() => {
                if (!previewDataUrl) return;
                const a = document.createElement('a');
                a.href = previewDataUrl;
                a.download = `dynamic-qr-${previewItem.id}.png`;
                a.click();
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              {isAr ? 'تحميل صورة QR' : 'Download QR Image'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
