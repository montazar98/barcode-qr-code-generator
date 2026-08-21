import { AdminSettings, AppLanguage } from '../types';

export function applyHeadMetadata(settings: AdminSettings, lang: AppLanguage): void {
  try {
    const isAr = lang === 'ar';
    const siteTitle = isAr
      ? settings.metaTitleAr || settings.siteNameAr || settings.siteName || 'باركودي'
      : settings.metaTitleEn || settings.siteNameEn || settings.siteName || 'Barcodey';
    
    const siteDesc = isAr
      ? settings.metaDescriptionAr || settings.siteSubtitleAr || 'أداة مجانية واحترافية لإنشاء وتخصيص رموز QR والباركود'
      : settings.metaDescriptionEn || settings.siteSubtitleEn || 'Free professional QR code and barcode generator';

    const keywords = settings.metaKeywords || 'qr code generator, barcode generator, مولد باركود, باركودي';
    const canonical = settings.canonicalUrl || window.location.origin;
    const ogImage = settings.ogImageUrl || `${window.location.origin}/og-image.png`;

    // 1. Page Title
    document.title = siteTitle;

    // Helper to set or create meta tag
    const setMeta = (nameOrProperty: 'name' | 'property', key: string, content: string) => {
      let tag = document.querySelector(`meta[${nameOrProperty}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(nameOrProperty, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', siteDesc);
    setMeta('name', 'keywords', keywords);
    setMeta('name', 'author', settings.siteNameAr || settings.siteName || 'باركودي');
    setMeta('name', 'application-name', settings.siteNameAr || settings.siteName || 'باركودي');

    // Fast Google Indexing Directives
    const indexingDirective =
      settings.robotsIndexing === 'noindex'
        ? 'noindex, follow'
        : settings.robotsIndexing === 'nofollow'
        ? 'index, nofollow'
        : settings.robotsIndexing === 'none'
        ? 'noindex, nofollow'
        : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

    setMeta('name', 'robots', indexingDirective);
    setMeta('name', 'googlebot', indexingDirective);

    // Google Search Console Site Verification Meta Tag
    if (settings.googleSiteVerification && settings.googleSiteVerification.trim()) {
      let rawToken = settings.googleSiteVerification.trim();
      // Handle if user pasted full <meta name="google-site-verification" content="xxx" />
      const match = rawToken.match(/content=["']([^"']+)["']/i);
      if (match) rawToken = match[1];
      setMeta('name', 'google-site-verification', rawToken);
    }

    // Bing Webmaster Tools Verification Meta Tag
    if (settings.bingSiteVerification && settings.bingSiteVerification.trim()) {
      let rawBing = settings.bingSiteVerification.trim();
      const match = rawBing.match(/content=["']([^"']+)["']/i);
      if (match) rawBing = match[1];
      setMeta('name', 'msvalidate.01', rawBing);
    }

    // 3. Open Graph (Facebook, WhatsApp, LinkedIn, Telegram)
    setMeta('property', 'og:title', siteTitle);
    setMeta('property', 'og:description', siteDesc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', settings.siteNameAr || settings.siteName || 'باركودي');
    setMeta('property', 'og:locale', isAr ? 'ar_AR' : 'en_US');

    // 4. Twitter Cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', siteTitle);
    setMeta('name', 'twitter:description', siteDesc);
    setMeta('name', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // 6. Custom Favicon Link
    if (settings.customFaviconUrl) {
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.setAttribute('rel', 'icon');
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = settings.customFaviconUrl;
    }

    // 7. Schema.org JSON-LD (Structured Data for Google Rich Snippets & AI Search Engines)
    const jsonLdId = 'schema-structured-data-ld';
    let scriptTag = document.getElementById(jsonLdId) as HTMLScriptElement | null;

    if (settings.enableStructuredData) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = jsonLdId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const structuredGraph: any[] = [
        // WebApplication & SoftwareApplication Schema
        {
          '@type': 'WebApplication',
          '@id': `${canonical}/#webapp`,
          name: settings.siteNameAr || settings.siteName || 'باركودي',
          alternateName: settings.siteNameEn || 'Barcodey',
          url: canonical,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          description: siteDesc,
          inLanguage: [isAr ? 'ar' : 'en', isAr ? 'en' : 'ar'],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          featureList: [
            'Generate QR codes with custom logos, dots, and colors',
            'Generate linear barcodes (Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14)',
            'Batch barcode & QR code generation and CSV export',
            'Live barcode scanner from camera or image upload',
            'High-definition vector SVG, PDF, and PNG export',
            'Rich knowledge base & 33 expert SEO articles on QR & Barcode tech',
          ],
        },
        // WebSite & Organization Schema
        {
          '@type': 'WebSite',
          '@id': `${canonical}/#website`,
          url: canonical,
          name: settings.siteNameAr || settings.siteName || 'باركودي',
          description: siteDesc,
          inLanguage: isAr ? 'ar' : 'en',
          publisher: {
            '@type': 'Organization',
            name: settings.siteNameAr || settings.siteName || 'باركودي',
            url: canonical,
            logo: settings.customLogoUrl || ogImage,
          },
        },
      ];

      // Article Schemas for Fast Google Search Console Indexing
      if (settings.articles && settings.articles.length > 0) {
        const publishedArticles = settings.articles.filter((a) => a.isPublished !== false);
        publishedArticles.forEach((art) => {
          const articleTitle = isAr ? art.titleAr || art.titleEn : art.titleEn || art.titleAr;
          const articleDesc = isAr ? art.excerptAr || art.excerptEn : art.excerptEn || art.excerptAr;
          const articleUrl = `${canonical}/#article-${art.slug || art.id}`;

          structuredGraph.push({
            '@type': 'Article',
            '@id': articleUrl,
            headline: articleTitle,
            description: articleDesc,
            image: art.coverImageUrl || ogImage,
            datePublished: new Date(art.createdAt).toISOString(),
            dateModified: new Date(art.updatedAt || art.createdAt).toISOString(),
            inLanguage: isAr ? 'ar' : 'en',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': articleUrl,
            },
            author: {
              '@type': 'Person',
              name: art.author || settings.siteNameAr || 'باركودي',
            },
            publisher: {
              '@type': 'Organization',
              name: settings.siteNameAr || settings.siteName || 'باركودي',
              logo: {
                '@type': 'ImageObject',
                url: settings.customLogoUrl || ogImage,
              },
            },
            keywords: (art.tags || []).join(', '),
          });
        });
      }

      // FAQPage Schema (Top-ranked rich results and LLM knowledge graph)
      if (settings.faqSchemaList && settings.faqSchemaList.length > 0) {
        const faqEntities = settings.faqSchemaList.map((item) => ({
          '@type': 'Question',
          name: isAr ? item.questionAr || item.questionEn : item.questionEn || item.questionAr,
          acceptedAnswer: {
            '@type': 'Answer',
            text: isAr ? item.answerAr || item.answerEn : item.answerEn || item.answerAr,
          },
        }));

        structuredGraph.push({
          '@type': 'FAQPage',
          '@id': `${canonical}/#faq`,
          mainEntity: faqEntities,
        });
      }

      scriptTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': structuredGraph,
      });
    } else if (scriptTag) {
      scriptTag.remove();
    }
  } catch (e) {
    console.error('Error applying SEO metadata:', e);
  }
}

