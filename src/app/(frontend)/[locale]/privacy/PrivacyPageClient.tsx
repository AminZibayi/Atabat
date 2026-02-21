// In the Name of God, the Creative, the Originator
'use client';

import React from 'react';

import { RichText } from '@/components/ui/RichText';
import { useRandomHeroBackground } from '@/hooks/useRandomHeroBackground';
import styles from '../static.module.css';

interface PrivacyPageClientProps {
  title: string;
  content: any;
  locale: string;
  lastUpdated?: string | null;
}

export function PrivacyPageClient({ title, content, locale, lastUpdated }: PrivacyPageClientProps) {
  const bgImage = useRandomHeroBackground();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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
