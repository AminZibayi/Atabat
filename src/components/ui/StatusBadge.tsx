// In the Name of God, the Creative, the Originator
import React from 'react';
import styles from './StatusBadge.module.css';

export type StatusType = 'pending' | 'confirmed' | 'paid' | 'cancelled';

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}
