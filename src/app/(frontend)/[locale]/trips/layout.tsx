// In the Name of God, the Creative, the Originator
import { setRequestLocale } from 'next-intl/server';
import React from 'react';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import TripsPageClient from './page';

export default async function TripsLayout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <TripsPageClient />
      <Footer />
    </>
  );
}
