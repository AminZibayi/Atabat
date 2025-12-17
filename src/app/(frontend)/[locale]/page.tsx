// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import React from 'react';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Link } from '@/i18n/navigation';
import styles from './page.module.css';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                <HeroTitle />
              </h1>
              <p className={styles.heroSubtitle}>
                <HeroSubtitle />
              </p>
              <div className={styles.heroCta}>
                <Link href="/trips" className={styles.primaryBtn}>
                  <HeroCta />
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <svg
                className={styles.heroIcon}
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <path d="M100 50L120 85H80L100 50Z" fill="currentColor" />
                <path d="M100 150L80 115H120L100 150Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              <QuickActionsTitle />
            </h2>
            <div className={styles.actionCards}>
              <ActionCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                }
                titleKey="searchTrips"
                descKey="searchTripsDesc"
                href="/trips"
              />
              <ActionCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                }
                titleKey="myReservations"
                descKey="myReservationsDesc"
                href="/reservations"
              />
              <ActionCard
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  </svg>
                }
                titleKey="profile"
                descKey="profileDesc"
                href="/profile"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// Client components for translations
function HeroTitle() {
  const t = useTranslations('home.hero');
  return <>{t('title')}</>;
}

function HeroSubtitle() {
  const t = useTranslations('home.hero');
  return <>{t('subtitle')}</>;
}

function HeroCta() {
  const t = useTranslations('home.hero');
  return <>{t('cta')}</>;
}

function QuickActionsTitle() {
  const t = useTranslations('home.quickActions');
  return <>{t('title')}</>;
}

function ActionCard({
  icon,
  titleKey,
  descKey,
  href,
}: {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  href: string;
}) {
  const t = useTranslations('home.quickActions');

  return (
    <Link href={href} className={styles.actionCard}>
      <div className={styles.actionIcon}>{icon}</div>
      <h3 className={styles.actionTitle}>{t(titleKey)}</h3>
      <p className={styles.actionDesc}>{t(descKey)}</p>
      <span className={styles.actionArrow}>→</span>
    </Link>
  );
}
