'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React, { useState, useRef, useEffect } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { Link } from '@/i18n/navigation';
import styles from './UserMenu.module.css';

export function UserMenu() {
  const t = useTranslations('nav');
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show loading skeleton
  if (isLoading) {
    return <div className={styles.loading} />;
  }

  // Show login button if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Link href="/auth/login" className={styles.loginBtn}>
        {t('login')}
      </Link>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.phone.slice(-2);
  };

  // Get display name
  const getDisplayName = () => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.phone;
  };

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.userButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true">
        <span className={styles.avatar}>{getInitials()}</span>
        <span className={styles.userName}>{getDisplayName()}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`${styles.dropdown} ${isOpen ? styles.open : ''}`}>
        {/* Profile */}
        <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          </svg>
          {t('profile') || 'پروفایل'}
        </Link>

        {/* Reservations */}
        <Link href="/reservations" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {t('reservations')}
        </Link>

        <div className={styles.divider} />

        {/* Logout */}
        <button
          className={`${styles.dropdownItem} ${styles.logoutItem}`}
          onClick={() => {
            setIsOpen(false);
            logout();
          }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t('logout') || 'خروج'}
        </button>
      </div>
    </div>
  );
}
