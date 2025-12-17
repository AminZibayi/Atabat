'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React from 'react';

import { Link } from '@/i18n/navigation';
import styles from './Footer.module.css';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <svg
              className={styles.logo}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
              <path d="M16 8L20 14H12L16 8Z" fill="currentColor" />
              <path d="M16 24L12 18H20L16 24Z" fill="currentColor" />
            </svg>
            <p className={styles.copyright}>{t('copyright', { year: currentYear })}</p>
          </div>

          <nav className={styles.links}>
            <Link href="/about" className={styles.link}>
              {t('links.about')}
            </Link>
            <Link href="/contact" className={styles.link}>
              {t('links.contact')}
            </Link>
            <Link href="/terms" className={styles.link}>
              {t('links.terms')}
            </Link>
            <Link href="/privacy" className={styles.link}>
              {t('links.privacy')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
