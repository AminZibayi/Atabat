import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { en } from '@payloadcms/translations/languages/en';
import { fa } from '@payloadcms/translations/languages/fa';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/User';
import { Media } from './collections/Media';
import { Pilgrims } from './collections/Pilgrim';
import { Trips } from './collections/Trip';
import { Reservations } from './collections/Reservation';
import { KargozarConfig } from './globals/KargozarConfig';

import { tripSearchHandler } from '@/endpoints/trips';
import {
  createReservationHandler,
  getReservationsHandler,
  getReceiptHandler,
} from '@/endpoints/reservations';
import { initiatePaymentHandler } from '@/endpoints/payments';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      graphics: {
        Icon: '@/components/admin/Icon',
        Logo: '@/components/admin/Logo',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Admin',
      titleSuffix: ' - Plya',
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
    },
  },
  collections: [Users, Media, Pilgrims, Trips, Reservations],
  globals: [KargozarConfig],
  endpoints: [
    {
      path: '/trips/search',
      method: 'get',
      handler: tripSearchHandler,
    },
    {
      path: '/reservations',
      method: 'post',
      handler: createReservationHandler,
    },
    {
      path: '/reservations',
      method: 'get',
      handler: getReservationsHandler,
    },
    {
      path: '/reservations/:id/receipt',
      method: 'get',
      handler: getReceiptHandler,
    },
    {
      path: '/payments/initiate/:reservationId',
      method: 'post',
      handler: initiatePaymentHandler,
    },
  ],
  i18n: {
    fallbackLanguage: 'fa',
    supportedLanguages: { en, fa },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [],
});
