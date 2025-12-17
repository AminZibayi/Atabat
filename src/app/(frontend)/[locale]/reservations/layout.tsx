// In the Name of God, the Creative, the Originator
import { setRequestLocale } from 'next-intl/server';
import React from 'react';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export default async function ReservationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
