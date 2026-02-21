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
import { RichText } from '@/components/ui/RichText';
import { useRandomHeroBackground } from '@/hooks/useRandomHeroBackground';
import styles from '../static.module.css';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
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

  const title = staticPages?.privacyTitle || (locale === 'fa' ? 'حریم خصوصی' : 'Privacy Policy');
  const content = staticPages?.privacyContent;
  const lastUpdated = staticPages?.privacyLastUpdated;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {isDraftMode && <LivePreviewListener />}
      <Header />
      <PrivacyPageClient
        title={title}
        content={content}
        locale={locale}
        lastUpdated={lastUpdated}
        formatDate={formatDate}
      />
      <Footer />
    </>
  );
}

function PrivacyPageClient({ title, content, locale, lastUpdated, formatDate }: any) {
  const bgImage = useRandomHeroBackground();

  return (
    <main className={styles.page}>
      <div
        className={styles.header}
        style={bgImage ? ({ '--hero-bg': `url("${bgImage}")` } as React.CSSProperties) : undefined}>
        <div className={styles.container}>
          <h1 className={styles.title}>{title}</h1>
          {lastUpdated && (
            <p className={styles.lastUpdated}>
              {locale === 'fa' ? 'آخرین بروزرسانی: ' : 'Last updated: '}
              {formatDate(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          <div className={styles.content}>
            {content ? (
              <RichText data={content} />
            ) : (
              <div className={styles.empty}>
                <p>{locale === 'fa' ? 'محتوایی وجود ندارد' : 'No content available'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
