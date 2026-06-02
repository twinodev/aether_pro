import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/" />
        <meta property="og:title" content="Aether Pro | Retail Intelligence & Duka Sync" />
        <meta property="og:description" content="Distributed inventory & shop management protocol. Precision retail intelligence for high-performance commerce." />
        <meta property="og:image" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/logo.svg" />
        <meta property="og:site_name" content="Aether Pro" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/" />
        <meta property="twitter:title" content="Aether Pro | Retail Intelligence Protocol" />
        <meta property="twitter:description" content="Unified inventory, secure tokens, and financial intelligence via Duka Sync. Zero latency, zero compromise." />
        <meta property="twitter:image" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/logo.svg" />

        {/* Structured Data (JSON-LD) */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Aether Pro",
              "url": "https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/",
              "description": "Precision-engineered suite of privacy-first utility tools. Elite digital solutions for QR, OCR, PDF, and more.",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "All",
              "browserRequirements": "requires HTML5 support",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />

        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="apple-mobile-web-app-title" content="Aether Pro" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.fetch) {
                  try {
                    const originalFetch = window.fetch;
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return originalFetch; },
                      set: function() { /* Silently ignore overwrite attempts */ },
                      configurable: true,
                      enumerable: true
                    });
                  } catch (e) {
                    // If already non-configurable, we can't do much here
                  }
                }
              })();
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
