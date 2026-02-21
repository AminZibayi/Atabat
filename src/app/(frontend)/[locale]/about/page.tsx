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
import { AboutPageClient } from './AboutPageClient';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
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

  const title = staticPages?.aboutTitle || (locale === 'fa' ? 'درباره ما' : 'About Us');
  const content = staticPages?.aboutContent;

  return (
    <>
      {isDraftMode && <LivePreviewListener />}
      <Header />
      <AboutPageClient title={title} content={content} locale={locale} />
      <Footer />
    </>
  );
}
