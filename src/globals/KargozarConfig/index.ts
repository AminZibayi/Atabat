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
      admin: {
        description: 'Password for Atabat kargozar panel',
        condition: () => false, // Hide from UI if possible, or just protect it.
        // Payload 'hidden' property might be better, but we need to set it via API/Env or have admin set it once.
        // For now, let's keep it visible to admin so they can set it.
      },
    },
    {
      name: 'currentOTP',
      type: 'text',
      required: true,
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
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (
          data.currentOTP &&
          data.currentOTP !==
            req.payload.config.globals
              .find(g => g.slug === 'kargozar-config')
              ?.fields.find(f => 'name' in f && f.name === 'currentOTP')
        ) {
          // If OTP changed, update timestamp
          data.otpLastUpdated = new Date().toISOString();
        }
        return data;
      },
    ],
  },
};
