import React from 'react';
import { Wrench } from 'lucide-react';
import { AppLanguage } from '../../types';

interface MaintenanceViewProps {
  message: string;
  lang: AppLanguage;
  onOpenAdmin?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  message,
  lang,
  onOpenAdmin,
}) => {
  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-lg w-full space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 animate-bounce">
          <Wrench className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
            {isAr ? 'وضع الصيانة مؤقتاً' : 'Under Maintenance'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isAr ? 'الموقع حالياً قيد التحديث والتحسين' : 'Site is Currently Under Maintenance'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            {message}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-center text-xs text-slate-400">
          <span>{isAr ? 'نقدر تفهمكم وصبركم' : 'Thank you for your patience'}</span>
        </div>
      </div>
    </div>
  );
};
