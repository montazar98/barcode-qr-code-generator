import React, { useState, useEffect } from 'react';
import { Barcode, Sliders, Palette, FileText } from 'lucide-react';
import { AppLanguage, BarcodeFormat, BarcodeStyleOptions } from '../types';
import { translations } from '../constants/translations';
import {
  generateBarcodeCanvas,
  generateBarcodeSVG,
  validateBarcodeText,
} from '../utils/barcodeGenerator';
import { PreviewCard } from './PreviewCard';

interface BarcodeGeneratorProps {
  lang: AppLanguage;
  onSaveToHistory: (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    barcodeOptions: BarcodeStyleOptions
  ) => void;
  onSaveToCloud?: (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    barcodeOptions: BarcodeStyleOptions
  ) => void;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ lang, onSaveToHistory, onSaveToCloud }) => {
  const t = translations[lang];
  const labels = t.labels;

  const [textValue, setTextValue] = useState('123456789012');
  const [styleOptions, setStyleOptions] = useState<BarcodeStyleOptions>({
    format: 'CODE128',
    lineColor: '#000000',
    bgColor: '#ffffff',
    transparentBg: false,
    width: 2,
    height: 100,
    margin: 10,
    displayValue: true,
    fontSize: 16,
    fontOptions: '',
    textPosition: 'bottom',
    textAlign: 'center',
    text: '',
  });

  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [svgString, setSvgString] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const barcodeTypes: { id: BarcodeFormat; label: string; sample: string }[] = [
    { id: 'CODE128', label: t.barcodeTypes.CODE128, sample: 'PROD-9988-ABC' },
    { id: 'EAN13', label: t.barcodeTypes.EAN13, sample: '9780201379624' },
    { id: 'EAN8', label: t.barcodeTypes.EAN8, sample: '12345670' },
    { id: 'UPC', label: t.barcodeTypes.UPC, sample: '012345678905' },
    { id: 'CODE39', label: t.barcodeTypes.CODE39, sample: 'BARCODE39' },
    { id: 'ITF14', label: t.barcodeTypes.ITF14, sample: '10012345678902' },
    { id: 'pharmacode', label: t.barcodeTypes.pharmacode, sample: '123456' },
    { id: 'codabar', label: t.barcodeTypes.codabar, sample: 'A12345678B' },
  ];

  // Re-render when format or parameters change
  useEffect(() => {
    const val = validateBarcodeText(styleOptions.format, textValue);
    if (!val.isValid && val.errorMsgKey) {
      setValidationError((labels as Record<string, string>)[val.errorMsgKey] || 'قيمة غير صالحة');
    } else {
      setValidationError(null);
    }

    const canvas = generateBarcodeCanvas(textValue, styleOptions);
    setPreviewDataUrl(canvas.toDataURL('image/png'));

    const svg = generateBarcodeSVG(textValue, styleOptions);
    setSvgString(svg);
  }, [textValue, styleOptions]);

  // Switch format and update sample
  const handleFormatChange = (fmt: BarcodeFormat) => {
    const sampleObj = barcodeTypes.find((x) => x.id === fmt);
    setStyleOptions((prev) => ({ ...prev, format: fmt }));
    if (sampleObj) {
      setTextValue(sampleObj.sample);
    }
  };

  const handleSaveCurrent = () => {
    const title = barcodeTypes.find((x) => x.id === styleOptions.format)?.label || 'Barcode';
    onSaveToHistory(title, styleOptions.format, textValue, previewDataUrl, styleOptions);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Format Selector Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            اختر نوع الباركود
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {barcodeTypes.map((type) => {
              const isActive = styleOptions.format === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleFormatChange(type.id)}
                  className={`flex flex-col text-right p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold truncate">{type.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    مثال: {type.sample}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Value Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>قيمة الباركود</span>
          </h3>
          <div>
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {validationError && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                ⚠️ {validationError}
              </p>
            )}
          </div>
        </div>

        {/* Customization Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>تصميم وأبعاد الباركود</span>
          </h3>

          {/* Color Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.fgColor}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleOptions.lineColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, lineColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={styleOptions.lineColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, lineColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.bgColor}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  disabled={styleOptions.transparentBg}
                  value={styleOptions.bgColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, bgColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 cursor-pointer disabled:opacity-40"
                />
                <input
                  type="text"
                  disabled={styleOptions.transparentBg}
                  value={styleOptions.bgColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, bgColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={styleOptions.transparentBg}
                onChange={(e) =>
                  setStyleOptions({ ...styleOptions, transparentBg: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span>{labels.transparentBg}</span>
            </label>
          </div>

          {/* Sizing sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>{labels.barWidth}</span>
                <span className="font-mono">{styleOptions.width}</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={styleOptions.width}
                onChange={(e) =>
                  setStyleOptions({ ...styleOptions, width: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>{labels.barHeight}</span>
                <span className="font-mono">{styleOptions.height}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={styleOptions.height}
                onChange={(e) =>
                  setStyleOptions({ ...styleOptions, height: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Text Display Options */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={styleOptions.displayValue}
                onChange={(e) =>
                  setStyleOptions({ ...styleOptions, displayValue: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span>{labels.displayValue}</span>
            </label>

            {styleOptions.displayValue && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {labels.fontSize}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="30"
                    value={styleOptions.fontSize}
                    onChange={(e) =>
                      setStyleOptions({
                        ...styleOptions,
                        fontSize: parseInt(e.target.value, 10) || 16,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    موضع النص
                  </label>
                  <select
                    value={styleOptions.textPosition}
                    onChange={(e) =>
                      setStyleOptions({
                        ...styleOptions,
                        textPosition: e.target.value as 'bottom' | 'top',
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bottom">أسفل الباركود</option>
                    <option value="top">أعلى الباركود</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Output Actions */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
        <PreviewCard
          dataUrl={previewDataUrl}
          svgString={svgString}
          title={
            barcodeTypes.find((x) => x.id === styleOptions.format)?.label || '1D Barcode'
          }
          kind="barcode"
          rawValue={textValue}
          lang={lang}
          fgColor={styleOptions.lineColor}
          bgColor={styleOptions.bgColor}
          transparentBg={styleOptions.transparentBg}
          onSaveToHistory={handleSaveCurrent}
          onSaveToCloud={
            onSaveToCloud
              ? () =>
                  onSaveToCloud(
                    barcodeTypes.find((x) => x.id === styleOptions.format)?.label || '1D Barcode',
                    styleOptions.format,
                    textValue,
                    previewDataUrl,
                    styleOptions
                  )
              : undefined
          }
        />
      </div>
    </div>
  );
};
