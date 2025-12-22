'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { Link } from '@/i18n/navigation';
import styles from './page.module.css';

interface Reservation {
  id: string;
  externalResId: string;
  status: StatusType;
  tripSnapshot: {
    departureDate: string;
    city: string;
    tripType: string;
    cost: number;
  };
  bookedAt: string;
}

export default function ReservationsPage() {
  const t = useTranslations('reservations');
  const tStatus = useTranslations('reservations.status');
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/reservations');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated]);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations/list');
      const result = await response.json();
      // API returns {success, data: {reservations}, code}
      if (result.success && result.data?.reservations) {
        setReservations(result.data.reservations);
      } else if (result.docs) {
        // Fallback for direct collection API response
        setReservations(result.docs);
      }
    } catch {
      console.error('Failed to fetch reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const filters = ['all', 'pending', 'confirmed', 'paid', 'cancelled'];

  const filteredReservations =
    activeFilter === 'all' ? reservations : reservations.filter(r => r.status === activeFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {filters.map(filter => (
            <button
              key={filter}
              className={`${styles.filterBtn} ${activeFilter === filter ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter)}>
              {t(`filters.${filter}`)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className={styles.grid}>
            {filteredReservations.map(reservation => (
              <Card key={reservation.id} hover className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.bookingId}>
                      {t('card.bookingId')}:{' '}
                      {reservation.externalResId || reservation.id.slice(0, 8)}
                    </span>
                    <span className={styles.bookedOn}>
                      {t('card.bookedOn')} {formatDate(reservation.bookedAt)}
                    </span>
                  </div>
                  <StatusBadge status={reservation.status} label={tStatus(reservation.status)} />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.tripInfo}>
                    <div className={styles.tripMain}>
                      <span className={styles.tripCity}>
                        {reservation.tripSnapshot?.city || 'عتبات'}
                      </span>
                      <span className={styles.tripType}>{reservation.tripSnapshot?.tripType}</span>
                    </div>
                    <div className={styles.tripDate}>
                      <span className={styles.dateLabel}>{t('card.tripDate')}</span>
                      <span className={styles.dateValue}>
                        {reservation.tripSnapshot?.departureDate}
                      </span>
                    </div>
                  </div>

                  <div className={styles.tripCost}>
                    {formatCurrency(reservation.tripSnapshot?.cost || 0)}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/reservations/${reservation.id}`}>
                    <Button variant="secondary" size="sm">
                      {t('card.viewDetails')}
                    </Button>
                  </Link>
                  {reservation.status === 'confirmed' && <Button size="sm">{t('card.pay')}</Button>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <h3>{t('empty.title')}</h3>
            <p>{t('empty.message')}</p>
            <Link href="/trips">
              <Button>{t('empty.cta')}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
