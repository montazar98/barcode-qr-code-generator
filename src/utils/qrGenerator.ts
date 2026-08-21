import QRCode from 'qrcode';
import {
  CryptoData,
  EmailData,
  EventData,
  LocationData,
  QRDataType,
  QRStyleOptions,
  VCardData,
  WhatsappData,
  WifiData,
} from '../types';

export function formatQRData(
  type: QRDataType,
  data: {
    url?: string;
    text?: string;
    wifi?: WifiData;
    vcard?: VCardData;
    email?: EmailData;
    phone?: string;
    sms?: { phone: string; message: string };
    whatsapp?: WhatsappData;
    event?: EventData;
    crypto?: CryptoData;
    location?: LocationData;
  }
): string {
  switch (type) {
    case 'url':
      let rawUrl = data.url?.trim() || 'https://example.com';
      if (!/^https?:\/\//i.test(rawUrl) && !/^mailto:/i.test(rawUrl) && !/^tel:/i.test(rawUrl)) {
        rawUrl = `https://${rawUrl}`;
      }
      return rawUrl;

    case 'text':
      return data.text || 'Sample Text';

    case 'wifi':
      const wifi = data.wifi || { ssid: 'MyWiFi', password: '', encryption: 'WPA', hidden: false };
      const hiddenStr = wifi.hidden ? 'H:true;' : '';
      return `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};${hiddenStr};`;

    case 'vcard':
      const v = data.vcard || {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Company',
        title: 'Manager',
        phoneMobile: '+123456789',
        phoneWork: '',
        email: 'john@example.com',
        url: 'https://example.com',
        address: 'Main St',
        note: '',
      };
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${v.lastName};${v.firstName};;;`,
        `FN:${v.firstName} ${v.lastName}`.trim(),
        v.organization ? `ORG:${v.organization}` : '',
        v.title ? `TITLE:${v.title}` : '',
        v.phoneMobile ? `TEL;TYPE=CELL:${v.phoneMobile}` : '',
        v.phoneWork ? `TEL;TYPE=WORK:${v.phoneWork}` : '',
        v.email ? `EMAIL:${v.email}` : '',
        v.url ? `URL:${v.url}` : '',
        v.address ? `ADR:;;${v.address};;;;` : '',
        v.note ? `NOTE:${v.note}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');

    case 'email':
      const em = data.email || { email: 'info@example.com', subject: '', body: '' };
      const params = new URLSearchParams();
      if (em.subject) params.append('subject', em.subject);
      if (em.body) params.append('body', em.body);
      const query = params.toString();
      return `mailto:${em.email}${query ? `?${query}` : ''}`;

    case 'phone':
      return `tel:${data.phone || '+1234567890'}`;

    case 'sms':
      const sms = data.sms || { phone: '+1234567890', message: '' };
      return `smsto:${sms.phone}:${sms.message || ''}`;

    case 'whatsapp':
      const wa = data.whatsapp || { phone: '1234567890', message: '' };
      const cleanPhone = wa.phone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(wa.message || '');
      return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;

    case 'event':
      const ev = data.event || {
        title: 'Meeting',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      };
      const fmtDate = (dStr: string) => {
        if (!dStr) return '';
        return new Date(dStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${ev.title || 'Event'}`,
        ev.location ? `LOCATION:${ev.location}` : '',
        ev.description ? `DESCRIPTION:${ev.description}` : '',
        ev.startDate ? `DTSTART:${fmtDate(ev.startDate)}` : '',
        ev.endDate ? `DTEND:${fmtDate(ev.endDate)}` : '',
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\n');

    case 'crypto':
      const cr = data.crypto || { coin: 'BTC', address: '', amount: '' };
      if (cr.coin === 'BTC') {
        return `bitcoin:${cr.address}${cr.amount ? `?amount=${cr.amount}` : ''}`;
      } else if (cr.coin === 'ETH') {
        return `ethereum:${cr.address}${cr.amount ? `?value=${cr.amount}` : ''}`;
      }
      return `${cr.coin.toLowerCase()}:${cr.address}`;

    case 'location':
      const loc = data.location || { latitude: '24.7136', longitude: '46.6753', label: '' };
      return `geo:${loc.latitude},${loc.longitude}?q=${loc.latitude},${loc.longitude}(${encodeURIComponent(
        loc.label || 'Location'
      )})`;

    default:
      return 'https://example.com';
  }
}

/**
 * Generate high quality QR code on Canvas with customized logo and styling options
 */
export async function generateQRCanvas(
  text: string,
  options: QRStyleOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const size = options.size || 600;
  canvas.width = size;
  canvas.height = size;

  const qrData = QRCode.create(text || 'https://example.com', {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  });

  const modules = qrData.modules;
  const moduleCount = modules.size;
  const margin = options.margin || 2;
  const totalCells = moduleCount + margin * 2;
  const cellSize = size / totalCells;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  // Background
  if (!options.transparentBg) {
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }

  // Helper to check if a cell is an eye module (top-left, top-right, bottom-left finder patterns)
  const isEyePattern = (r: number, c: number): boolean => {
    // Top-left
    if (r < 7 && c < 7) return true;
    // Top-right
    if (r < 7 && c >= moduleCount - 7) return true;
    // Bottom-left
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  };

  // Draw regular dots/modules
  ctx.fillStyle = options.fgColor || '#000000';

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c)) {
        if (isEyePattern(r, c)) continue; // Eyes handled separately for custom styling

        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;

        if (options.dotStyle === 'dots') {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (options.dotStyle === 'rounded') {
          ctx.beginPath();
          const rRadius = cellSize * 0.3;
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, rRadius);
          ctx.fill();
        } else {
          // Square
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  // Function to draw finder pattern eye
  const drawEye = (startRow: number, startCol: number) => {
    const x = (startCol + margin) * cellSize;
    const y = (startRow + margin) * cellSize;
    const eyeSize = 7 * cellSize;

    ctx.save();
    ctx.fillStyle = options.fgColor || '#000000';

    if (options.eyeStyle === 'circle') {
      // Outer ring
      ctx.beginPath();
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner white cutout
      ctx.fillStyle = options.transparentBg ? '#ffffff' : options.bgColor || '#ffffff';
      ctx.beginPath();
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize * (5 / 14), 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = options.fgColor || '#000000';
      ctx.beginPath();
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize * (3 / 14), 0, Math.PI * 2);
      ctx.fill();
    } else if (options.eyeStyle === 'rounded') {
      const radius = eyeSize * 0.25;
      // Outer rounded box
      ctx.beginPath();
      ctx.roundRect(x, y, eyeSize, eyeSize, radius);
      ctx.fill();

      // Inner cutout
      ctx.fillStyle = options.transparentBg ? '#ffffff' : options.bgColor || '#ffffff';
      const innerX = x + cellSize;
      const innerY = y + cellSize;
      const innerSize = 5 * cellSize;
      ctx.beginPath();
      ctx.roundRect(innerX, innerY, innerSize, innerSize, radius * 0.7);
      ctx.fill();

      // Center dot
      ctx.fillStyle = options.fgColor || '#000000';
      const centerX = x + 2 * cellSize;
      const centerY = y + 2 * cellSize;
      const centerSize = 3 * cellSize;
      ctx.beginPath();
      ctx.roundRect(centerX, centerY, centerSize, centerSize, radius * 0.4);
      ctx.fill();
    } else {
      // Standard Square
      ctx.fillRect(x, y, eyeSize, eyeSize);

      ctx.fillStyle = options.transparentBg ? '#ffffff' : options.bgColor || '#ffffff';
      ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);

      ctx.fillStyle = options.fgColor || '#000000';
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }

    ctx.restore();
  };

  // Draw 3 eyes
  drawEye(0, 0); // Top-left
  drawEye(0, moduleCount - 7); // Top-right
  drawEye(moduleCount - 7, 0); // Bottom-left

  // Draw center logo if provided
  if (options.logoUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoRatio = Math.min(Math.max(options.logoSizeRatio || 0.22, 0.12), 0.32);
        const logoDim = size * logoRatio;
        const logoX = (size - logoDim) / 2;
        const logoY = (size - logoDim) / 2;
        const pad = options.logoMargin || 6;

        // Draw background container behind logo for contrast & clarity
        ctx.fillStyle = options.transparentBg ? '#ffffff' : options.bgColor || '#ffffff';
        ctx.beginPath();
        ctx.roundRect(
          logoX - pad,
          logoY - pad,
          logoDim + pad * 2,
          logoDim + pad * 2,
          (logoDim + pad * 2) * 0.2
        );
        ctx.fill();

        // Draw logo image
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoDim, logoDim, logoDim * 0.18);
        ctx.clip();
        ctx.drawImage(img, logoX, logoY, logoDim, logoDim);
        ctx.restore();

        resolve();
      };
      img.onerror = () => {
        resolve(); // Ignore logo error gracefully
      };
      img.src = options.logoUrl!;
    });
  }

  return canvas;
}

/**
 * Generate SVG string of QR code for vector download
 */
export async function generateQRSVG(text: string, options: QRStyleOptions): Promise<string> {
  const canvas = await generateQRCanvas(text, options);
  const dataUrl = canvas.toDataURL('image/png');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${options.size}" height="${options.size}" viewBox="0 0 ${options.size} ${options.size}">
    <image width="${options.size}" height="${options.size}" xlink:href="${dataUrl}"/>
  </svg>`;
}
