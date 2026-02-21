// In the Name of God, the Creative, the Originator
'use client';

import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Link, usePathname } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';
import styles from './MobileMenu.module.css';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/trips', label: t('trips') },
    { href: '/reservations', label: t('reservations') },
  ];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle navigation link click
  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Use a portal to render outside the header context (which has backdrop-filter/z-index constraints)
  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className={styles.header}>
          <div className={styles.brand}>
            <Logo size="sm" />
            <span className={styles.title}>{locale === 'fa' ? 'موج زمزم' : 'Moj Zamzam'}</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
            type="button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              onClick={handleNavClick}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher />
          <UserMenu placement="top" />
        </div>
      </div>
    </div>,
    document.body
  );
}
