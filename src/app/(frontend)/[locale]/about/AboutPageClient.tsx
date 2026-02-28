// In the Name of God, the Creative, the Originator
'use client';

import Image from 'next/image';
import React from 'react';

import { RichText } from '@/components/ui/RichText';
import { useRandomHeroBackground } from '@/hooks/useRandomHeroBackground';
import styles from '../static.module.css';

interface AboutPageClientProps {
  title: string;
  content: any;
  locale: string;
}

export function AboutPageClient({ title, content, locale }: AboutPageClientProps) {
  const bgImage = useRandomHeroBackground();

  return (
    <main className={styles.page}>
      <div
        className={styles.header}
        style={bgImage ? ({ '--hero-bg': `url("${bgImage}")` } as React.CSSProperties) : undefined}>
        <div className={styles.container}>
          <h1 className={styles.title}>{title}</h1>
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
            <div className={styles.brandStamp}>
              <Image
                src="/mz_wide.jpg"
                alt="MojeZamZam official logo"
                width={200}
                height={60}
                className={styles.brandStampImage}
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
