// In the Name of God, the Creative, the Originator
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import React from 'react';
import { Toaster } from 'react-hot-toast';

import { AdminBar } from '@/components/ui/AdminBar';
import { routing, Locale } from '@/i18n/routing';
import './globals.css';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = (await import(`../../../../messages/${locale}.json`)).default;

  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
    icons: [
      { rel: 'icon', type: 'image/png', url: '/favicon-96x96.png', sizes: '96x96' },
      { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
      { rel: 'shortcut icon', url: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' },
    ],
    manifest: '/site.webmanifest',
    appleWebApp: {
      title: 'MojeZamZam',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { isEnabled: isDraftMode } = await draftMode();

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRTL = locale === 'fa';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AdminBar
            adminBarProps={{
              preview: isDraftMode,
            }}
          />
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #1a202c)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontFamily: 'inherit',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-success, #10b981)',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--color-error, #ef4444)',
                  secondary: '#fff',
                },
              },
            }}
          />
          <div className="app-layout">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
