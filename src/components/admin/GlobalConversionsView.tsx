import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  QrCode,
  Barcode,
  Search,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Filter,
  Calendar,
  Globe,
  User,
  ArrowUpDown,
  Smartphone,
  Monitor,
  Tablet,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ConversionLogItem, AppLanguage } from '../../types';
import { fetchAdminConversions, getAuthHeaders } from '../../lib/firebase';

interface GlobalConversionsViewProps {
  lang: AppLanguage;
  onNotification?: (msg: string) => void;
}

export const GlobalConversionsView: React.FC<GlobalConversionsViewProps> = ({
  lang,
  onNotification,
}) => {
  const isAr = lang === 'ar';
  const [logs, setLogs] = useState<ConversionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'url' | 'social' | 'qr' | 'barcode'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ConversionLogItem | null>(null);

  const [metrics, setMetrics] = useState({
    totalConversions: 0,
    todayConversions: 0,
    qrCount: 0,
    barcodeCount: 0,
    urlCount: 0,
    topDomains: [] as { domain: string; count: number }[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminConversions();
      setLogs(data.logs);
      setMetrics({
        totalConversions: data.totalConversions,
        todayConversions: data.todayConversions,
        qrCount: data.qrCount,
        barcodeCount: data.barcodeCount,
        urlCount: data.urlCount,
        topDomains: data.topDomains,
      });
    } catch (err) {
      console.error('Error loading conversions log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyValue = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onNotification) onNotification(isAr ? 'تم نسخ الرابط/النص إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Delete this conversion record?')) {
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/conversions/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
        if (onNotification) onNotification(isAr ? 'تم حذف السجل بنجاح' : 'Log record deleted');
      }
    } catch (e) {
      console.error('Error deleting conversion log:', e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(isAr ? 'تحذير: هل أنت متأكد من مسح جميع سجلات التحويل؟' : 'Warning: Clear all conversion records?')) {
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/conversions/clear', { method: 'POST', headers });
      if (res.ok) {
        setLogs([]);
        setMetrics((prev) => ({ ...prev, totalConversions: 0, todayConversions: 0 }));
        if (onNotification) onNotification(isAr ? 'تم مسح السجل بالكامل' : 'All conversion records cleared');
      }
    } catch (e) {
      console.error('Error clearing conversions:', e);
    }
  };

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['ID', 'Date', 'Kind', 'Type', 'Value/URL', 'User Name', 'User Email', 'Country'];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.kind,
      l.subType,
      `"${(l.rawValue || '').replace(/"/g, '""')}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      l.userEmail || 'N/A',
      l.country || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `barcode_conversions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // Type Filter
      if (typeFilter === 'url') {
        const isUrl = item.subType === 'url' || item.rawValue.startsWith('http://') || item.rawValue.startsWith('https://') || item.rawValue.startsWith('www.');
        if (!isUrl) return false;
      } else if (typeFilter === 'social') {
        const isSocial = ['whatsapp', 'vcard', 'email', 'phone', 'sms'].includes(item.subType) || item.rawValue.includes('wa.me') || item.rawValue.includes('mailto:') || item.rawValue.includes('tel:');
        if (!isSocial) return false;
      } else if (typeFilter === 'qr' && item.kind !== 'qr') {
        return false;
      } else if (typeFilter === 'barcode' && item.kind !== 'barcode') {
        return false;
      }

      // Domain Filter
      if (selectedDomain) {
        if (!item.rawValue.toLowerCase().includes(selectedDomain.toLowerCase())) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchVal = item.rawValue.toLowerCase().includes(q);
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchUser = item.userName?.toLowerCase().includes(q);
        const matchEmail = item.userEmail?.toLowerCase().includes(q);
        const matchSub = item.subType?.toLowerCase().includes(q);
        const matchCountry = item.country?.toLowerCase().includes(q);
        return matchVal || matchTitle || matchUser || matchEmail || matchSub || matchCountry;
      }
      return true;
    });
  }, [logs, typeFilter, selectedDomain, searchQuery]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return isAr
      ? d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (timestamp: number) => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return isAr ? 'الآن' : 'just now';
    if (diff < 3600) return isAr ? `منذ ${Math.floor(diff / 60)} دقيقة` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isAr ? `منذ ${Math.floor(diff / 3600)} ساعة` : `${Math.floor(diff / 3600)}h ago`;
    return isAr ? `منذ ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
  };

  const isUrlFormat = (str: string) => {
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('www.');
  };

  return (
    <div className="space-y-6" id="global-conversions-view">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Link2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">
              {isAr ? 'سجل الروابط والباركودات المحولة' : 'Converted Links & Barcodes Audit Log'}
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isAr
              ? 'متابعة حية لجميع الروابط والنصوص التي قام المستخدمون والزوار بتحويلها إلى باركود أو QR Code'
              : 'Live tracking of all URLs and payloads converted into QR Codes and Barcodes by users'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!logs.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Conversions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'إجمالي التحويلات' : 'Total Conversions'}
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{metrics.totalConversions}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {metrics.todayConversions} {isAr ? 'تحويل اليوم' : 'conversions today'}
          </span>
        </div>

        {/* URLs Converted */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'روابط مواقع ويب' : 'Web URLs'}
            </span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 mt-2">{metrics.urlCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.totalConversions > 0 ? Math.round((metrics.urlCount / metrics.totalConversions) * 100) : 0}% {isAr ? 'من الإجمالي' : 'of total'}
          </span>
        </div>

        {/* QR Codes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'رموز QR Code' : 'QR Codes'}
            </span>
            <QrCode className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">{metrics.qrCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.totalConversions > 0 ? Math.round((metrics.qrCount / metrics.totalConversions) * 100) : 0}% {isAr ? 'رمز QR' : 'QR codes'}
          </span>
        </div>

        {/* Barcodes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'باركودات خطية' : 'Linear Barcodes'}
            </span>
            <Barcode className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics.barcodeCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.totalConversions > 0 ? Math.round((metrics.barcodeCount / metrics.totalConversions) * 100) : 0}% {isAr ? 'باركود خطي' : 'barcodes'}
          </span>
        </div>
      </div>

      {/* Top Domains Pill Bar */}
      {metrics.topDomains.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'أكثر المواقع والنطاقات تحويلاً:' : 'Top Converted Domains:'}
            </span>
            {selectedDomain && (
              <button
                onClick={() => setSelectedDomain(null)}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                ✕ {isAr ? 'إلغاء تصفية النطاق' : 'Clear domain filter'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.topDomains.map((d) => {
              const isSelected = selectedDomain === d.domain;
              return (
                <button
                  key={d.domain}
                  onClick={() => setSelectedDomain(isSelected ? null : d.domain)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600 hover:bg-slate-700/60'
                  }`}
                >
                  <Globe className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{d.domain}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {d.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الروابط المحولة، النصوص، أسماء المستخدمين، الدول...' : 'Search converted URLs, text, users, countries...'}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({logs.length})
            </button>
            <button
              onClick={() => setTypeFilter('url')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'روابط فقط' : 'URLs Only'}
            </button>
            <button
              onClick={() => setTypeFilter('social')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'social' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'تواصل / سوشيال' : 'Social / Contact'}
            </button>
            <button
              onClick={() => setTypeFilter('qr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'qr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setTypeFilter('barcode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === 'barcode' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barcode
            </button>
          </div>

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 text-xs font-medium transition-all"
            >
              {isAr ? 'مسح السجل' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Conversions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              {isAr ? 'قائمة الروابط والنصوص المحولة' : 'Converted Items List'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredLogs.length}
            </span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Link2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-base font-medium text-slate-300">
              {isAr ? 'لا توجد سجلات تحويل حتى الآن' : 'No conversion logs recorded yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'أي رابط أو نص يحوله المستخدم أو الزائر لباركود يتم تسجيله تلقائياً هنا مع التوقيت والمستخدم.'
                : 'Whenever a visitor or user generates a QR/Barcode, it will be automatically recorded here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">{isAr ? 'الرابط / القيمة المحولة' : 'Converted Payload / URL'}</th>
                  <th className="py-3 px-4">{isAr ? 'النوع' : 'Format'}</th>
                  <th className="py-3 px-4">{isAr ? 'تم التحويل بواسطة' : 'Converted By'}</th>
                  <th className="py-3 px-4">{isAr ? 'التوقيت والموقع' : 'Timestamp & Location'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredLogs.map((item) => {
                  const isUrl = isUrlFormat(item.rawValue);
                  const fullUrl = isUrl
                    ? item.rawValue.startsWith('http')
                      ? item.rawValue
                      : `https://${item.rawValue}`
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setPreviewItem(item)}
                    >
                      {/* Converted Value & Preview */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.previewDataUrl ? (
                            <img
                              src={item.previewDataUrl}
                              alt="Preview"
                              className="w-11 h-11 rounded-lg bg-white p-1 border border-slate-700 shrink-0 object-contain"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                              {item.kind === 'qr' ? <QrCode className="w-5 h-5" /> : <Barcode className="w-5 h-5" />}
                            </div>
                          )}

                          <div className="min-w-0 max-w-md">
                            <div className="font-medium text-white truncate flex items-center gap-1.5">
                              {isUrl ? (
                                <span className="text-emerald-400 font-mono text-xs hover:underline flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                                  <span className="truncate">{item.rawValue}</span>
                                </span>
                              ) : (
                                <span className="truncate">{item.rawValue}</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{item.title}</span>
                              {item.subType && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">
                                  {item.subType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code Kind */}
                      <td className="py-3 px-4">
                        {item.kind === 'qr' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <QrCode className="w-3 h-3" />
                            QR Code
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Barcode className="w-3 h-3" />
                            Barcode
                          </span>
                        )}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {item.userPhoto ? (
                            <img
                              src={item.userPhoto}
                              alt="Avatar"
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {item.userName || (isAr ? 'زائر' : 'Guest')}
                            </div>
                            {item.userEmail && (
                              <div className="text-[10px] text-slate-400 truncate">{item.userEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Timestamp & Location */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-300 font-medium">
                            {formatDate(item.createdAt)}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span>{getRelativeTime(item.createdAt)}</span>
                            {item.flag && <span>{item.flag}</span>}
                            {item.country && <span>{item.country}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {fullUrl && (
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              title={isAr ? 'فتح الرابط في علامة تبويب جديدة' : 'Open URL'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={() => handleCopyValue(item.id, item.rawValue)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={isAr ? 'نسخ الرابط / القيمة' : 'Copy value'}
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteLog(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title={isAr ? 'حذف من السجل' : 'Delete log'}
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
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {previewItem.kind === 'qr' ? <QrCode className="w-4 h-4 text-indigo-400" /> : <Barcode className="w-4 h-4 text-amber-400" />}
                <span>{previewItem.title}</span>
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {previewItem.previewDataUrl && (
              <div className="bg-white p-6 rounded-2xl flex items-center justify-center shadow-inner">
                <img
                  src={previewItem.previewDataUrl}
                  alt={previewItem.title}
                  className="max-h-56 max-w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-500 block mb-1">{isAr ? 'الرابط / المحتوى المحول:' : 'Converted Value:'}</span>
                <span className="text-emerald-400 font-mono text-sm break-all">{previewItem.rawValue}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-500 block">{isAr ? 'المستخدم:' : 'User:'}</span>
                  <span className="text-slate-200 font-medium">{previewItem.userName || (isAr ? 'زائر' : 'Guest')}</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-500 block">{isAr ? 'تاريخ التحويل:' : 'Date:'}</span>
                  <span className="text-slate-200 font-medium">{formatDate(previewItem.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleCopyValue(previewItem.id, previewItem.rawValue)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isAr ? 'نسخ الرابط' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
