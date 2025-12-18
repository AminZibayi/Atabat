'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from '@/i18n/navigation';
import styles from './page.module.css';

export default function LoginPage() {
  const t = useTranslations('auth.login');

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call login API
      const response = await fetch('/api/pilgrims/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        toast.success(data.message || 'ورود موفق');
        window.location.href = '/';
      } else {
        toast.error(data.message || data.error || 'خطا در ورود');
      }
    } catch {
      toast.error('خطای شبکه، لطفا دوباره تلاش کنید');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          {/* Logo */}
          <div className={styles.logo}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
              <path d="M24 12L30 20H18L24 12Z" fill="currentColor" />
              <path d="M24 36L18 28H30L24 36Z" fill="currentColor" />
            </svg>
          </div>

          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label={t('phone')}
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
              fullWidth
            />

            <Input
              label={t('password')}
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>{t('rememberMe')}</span>
              </label>
              <Link href="/auth/forgot-password" className={styles.forgotLink}>
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" isLoading={isLoading} fullWidth>
              {t('loginBtn')}
            </Button>
          </form>

          <p className={styles.footer}>
            {t('noAccount')}{' '}
            <Link href="/auth/register" className={styles.registerLink}>
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
