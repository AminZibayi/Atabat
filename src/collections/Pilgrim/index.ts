// In the Name of God, the Creative, the Originator
import type { CollectionConfig } from 'payload';

import { i18n } from '@/i18n';
import { validateZod } from '@/utils/validateZod';
import { birthdateSchema, nationalIdSchema, phoneSchema } from '@/validations/pilgrim';

export const Pilgrims: CollectionConfig = {
  slug: 'pilgrims',
  labels: i18n.collections.pilgrims.labels,
  admin: {
    useAsTitle: 'phone',
    group: i18n.collections.pilgrims.admin.group,
    defaultColumns: ['phone', 'firstName', 'lastName', 'nationalId'],
  },
  auth: {
    useAPIKey: false,
    tokenExpiration: 604800, // 1 week
    // Use phone as the username for authentication, email is optional
    loginWithUsername: {
      allowEmailLogin: true, // Only allow login with phone (username)
      requireEmail: false, // Email is not required for registration
    },
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      label: i18n.collections.pilgrims.fields.phone.label,
      validate: validateZod(phoneSchema),
    },
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'nationalId',
      type: 'text',
      label: i18n.collections.pilgrims.fields.nationalId.label,
      validate: validateZod(nationalIdSchema),
    },
    {
      name: 'birthdate',
      type: 'text',
      label: i18n.collections.pilgrims.fields.birthdate.label,
      validate: validateZod(birthdateSchema),
      admin: {
        description: 'Jalali format: YYYY/MM/DD',
      },
    },
  ],
};
