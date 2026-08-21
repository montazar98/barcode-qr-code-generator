import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  RefreshCw,
  Trash2,
  Search,
  Compass,
  Laptop,
  Clock,
  Flame,
  ShieldCheck,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AnalyticsSummary, AppLanguage, VisitorLogEntry } from '../../types';
import {
  getAnalyticsSummary,
  fetchServerAnalyticsSummary,
  exportAnalyticsCSV,
  clearAnalyticsData,
  getFlagEmoji,
} from '../../utils/analytics';

interface AnalyticsViewProps {
  lang: AppLanguage;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ lang }) => {
  const [summary, setSummary] = useState<AnalyticsSummary>(getAnalyticsSummary());
  const [isLoading, setIsLoading] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'countries' | 'logs' | 'devices' | 'sources'>('countries');

  const isAr = lang === 'ar';

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchServerAnalyticsSummary();
      setSummary(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Auto refresh from central server every 6 seconds
    const interval = setInterval(refreshData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من مسح وتصفير كافة بيانات وإحصائيات الزوار الحقيقية من الخادم المركزي؟'
          : 'Are you sure you want to clear all real visitor analytics and history from the central server?'
      )
    ) {
      await clearAnalyticsData();
      await refreshData();
    }
  };

  // Filter countries
  const filteredCountries = summary.topCountries.filter((c) => {
    if (!countryFilter.trim()) return true;
    const q = countryFilter.toLowerCase();
    return (
      c.countryNameAr.toLowerCase().includes(q) ||
      c.countryNameEn.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().includes(q)
    );
  });

  // Calculate max daily visit for chart scaling
  const maxDailyVisit = Math.max(...summary.dailyHistory.map((d) => d.visits), 1);

  // Top Country
  const topCountry = summary.topCountries[0];

  // Device percentage
  const totalDeviceVisits =
    summary.deviceBreakdown.desktop + summary.deviceBreakdown.mobile + summary.deviceBreakdown.tablet || 0;
  const mobilePct =
    totalDeviceVisits > 0 ? Math.round((summary.deviceBreakdown.mobile / totalDeviceVisits) * 100) : 0;
  const desktopPct =
    totalDeviceVisits > 0 ? Math.round((summary.deviceBreakdown.desktop / totalDeviceVisits) * 100) : 0;
  const tabletPct =
    totalDeviceVisits > 0 ? Math.round((summary.deviceBreakdown.tablet / totalDeviceVisits) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              {isAr ? 'إحصائيات الزوار الحقيقية (Real-Time Analytics)' : 'Real-Time Visitor Analytics'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? 'خادم إحصائيات مركزي نشط 100%' : '100% Central Server Live'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'يتم احتساب كل زائر يدخل للموقع من أي هاتف أو كمبيوتر في العالم بشكل مركزي وفوري عبر الخادم.'
              : 'Every visitor from any device globally is tracked centrally in real-time via the server.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshData}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isLoading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث لحظي' : 'Live Refresh'}
          </button>

          <button
            type="button"
            onClick={exportAnalyticsCSV}
            disabled={summary.totalVisits === 0}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            {isAr ? 'تصدير CSV' : 'Export CSV'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 text-xs transition-colors cursor-pointer"
            title={isAr ? 'تصفير إحصائيات الزوار' : 'Clear Analytics'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pageviews */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'إجمالي الزيارات الفعلية' : 'Total Real Visits'}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalVisits.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Users className="w-3 h-3" />
            {summary.uniqueVisitors} {isAr ? 'زائر حقيقي فريد (Unique IP/ID)' : 'unique visitors'}
          </p>
        </div>

        {/* Today's Visits */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'زيارات اليوم' : "Today's Visits"}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.todayVisits.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? `الأمس: ${summary.yesterdayVisits} زيارة` : `Yesterday: ${summary.yesterdayVisits}`}
          </p>
        </div>

        {/* Top Country */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'أعلى دولة مصدراً' : 'Top Country'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{topCountry ? topCountry.flagEmoji : '🌐'}</span>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {topCountry
                  ? isAr
                    ? topCountry.countryNameAr
                    : topCountry.countryNameEn
                  : isAr
                  ? 'بانتظار الزوار'
                  : 'Awaiting visitors'}
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {topCountry ? `${topCountry.visits} زيارة (${topCountry.percentage}%)` : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Dominant Device */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{isAr ? 'نوع الجهاز الفعلي' : 'Main Device'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {mobilePct >= desktopPct ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalDeviceVisits === 0
              ? isAr
                ? 'لا يوجد'
                : 'None'
              : mobilePct >= desktopPct
              ? isAr
                ? 'الهاتف الجوال'
                : 'Mobile'
              : isAr
              ? 'أجهزة الكمبيوتر'
              : 'Desktop'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>📱 {mobilePct}%</span>
            <span>•</span>
            <span>💻 {desktopPct}%</span>
            <span>•</span>
            <span>📟 {tabletPct}%</span>
          </div>
        </div>
      </div>

      {/* 14-Day Timeline Chart */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            {isAr ? 'حركة الزيارات اليومية الحقيقية (آخر 14 يوماً)' : 'Real Daily Visits Trend (Last 14 Days)'}
          </h4>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'تحديث لحظي' : 'Live updates'}
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-32 flex items-end justify-between gap-1.5 sm:gap-2">
            {summary.dailyHistory.map((item, idx) => {
              const heightPct =
                item.visits > 0 ? Math.max(12, Math.round((item.visits / maxDailyVisit) * 100)) : 4;
              const isToday = idx === summary.dailyHistory.length - 1;
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-10">
                    <span className="font-bold">{item.visits}</span> {isAr ? 'زيارة فعلية' : 'visits'} ({item.date})
                  </div>

                  <div className="w-full h-24 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.visits === 0
                          ? 'bg-slate-200 dark:bg-slate-800'
                          : isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-teal-400 shadow-sm'
                          : 'bg-indigo-500/70 dark:bg-indigo-600/50 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('countries')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === 'countries'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'توزيع الدول والبلدان' : 'Countries & World Table'}
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {summary.topCountries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {isAr ? 'سجل الزيارات المباشر' : 'Live Visitor Log'}
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {summary.recentLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('devices')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === 'devices'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          {isAr ? 'الأجهزة والمتصفحات' : 'Devices & Browsers'}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sources')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeSubTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          {isAr ? 'مصادر الزيارات (Referrers)' : 'Traffic Sources'}
        </button>
      </div>

      {/* SUBTAB 1: COUNTRIES BREAKDOWN */}
      {activeSubTab === 'countries' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 rtl:right-3 ltr:left-3" />
              <input
                type="text"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                placeholder={isAr ? 'بحث عن دولة أو كود (SA, IQ...)' : 'Search country or code...'}
                className="w-full pr-9 pl-3 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? `عرض ${filteredCountries.length} من أصل ${summary.topCountries.length} دولة`
                : `Showing ${filteredCountries.length} of ${summary.topCountries.length} countries`}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">{isAr ? 'الدولة' : 'Country'}</th>
                    <th className="px-4 py-3">{isAr ? 'رمز ISO' : 'ISO'}</th>
                    <th className="px-4 py-3">{isAr ? 'الزيارات الفعلية' : 'Visits'}</th>
                    <th className="px-4 py-3">{isAr ? 'الزوار الفريدون' : 'Unique Visitors'}</th>
                    <th className="px-4 py-3">{isAr ? 'النسبة المئوية' : 'Share'}</th>
                    <th className="px-4 py-3">{isAr ? 'الشريط البياني' : 'Distribution'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredCountries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        {summary.totalVisits === 0
                          ? isAr
                            ? 'لم يتم تسجيل أي زيارات حقيقية حتى الآن. ستظهر الإحصائيات فور دخول الزوار للموقع.'
                            : 'No real visits recorded yet. Analytics will populate as visitors access the site.'
                          : isAr
                          ? 'لم يتم العثور على أي دولة تطابق البحث'
                          : 'No matching countries found'}
                      </td>
                    </tr>
                  ) : (
                    filteredCountries.map((c, index) => (
                      <tr
                        key={c.countryCode}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-400 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="text-lg">{c.flagEmoji}</span>
                          <span>{isAr ? c.countryNameAr : c.countryNameEn}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                            {c.countryCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {c.visits.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                          {c.uniqueVisitors}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                          {c.percentage}%
                        </td>
                        <td className="px-4 py-3 w-40">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(4, c.percentage)}%` }}
                              className="bg-indigo-600 h-full rounded-full"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: LIVE VISITOR LOG */}
      {activeSubTab === 'logs' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr
                ? `آخر ${summary.recentLogs.length} زيارة حقيقية مسجلة في الوقت الفعلي`
                : `Latest ${summary.recentLogs.length} real visits recorded`}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? 'مراقبة حية ونشطة' : 'Live active tracking'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-3">{isAr ? 'الوقت' : 'Time'}</th>
                    <th className="px-4 py-3">{isAr ? 'الدولة والمدينة' : 'Country & City'}</th>
                    <th className="px-4 py-3">{isAr ? 'الجهاز' : 'Device'}</th>
                    <th className="px-4 py-3">{isAr ? 'نظام التشغيل والمتصفح' : 'OS & Browser'}</th>
                    <th className="px-4 py-3">{isAr ? 'مصدر الإحالة' : 'Referrer'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {summary.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {isAr
                          ? 'لا توجد سجلات زيارة حالياً. يتم تسجيل أي زيارة حقيقية فوراً.'
                          : 'No visitor logs yet.'}
                      </td>
                    </tr>
                  ) : (
                    summary.recentLogs.map((log) => {
                      const timeAgo = formatTimeAgo(log.timestamp, isAr);
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {timeAgo}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-base">{log.flagEmoji}</span>
                            <div>
                              <p className="leading-tight">
                                {isAr ? log.countryNameAr : log.countryNameEn}
                              </p>
                              {log.city && (
                                <p className="text-[10px] text-slate-400 font-normal">{log.city}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                              {log.deviceType === 'mobile' ? (
                                <Smartphone className="w-3 h-3 text-indigo-500" />
                              ) : log.deviceType === 'tablet' ? (
                                <Tablet className="w-3 h-3 text-teal-500" />
                              ) : (
                                <Monitor className="w-3 h-3 text-blue-500" />
                              )}
                              {log.deviceType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {log.os} • {log.browser}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                            {log.referrer}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DEVICES & BROWSERS */}
      {activeSubTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Device & OS Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Laptop className="w-4 h-4" />
              {isAr ? 'توزيع الأجهزة وأنظمة التشغيل الفعلية' : 'Real Devices & Operating Systems'}
            </h4>

            {/* Devices breakdown */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                    {isAr ? 'الهواتف الذكية (Mobile)' : 'Smartphones (Mobile)'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.deviceBreakdown.mobile} ({mobilePct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${mobilePct}%` }} className="bg-indigo-600 h-full rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-500" />
                    {isAr ? 'أجهزة الكمبيوتر (Desktop)' : 'Computers (Desktop)'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.deviceBreakdown.desktop} ({desktopPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${desktopPct}%` }} className="bg-blue-600 h-full rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tablet className="w-3.5 h-3.5 text-teal-500" />
                    {isAr ? 'الأجهزة اللوحية (Tablet)' : 'Tablets'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {summary.deviceBreakdown.tablet} ({tabletPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${tabletPct}%` }} className="bg-teal-600 h-full rounded-full" />
                </div>
              </div>
            </div>

            {/* OS Breakdown */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {isAr ? 'أنظمة التشغيل' : 'Operating Systems'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.keys(summary.osBreakdown).length === 0 ? (
                  <p className="text-slate-400 text-[11px] col-span-2">{isAr ? 'لا توجد بيانات' : 'No data yet'}</p>
                ) : (
                  Object.entries(summary.osBreakdown).map(([osName, countVal]) => {
                    const count = Number(countVal);
                    const pct = Math.round((count / (summary.totalVisits || 1)) * 100);
                    return (
                      <div
                        key={osName}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{osName}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Browser Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              {isAr ? 'توزيع متصفحات الإنترنت الفعلية' : 'Real Web Browsers'}
            </h4>

            <div className="space-y-3">
              {Object.keys(summary.browserBreakdown).length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">{isAr ? 'لا توجد بيانات متصفحات مسجلة بعد' : 'No browser data yet'}</p>
              ) : (
                Object.entries(summary.browserBreakdown).map(([bName, countVal]) => {
                  const count = Number(countVal);
                  const pct = Math.round((count / (summary.totalVisits || 1)) * 100);
                  return (
                    <div key={bName}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{bName}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(5, pct)}%` }}
                          className="bg-indigo-600 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TRAFFIC SOURCES */}
      {activeSubTab === 'sources' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 animate-fade-in">
          <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            {isAr ? 'مصادر الزيارات والإحالات الفعلية (Referrers)' : 'Real Traffic Acquisition & Referrers'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(summary.referrerBreakdown).length === 0 ? (
              <p className="text-slate-400 text-xs py-4 col-span-2 text-center">{isAr ? 'لا توجد مصادر زيارات بعد' : 'No referrer data yet'}</p>
            ) : (
              Object.entries(summary.referrerBreakdown).map(([refName, countVal]) => {
                const count = Number(countVal);
                const pct = Math.round((count / (summary.totalVisits || 1)) * 100);
                return (
                  <div
                    key={refName}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-white">{refName}</p>
                      <p className="text-[10px] text-slate-400">{count} {isAr ? 'زيارة حقيقية' : 'real visits'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                      {pct}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Format time ago string
function formatTimeAgo(timestamp: number, isAr: boolean): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return isAr ? 'منذ لحظات' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}
