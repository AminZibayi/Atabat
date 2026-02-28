'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React from 'react';

import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';
import styles from './Footer.module.css';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <Logo size="sm" />
            <p className={styles.copyright}>{t('copyright', { year: currentYear })}</p>
          </div>

          <div className={styles.officialBrand}>
            <Image
              src="/mz_wide.jpg"
              alt="MojeZamZam"
              width={120}
              height={36}
              className={styles.officialBrandImage}
              priority={false}
            />
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
