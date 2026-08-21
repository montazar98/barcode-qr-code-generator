import React, { useState } from 'react';
import { Layers, Upload, Download, CheckCircle, FileSpreadsheet, Sparkles, Trash2 } from 'lucide-react';
import { AppLanguage, BarcodeFormat, BatchItem } from '../types';
import { translations } from '../constants/translations';
import { generateQRCanvas } from '../utils/qrGenerator';
import { generateBarcodeCanvas } from '../utils/barcodeGenerator';
import { generatePrintPDF } from '../utils/pdfGenerator';
import { logConversion } from '../lib/firebase';

interface BatchGeneratorProps {
  lang: AppLanguage;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({ lang }) => {
  const t = translations[lang];
  const labels = t.labels;

  const [rawText, setRawText] = useState(
    'https://example.com/item/1\nhttps://example.com/item/2\n123456789012\n987654321098'
  );
  const [codeKind, setCodeKind] = useState<'qr' | 'barcode'>('qr');
  const [barcodeFmt, setBarcodeFmt] = useState<BarcodeFormat>('CODE128');

  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // File CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Generate batch
  const handleGenerate = async () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setIsGenerating(true);
    const newItems: BatchItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const val = lines[i];
      try {
        let dataUrl = '';
        if (codeKind === 'qr') {
          const canvas = await generateQRCanvas(val, {
            fgColor: '#000000',
            bgColor: '#ffffff',
            transparentBg: false,
            size: 400,
            margin: 2,
            errorCorrectionLevel: 'M',
            logoSizeRatio: 0.2,
            logoMargin: 6,
            dotStyle: 'square',
            eyeStyle: 'square',
          });
          dataUrl = canvas.toDataURL('image/png');
        } else {
          const canvas = generateBarcodeCanvas(val, {
            format: barcodeFmt,
            lineColor: '#000000',
            bgColor: '#ffffff',
            transparentBg: false,
            width: 2,
            height: 80,
            margin: 10,
            displayValue: true,
            fontSize: 14,
            fontOptions: '',
            textPosition: 'bottom',
            textAlign: 'center',
            text: '',
          });
          dataUrl = canvas.toDataURL('image/png');
        }

        newItems.push({
          id: `${i}-${Date.now()}`,
          value: val,
          label: `Item #${i + 1}`,
          status: 'done',
          dataUrl,
        });

        // Log conversion for audit & analytics
        logConversion({
          kind: codeKind,
          subType: val.startsWith('http') ? 'url' : 'batch_item',
          rawValue: val,
          title: `Batch #${i + 1} (${codeKind.toUpperCase()})`,
          previewDataUrl: dataUrl,
        }).catch(() => {});
      } catch (err) {
        newItems.push({
          id: `${i}-${Date.now()}`,
          value: val,
          status: 'error',
          errorMsg: 'خطأ في توليد القيمة',
        });
      }
    }

    setBatchItems(newItems);
    setIsGenerating(false);
  };

  // Export printable PDF for all items
  const handleExportPDF = () => {
    if (batchItems.length === 0) return;

    const firstValid = batchItems.find((x) => x.dataUrl);
    if (!firstValid?.dataUrl) return;

    // Build PDF containing all items
    const pdfDoc = generatePrintPDF({
      title: 'Batch Code Collection',
      dataUrl: firstValid.dataUrl,
      valueText: firstValid.value,
      copies: batchItems.length,
      pageSize: 'a4',
    });

    pdfDoc.save('batch_codes_sheet.pdf');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input panel */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>{labels.batchTitle}</span>
            </h3>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>رفع ملف CSV / TXT</span>
              <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">{labels.batchDesc}</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                نوع الرمز المطلوب
              </label>
              <select
                value={codeKind}
                onChange={(e) => setCodeKind(e.target.value as 'qr' | 'barcode')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="qr">رمز استجابة سريعة (QR Code)</option>
                <option value="barcode">باركود خطي (1D Barcode)</option>
              </select>
            </div>

            {codeKind === 'barcode' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  صيغة الباركود
                </label>
                <select
                  value={barcodeFmt}
                  onChange={(e) => setBarcodeFmt(e.target.value as BarcodeFormat)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="CODE128">Code 128</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="UPC">UPC-A</option>
                  <option value="CODE39">Code 39</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={labels.batchPlaceholder}
              className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !rawText.trim()}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'جاري التوليد...' : labels.generateBatch}</span>
          </button>
        </div>
      </div>

      {/* Output Results Grid */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>الرموز الناتجة ({batchItems.length})</span>
            </h3>

            {batchItems.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تنزيل ملصقات (PDF)</span>
              </button>
            )}
          </div>

          {batchItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              أدخل القائمة واضغط على "توليد كافة الرموز" للبدء.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1 scrollbar-thin">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center text-center space-y-2"
                >
                  {item.dataUrl ? (
                    <img src={item.dataUrl} alt={item.value} className="max-h-24 object-contain" />
                  ) : (
                    <span className="text-xs text-rose-500">{item.errorMsg}</span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 max-w-full truncate">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
