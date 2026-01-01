// In the Name of God, the Creative, the Originator
import type { GlobalConfig } from 'payload';

import { i18n } from '@/i18n';

export const KargozarConfig: GlobalConfig = {
  slug: 'kargozar-config',
  label: i18n.collections.kargozarConfig.labels.singular,
  admin: {
    group: i18n.collections.kargozarConfig.admin.group,
  },
  access: {
    read: () => true, // API needs to read this for scraper
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      label: i18n.collections.kargozarConfig.fields.username.label,
    },
    {
      name: 'password',
      type: 'text',
      required: true,
      label: i18n.collections.kargozarConfig.fields.password.label,
    },
    {
      name: 'currentOTP',
      type: 'text',
      label: i18n.collections.kargozarConfig.fields.currentOTP.label,
      admin: {
        description: 'Daily OTP code (valid for 24h)',
      },
    },
    {
      name: 'otpLastUpdated',
      type: 'date',
      label: i18n.collections.kargozarConfig.fields.otpLastUpdated.label,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'cookiesData',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Active session cookies for the scraper',
      },
    },
    {
      name: 'cookiesExpireAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastAuthAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'captchaMaxAttempts',
      type: 'number',
      defaultValue: 5,
      label: i18n.collections.kargozarConfig.fields.captchaMaxAttempts.label,
      admin: {
        description: 'Maximum number of captcha solve attempts before giving up',
      },
    },
  ],
};
