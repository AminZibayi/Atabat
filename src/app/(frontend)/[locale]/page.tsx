'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { JalaliDatePicker } from '@/components/ui/JalaliDatePicker';
import { Link } from '@/i18n/navigation';
import { getTodayJalali, addDaysToTodayJalali } from '@/utils/jalaliDate';
import { convertToEnglishDigits } from '@/utils/digits';
import { tripSearchSchema } from '@/validations/trip';
import styles from './page.module.css';

interface SearchFilters {
  departureFrom: string;
  departureTo: string;
  province: string;
  minCapacity: string;
  tripType: string;
}

export default function HomePage() {
  const router = useRouter();
  const tSearch = useTranslations('trips.search');

  // Calculate default dates (today and today+14)
  const defaultDates = useMemo(
    () => ({
      from: getTodayJalali(),
      to: addDaysToTodayJalali(14),
    }),
    []
  );

  const [filters, setFilters] = useState<SearchFilters>({
    departureFrom: defaultDates.from,
    departureTo: defaultDates.to,
    province: '-1',
    minCapacity: '1',
    tripType: '',
  });

  // All provinces from the functional spec
  const provinces = [
    { value: '-1', label: 'همه استان‌ها' },
    { value: '10', label: 'اردبیل' },
    { value: '11', label: 'آذربایجان شرقی' },
    { value: '12', label: 'آذربایجان غربی' },
    { value: '13', label: 'اصفهان' },
    { value: '14', label: 'ایلام' },
    { value: '15', label: 'کرمانشاه' },
    { value: '16', label: 'بوشهر' },
    { value: '17', label: 'تهران' },
    { value: '18', label: 'چهارمحال و بختیاری' },
    { value: '19', label: 'خراسان رضوی' },
    { value: '20', label: 'خوزستان' },
    { value: '21', label: 'زنجان' },
    { value: '22', label: 'سمنان' },
    { value: '23', label: 'سیستان و بلوچستان' },
    { value: '24', label: 'فارس' },
    { value: '25', label: 'کردستان' },
    { value: '26', label: 'کرمان' },
    { value: '27', label: 'کهگیلویه و بویراحمد' },
    { value: '28', label: 'گیلان' },
    { value: '29', label: 'لرستان' },
    { value: '30', label: 'مازندران' },
    { value: '31', label: 'مرکزی' },
    { value: '32', label: 'هرمزگان' },
    { value: '33', label: 'همدان' },
    { value: '34', label: 'یزد' },
    { value: '35', label: 'قم' },
    { value: '36', label: 'کاشان' },
    { value: '37', label: 'قزوین' },
    { value: '38', label: 'گلستان' },
    { value: '39', label: 'خراسان جنوبی' },
    { value: '40', label: 'خراسان شمالی' },
    { value: '47', label: 'البرز' },
  ];

  // All trip types from the functional spec
  const tripTypes = [
    { value: '', label: 'همه انواع' },
    { value: '2', label: 'بسته زیارت هوایی' },
    { value: '1', label: 'بسته زیارت زمینی' },
    { value: '128', label: 'فقط اسکان' },
    { value: '129', label: 'فقط پرواز' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert Persian digits to English and prepare search input
      const searchInput = {
        departureFrom: convertToEnglishDigits(filters.departureFrom),
        departureTo: convertToEnglishDigits(filters.departureTo),
        province: filters.province || undefined,
        minCapacity: filters.minCapacity ? parseInt(filters.minCapacity, 10) : undefined,
        tripType: (filters.tripType || undefined) as '' | '1' | '2' | '128' | '129' | undefined,
      };

      // Validate with Zod schema (same schema used on server)
      const validation = tripSearchSchema.safeParse(searchInput);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || 'پارامترهای جستجو نامعتبر است';
        toast.error(firstError);
        return;
      }

      // Build query params with validated and converted data
      const params = new URLSearchParams();
      if (searchInput.departureFrom) params.set('departureFrom', searchInput.departureFrom);
      if (searchInput.departureTo) params.set('departureTo', searchInput.departureTo);
      if (searchInput.province) params.set('province', searchInput.province);
      if (searchInput.minCapacity) params.set('minCapacity', searchInput.minCapacity.toString());
      if (searchInput.tripType) params.set('tripType', searchInput.tripType);

      // Navigate to trips page with search params
      router.push(`/trips?${params.toString()}`);
    } catch (error) {
      // Handle unexpected errors during validation or navigation
      toast.error('خطا در انجام عملیات، لطفا دوباره تلاش کنید');
      console.error('Search form error:', error);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <HeroTitle />
            </h1>
            <p className={styles.heroSubtitle}>
              <HeroSubtitle />
            </p>

            {/* Search Card */}
            <div className={styles.heroSearchCard}>
              <form onSubmit={handleSearch} className={styles.heroForm}>
                <div className={styles.heroFormGrid}>
                  <JalaliDatePicker
                    label={tSearch('departureFrom')}
                    value={filters.departureFrom}
                    onChange={value => setFilters({ ...filters, departureFrom: value })}
                    placeholder="انتخاب تاریخ"
                    fullWidth
                  />
                  <JalaliDatePicker
                    label={tSearch('departureTo')}
                    value={filters.departureTo}
                    onChange={value => setFilters({ ...filters, departureTo: value })}
                    minDate={filters.departureFrom}
                    placeholder="انتخاب تاریخ"
                    fullWidth
                  />
                  <Select
                    label={tSearch('province')}
                    options={provinces}
                    value={filters.province}
                    onChange={e => setFilters({ ...filters, province: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={tSearch('minCapacity')}
                    type="number"
                    min="1"
                    value={filters.minCapacity}
                    onChange={e => setFilters({ ...filters, minCapacity: e.target.value })}
                    fullWidth
                  />
                  <Select
                    label={tSearch('tripType')}
                    options={tripTypes}
                    value={filters.tripType}
                    onChange={e => setFilters({ ...filters, tripType: e.target.value })}
                    fullWidth
                  />
                  <div className={styles.heroSearchBtnWrapper}>
                    <Button type="submit" fullWidth className={styles.heroSearchBtn}>
                      {tSearch('searchBtn')}
                    </Button>
                  </div>
                </div>
              </form>
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
