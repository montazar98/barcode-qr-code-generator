import React, { useState, useEffect, useRef } from 'react';
import { Scan, Camera, Upload, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { AppLanguage } from '../types';
import { translations } from '../constants/translations';

interface ScannerProps {
  lang: AppLanguage;
}

export const Scanner: React.FC<ScannerProps> = ({ lang }) => {
  const t = translations[lang];
  const labels = t.labels;

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start live camera scanner
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-region');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScannedResult(decodedText);
          stopCamera();
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err: any) {
      setErrorMsg('تعذر الوصول إلى الكاميرا. يرجى التأكد من السماح بإذن الكاميرا أو رفع صورة.');
      setIsCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {}
    }
    setIsCameraActive(false);
  };

  // Upload image file for scan
  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-region-hidden');
      }
      const result = await html5QrCodeRef.current.scanFile(file, true);
      setScannedResult(result);
    } catch (err) {
      setErrorMsg('لم يتم العثور على رمز QR أو باركود واضح في الصورة المرفوعة.');
    }
  };

  const handleCopy = () => {
    if (scannedResult) {
      navigator.clipboard.writeText(scannedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUrl = scannedResult ? /^https?:\/\//i.test(scannedResult) : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-500" />
            <span>{labels.scanTitle}</span>
          </h3>
        </div>

        {/* Camera Display Container */}
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl min-h-[300px] flex items-center justify-center border border-slate-800">
          <div id="qr-reader-region" className="w-full max-w-md text-white" />
          <div id="qr-reader-region-hidden" className="hidden" />

          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-950/80">
              <Camera className="w-12 h-12 text-slate-500" />
              <p className="text-xs text-slate-400 max-w-sm">
                يمكنك المسح المباشر باستخدام كاميرا الهاتف/الجهاز أو رفع صورة تحتوي على الرمز.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{labels.startCamera}</span>
                </button>

                <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer transition-all flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{labels.uploadScanImg}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageScan}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {isCameraActive && (
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
            >
              {labels.stopCamera}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Scanned Result Output Display */}
        {scannedResult && (
          <div className="p-5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                نتيجة القراءة:
              </span>
              <button
                onClick={() => setScannedResult(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المسح</span>
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-white break-all">
              {scannedResult}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              {isUrl && (
                <a
                  href={scannedResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-500" />
                  <span>فتح الرابط</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
