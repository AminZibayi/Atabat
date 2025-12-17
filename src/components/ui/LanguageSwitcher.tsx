'use client';

// In the Name of God, the Creative, the Originator
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import React, { useTransition } from 'react';

import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const newLocale = locale === 'fa' ? 'en' : 'fa';

    // Replace the locale segment in the current path
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale (first segment after /)
    const newPath = segments.join('/');

    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <button
      className={`${styles.switcher} ${isPending ? styles.pending : ''}`}
      onClick={toggleLocale}
      disabled={isPending}
      aria-label={locale === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}>
      <span className={styles.flag}>{locale === 'fa' ? '🇬🇧' : '🇮🇷'}</span>
      <span className={styles.label}>{locale === 'fa' ? 'EN' : 'فا'}</span>
    </button>
  );
}
