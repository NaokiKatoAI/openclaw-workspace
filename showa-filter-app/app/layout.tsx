import type { Metadata, Viewport } from "next";
import { Shippori_Mincho } from "next/font/google";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-mincho",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://showa-filter-app.vercel.app'),
  title: {
    default: "昭和Pictures - 最新の写真が、最古の思い出に。",
    template: "%s | 昭和Pictures"
  },
  description: "ワンクリックで写真を昭和・大正・明治風に変換。時を超える写真館。AI画像フィルターで懐かしい雰囲気を再現。",
  keywords: ["昭和", "大正", "明治", "写真加工", "レトロ", "フィルター", "画像編集", "ヴィンテージ", "モノクロ", "セピア"],
  authors: [{ name: "昭和Pictures" }],
  creator: "昭和Pictures",
  publisher: "昭和Pictures",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '昭和Pictures',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://showa-filter-app.vercel.app',
    siteName: '昭和Pictures',
    title: '昭和Pictures - 最新の写真が、最古の思い出に。',
    description: 'ワンクリックで写真を昭和・大正・明治風に変換。時を超える写真館。',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '昭和Pictures - 写真を時代を超えて加工',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '昭和Pictures - 最新の写真が、最古の思い出に。',
    description: 'ワンクリックで写真を昭和・大正・明治風に変換。時を超える写真館。',
    images: ['/og-image.jpg'],
    creator: '@showapictures',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console用（後で設定）
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '昭和Pictures',
    description: 'ワンクリックで写真を昭和・大正・明治風に変換。時を超える写真館。AI画像フィルターで懐かしい雰囲気を再現。',
    url: 'https://showa-filter-app.vercel.app',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: [
      {
        '@type': 'Offer',
        name: '無料プラン',
        price: '0',
        priceCurrency: 'JPY',
      },
      {
        '@type': 'Offer',
        name: 'ライトプラン',
        price: '500',
        priceCurrency: 'JPY',
      },
      {
        '@type': 'Offer',
        name: 'プロプラン',
        price: '1000',
        priceCurrency: 'JPY',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      ratingCount: '1',
    },
    author: {
      '@type': 'Organization',
      name: '昭和Pictures',
    },
  };

  return (
    <html lang="ja">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6F6SZRHCN3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6F6SZRHCN3');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${shipporiMincho.variable} antialiased`} style={{ fontFamily: "'Shippori Mincho', serif" }}>
        {children}
      </body>
    </html>
  );
}
