import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogIn,
  Cloud,
  LogOut,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
  Settings,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppLanguage, CloudSavedCode } from '../../types';
import { logOut } from '../../lib/firebase';

interface UserMenuProps {
  user: FirebaseUser | null;
  cloudCodes: CloudSavedCode[];
  lang: AppLanguage;
  onOpenAuthModal: (mode?: 'login' | 'signup') => void;
  onOpenProfileModal: () => void;
  onOpenCloudCodesTab?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  cloudCodes,
  lang,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenCloudCodesTab,
}) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuthModal('login')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
        </button>
      </div>
    );
  }

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-100 transition-all shadow-sm cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-lg overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
          ) : (
            <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
          )}
        </div>

        {/* User Name */}
        <span className="text-xs font-bold max-w-[100px] sm:max-w-[120px] truncate hidden sm:inline-block">
          {user.displayName || (user.isAnonymous ? (isAr ? 'زائر' : 'Guest') : user.email?.split('@')[0])}
        </span>

        {/* Cloud Status Dot */}
        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" title="Cloud Active"></span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute end-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-fade-in`}
        >
          {/* User Info Header */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName || (user.isAnonymous ? (isAr ? 'زائر سحابي' : 'Cloud Guest') : 'مستخدم باركودي')}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate dir-ltr">
                  {user.email || 'Anonymous Guest'}
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-indigo-500" />
                {isAr ? 'الرموز السحابية:' : 'Cloud Codes:'}
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{cloudCodes.length}</span>
            </div>
          </div>

          {/* Action Items */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenProfileModal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-indigo-500" />
            <span>{isAr ? 'الملف الشخصي والرموز' : 'My Profile & Cloud Codes'}</span>
          </button>

          {onOpenCloudCodesTab && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCloudCodesTab();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-teal-500" />
              <span>{isAr ? 'عرض سجل الرموز' : 'View Code Library'}</span>
            </button>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
