// In the Name of God, the Creative, the Originator
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './index.module.css';

interface PassengerInfo {
  id: string;
  nationalId: string;
}

interface OfficeInfo {
  agentName?: string;
  agentPhone?: string;
  agentAddress?: string;
}

export interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  officeInfo?: OfficeInfo;
  passengers?: PassengerInfo[];
}

const PAYMENT_PORTAL_URL = 'https://atabatorg.haj.ir/PassengerPayPublic.aspx';

export function PaymentOptionsModal({
  isOpen,
  onClose,
  officeInfo,
  passengers,
}: PaymentOptionsModalProps) {
  const t = useTranslations('reservations.details.paymentModal');

  const handlePaymentClick = () => {
    window.open(PAYMENT_PORTAL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title')}>
      <div className={styles.container}>
        {/* In-Person Payment Option */}
        <div className={styles.option}>
          <div className={styles.optionHeader}>
            <span className={styles.optionIcon}>🏢</span>
            <h3 className={styles.optionTitle}>{t('inPerson.title')}</h3>
          </div>
          <p className={styles.optionDescription}>{t('inPerson.description')}</p>
          <div className={styles.deadline}>
            <span className={styles.deadlineIcon}>⏰</span>
            <span>{t('inPerson.deadline')}</span>
          </div>
          {officeInfo?.agentName && (
            <div className={styles.officeInfo}>
              <p className={styles.officeName}>{officeInfo.agentName}</p>
              {officeInfo.agentPhone && (
                <p className={styles.officeDetail}>
                  <span>📞</span> {officeInfo.agentPhone}
                </p>
              )}
              {officeInfo.agentAddress && (
                <p className={styles.officeDetail}>
                  <span>📍</span> {officeInfo.agentAddress}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={styles.divider}>
          <span>{t('or')}</span>
        </div>

        {/* Online Payment Option */}
        <div className={styles.option}>
          <div className={styles.optionHeader}>
            <span className={styles.optionIcon}>💳</span>
            <h3 className={styles.optionTitle}>{t('online.title')}</h3>
          </div>
          <p className={styles.optionDescription}>{t('online.description')}</p>

          {passengers && passengers.length > 0 && (
            <div className={styles.passengerInfo}>
              {passengers.map((passenger, index) => (
                <div key={index} className={styles.passengerCard}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('online.passengerId')}</span>
                    <span className={styles.infoValue}>{passenger.id}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('online.nationalId')}</span>
                    <span className={styles.infoValue}>{passenger.nationalId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handlePaymentClick} fullWidth>
            {t('online.payButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
