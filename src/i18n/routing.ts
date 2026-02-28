// In the Name of God, the Creative, the Originator
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fa', 'en'],
  defaultLocale: 'fa',
  localePrefix: 'always',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
