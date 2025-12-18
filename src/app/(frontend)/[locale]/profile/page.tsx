// In the Name of God, the Creative, the Originator
'use client';

import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/i18n/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tAuth = useTranslations('auth.register');
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refetch } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!user?.id) return;

      const response = await fetch(`/api/pilgrims/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('success'));
        refetch();
      } else {
        toast.error(data.errors?.[0]?.message || data.message || 'خطا در بروزرسانی پروفایل');
      }
    } catch {
      toast.error('خطای شبکه، لطفا دوباره تلاش کنید');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>

          <div className={styles.content}>
            <Card className={styles.card}>
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Personal Info Section */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t('personalInfo')}</h2>

                  <div className={styles.formGrid}>
                    <Input
                      label={tAuth('firstName')}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder={tAuth('firstName')}
                    />
                    <Input
                      label={tAuth('lastName')}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder={tAuth('lastName')}
                    />
                  </div>
                </div>

                {/* Contact Info Section */}
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t('contactInfo')}</h2>

                  <div className={styles.formGrid}>
                    <Input
                      label={tAuth('phone')}
                      value={user.phone}
                      disabled
                      className={styles.readOnly}
                    />
                    <Input
                      label={tAuth('nationalId')}
                      value={user.nationalId || ''}
                      disabled
                      className={styles.readOnly}
                    />
                    <Input
                      label={tAuth('email')}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tAuth('email')}
                    />
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button type="submit" isLoading={isSaving}>
                    {t('updateBtn')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