/**
 * Generates dynamic XML Sitemap for Google Search Console
 */
export function generateSitemapXml(settings: AdminSettings): string {
  const origin = settings.canonicalUrl || 'https://www.evar-cademy.online';
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${origin}/#qr`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/#barcode`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/#batch`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${origin}/#scanner`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${origin}/#articles`, priority: '0.9', changefreq: 'daily' },
  ];

  const articleUrls = (settings.articles || [])
    .filter((a) => a.isPublished !== false)
    .map((a) => ({
      loc: `${origin}/#article-${a.slug || a.id}`,
      lastmod: new Date(a.updatedAt || a.createdAt).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    }));

  const allUrls = [
    ...staticUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
    ...articleUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join('\n')}
</urlset>`;
}

/**
 * Generates llms.txt content (Emerging standard for ChatGPT, Claude, Perplexity and LLMs)
 */
export function generateLlmsTxt(settings: AdminSettings): string {
  const site = settings.siteNameAr || settings.siteName || 'باركودي';
  return `# ${site} - AI Context & Summary (llms.txt)
> ${settings.siteSubtitleAr || settings.metaDescriptionAr}

## About The Platform
${settings.aboutUsAr}

## Main Capabilities
- **QR Code Generator**: Create URLs, vCards, Wi-Fi, WhatsApp, Crypto, Geo-location, and event QR codes with customizable colors, eye shapes, and custom central logos.
- **Barcode Generator**: Produce EAN-13, Code 128, UPC-A, Code 39, ITF-14, MSI, Pharmacode, and Codabar linear formats.
- **Batch Processing**: Bulk generate codes with custom CSV data import/export.
- **HD Exporting**: Direct export to HD PNG, scalable vector SVG, and printable PDF documents.
- **Articles & Knowledge Hub**: 33 comprehensive guides on QR menus, EAN barcodes, vCards, logistics, e-invoicing, vector printing, security, and healthcare serialization.
- **Privacy & Security**: 100% Client-side browser rendering. No user-entered private codes or Wi-Fi passwords are stored remotely.

## Key Links & Resources
- Home URL: ${settings.canonicalUrl || 'https://www.evar-cademy.online'}
- Contact Email: ${settings.contactEmail || 'support@example.com'}
`;
}

/**
 * Generates robots.txt content optimized for Googlebot, Bingbot, and AI Search Crawlers
 */
export function generateRobotsTxt(settings: AdminSettings): string {
  const canonical = settings.canonicalUrl || 'https://www.evar-cademy.online';
  return `# Robots.txt for ${settings.siteNameAr || settings.siteName || 'باركودي'}
User-agent: *
Allow: /
Disallow: /?admin_key=
Disallow: /#portal-access-2026

# Fast Search Crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# AI Crawlers & LLM Agents
User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${canonical}/sitemap.xml
`;
}

