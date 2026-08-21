import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  Clock,
  QrCode,
  Barcode,
  Shield,
  Trash2,
  Filter,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  UserX,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { RegisteredAccountItem, AppLanguage } from '../../types';
import { fetchAdminRegisteredUsers, getAuthHeaders } from '../../lib/firebase';

interface UserManagementViewProps {
  lang: AppLanguage;
  onNotification?: (msg: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  lang,
  onNotification,
}) => {
  const isAr = lang === 'ar';
  const [users, setUsers] = useState<RegisteredAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'password' | 'anonymous'>('all');
  const [sortBy, setSortBy] = useState<'lastActive' | 'createdAt' | 'conversions'>('lastActive');
  const [selectedUser, setSelectedUser] = useState<RegisteredAccountItem | null>(null);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    googleUsers: 0,
    emailUsers: 0,
    guestUsers: 0,
    totalSavedCodes: 0,
    totalConversions: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminRegisteredUsers();
      setUsers(data.users);
      setMetrics({
        totalUsers: data.totalUsers,
        googleUsers: data.googleUsers,
        emailUsers: data.emailUsers,
        guestUsers: data.guestUsers,
        totalSavedCodes: data.totalSavedCodes,
        totalConversions: data.totalConversions,
      });
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا الحساب من السجل؟' : 'Are you sure you want to delete this user record?')) {
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${uid}`, { method: 'DELETE', headers });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
        if (onNotification) onNotification(isAr ? 'تم حذف الحساب بنجاح' : 'User record removed');
        if (selectedUser?.uid === uid) setSelectedUser(null);
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (providerFilter !== 'all') {
          if (providerFilter === 'google' && u.provider !== 'google' && !u.email?.includes('gmail.com')) return false;
          if (providerFilter === 'password' && (u.provider === 'google' || u.isAnonymous)) return false;
          if (providerFilter === 'anonymous' && !u.isAnonymous && u.provider !== 'anonymous') return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = u.displayName?.toLowerCase().includes(q);
          const matchEmail = u.email?.toLowerCase().includes(q);
          const matchUid = u.uid.toLowerCase().includes(q);
          return matchName || matchEmail || matchUid;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'lastActive') return (b.lastActive || b.createdAt) - (a.lastActive || a.createdAt);
        if (sortBy === 'createdAt') return b.createdAt - a.createdAt;
        if (sortBy === 'conversions') return (b.totalConversionsCount || 0) - (a.totalConversionsCount || 0);
        return 0;
      });
  }, [users, providerFilter, searchQuery, sortBy]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return isAr ? 'غير محدد' : 'N/A';
    const d = new Date(timestamp);
    return isAr
      ? d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (timestamp: number) => {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return isAr ? 'الآن' : 'just now';
    if (diff < 3600) return isAr ? `منذ ${Math.floor(diff / 60)} دقيقة` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isAr ? `منذ ${Math.floor(diff / 3600)} ساعة` : `${Math.floor(diff / 3600)}h ago`;
    return isAr ? `منذ ${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6" id="user-management-view">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">
              {isAr ? 'إدارة الحسابات والمستخدمين المسجلين' : 'Registered Accounts & User Directory'}
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isAr
              ? 'مراقبة جميع حسابات المستخدمين المسجلة عبر Google والبريد الإلكتروني والضيوف مع إحصائيات النشاط'
              : 'Monitor registered user accounts across Google, Email/Password, and Guests with conversion statistics'}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'إجمالي الحسابات' : 'Total Accounts'}
            </span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{metrics.totalUsers}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {isAr ? 'حسابات مسجلة وموثقة' : 'Active Registered'}
          </span>
        </div>

        {/* Google Users */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'حسابات Google' : 'Google Accounts'}
            </span>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">{metrics.googleUsers}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.totalUsers > 0 ? Math.round((metrics.googleUsers / metrics.totalUsers) * 100) : 0}% {isAr ? 'من الإجمالي' : 'of total'}
          </span>
        </div>

        {/* Email/Password Users */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'بريد وكلمة مرور' : 'Email/Password'}
            </span>
            <Mail className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{metrics.emailUsers}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.totalUsers > 0 ? Math.round((metrics.emailUsers / metrics.totalUsers) * 100) : 0}% {isAr ? 'من الإجمالي' : 'of total'}
          </span>
        </div>

        {/* Total Conversions & Saved */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'عمليات التحويل للمستخدمين' : 'User Conversions'}
            </span>
            <QrCode className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{metrics.totalConversions || users.reduce((acc, u) => acc + (u.totalConversionsCount || 0), 0)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'روابط وباركودات تم توليدها' : 'Total Barcodes & Links'}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، البريد الإلكتروني، أو معرف المستخدم (UID)...' : 'Search by name, email, or UID...'}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Provider Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 overflow-x-auto">
            <button
              onClick={() => setProviderFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                providerFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({users.length})
            </button>
            <button
              onClick={() => setProviderFilter('google')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                providerFilter === 'google'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google ({users.filter((u) => u.provider === 'google' || u.email?.includes('gmail.com')).length})
            </button>
            <button
              onClick={() => setProviderFilter('password')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                providerFilter === 'password'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'بريد وكلمة مرور' : 'Email/Pass'} ({users.filter((u) => u.provider === 'password').length})
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isAr ? 'ترتيب:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="lastActive">{isAr ? 'آخر نشاط' : 'Last Active'}</option>
              <option value="createdAt">{isAr ? 'تاريخ التسجيل' : 'Registration Date'}</option>
              <option value="conversions">{isAr ? 'الأكثر تحويلاً للروابط' : 'Most Conversions'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              {isAr ? 'قائمة الحسابات المسجلة' : 'Registered Users Directory'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredUsers.length}
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserX className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-base font-medium text-slate-300">
              {isAr ? 'لم يتم العثور على أي حسابات مطابقة' : 'No registered accounts found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'عند تسجيل أي مستخدم حسابه عبر Google أو البريد الإلكتروني، سيظهر حسابه هنا فوراً.'
                : 'When users sign up or log in via Google/Email, their accounts appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">{isAr ? 'المستخدم / الحساب' : 'User Account'}</th>
                  <th className="py-3 px-4">{isAr ? 'نوع التسجيل' : 'Provider'}</th>
                  <th className="py-3 px-4">{isAr ? 'النشاط والتحويلات' : 'Activity & Conversions'}</th>
                  <th className="py-3 px-4">{isAr ? 'تاريخ التسجيل' : 'Registered On'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredUsers.map((user) => {
                  const isGoogle = user.provider === 'google' || user.email?.includes('gmail.com');
                  const isGuest = user.isAnonymous || user.provider === 'anonymous';

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'User'}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{user.displayName || (isAr ? 'مستخدم بدون اسم' : 'Unnamed User')}</span>
                              {isGoogle && (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                  Google
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email || (isAr ? 'بدون بريد إلكتروني' : 'No email')}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              UID: {user.uid.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Provider Badge */}
                      <td className="py-3 px-4">
                        {isGoogle ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                            </svg>
                            Google OAuth
                          </span>
                        ) : isGuest ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            {isAr ? 'زائر سحابي' : 'Guest Account'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Mail className="w-3 h-3" />
                            {isAr ? 'بريد وكلمة مرور' : 'Email Password'}
                          </span>
                        )}
                      </td>

                      {/* Activity & Conversions */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-indigo-400">
                              {user.totalConversionsCount || 0} {isAr ? 'تحويل' : 'conversions'}
                            </span>
                            {user.savedCodesCount !== undefined && user.savedCodesCount > 0 && (
                              <span className="text-[11px] text-slate-400">
                                • {user.savedCodesCount} {isAr ? 'محفوظ بالسحابة' : 'saved'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>{isAr ? 'آخر نشاط:' : 'Active:'} {getRelativeTime(user.lastActive || user.createdAt)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-300 font-medium">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={isAr ? 'حذف من السجل' : 'Delete user record'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {selectedUser.photoURL ? (
                  <img
                    src={selectedUser.photoURL}
                    alt={selectedUser.displayName || 'User'}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedUser.displayName ? selectedUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedUser.displayName || (isAr ? 'مستخدم' : 'User Profile')}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedUser.email || (isAr ? 'حساب مجهول البريد' : 'No email')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-500 block">{isAr ? 'معرف المستخدم الفايربيس (Firebase UID):' : 'Firebase UID:'}</span>
                <span className="font-mono text-xs text-indigo-400 break-all">{selectedUser.uid}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-500 block">{isAr ? 'طريقة التسجيل:' : 'Auth Method:'}</span>
                  <span className="text-sm font-semibold text-white capitalize">{selectedUser.provider}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-500 block">{isAr ? 'عدد عمليات التحويل:' : 'Total Conversions:'}</span>
                  <span className="text-sm font-semibold text-amber-400">{selectedUser.totalConversionsCount || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-500 block">{isAr ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                  <span className="text-xs text-slate-300">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-500 block">{isAr ? 'آخر تواجد:' : 'Last Active:'}</span>
                  <span className="text-xs text-slate-300">{formatDate(selectedUser.lastActive || selectedUser.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser.uid)}
                className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-600 hover:text-white transition-all"
              >
                {isAr ? 'حذف من السجل' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
