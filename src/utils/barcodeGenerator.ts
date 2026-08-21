import JsBarcode from 'jsbarcode';
import { BarcodeFormat, BarcodeStyleOptions } from '../types';

export function validateBarcodeText(
  format: BarcodeFormat,
  text: string
): { isValid: boolean; errorMsgKey?: string; formattedText?: string } {
  const clean = text.trim();
  if (!clean) {
    return { isValid: false, errorMsgKey: 'barcodeValue' };
  }

  switch (format) {
    case 'EAN13':
      // Requires 12 or 13 digits
      if (!/^\d{12,13}$/.test(clean)) {
        return { isValid: false, errorMsgKey: 'invalidEAN13' };
      }
      return { isValid: true, formattedText: clean };

    case 'EAN8':
      // Requires 7 or 8 digits
      if (!/^\d{7,8}$/.test(clean)) {
        return { isValid: false, errorMsgKey: 'invalidEAN8' };
      }
      return { isValid: true, formattedText: clean };

    case 'UPC':
      // Requires 11 or 12 digits
      if (!/^\d{11,12}$/.test(clean)) {
        return { isValid: false, errorMsgKey: 'invalidUPC' };
      }
      return { isValid: true, formattedText: clean };

    case 'ITF14':
      if (!/^\d{13,14}$/.test(clean)) {
        return { isValid: false, errorMsgKey: 'invalidBarcode' };
      }
      return { isValid: true, formattedText: clean };

    case 'pharmacode':
      const num = parseInt(clean, 10);
      if (isNaN(num) || num < 3 || num > 131070) {
        return { isValid: false, errorMsgKey: 'invalidBarcode' };
      }
      return { isValid: true, formattedText: clean };

    default:
      return { isValid: true, formattedText: clean };
  }
}

/**
 * Generate 1D Barcode on HTMLCanvasElement
 */
export function generateBarcodeCanvas(
  text: string,
  options: BarcodeStyleOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  const validation = validateBarcodeText(options.format, text);
  const targetText = validation.formattedText || text || '1234567890';

  try {
    JsBarcode(canvas, targetText, {
      format: options.format === 'UPC' ? 'UPC' : options.format,
      lineColor: options.lineColor || '#000000',
      background: options.transparentBg ? 'transparent' : options.bgColor || '#ffffff',
      width: options.width || 2,
      height: options.height || 100,
      margin: options.margin || 10,
      displayValue: options.displayValue,
      fontSize: options.fontSize || 16,
      fontOptions: options.fontOptions || '',
      textPosition: options.textPosition || 'bottom',
      textAlign: options.textAlign || 'center',
    });
  } catch (err) {
    console.warn('Barcode rendering error:', err);
    // Fallback draw simple warning text on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 300;
      canvas.height = 100;
      ctx.fillStyle = options.bgColor || '#ffffff';
      ctx.fillRect(0, 0, 300, 100);
      ctx.fillStyle = '#dc2626';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Invalid Barcode Format Value', 150, 50);
    }
  }

  return canvas;
}

/**
 * Generate SVG string for Barcode
 */
export function generateBarcodeSVG(text: string, options: BarcodeStyleOptions): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const validation = validateBarcodeText(options.format, text);
  const targetText = validation.formattedText || text || '1234567890';

  try {
    JsBarcode(svg, targetText, {
      format: options.format === 'UPC' ? 'UPC' : options.format,
      lineColor: options.lineColor || '#000000',
      background: options.transparentBg ? 'transparent' : options.bgColor || '#ffffff',
      width: options.width || 2,
      height: options.height || 100,
      margin: options.margin || 10,
      displayValue: options.displayValue,
      fontSize: options.fontSize || 16,
      fontOptions: options.fontOptions || '',
      textPosition: options.textPosition || 'bottom',
      textAlign: options.textAlign || 'center',
    });
    return new XMLSerializer().serializeToString(svg);
  } catch (e) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="10" y="50" fill="red">Invalid Format</text></svg>`;
  }
}
