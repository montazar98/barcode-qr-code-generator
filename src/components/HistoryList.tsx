import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  Copy,
  Check,
  Cloud,
  HardDrive,
  LogIn,
  Sparkles,
  ExternalLink,
  QrCode,
  Barcode,
  CloudUpload,
} from 'lucide-react';
import { AppLanguage, CodeHistoryItem, CloudSavedCode } from '../types';
import { translations } from '../constants/translations';
import { User as FirebaseUser } from 'firebase/auth';

interface HistoryListProps {
  history: CodeHistoryItem[];
  cloudCodes: CloudSavedCode[];
  currentUser: FirebaseUser | null;
  lang: AppLanguage;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onDeleteCloudCode?: (id: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'signup') => void;
  onSyncAllLocalToCloud?: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  cloudCodes,
  currentUser,
  lang,
  onClearHistory,
  onDeleteItem,
  onDeleteCloudCode,
  onOpenAuthModal,
  onSyncAllLocalToCloud,
}) => {
  const isAr = lang === 'ar';
  const t = translations[lang];
  const labels = t.labels;

  const [activeSubTab, setActiveSubTab] = useState<'cloud' | 'local'>('cloud');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const displayList = activeSubTab === 'cloud' ? cloudCodes : history;

  const filtered = displayList.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.rawValue.toLowerCase().includes(search.toLowerCase()) ||
      item.subType.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: CodeHistoryItem | CloudSavedCode) => {
    const link = document.createElement('a');
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = item.previewDataUrl;
    link.click();
  };

  const handleBulkSync = async () => {
    if (onSyncAllLocalToCloud) {
      setSyncingAll(true);
      await onSyncAllLocalToCloud();
      setSyncingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Header & Sub-tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              <span>{isAr ? 'سجل الرموز والتخزين السحابي' : 'Code History & Cloud Storage'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'استعرض رموزك المحفوظة سحابياً على حسابك أو في الذاكرة المحلية للجهاز'
                : 'Browse codes synchronized with your cloud account or stored locally'}
            </p>
          </div>

          {/* Sub-tab Switchers */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('cloud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'cloud'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{isAr ? 'السحابة' : 'Cloud'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {cloudCodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'local'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{isAr ? 'المحلي' : 'Local'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {/* Cloud Status Banner (When Not Logged In) */}
        {activeSubTab === 'cloud' && !currentUser && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? 'سجّل دخولك لمزامنة الرموز سحابياً' : 'Sign in to sync your codes across all devices'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'احفظ جميع رموز الباركود و QR إلى الأبد مع إمكانية استرجاعها وتعديلها في أي وقت.'
                    : 'Store barcode & QR designs securely in Google Firebase with zero data loss.'}
                </p>
              </div>
            </div>

            {onOpenAuthModal && (
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الدخول السحابي' : 'Sign In with Firebase'}</span>
              </button>
            )}
          </div>
        )}

        {/* Sync Local to Cloud Action Banner */}
        {activeSubTab === 'local' && history.length > 0 && currentUser && onSyncAllLocalToCloud && (
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-semibold text-teal-900 dark:text-teal-200">
                {isAr
                  ? `لديك ${history.length} رمز محلي يمكنك نقلها ومزامنتها مع حسابك السحابي.`
                  : `You have ${history.length} local codes ready to sync to Firebase.`}
              </span>
            </div>
            <button
              onClick={handleBulkSync}
              disabled={syncingAll}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {syncingAll ? (isAr ? 'جارِ النقل...' : 'Syncing...') : (isAr ? 'مزامنة الكل للسحابة' : 'Sync All to Cloud')}
            </button>
          </div>
        )}

        {/* Search Input & Action buttons */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'البحث في المحفوظات بالاسم أو المحتوى أو النوع...' : 'Search saved codes...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeSubTab === 'local' && history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{labels.clearHistory}</span>
            </button>
          )}
        </div>

        {/* List of Saved Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs space-y-2">
            <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p>{labels.noHistory}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/80 dark:text-indigo-300">
                      {item.kind.toUpperCase()} ({item.subType})
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[120px]">
                    <img
                      src={item.previewDataUrl}
                      alt={item.title}
                      className="max-h-24 object-contain"
                    />
                  </div>

                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate dir-ltr">
                    {item.rawValue}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                      title={isAr ? 'تحميل الصورة' : 'Download'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(item.id, item.rawValue)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      title={isAr ? 'نسخ القيمة' : 'Copy'}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (activeSubTab === 'cloud' && onDeleteCloudCode) {
                        onDeleteCloudCode(item.id);
                      } else {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
