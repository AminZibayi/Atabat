// In the Name of God, the Creative, the Originator
import { draftMode } from 'next/headers';
import { getPayload } from 'payload';
import { setRequestLocale } from 'next-intl/server';
import React from 'react';
import type { Config } from '@/payload-types';

import config from '@/payload.config';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { LivePreviewListener } from '@/components/ui/LivePreviewListener';
import { TermsPageClient } from './TermsPageClient';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { isEnabled: isDraftMode } = await draftMode();
  setRequestLocale(locale);

  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });

  const staticPages = await payload.findGlobal({
    slug: 'static-pages',
    locale: locale as Config['locale'],
    draft: isDraftMode,
  });

  const title = staticPages?.termsTitle || (locale === 'fa' ? 'شرایط استفاده' : 'Terms of Service');
  const content = staticPages?.termsContent;
  const lastUpdated = staticPages?.termsLastUpdated;

  return (
    <>
      {isDraftMode && <LivePreviewListener />}
      <Header />
      <TermsPageClient title={title} content={content} locale={locale} lastUpdated={lastUpdated} />
      <Footer />
    </>
  );
}
