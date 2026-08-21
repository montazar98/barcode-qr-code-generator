import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Eye,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Sparkles,
  Tag,
  Globe,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Article, AppLanguage } from '../../types';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  articleToEdit: Article | null;
  lang: AppLanguage;
  existingCategories: { ar: string; en: string }[];
}

const PRESET_COVERS = [
  {
    label: 'QR Code & Tech',
    url: 'https://images.unsplash.com/photo-1595079672139-545c6001d670?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Barcode & Logistics',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Mobile & Digital',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Retail & POS Store',
    url: 'https://images.unsplash.com/photo-1556742049-0a67e55722c3?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Modern Business Analytics',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  },
];

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  articleToEdit,
  lang,
  existingCategories,
}) => {
  const isAr = lang === 'ar';
  const [contentLangTab, setContentLangTab] = useState<'ar' | 'en'>('ar');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<Article>({
    id: '',
    slug: '',
    titleAr: '',
    titleEn: '',
    excerptAr: '',
    excerptEn: '',
    contentAr: '',
    contentEn: '',
    coverImageUrl: '',
    categoryAr: 'أدلة رموز QR',
    categoryEn: 'QR Code Guides',
    tags: ['QR Code', 'دليل'],
    author: 'فريق التحرير',
    readTimeMinutes: 3,
    isPublished: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewsCount: 0,
    metaKeywords: '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (articleToEdit) {
      setFormData(articleToEdit);
    } else {
      setFormData({
        id: `art_${Date.now()}`,
        slug: '',
        titleAr: '',
        titleEn: '',
        excerptAr: '',
        excerptEn: '',
        contentAr: '',
        contentEn: '',
        coverImageUrl: PRESET_COVERS[0].url,
        categoryAr: 'أدلة رموز QR',
        categoryEn: 'QR Code Guides',
        tags: ['QR Code', 'دليل'],
        author: 'فريق التحرير',
        readTimeMinutes: 3,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewsCount: 0,
        metaKeywords: '',
      });
    }
  }, [articleToEdit, isOpen]);

  // Auto-calculate read time based on word count
  useEffect(() => {
    const activeText = contentLangTab === 'ar' ? formData.contentAr : formData.contentEn;
    const words = activeText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 150));
    setFormData((prev) => ({ ...prev, readTimeMinutes: minutes }));
  }, [formData.contentAr, formData.contentEn, contentLangTab]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string, language: 'ar' | 'en') => {
    if (language === 'ar') {
      setFormData((prev) => {
        const autoSlug = prev.slug === '' ? generateSlug(val) : prev.slug;
        return { ...prev, titleAr: val, slug: autoSlug };
      });
    } else {
      setFormData((prev) => {
        const autoSlug = prev.slug === '' ? generateSlug(val) : prev.slug;
        return { ...prev, titleEn: val, slug: autoSlug };
      });
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0621-\u064A-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Rich Formatting Insertion Helper
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = contentLangTab === 'ar' ? formData.contentAr : formData.contentEn;

    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updatedText = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    if (contentLangTab === 'ar') {
      setFormData((prev) => ({ ...prev, contentAr: updatedText }));
    } else {
      setFormData((prev) => ({ ...prev, contentEn: updatedText }));
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleAr && !formData.titleEn) {
      alert(isAr ? 'يرجى إدخال عنوان المقال على الأقل.' : 'Please enter at least an article title.');
      return;
    }
    const finalArticle: Article = {
      ...formData,
      slug: formData.slug || generateSlug(formData.titleEn || formData.titleAr || `article-${Date.now()}`),
      updatedAt: Date.now(),
    };
    onSave(finalArticle);
    onClose();
  };

  const activeContent = contentLangTab === 'ar' ? formData.contentAr : formData.contentEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl my-4 sm:my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {articleToEdit
                  ? isAr
                    ? 'تعديل المقال'
                    : 'Edit Article'
                  : isAr
                  ? 'إنشاء مقال ومحتوى جديد'
                  : 'Create New Article'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'محرر غني واحترافي لإنشاء مقالات السيو وتوجيهات الاستخدام'
                  : 'Professional rich editor for SEO articles and user guides'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Settings Grid: Status, Author, Category, Cover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'حالة المقال:' : 'Publication Status:'}
              </label>
              <select
                value={formData.isPublished ? 'published' : 'draft'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublished: e.target.value === 'published' }))
                }
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="published">🟢 {isAr ? 'منشور للزوار' : 'Published'}</option>
                <option value="draft">🟡 {isAr ? 'مسودة خاصة' : 'Draft'}</option>
              </select>
            </div>

            {/* Category Ar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'التصنيف (العربية):' : 'Category (Arabic):'}
              </label>
              <input
                type="text"
                value={formData.categoryAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryAr: e.target.value }))}
                placeholder="أدلة رموز QR"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* Category En */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'التصنيف (English):' : 'Category (English):'}
              </label>
              <input
                type="text"
                value={formData.categoryEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryEn: e.target.value }))}
                placeholder="QR Code Guides"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white dir-ltr"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'اسم الكاتب / المحرر:' : 'Author Name:'}
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                placeholder="فريق باركودي"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cover Image & Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'رابط صورة الغلاف (Cover Image URL):' : 'Cover Image URL:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.coverImageUrl || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white dir-ltr"
              />
            </div>
            {/* Presets Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                {isAr ? 'صور جاهزة مقترحة:' : 'Quick Presets:'}
              </span>
              {PRESET_COVERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, coverImageUrl: preset.url }))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection Tabs for Content */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setContentLangTab('ar')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contentLangTab === 'ar'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                🇸🇦 {isAr ? 'المحتوى بالعربية (الأساسي)' : 'Arabic Content'}
              </button>
              <button
                type="button"
                onClick={() => setContentLangTab('en')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  contentLangTab === 'en'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                🇬🇧 {isAr ? 'المحتوى بالإنجليزية' : 'English Content'}
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEditorTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  editorTab === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'المحرر' : 'Editor'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  editorTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة حية' : 'Live Preview'}</span>
              </button>
            </div>
          </div>

          {/* Title & Slug Inputs */}
          {contentLangTab === 'ar' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'عنوان المقال (بالعربية):' : 'Article Title (Arabic):'}
                </label>
                <input
                  type="text"
                  value={formData.titleAr}
                  onChange={(e) => handleTitleChange(e.target.value, 'ar')}
                  placeholder="مثال: الدليل الشامل لاختيار واستخدام رموز QR..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm sm:text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'مقتطف موجز للمقال (Excerpt / Meta Description):' : 'Summary / Excerpt:'}
                </label>
                <textarea
                  rows={2}
                  value={formData.excerptAr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerptAr: e.target.value }))}
                  placeholder="نبذة سريعة تظهر في بطاقة المقال ونتائج محركات البحث..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Article Title (English):
                </label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => handleTitleChange(e.target.value, 'en')}
                  placeholder="e.g. The Ultimate QR Code Guide for Modern Business..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm sm:text-base font-bold text-slate-900 dark:text-white dir-ltr focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Article Excerpt / Meta Description (English):
                </label>
                <textarea
                  rows={2}
                  value={formData.excerptEn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerptEn: e.target.value }))}
                  placeholder="Short summary displayed on cards and search engine snippets..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white dir-ltr"
                />
              </div>
            </div>
          )}

          {/* Slug URL Customization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'الرابط الدائم المخصص (Slug):' : 'Custom URL Slug:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="qr-marketing-guide"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white dir-ltr"
              />
            </div>
          </div>

          {/* Rich Content Editor / Preview */}
          {editorTab === 'edit' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'محتوى المقال الكامل:' : 'Full Article Content:'}
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formData.readTimeMinutes} {isAr ? 'دقائق قراءة تقديرية' : 'min read'}
                </span>
              </div>

              {/* Rich Formatting Toolbar */}
              <div className="p-2 rounded-t-2xl bg-slate-100 dark:bg-slate-800 border border-b-0 border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('## ', '', isAr ? 'عنوان رئيسي جديد' : 'Main Heading')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Heading 2 (##)"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ', '', isAr ? 'عنوان فرعي' : 'Subheading')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Heading 3 (###)"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**', isAr ? 'نص عريض' : 'bold text')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Bold (**text**)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*', isAr ? 'نص مائل' : 'italic text')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Italic (*text*)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('`', '`', 'code')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Code (`inline`)"
                >
                  <Code className="w-4 h-4" />
                </button>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('* ', '', isAr ? 'نقطة في القائمة' : 'List Item')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Bullet List (* item)"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('1. ', '', isAr ? 'عنصر مرقم' : 'Numbered Item')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Numbered List (1. item)"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ', '', isAr ? 'اقتباس أو نصيحة هامة' : 'Important Callout Quote')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Quote (> blockquote)"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n---\n')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Divider (---)"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={12}
                value={activeContent}
                onChange={(e) => {
                  const val = e.target.value;
                  if (contentLangTab === 'ar') {
                    setFormData((prev) => ({ ...prev, contentAr: val }));
                  } else {
                    setFormData((prev) => ({ ...prev, contentEn: val }));
                  }
                }}
                placeholder={
                  contentLangTab === 'ar'
                    ? 'اكتب محتوى المقال هنا بالتنسيق المرن...\n\n## عنوان رئيسي\nاكتب الفقرات التوضيحية...\n\n* نقطة أولى\n* نقطة ثانية\n\n> نصيحة هامة للقراء'
                    : 'Write your full guide content here with markdown support...\n\n## Main Section\nAdd descriptive paragraphs...\n\n* Key point\n* Another takeaway'
                }
                className={`w-full p-4 rounded-b-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm leading-relaxed text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 ${
                  contentLangTab === 'en' ? 'dir-ltr' : ''
                }`}
              />
            </div>
          ) : (
            /* Live Preview Box */
            <div className="p-6 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[300px]">
              <div className="text-xs font-bold text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                {isAr ? 'معاينة ظهور المقال للقارئ:' : 'Live Article Preview:'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">
                {(contentLangTab === 'ar' ? formData.titleAr : formData.titleEn) ||
                  (isAr ? 'عنوان المقال هنا' : 'Article Title Here')}
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base">
                {activeContent ? (
                  activeContent.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
                          {trimmed.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h3 key={idx} className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1">
                          {trimmed.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith('> ')) {
                      return (
                        <blockquote
                          key={idx}
                          className="my-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border-r-4 border-indigo-500 italic text-slate-700 dark:text-slate-300"
                        >
                          {trimmed.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                      return (
                        <li key={idx} className="ms-4 list-disc text-slate-700 dark:text-slate-300">
                          {trimmed.replace(/^(\*|-)\s+/, '')}
                        </li>
                      );
                    }
                    if (trimmed === '---') {
                      return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
                    }
                    if (trimmed) {
                      return (
                        <p key={idx} className="my-2 text-slate-700 dark:text-slate-300">
                          {trimmed}
                        </p>
                      );
                    }
                    return null;
                  })
                ) : (
                  <p className="text-slate-400 italic">
                    {isAr ? 'لا يوجد محتوى مكتوب بعد في هذه اللغة.' : 'No content written in this language yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tags Chips Manager */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'الكلمات المفتاحية والوسوم (Tags):' : 'Tags & Topics:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={isAr ? 'أدخل وسماً ثم اضغط إضافة...' : 'Add a tag and press add...'}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? '+ إضافة وسم' : '+ Add Tag'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'حفظ ونشر المقال' : 'Save & Publish Article'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
