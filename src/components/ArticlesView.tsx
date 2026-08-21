import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  Sparkles,
  QrCode,
  Barcode as BarcodeIcon,
  ChevronRight,
  Printer,
  Compass,
} from 'lucide-react';
import { Article, AppLanguage, AppTab } from '../types';
import { NotFoundView } from './NotFoundView';

interface ArticlesViewProps {
  articles: Article[];
  lang: AppLanguage;
  onNavigateToTab: (tab: AppTab) => void;
  siteName: string;
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({
  articles,
  lang,
  onNavigateToTab,
  siteName,
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Filter only published articles for users
  const publishedArticles = useMemo(() => {
    return articles.filter((art) => art.isPublished !== false);
  }, [articles]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    publishedArticles.forEach((art) => {
      const cat = isAr ? art.categoryAr || art.categoryEn : art.categoryEn || art.categoryAr;
      if (cat) cats.add(cat);
    });
    return Array.from(cats);
  }, [publishedArticles, isAr]);

  // Filtered articles based on search and category
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((art) => {
      const title = (isAr ? art.titleAr : art.titleEn) || art.titleAr || art.titleEn;
      const excerpt = (isAr ? art.excerptAr : art.excerptEn) || art.excerptAr || art.excerptEn;
      const content = (isAr ? art.contentAr : art.contentEn) || art.contentAr || art.contentEn;
      const cat = (isAr ? art.categoryAr : art.categoryEn) || art.categoryAr || art.categoryEn;
      const tagsStr = (art.tags || []).join(' ');

      const matchesSearch =
        searchQuery.trim() === '' ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tagsStr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || cat.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [publishedArticles, searchQuery, selectedCategory, isAr]);

  // Active article being read
  const currentArticle = useMemo(() => {
    if (!selectedArticleId) return null;
    return publishedArticles.find((a) => a.id === selectedArticleId) || null;
  }, [selectedArticleId, publishedArticles]);

  // Related articles
  const relatedArticles = useMemo(() => {
    if (!currentArticle) return [];
    return publishedArticles
      .filter((a) => a.id !== currentArticle.id)
      .slice(0, 3);
  }, [currentArticle, publishedArticles]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Safe parser to render inline markdown into pure React nodes without dangerouslySetInnerHTML
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return null;

    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/[^\s)]+)\))/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      const key = `token-${match.index}`;

      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={key} className="font-bold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={key} className="italic text-slate-800 dark:text-slate-200">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-sm font-semibold"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        const closingBracket = token.indexOf('](');
        const label = token.slice(1, closingBracket);
        const rawUrl = token.slice(closingBracket + 2, -1);
        if (/^https?:\/\//i.test(rawUrl)) {
          parts.push(
            <a
              key={key}
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700"
            >
              {label}
            </a>
          );
        } else {
          parts.push(label);
        }
      } else {
        parts.push(token);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length === 1 ? parts[0] : <React.Fragment>{parts}</React.Fragment>;
  };

  // Helper to render markdown-like content cleanly and safely
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`${keyPrefix}-list`} className="my-4 space-y-2 list-none ps-0">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>{parseInlineMarkdown(item)}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        flushList(`before-h3-${index}`);
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 flex items-center gap-2"
          >
            <span className="w-1.5 h-5 bg-indigo-600 rounded-full inline-block" />
            <span>{parseInlineMarkdown(trimmed.replace('### ', ''))}</span>
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList(`before-h2-${index}`);
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
          >
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{parseInlineMarkdown(trimmed.replace('## ', ''))}</span>
          </h2>
        );
      } else if (trimmed.startsWith('---')) {
        flushList(`before-hr-${index}`);
        elements.push(<hr key={`hr-${index}`} className="my-6 border-slate-200 dark:border-slate-800" />);
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(trimmed.replace(/^(\*|-)\s+/, ''));
      } else if (/^\d+\.\s+/.test(trimmed)) {
        flushList(`before-numlist-${index}`);
        elements.push(
          <div
            key={`num-${index}`}
            className="my-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              {trimmed.match(/^\d+/)?.[0]}
            </span>
            <div className="flex-1">
              {parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}
            </div>
          </div>
        );
      } else if (trimmed.startsWith('> ')) {
        flushList(`before-quote-${index}`);
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className="my-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border-r-4 rtl:border-r-4 rtl:border-l-0 ltr:border-l-4 ltr:border-r-0 border-indigo-600 text-slate-800 dark:text-slate-200 italic text-base leading-relaxed"
          >
            <p>{parseInlineMarkdown(trimmed.replace('> ', ''))}</p>
          </blockquote>
        );
      } else if (trimmed !== '') {
        flushList(`before-p-${index}`);
        elements.push(
          <p
            key={`p-${index}`}
            className="my-3 text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed"
          >
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      }
    });

    flushList('final');
    return elements;
  };

  // -------------------------------------------------------------
  // VIEW: SINGLE ARTICLE READER MODE / NOT FOUND
  // -------------------------------------------------------------
  if (selectedArticleId && !currentArticle) {
    return (
      <NotFoundView
        lang={lang}
        missingUrl={`/articles/${selectedArticleId}`}
        customReason={
          isAr
            ? 'عذراً، لم يتم العثور على المقال المطلوب. ربما تم حذفه أو نقله.'
            : 'Sorry, the requested article was not found. It may have been moved or unpublished.'
        }
        onNavigateHome={() => {
          setSelectedArticleId(null);
          onNavigateToTab('qr');
        }}
        onNavigateToTab={(tab) => {
          setSelectedArticleId(null);
          onNavigateToTab(tab);
        }}
      />
    );
  }

  if (currentArticle) {
    const title = (isAr ? currentArticle.titleAr : currentArticle.titleEn) || currentArticle.titleAr || currentArticle.titleEn;
    const category = (isAr ? currentArticle.categoryAr : currentArticle.categoryEn) || currentArticle.categoryAr || currentArticle.categoryEn;
    const content = (isAr ? currentArticle.contentAr : currentArticle.contentEn) || currentArticle.contentAr || currentArticle.contentEn;
    const dateFormatted = new Date(currentArticle.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-in fade-in duration-300">
        {/* Navigation Breadcrumbs & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSelectedArticleId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'العودة لقائمة المقالات' : 'Back to Articles'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title={isAr ? 'نسخ الرابط للمشاركة' : 'Copy link to share'}
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedShare ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'مشاركة' : 'Share')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-all cursor-pointer shadow-sm"
              title={isAr ? 'طباعة المقال' : 'Print Article'}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Header & Metadata */}
        <header className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Compass className="w-3.5 h-3.5" />
              {category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {currentArticle.readTimeMinutes} {isAr ? 'دقائق قراءة' : 'min read'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {dateFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {currentArticle.author || siteName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'محرر تقني متخصص' : 'Specialized Technical Author'}
              </p>
            </div>
          </div>
        </header>

        {/* Article Cover Image */}
        {currentArticle.coverImageUrl && (
          <div className="rounded-3xl overflow-hidden mb-8 border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-900 max-h-[420px]">
            <img
              src={currentArticle.coverImageUrl}
              alt={title}
              className="w-full h-full object-cover max-h-[420px]"
            />
          </div>
        )}

        {/* Article Excerpt Callout */}
        {(currentArticle.excerptAr || currentArticle.excerptEn) && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-base sm:text-lg mb-8 leading-relaxed">
            {isAr ? currentArticle.excerptAr : currentArticle.excerptEn}
          </div>
        )}

        {/* Article Body Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none mb-12">
          {renderFormattedContent(content)}
        </article>

        {/* Tags */}
        {currentArticle.tags && currentArticle.tags.length > 0 && (
          <div className="pt-6 pb-8 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {isAr ? 'الكلمات المفتاحية والمواضيع:' : 'Topics & Tags:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentArticle.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interactive CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-start space-y-2">
              <h3 className="text-xl sm:text-2xl font-black">
                {isAr ? 'جاهز لتطبيق ما قرأته الآن؟' : 'Ready to Create Your Custom Codes?'}
              </h3>
              <p className="text-indigo-100 text-xs sm:text-sm max-w-xl">
                {isAr
                  ? 'صمم رمز QR احترافي مع شعارك مجاناً وبأعلى دقة متجهة، أو أنشئ باركود لمنتجاتك ومخزونك في ثوانٍ.'
                  : 'Design professional vector QR codes with your custom logo or create retail barcodes in seconds.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => onNavigateToTab('qr')}
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>{isAr ? 'مولد QR' : 'QR Generator'}</span>
              </button>
              <button
                onClick={() => onNavigateToTab('barcode')}
                className="px-4 py-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-indigo-400/30 cursor-pointer transition-all"
              >
                <BarcodeIcon className="w-4 h-4" />
                <span>{isAr ? 'مولد باركود' : 'Barcode Generator'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>{isAr ? 'مقالات وأدلة أخرى قد تهمك' : 'Related Guides & Articles'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => {
                const relTitle = (isAr ? rel.titleAr : rel.titleEn) || rel.titleAr;
                return (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedArticleId(rel.id)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                        {isAr ? rel.categoryAr : rel.categoryEn}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2">
                        {relTitle}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{rel.readTimeMinutes} {isAr ? 'د قراءة' : 'min'}</span>
                      <span className="text-indigo-600 font-bold flex items-center gap-1">
                        {isAr ? 'قراءة' : 'Read'}
                        <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ARTICLES CATALOG / GRID
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Header Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{isAr ? 'مركز المعرفة والمقالات الإرشادية' : 'Knowledge Base & Technical Guides'}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {isAr
            ? 'مقالات وأدلة شاملة في عالم الباركود ورموز QR'
            : 'Comprehensive Guides for QR Codes & Barcodes'}
        </h2>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          {isAr
            ? 'تعلم أسرار تصميم رموز الاستجابة السريعة، استراتيجيات التسويق الحديثة، وإدارة المخزون ونقاط البيع باحترافية.'
            : 'Learn the secrets of QR design, modern mobile marketing strategies, and retail barcode standards.'}
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-4 rtl:pl-0 rtl:pr-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في المقالات والمواضيع...' : 'Search articles and guides...'}
            className="w-full pl-11 pr-4 rtl:pl-4 rtl:pr-11 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      {categories.length > 0 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-6 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {isAr ? 'جميع المقالات' : 'All Articles'} ({publishedArticles.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article) => {
            const title = (isAr ? article.titleAr : article.titleEn) || article.titleAr || article.titleEn;
            const excerpt = (isAr ? article.excerptAr : article.excerptEn) || article.excerptAr || article.excerptEn;
            const category = (isAr ? article.categoryAr : article.categoryEn) || article.categoryAr || article.categoryEn;
            const dateFormatted = new Date(article.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-500/80 dark:hover:border-indigo-500/80 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Card Cover Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {article.coverImageUrl ? (
                      <img
                        src={article.coverImageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                        <BookOpen className="w-12 h-12 opacity-80" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rtl:right-auto rtl:left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-slate-900/95 text-indigo-600 dark:text-indigo-400 backdrop-blur-md shadow-md">
                      {category}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateFormatted}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTimeMinutes} {isAr ? 'د قراءة' : 'min'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                      {title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      {article.author ? article.author.charAt(0) : 'A'}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      {article.author || siteName}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    {isAr ? 'قراءة المقال' : 'Read Article'}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {isAr ? 'لم يتم العثور على مقالات مطابقة' : 'No matching articles found'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'جرّب البحث بكلمة أخرى أو قم بإلغاء الفلتر لعرض كافة المقالات.'
              : 'Try searching with different keywords or reset your active filters.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {isAr ? 'إعادة ضبط البحث' : 'Reset Search'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
