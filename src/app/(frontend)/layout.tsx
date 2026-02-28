// In the Name of God, the Creative, the Originator
import React from 'react';

export const metadata = {
  description: 'Moj Zamzam - Smart Pilgrimage Booking Platform',
  title: 'Moj Zamzam',
  icons: [
    { rel: 'icon', type: 'image/png', url: '/favicon-96x96.png', sizes: '96x96' },
    { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' },
  ],
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'MojeZamZam',
  },
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return children;
}
