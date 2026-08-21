import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Cloud,
  LogOut,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  ExternalLink,
  QrCode,
  Barcode,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppLanguage, CloudSavedCode } from '../../types';
import { logOut, updateUserPreferences, deleteCodeFromCloud } from '../../lib/firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  cloudCodes: CloudSavedCode[];
  lang: AppLanguage;
  onSelectCode?: (code: CloudSavedCode) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  cloudCodes,
  lang,
  onSelectCode,
}) => {
  const isAr = lang === 'ar';
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud-codes'>('profile');

  if (!isOpen || !user) return null;

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    try {
      setLoadingName(true);
      setMsg(null);
      await updateUserPreferences(user.uid, { displayName: displayName.trim() });
      setIsEditingName(false);
      setMsg({
        type: 'success',
        text: isAr ? 'تم تحديث الاسم بنجاح!' : 'Name updated successfully!',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || (isAr ? 'حدث خطأ أثناء التحديث.' : 'Failed to update name.'),
      });
    } finally {
      setLoadingName(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا الرمز من السحابة؟' : 'Delete this code from cloud?')) {
      return;
    }
    try {
      await deleteCodeFromCloud(user.uid, codeId);
    } catch (err) {
      console.error('Delete cloud code error:', err);
    }
  };

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner font-extrabold text-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
              ) : (
                <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {user.displayName || (user.isAnonymous ? (isAr ? 'زائر سحابي' : 'Cloud Guest') : isAr ? 'مستخدم مسجل' : 'Registered User')}
              </h3>
              <p className="text-xs text-indigo-100 font-mono dir-ltr">{user.email || (isAr ? 'حساب مجهول (Guest)' : 'Anonymous account')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isAr ? 'الملف الشخصي والبيانات' : 'Profile & Account'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud-codes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cloud-codes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>{isAr ? 'الرموز السحابية المحفوظة' : 'Cloud Saved Codes'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold">
              {cloudCodes.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Status Message */}
          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{msg.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Cloud Sync Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-teal-50/60 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'حالة المزامنة السحابية' : 'Cloud Synchronization'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'الرموز تُحفظ سحابياً فور إنشائها' : 'Real-time sync to Firebase Firestore'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isAr ? 'متصل ونشط' : 'Active'}</span>
                </span>
              </div>

              {/* Edit Display Name */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'اسم المستخدم / العرض:' : 'Display Name:'}
                  </label>
                  {!isEditingName ? (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isAr ? 'تعديل الاسم' : 'Edit'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={isAr ? 'أدخل اسمك الجديد' : 'Enter new name'}
                      className="flex-grow px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={loadingName}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {loadingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>{isAr ? 'حفظ' : 'Save'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.displayName || (user.isAnonymous ? (isAr ? 'زائر' : 'Guest') : isAr ? 'غير محدد' : 'Not set')}
                  </p>
                )}
              </div>

              {/* Account Details */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'تفاصيل الحساب والأمان:' : 'Account & Security Details:'}
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">{isAr ? 'طريقة التسجيل:' : 'Auth Method:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {isGoogleUser ? 'Google Account' : user.isAnonymous ? 'Guest / Anonymous' : 'Email & Password'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">{isAr ? 'معرّف المستخدم (UID):' : 'Firebase UID:'}</span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 dir-ltr">{user.uid}</span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">{isAr ? 'عدد الرموز المحفوظة بالسحابة:' : 'Saved Cloud Codes:'}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{cloudCodes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloud-codes' && (
            <div className="space-y-3">
              {cloudCodes.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Cloud className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'لا توجد رموز سحابية محفوظة بعد' : 'No cloud codes saved yet'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {isAr
                      ? 'عند توليد أي رمز QR أو باركود، اضغط على زر "حفظ سحابي" ليبقى محفوظاً بحسابك إلى الأبد.'
                      : 'When creating QR or barcodes, click "Save to Cloud" to sync and store them permanently.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pe-1">
                  {cloudCodes.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.previewDataUrl ? (
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0 flex items-center justify-center">
                            <img src={item.previewDataUrl} alt={item.title} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 shrink-0">
                            {item.kind === 'qr' ? <QrCode className="w-6 h-6" /> : <Barcode className="w-6 h-6" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate dir-ltr">
                            {item.rawValue}
                          </p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                            {item.kind.toUpperCase()} • {item.subType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectCode && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCode(item);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            {isAr ? 'فتح وتعديل' : 'Open'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.rawValue);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Copy raw text"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCode(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
