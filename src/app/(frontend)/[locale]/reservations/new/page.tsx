'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

interface TripData {
  id: string;
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
}

export default function NewReservationPage() {
  const t = useTranslations('reservations.new');
  const tTrips = useTranslations('trips.details');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('apiErrors');
  const tAuth = useTranslations('auth.register');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: isAuthLoading, isAuthenticated, user } = useAuth();

  const tripId = searchParams.get('tripId');

  const [trip, setTrip] = useState<TripData | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Form fields
  const [nationalId, setNationalId] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/reservations/new?tripId=${tripId}`);
    }
  }, [isAuthLoading, isAuthenticated, router, tripId]);

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      if (user.nationalId) setNationalId(user.nationalId);
      if (user.birthdate) setBirthdate(user.birthdate);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Fetch trip data
  useEffect(() => {
    if (tripId && tripId !== 'undefined') {
      fetchTrip();
    } else {
      setIsLoadingTrip(false);
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      // Fetch trips and find the one with matching ID
      const response = await fetch('/api/trips/search');
      const data = await response.json();

      if (data.success && data.trips) {
        const foundTrip = data.trips.find((t: TripData) => t.id === tripId);
        if (foundTrip) {
          setTrip(foundTrip);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      toast.error('خطا در دریافت اطلاعات سفر');
    } finally {
      setIsLoadingTrip(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast.error('لطفا شرایط و قوانین را بپذیرید');
      return;
    }

    if (!trip) {
      toast.error('اطلاعات سفر یافت نشد');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripSnapshot: {
            departureDate: trip.departureDate,
            city: trip.city,
            tripType: trip.tripType,
            cost: trip.cost,
            agentName: trip.agentName,
            groupCode: trip.groupCode,
          },
          passengerInfo: {
            nationalId,
            birthdate,
            phone,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('success.message'));
        router.push(`/reservations/${data.reservation?.id || ''}`);
      } else {
        const errorMsg = data.code ? tErrors(data.code) : data.message || tCommon('error');
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Reservation failed:', error);
      toast.error('خطای شبکه، لطفا دوباره تلاش کنید');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTrip || isAuthLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </div>
      </div>
    );
  }

  if (!tripId || tripId === 'undefined' || !trip) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>سفر یافت نشد</h2>
            <p>اطلاعات سفر مورد نظر در دسترس نیست.</p>
            <Link href="/trips">
              <Button>{tTrips('backToSearch')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <div className={styles.grid}>
          {/* Trip Summary */}
          <Card className={styles.tripSummary}>
            <h2 className={styles.sectionTitle}>{t('tripSummary')}</h2>

            <div className={styles.tripDetails}>
              <div className={styles.tripRow}>
                <span className={styles.label}>{tTrips('departureLocation')}</span>
                <span className={styles.value}>{trip.city}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>تاریخ حرکت</span>
                <span className={styles.value}>{trip.departureDate}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>نوع سفر</span>
                <span className={styles.value}>{trip.tripType}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{tTrips('executor')}</span>
                <span className={styles.value}>{trip.executorName}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{tTrips('groupCode')}</span>
                <span className={styles.value}>{trip.groupCode}</span>
              </div>

              <div className={styles.hotelsSection}>
                <h3>هتل‌ها</h3>
                <div className={styles.tripRow}>
                  <span className={styles.label}>{tTrips('najafHotel')}</span>
                  <span className={styles.value}>{trip.najafHotel}</span>
                </div>
                <div className={styles.tripRow}>
                  <span className={styles.label}>{tTrips('karbalaHotel')}</span>
                  <span className={styles.value}>{trip.karbalaHotel}</span>
                </div>
                {trip.kazemainHotel && trip.kazemainHotel !== '-' && (
                  <div className={styles.tripRow}>
                    <span className={styles.label}>{tTrips('kazemainHotel')}</span>
                    <span className={styles.value}>{trip.kazemainHotel}</span>
                  </div>
                )}
              </div>

              <div className={styles.totalCost}>
                <span>هزینه کل</span>
                <span className={styles.costValue}>{formatCurrency(trip.cost)}</span>
              </div>
            </div>
          </Card>

          {/* Reservation Form */}
          <Card className={styles.formCard}>
            <h2 className={styles.sectionTitle}>{t('pilgrimInfo')}</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label={tAuth('nationalId')}
                type="text"
                value={nationalId}
                onChange={e => setNationalId(e.target.value)}
                placeholder="0123456789"
                maxLength={10}
                required
                fullWidth
              />

              <Input
                label={tAuth('birthdate')}
                type="text"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                placeholder="1370/01/15"
                required
                fullWidth
              />

              <Input
                label={tAuth('phone')}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="09123456789"
                maxLength={11}
                required
                fullWidth
              />

              <div className={styles.termsSection}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                  />
                  <span>{t('termsAccept')}</span>
                </label>
                <p className={styles.warning}>⚠️ توجه: امکان لغو رزرو تا ۲۴ ساعت وجود ندارد</p>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" isLoading={isSubmitting} disabled={!acceptTerms} fullWidth>
                  {isSubmitting ? t('processing') : t('confirmReservation')}
                </Button>

                <Link href="/trips" className={styles.backLink}>
                  <Button variant="secondary" fullWidth>
                    {tTrips('backToSearch')}
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
