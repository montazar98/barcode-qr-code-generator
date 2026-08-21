import React, { useState } from 'react';
import {
  Download,
  Copy,
  Printer,
  BookmarkPlus,
  Check,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Cloud,
  CloudUpload,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../constants/translations';
import { generatePrintPDF } from '../utils/pdfGenerator';

interface PreviewCardProps {
  dataUrl: string;
  svgString?: string;
  title: string;
  kind: 'qr' | 'barcode';
  rawValue: string;
  lang: AppLanguage;
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  onSaveToHistory: () => void;
  onSaveToCloud?: () => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  dataUrl,
  svgString,
  title,
  kind,
  rawValue,
  lang,
  fgColor,
  bgColor,
  transparentBg,
  onSaveToHistory,
  onSaveToCloud,
}) => {
  const t = translations[lang].labels;
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cloudSaved, setCloudSaved] = useState(false);
  const [printCopies, setPrintCopies] = useState(6);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Evaluate color contrast for scannability score
  const evaluateScannability = () => {
    if (transparentBg) return { score: 'good', text: t.good, color: 'text-amber-500' };

    const getLuminance = (hex: string) => {
      const c = hex.replace('#', '');
      if (c.length !== 6) return 0.5;
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lumFg = getLuminance(fgColor);
    const lumBg = getLuminance(bgColor);
    const contrast = Math.abs(lumFg - lumBg);

    if (contrast > 0.5) return { score: 'excellent', text: t.excellent, color: 'text-emerald-500' };
    if (contrast > 0.25) return { score: 'good', text: t.good, color: 'text-amber-500' };
    return { score: 'warning', text: t.warning, color: 'text-red-500' };
  };

  const scannability = evaluateScannability();

  // Download PNG
  const handleDownloadPNG = () => {
    if (!dataUrl) return;
    onSaveToHistory();
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'code'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgString) return;
    onSaveToHistory();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'code'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy PNG image to clipboard
  const handleCopyImage = async () => {
    onSaveToHistory();
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback copy text
      navigator.clipboard.writeText(rawValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save to history trigger
  const handleSave = () => {
    onSaveToHistory();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Handle PDF Export
  const handlePrintPDF = (pageSize: 'a4' | 'singleLabel') => {
    onSaveToHistory();
    const pdfDoc = generatePrintPDF({
      title,
      dataUrl,
      valueText: rawValue,
      copies: printCopies,
      pageSize,
    });
    pdfDoc.save(`${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_labels.pdf`);
    setShowPrintModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t.livePreview}</span>
        </h3>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${scannability.color}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {scannability.text}
        </span>
      </div>

      {/* Code Display Canvas Box */}
      <div
        className="relative flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 min-h-[280px] transition-all"
        style={{
          backgroundColor: transparentBg ? undefined : bgColor,
          backgroundImage: transparentBg
            ? 'radial-gradient(#cbd5e1 1px, transparent 1px)'
            : undefined,
          backgroundSize: '12px 12px',
        }}
      >
        {dataUrl ? (
          <div className="space-y-3 text-center">
            <img
              src={dataUrl}
              alt={title}
              className="max-h-[240px] max-w-full object-contain mx-auto shadow-md rounded-lg"
            />
            {rawValue && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-[280px] truncate mx-auto">
                {rawValue}
              </p>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">{t.barcodeValue}...</div>
        )}
      </div>

      {/* Primary Action Download Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          onClick={handleDownloadPNG}
          disabled={!dataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{t.downloadPNG}</span>
        </button>

        <button
          onClick={handleDownloadSVG}
          disabled={!svgString}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-all"
        >
          <FileCode className="w-4 h-4 text-emerald-500" />
          <span>{t.downloadSVG}</span>
        </button>

        <button
          onClick={() => setShowPrintModal(true)}
          disabled={!dataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-all"
        >
          <Printer className="w-4 h-4 text-blue-500" />
          <span>{t.printLabel}</span>
        </button>

        <button
          onClick={handleCopyImage}
          disabled={!dataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.copySuccess : t.copyImage}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!dataUrl}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 disabled:opacity-50 transition-all cursor-pointer"
        >
          {saved ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
          <span>{saved ? t.savedSuccess : t.saveHistory}</span>
        </button>

        {onSaveToCloud && (
          <button
            onClick={() => {
              onSaveToCloud();
              setCloudSaved(true);
              setTimeout(() => setCloudSaved(false), 2000);
            }}
            disabled={!dataUrl}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {cloudSaved ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <CloudUpload className="w-4 h-4 text-white" />
            )}
            <span>{cloudSaved ? (isAr ? 'تم الحفظ بالسحابة!' : 'Saved to Cloud!') : (isAr ? 'حفظ بالسحابة' : 'Save to Cloud')}</span>
          </button>
        )}
      </div>

      {/* Print PDF Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              <span>إعدادات طباعة الملصق (PDF)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر نوع صفحة الطباعة وعدد النسخ لإنشاء ملف PDF جاهز للطباعة على الملصقات والمستندات.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  عدد النسخ
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={printCopies}
                  onChange={(e) => setPrintCopies(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handlePrintPDF('a4')}
                  className="p-3 border rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200 transition-all flex flex-col items-center text-center gap-1"
                >
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                  <span>صفحة A4 متعددة (Grid)</span>
                </button>

                <button
                  onClick={() => handlePrintPDF('singleLabel')}
                  className="p-3 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 transition-all flex flex-col items-center text-center gap-1"
                >
                  <Printer className="w-6 h-6 text-emerald-600" />
                  <span>ملصق مفرد (Thermal Sticker)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
