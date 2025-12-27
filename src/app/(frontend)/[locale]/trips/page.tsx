'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { JalaliDatePicker } from '@/components/ui/JalaliDatePicker';
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

interface Trip {
  rowIndex: string;
  tripIdentifier: string;
  dayOfWeek: string;
  departureDate: string;
  remainingCapacity: number;
  tripType: string;
  cost: number;
  departureLocation: string;
  city: string;
  agentName: string;
  groupCode: string;
  executorName: string;
  najafHotel: string;
  karbalaHotel: string;
  kazemainHotel: string;
  address: string;
  selectButtonScript?: string;
}

export default function TripsPage() {
  const t = useTranslations('trips');
  const tApiErrors = useTranslations('api.result.error');
  const tCommon = useTranslations('common');

  // Calculate default dates (today and today+14)
  const defaultDates = useMemo(
    () => ({
      from: getTodayJalali(),
      to: addDaysToTodayJalali(14),
    }),
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
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
    setIsLoading(true);
    setHasSearched(true);

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

      const response = await fetch(`/api/trips/search?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data?.trips) {
        setTrips(result.data.trips);
        if (result.data.trips.length === 0) {
          toast(t('results.noTrips'), { icon: '🔍' });
        }
      } else if (!result.success) {
        const errorMsg = result.code ? tApiErrors(result.code) : result.message || 'خطا در جستجو';
        toast.error(errorMsg);
      }
    } catch {
      toast.error('خطای شبکه، لطفا دوباره تلاش کنید');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const router = useRouter();

  const handleTripDetails = (trip: Trip) => {
    // Store full trip data in sessionStorage for the reservation page
    // Include provinceCode from current search filters for re-search
    const tripWithProvince = { ...trip, provinceCode: filters.province };
    sessionStorage.setItem('selectedTrip', JSON.stringify(tripWithProvince));
    // Navigate to reservation page with tripIdentifier in URL
    router.push(`/reservations/new?trip=${encodeURIComponent(trip.tripIdentifier)}`);
  };

  return (
    <div className={styles.page}>
      {/* Search Form */}
      <section className={styles.searchSection}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.formGrid}>
              <JalaliDatePicker
                label={t('search.departureFrom')}
                value={filters.departureFrom}
                onChange={value => setFilters({ ...filters, departureFrom: value })}
                placeholder="انتخاب تاریخ"
                fullWidth
              />
              <JalaliDatePicker
                label={t('search.departureTo')}
                value={filters.departureTo}
                onChange={value => setFilters({ ...filters, departureTo: value })}
                minDate={filters.departureFrom}
                placeholder="انتخاب تاریخ"
                fullWidth
              />
              <Select
                label={t('search.province')}
                options={provinces}
                value={filters.province}
                onChange={e => setFilters({ ...filters, province: e.target.value })}
                fullWidth
              />
              <Input
                label={t('search.minCapacity')}
                type="number"
                min="1"
                value={filters.minCapacity}
                onChange={e => setFilters({ ...filters, minCapacity: e.target.value })}
                fullWidth
              />
              <Select
                label={t('search.tripType')}
                options={tripTypes}
                value={filters.tripType}
                onChange={e => setFilters({ ...filters, tripType: e.target.value })}
                fullWidth
              />
              <div className={styles.searchBtnWrapper}>
                <Button type="submit" isLoading={isLoading} fullWidth>
                  {t('search.searchBtn')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      {hasSearched && (
        <section className={styles.resultsSection}>
          <div className={styles.container}>
            <h2 className={styles.resultsTitle}>{t('results.title')}</h2>

            {trips.length > 0 ? (
              <>
                <p className={styles.resultsCount}>{t('results.count', { count: trips.length })}</p>

                {/* Results Table - Desktop */}
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('table.dayOfWeek')}</th>
                        <th>{t('table.departureDate')}</th>
                        <th>{t('table.capacity')}</th>
                        <th>{t('table.tripType')}</th>
                        <th>{t('table.cost')}</th>
                        <th>{t('table.city')}</th>
                        <th>{t('table.hotels')}</th>
                        <th>{t('table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map(trip => (
                        <tr key={trip.tripIdentifier}>
                          <td>{trip.dayOfWeek}</td>
                          <td>{trip.departureDate}</td>
                          <td>
                            <span className={styles.capacity}>{trip.remainingCapacity}</span>
                          </td>
                          <td>{trip.tripType}</td>
                          <td className={styles.cost}>{formatCurrency(trip.cost)}</td>
                          <td>{trip.city}</td>
                          <td className={styles.hotels}>
                            <span>{trip.najafHotel}</span>
                            <span>{trip.karbalaHotel}</span>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleTripDetails(trip)}>
                              {t('card.details')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Results Cards - Mobile */}
                <div className={styles.cardsWrapper}>
                  {trips.map(trip => (
                    <div key={trip.tripIdentifier} className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardDate}>{trip.departureDate}</span>
                        <span className={styles.cardCapacity}>
                          {t('card.remaining', { count: trip.remainingCapacity })}
                        </span>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardInfo}>
                          <span className={styles.cardCity}>{trip.city}</span>
                          <span className={styles.cardType}>{trip.tripType}</span>
                        </div>
                        <div className={styles.cardCost}>
                          <span className={styles.cardPrice}>{formatCurrency(trip.cost)}</span>
                          <span className={styles.cardPriceLabel}>{t('card.perPerson')}</span>
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleTripDetails(trip)}>
                          {t('card.details')}
                        </Button>
                        <Button size="sm" onClick={() => handleTripDetails(trip)}>
                          {t('card.reserve')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.noResults}>
                <svg
                  className={styles.noResultsIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 8l6 6M14 8l-6 6" />
                </svg>
                <h3>{t('results.noTrips')}</h3>
                <p>{t('results.tryAgain')}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
