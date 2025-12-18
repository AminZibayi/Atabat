// In the Name of God, the Creative, the Originator
import type { GlobalConfig } from 'payload';

import { i18n } from '@/i18n';

export const StaticPages: GlobalConfig = {
  slug: 'static-pages',
  label: i18n.globals.staticPages.labels.singular,
  admin: {
    group: i18n.globals.staticPages.admin.group,
  },
  access: {
    read: () => true, // Public pages need to be readable
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: i18n.globals.staticPages.tabs.about,
          fields: [
            {
              name: 'aboutTitle',
              type: 'text',
              label: i18n.globals.staticPages.fields.title,
              localized: true,
            },
            {
              name: 'aboutContent',
              type: 'richText',
              label: i18n.globals.staticPages.fields.content,
              localized: true,
            },
          ],
        },
        {
          label: i18n.globals.staticPages.tabs.contact,
          fields: [
            {
              name: 'contactTitle',
              type: 'text',
              label: i18n.globals.staticPages.fields.title,
              localized: true,
            },
            {
              name: 'contactContent',
              type: 'richText',
              label: i18n.globals.staticPages.fields.content,
              localized: true,
            },
            {
              name: 'contactEmail',
              type: 'email',
              label: i18n.globals.staticPages.fields.email,
            },
            {
              name: 'contactPhone',
              type: 'text',
              label: i18n.globals.staticPages.fields.phone,
            },
            {
              name: 'contactAddress',
              type: 'textarea',
              label: i18n.globals.staticPages.fields.address,
              localized: true,
            },
          ],
        },
        {
          label: i18n.globals.staticPages.tabs.terms,
          fields: [
            {
              name: 'termsTitle',
              type: 'text',
              label: i18n.globals.staticPages.fields.title,
              localized: true,
            },
            {
              name: 'termsContent',
              type: 'richText',
              label: i18n.globals.staticPages.fields.content,
              localized: true,
            },
            {
              name: 'termsLastUpdated',
              type: 'date',
              label: i18n.globals.staticPages.fields.lastUpdated,
              admin: {
                description: 'Last update date shown to users',
              },
            },
          ],
        },
        {
          label: i18n.globals.staticPages.tabs.privacy,
          fields: [
            {
              name: 'privacyTitle',
              type: 'text',
              label: i18n.globals.staticPages.fields.title,
              localized: true,
            },
            {
              name: 'privacyContent',
              type: 'richText',
              label: i18n.globals.staticPages.fields.content,
              localized: true,
            },
            {
              name: 'privacyLastUpdated',
              type: 'date',
              label: i18n.globals.staticPages.fields.lastUpdated,
              admin: {
                description: 'Last update date shown to users',
              },
            },
          ],
        },
      ],
    },
  ],
};
