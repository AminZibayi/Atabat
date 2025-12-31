'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { PaymentOptionsModal } from '@/components/ui/PaymentOptionsModal';
import styles from './page.module.css';

type TripSnapshot = {
  departureDate?: string;
  city?: string;
  tripType?: string;
  cost?: number;
  agentName?: string;
  groupCode?: string;
};

type ItineraryItem = {
  row: number;
  entryDate: string;
  city: string;
  hotel: string;
  exitDate: string;
};

type ReservationData = {
  id: string;
  externalResId?: string;
  status: StatusType;
  tripSnapshot?: TripSnapshot;
  receiptData?: {
    resId?: string;
    expireDate?: string;
    city?: string;
    tripType?: string;
    departureDate?: string;
    agentName?: string;
    agentPhone?: string;
    agentAddress?: string;
    executorName?: string;
    itinerary?: ItineraryItem[];
    passengers?: Array<{
      id: string;
      nationalId: string;
      firstName: string;
      lastName: string;
      birthdate: string;
      cost: number;
    }>;
    paymentUrl?: string;
  };
  paymentUrl?: string;
  bookedAt?: string;
  paidAt?: string;
};

type PageParams = {
  params: Promise<{ id: string; locale: string }>;
};

export default function ReservationDetailPage({ params }: PageParams) {
  const t = useTranslations('reservations');
  const tStatus = useTranslations('reservations.status');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then(p => setReservationId(p.id));
  }, [params]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/reservations/${reservationId}`);
    }
  }, [isAuthLoading, isAuthenticated, router, reservationId]);

  const fetchReservation = useCallback(async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (response.ok) {
        const data = await response.json();
        setReservation(data);
      } else if (response.status === 404) {
        setReservation(null);
      }
    } catch (error) {
      console.error('Failed to fetch reservation:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, tCommon]);

  // Fetch reservation data
  useEffect(() => {
    if (isAuthenticated && reservationId) {
      fetchReservation();
    }
  }, [isAuthenticated, reservationId, fetchReservation]);

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (isLoading || isAuthLoading) {
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

  if (!reservation) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>{t('details.notFound')}</h2>
            <p>{t('details.notFoundMessage')}</p>
            <Link href="/reservations">
              <Button>{tCommon('back')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tripSnapshot = reservation.tripSnapshot;
  const receipt = reservation.receiptData;
  const canPay = ['pending', 'confirmed'].includes(reservation.status);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/reservations" className={styles.backLink}>
              <Button variant="ghost" size="sm">
                → {tCommon('back')}
              </Button>
            </Link>
            <StatusBadge status={reservation.status} label={tStatus(reservation.status)} />
          </div>
          <h1 className={styles.title}>{t('details.title')}</h1>
          <p className={styles.bookingId}>
            {t('card.bookingId')}: {reservation.externalResId || reservation.id}
          </p>
        </div>

        <div className={styles.grid}>
          {/* Trip Info Card */}
          <Card className={styles.tripCard}>
            <h2 className={styles.sectionTitle}>{t('details.tripInfo')}</h2>
            <div className={styles.tripDetails}>
              <div className={styles.tripRow}>
                <span className={styles.label}>{t('details.city')}</span>
                <span className={styles.value}>{tripSnapshot?.city || '-'}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{t('details.tripType')}</span>
                <span className={styles.value}>{tripSnapshot?.tripType || '-'}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{t('details.departureDate')}</span>
                <span className={styles.value}>{tripSnapshot?.departureDate || '-'}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{t('details.agent')}</span>
                <span className={styles.value}>{tripSnapshot?.agentName || '-'}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.label}>{t('details.groupCode')}</span>
                <span className={styles.value}>{tripSnapshot?.groupCode || '-'}</span>
              </div>
              <div className={styles.totalCost}>
                <span>{t('details.totalCost')}</span>
                <span className={styles.costValue}>{formatCurrency(tripSnapshot?.cost || 0)}</span>
              </div>
            </div>
          </Card>

          {/* Receipt/Itinerary Card */}
          {receipt && (
            <Card className={styles.receiptCard}>
              <h2 className={styles.sectionTitle}>{t('details.receipt')}</h2>

              {receipt.expireDate && (
                <div className={styles.deadline}>
                  <span className={styles.deadlineLabel}>{t('details.paymentDeadline')}</span>
                  <span className={styles.deadlineValue}>{receipt.expireDate}</span>
                </div>
              )}

              {/* Office Info */}
              {receipt.agentName && (
                <div className={styles.officeInfo}>
                  <h3>{t('details.officeInfo')}</h3>
                  <p>
                    <strong>{receipt.agentName}</strong>
                  </p>
                  {receipt.agentPhone && <p>📞 {receipt.agentPhone}</p>}
                  {receipt.agentAddress && <p>📍 {receipt.agentAddress}</p>}
                </div>
              )}

              {/* Itinerary Table */}
              {receipt.itinerary && receipt.itinerary.length > 0 && (
                <div className={styles.itinerary}>
                  <h3>{t('details.itinerary')}</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('details.checkIn')}</th>
                        <th>{t('details.cityName')}</th>
                        <th>{t('details.hotel')}</th>
                        <th>{t('details.checkOut')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.itinerary.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.row}</td>
                          <td>{item.entryDate}</td>
                          <td>{item.city}</td>
                          <td>{item.hotel}</td>
                          <td>{item.exitDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Passengers Table */}
              {receipt.passengers && receipt.passengers.length > 0 && (
                <div className={styles.passengers}>
                  <h3>{t('details.passengers')}</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('details.passengerId')}</th>
                        <th>{t('details.nationalId')}</th>
                        <th>{t('details.name')}</th>
                        <th>{t('details.birthdate')}</th>
                        <th>{t('details.cost')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.passengers.map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.id}</td>
                          <td>{p.nationalId}</td>
                          <td>
                            {p.firstName} {p.lastName}
                          </td>
                          <td>{p.birthdate}</td>
                          <td>{formatCurrency(p.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Payment Actions */}
          <Card className={styles.actionsCard}>
            <h2 className={styles.sectionTitle}>{t('details.actions')}</h2>

            <div className={styles.statusInfo}>
              <div className={styles.statusRow}>
                <span>{t('card.bookedOn')}</span>
                <span>{reservation.bookedAt ? formatDate(reservation.bookedAt) : '-'}</span>
              </div>
              {reservation.paidAt && (
                <div className={styles.statusRow}>
                  <span>{t('details.paidOn')}</span>
                  <span>{formatDate(reservation.paidAt)}</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {canPay && (
                <Button onClick={handlePayment} fullWidth>
                  {t('details.payNow')}
                </Button>
              )}

              {reservation.status === 'paid' && (
                <div className={styles.paidBadge}>✓ {t('details.paymentComplete')}</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Options Modal */}
      <PaymentOptionsModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        officeInfo={
          receipt
            ? {
                agentName: receipt.agentName,
                agentPhone: receipt.agentPhone,
                agentAddress: receipt.agentAddress,
              }
            : undefined
        }
        passengers={receipt?.passengers?.map(p => ({
          id: p.id,
          nationalId: p.nationalId,
        }))}
      />
    </div>
  );
}
