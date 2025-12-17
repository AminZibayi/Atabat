// In the Name of God, the Creative, the Originator
import React from 'react';

export const metadata = {
  description: 'Atabat - Pilgrim Travel Management',
  title: 'Atabat',
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      url: '/favicon.png',
    },
    {
      rel: 'apple-touch-icon',
      type: 'image/png',
      url: '/apple-touch-icon.png',
    },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return children;
}
