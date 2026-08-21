import React, { useMemo } from 'react';

interface AdBannerProps {
  enabled: boolean;
  codeHtml: string;
  clientId?: string;
  position: 'header' | 'sidebar' | 'inContent' | 'footer';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  enabled,
  codeHtml,
  position,
}) => {
  const iframeDoc = useMemo(() => {
    if (!codeHtml || !codeHtml.trim()) return '';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      background: transparent;
      overflow: hidden;
    }
    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    a { color: inherit; text-decoration: none; }
  </style>
</head>
<body>
  ${codeHtml.trim()}
</body>
</html>`;
  }, [codeHtml]);

  if (!enabled || !codeHtml || !codeHtml.trim()) return null;

  const minHeight = position === 'sidebar' ? '250px' : '90px';

  return (
    <div
      className={`ad-container my-3 flex justify-center w-full overflow-hidden transition-all ${
        position === 'sidebar' ? 'max-w-xs' : 'max-w-5xl mx-auto px-4'
      }`}
    >
      <iframe
        title="Advertisement"
        sandbox="allow-scripts allow-popups allow-forms"
        srcDoc={iframeDoc}
        className="w-full border-0 rounded-xl overflow-hidden bg-transparent"
        style={{ minHeight, height: minHeight }}
        loading="lazy"
      />
    </div>
  );
};


