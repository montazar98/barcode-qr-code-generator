import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  FileText,
  Wifi,
  Contact,
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  Calendar,
  Coins,
  MapPin,
  Palette,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AppLanguage,
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
import { translations } from '../constants/translations';
import { PRESET_TEMPLATES } from '../constants/presets';
import { formatQRData, generateQRCanvas, generateQRSVG } from '../utils/qrGenerator';
import { PreviewCard } from './PreviewCard';

interface QRGeneratorProps {
  lang: AppLanguage;
  onSaveToHistory: (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    qrOptions: QRStyleOptions
  ) => void;
  onSaveToCloud?: (
    title: string,
    subType: string,
    rawValue: string,
    dataUrl: string,
    qrOptions: QRStyleOptions
  ) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ lang, onSaveToHistory, onSaveToCloud }) => {
  const t = translations[lang];
  const labels = t.labels;

  const [activeType, setActiveType] = useState<QRDataType>('url');

  // Input states
  const [url, setUrl] = useState('https://google.com');
  const [text, setText] = useState('مرحباً بك في مولد الرموز الاحترافي!');
  const [wifi, setWifi] = useState<WifiData>({
    ssid: 'MyHomeNetwork',
    password: 'SecretPassword123',
    encryption: 'WPA',
    hidden: false,
  });
  const [vcard, setVcard] = useState<VCardData>({
    firstName: 'محمد',
    lastName: 'أحمد',
    organization: 'شركة البرمجيات',
    title: 'مهندس حلول',
    phoneMobile: '+966500000000',
    phoneWork: '',
    email: 'm.ahmed@example.com',
    url: 'https://example.com',
    address: 'الرياض، المملكة العربية السعودية',
    note: 'متخصص في برمجة وتطوير المواقع والحلول الذكية',
  });
  const [email, setEmail] = useState<EmailData>({
    email: 'info@example.com',
    subject: 'استفسار عن الخدمات',
    body: 'السلام عليكم ورحمة الله وبركاته، أرغب في الاستفسار عن...',
  });
  const [phone, setPhone] = useState('+966500000000');
  const [sms, setSms] = useState({ phone: '+966500000000', message: 'مرحباً، أود التواصل معك.' });
  const [whatsapp, setWhatsapp] = useState<WhatsappData>({
    phone: '966500000000',
    message: 'مرحباً، تواصلت معك عبر رمز QR الخاطف!',
  });
  const [event, setEvent] = useState<EventData>({
    title: 'مؤتمر التقنية والابتكار 2026',
    location: 'مركز المؤتمرات، الرياض',
    startDate: '2026-10-15T09:00',
    endDate: '2026-10-15T17:00',
    description: 'لقاء سنويا يجمع قادة التقنية ومطوري البرمجيات.',
  });
  const [crypto, setCrypto] = useState<CryptoData>({
    coin: 'BTC',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    amount: '0.05',
  });
  const [location, setLocation] = useState<LocationData>({
    latitude: '24.7136',
    longitude: '46.6753',
    label: 'موقع الرياض',
  });

  // Customization state
  const [styleOptions, setStyleOptions] = useState<QRStyleOptions>({
    fgColor: '#000000',
    bgColor: '#ffffff',
    transparentBg: false,
    size: 600,
    margin: 2,
    errorCorrectionLevel: 'M',
    logoUrl: undefined,
    logoSizeRatio: 0.22,
    logoMargin: 6,
    dotStyle: 'square',
    eyeStyle: 'square',
  });

  // Preview state
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [formattedText, setFormattedText] = useState<string>('');

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Type definitions for selector bar
  const typeTabs: { id: QRDataType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: t.qrTypes.url, icon: <Globe className="w-4 h-4" /> },
    { id: 'text', label: t.qrTypes.text, icon: <FileText className="w-4 h-4" /> },
    { id: 'wifi', label: t.qrTypes.wifi, icon: <Wifi className="w-4 h-4" /> },
    { id: 'vcard', label: t.qrTypes.vcard, icon: <Contact className="w-4 h-4" /> },
    { id: 'whatsapp', label: t.qrTypes.whatsapp, icon: <MessageCircle className="w-4 h-4 text-emerald-500" /> },
    { id: 'email', label: t.qrTypes.email, icon: <Mail className="w-4 h-4" /> },
    { id: 'phone', label: t.qrTypes.phone, icon: <Phone className="w-4 h-4" /> },
    { id: 'sms', label: t.qrTypes.sms, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'event', label: t.qrTypes.event, icon: <Calendar className="w-4 h-4" /> },
    { id: 'crypto', label: t.qrTypes.crypto, icon: <Coins className="w-4 h-4 text-amber-500" /> },
    { id: 'location', label: t.qrTypes.location, icon: <MapPin className="w-4 h-4 text-rose-500" /> },
  ];

  // Re-generate QR whenever inputs or styles change
  useEffect(() => {
    const rawData = formatQRData(activeType, {
      url,
      text,
      wifi,
      vcard,
      email,
      phone,
      sms,
      whatsapp,
      event,
      crypto,
      location,
    });

    setFormattedText(rawData);

    // Auto update error correction to High if logo present
    const effectiveOptions: QRStyleOptions = {
      ...styleOptions,
      errorCorrectionLevel: styleOptions.logoUrl ? 'H' : styleOptions.errorCorrectionLevel,
    };

    generateQRCanvas(rawData, effectiveOptions).then((canvas) => {
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    });

    generateQRSVG(rawData, effectiveOptions).then((svg) => {
      setSvgString(svg);
    });
  }, [
    activeType,
    url,
    text,
    wifi,
    vcard,
    email,
    phone,
    sms,
    whatsapp,
    event,
    crypto,
    location,
    styleOptions,
  ]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setStyleOptions((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
          errorCorrectionLevel: 'H',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Preset
  const applyPreset = (pId: string) => {
    const p = PRESET_TEMPLATES.find((x) => x.id === pId);
    if (p) {
      setStyleOptions((prev) => ({
        ...prev,
        fgColor: p.fgColor,
        bgColor: p.bgColor,
        dotStyle: p.dotStyle,
        eyeStyle: p.eyeStyle,
        transparentBg: false,
      }));
    }
  };

  const handleSaveCurrent = () => {
    const title = typeTabs.find((x) => x.id === activeType)?.label || 'QR Code';
    onSaveToHistory(title, activeType, formattedText, previewDataUrl, styleOptions);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: QR Content & Customization Options */}
      <div className="lg:col-span-7 space-y-6">
        {/* Type selector tabs grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            اختر نوع محتوى رمز QR
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {typeTabs.map((tab) => {
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Input Fields Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>بيانات الرمز ({typeTabs.find((x) => x.id === activeType)?.label})</span>
          </h3>

          {/* URL Input */}
          {activeType === 'url' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.urlInput}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Text Input */}
          {activeType === 'text' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.textInput}
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب أي نص أو معلومات هنا..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Wifi Inputs */}
          {activeType === 'wifi' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.ssid}
                </label>
                <input
                  type="text"
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.password}
                </label>
                <input
                  type="text"
                  value={wifi.password}
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.encryption}
                </label>
                <select
                  value={wifi.encryption}
                  onChange={(e) =>
                    setWifi({ ...wifi, encryption: e.target.value as 'WPA' | 'WEP' | 'nopass' })
                  }
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">بدون كلمة سر (Open)</option>
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wifi.hidden}
                    onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{labels.hiddenNetwork}</span>
                </label>
              </div>
            </div>
          )}

          {/* vCard Inputs */}
          {activeType === 'vcard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.firstName}
                </label>
                <input
                  type="text"
                  value={vcard.firstName}
                  onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.lastName}
                </label>
                <input
                  type="text"
                  value={vcard.lastName}
                  onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.organization}
                </label>
                <input
                  type="text"
                  value={vcard.organization}
                  onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.jobTitle}
                </label>
                <input
                  type="text"
                  value={vcard.title}
                  onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.phoneMobile}
                </label>
                <input
                  type="text"
                  value={vcard.phoneMobile}
                  onChange={(e) => setVcard({ ...vcard, phoneMobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.email}
                </label>
                <input
                  type="email"
                  value={vcard.email}
                  onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.address}
                </label>
                <input
                  type="text"
                  value={vcard.address}
                  onChange={(e) => setVcard({ ...vcard, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* WhatsApp Inputs */}
          {activeType === 'whatsapp' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.phoneNumber}
                </label>
                <input
                  type="text"
                  value={whatsapp.phone}
                  onChange={(e) => setWhatsapp({ ...whatsapp, phone: e.target.value })}
                  placeholder="966500000000"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.messageBody}
                </label>
                <textarea
                  rows={3}
                  value={whatsapp.message}
                  onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Email Inputs */}
          {activeType === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.email}
                </label>
                <input
                  type="email"
                  value={email.email}
                  onChange={(e) => setEmail({ ...email, email: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.subject}
                </label>
                <input
                  type="text"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.messageBody}
                </label>
                <textarea
                  rows={2}
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Phone Input */}
          {activeType === 'phone' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.phoneNumber}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* SMS Input */}
          {activeType === 'sms' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.phoneNumber}
                </label>
                <input
                  type="text"
                  value={sms.phone}
                  onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.messageBody}
                </label>
                <input
                  type="text"
                  value={sms.message}
                  onChange={(e) => setSms({ ...sms, message: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Event Inputs */}
          {activeType === 'event' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.eventTitle}
                </label>
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => setEvent({ ...event, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.eventLocation}
                </label>
                <input
                  type="text"
                  value={event.location}
                  onChange={(e) => setEvent({ ...event, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.startDate}
                </label>
                <input
                  type="datetime-local"
                  value={event.startDate}
                  onChange={(e) => setEvent({ ...event, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.endDate}
                </label>
                <input
                  type="datetime-local"
                  value={event.endDate}
                  onChange={(e) => setEvent({ ...event, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Crypto Inputs */}
          {activeType === 'crypto' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.cryptoCoin}
                </label>
                <select
                  value={crypto.coin}
                  onChange={(e) =>
                    setCrypto({
                      ...crypto,
                      coin: e.target.value as 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'BNB',
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="SOL">Solana (SOL)</option>
                  <option value="BNB">Binance (BNB)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.amount}
                </label>
                <input
                  type="text"
                  value={crypto.amount}
                  onChange={(e) => setCrypto({ ...crypto, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.walletAddress}
                </label>
                <input
                  type="text"
                  value={crypto.address}
                  onChange={(e) => setCrypto({ ...crypto, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Location Inputs */}
          {activeType === 'location' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.latitude}
                </label>
                <input
                  type="text"
                  value={location.latitude}
                  onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {labels.longitude}
                </label>
                <input
                  type="text"
                  value={location.longitude}
                  onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  اسم / وصف المكان
                </label>
                <input
                  type="text"
                  value={location.label}
                  onChange={(e) => setLocation({ ...location, label: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Styling & Color Customization Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span>{labels.customization}</span>
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-normal">
              تخصيص الألوان والأنماط
            </span>
          </h3>

          {/* Presets List */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {labels.presets}
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_TEMPLATES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:scale-105 transition-transform text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300"
                    style={{ backgroundColor: p.fgColor }}
                  />
                  <span>{lang === 'ar' ? p.nameAr : p.nameEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.fgColor}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleOptions.fgColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, fgColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={styleOptions.fgColor}
                  onChange={(e) => setStyleOptions({ ...styleOptions, fgColor: e.target.value })}
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

          <div className="flex items-center pt-1">
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

          {/* Logo Center Upload */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>{labels.uploadLogo}</span>
              </span>
              {styleOptions.logoUrl && (
                <button
                  onClick={() => setStyleOptions({ ...styleOptions, logoUrl: undefined })}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{labels.removeLogo}</span>
                </button>
              )}
            </label>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {!styleOptions.logoUrl ? (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-500 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>انقر لرفع أي صورة أو شعار للوضع في منتصف الرمز</span>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <img
                  src={styleOptions.logoUrl}
                  alt="Logo preview"
                  className="w-10 h-10 object-contain rounded-lg border bg-white"
                />
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">{labels.logoSize}</label>
                  <input
                    type="range"
                    min="0.12"
                    max="0.30"
                    step="0.02"
                    value={styleOptions.logoSizeRatio}
                    onChange={(e) =>
                      setStyleOptions({
                        ...styleOptions,
                        logoSizeRatio: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dot Style and Eye Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.dotStyle}
              </label>
              <select
                value={styleOptions.dotStyle}
                onChange={(e) =>
                  setStyleOptions({
                    ...styleOptions,
                    dotStyle: e.target.value as 'square' | 'rounded' | 'dots',
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="square">مربعة كلاسيكية (Square)</option>
                <option value="rounded">حواف دائرية (Rounded)</option>
                <option value="dots">نقاط دائرية (Dots)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {labels.eyeStyle}
              </label>
              <select
                value={styleOptions.eyeStyle}
                onChange={(e) =>
                  setStyleOptions({
                    ...styleOptions,
                    eyeStyle: e.target.value as 'square' | 'rounded' | 'circle',
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="square">عيون مربعة (Square)</option>
                <option value="rounded">عيون منحنية (Rounded)</option>
                <option value="circle">عيون دائرية (Circle)</option>
              </select>
            </div>
          </div>

          {/* Resolution size slider */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{labels.size}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {styleOptions.size} x {styleOptions.size} px
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="1200"
              step="50"
              value={styleOptions.size}
              onChange={(e) =>
                setStyleOptions({ ...styleOptions, size: parseInt(e.target.value, 10) })
              }
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Live Interactive Preview & Download Card */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
        <PreviewCard
          dataUrl={previewDataUrl}
          svgString={svgString}
          title={typeTabs.find((x) => x.id === activeType)?.label || 'QR Code'}
          kind="qr"
          rawValue={formattedText}
          lang={lang}
          fgColor={styleOptions.fgColor}
          bgColor={styleOptions.bgColor}
          transparentBg={styleOptions.transparentBg}
          onSaveToHistory={handleSaveCurrent}
          onSaveToCloud={
            onSaveToCloud
              ? () =>
                  onSaveToCloud(
                    typeTabs.find((x) => x.id === activeType)?.label || 'QR Code',
                    activeType,
                    formattedText,
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
