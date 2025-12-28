'use client';

// In the Name of God, the Creative, the Originator
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { Link } from '@/i18n/navigation';
import styles from './page.module.css';

export default function RegisterPage() {
  const t = useTranslations('auth.register');

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    birthdate: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    setIsLoading(true);

    try {
      // Call register API
      const response = await fetch('/api/pilgrims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.doc) {
        toast.success(data.message || 'ثبت نام موفق');
        window.location.href = '/auth/login';
      } else {
        // Payload returns 'errors' array usually, or 'message'
        const msg = data.errors?.[0]?.message || data.message || 'خطا در ثبت نام';
        toast.error(msg);
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
            <Logo size="lg" />
          </div>

          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <Input
                label={t('firstName')}
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
                fullWidth
              />
              <Input
                label={t('lastName')}
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
                fullWidth
              />
            </div>

            <Input
              label={t('phone')}
              type="tel"
              placeholder="09123456789"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
              fullWidth
            />

            <Input
              label={t('nationalId')}
              type="text"
              placeholder="0123456789"
              value={formData.nationalId}
              onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
              required
              fullWidth
            />

            <Input
              label={t('birthdate')}
              type="text"
              placeholder={t('birthdatePlaceholder')}
              value={formData.birthdate}
              onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
              fullWidth
            />

            <Input
              label={t('email')}
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />

            <Input
              label={t('password')}
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />

            <Input
              label={t('confirmPassword')}
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              fullWidth
            />

            <Button type="submit" isLoading={isLoading} fullWidth>
              {t('registerBtn')}
            </Button>
          </form>

          <p className={styles.footer}>
            {t('hasAccount')}{' '}
            <Link href="/auth/login" className={styles.loginLink}>
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
