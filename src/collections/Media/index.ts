import type { CollectionConfig } from 'payload';

import { i18n } from '@/i18n';
import { validateZod } from '@/utils/validateZod';
import { mediaAltSchema } from '@/validations/media';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: i18n.collections.media.labels,
  admin: {
    group: i18n.collections.media.admin.group,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: i18n.collections.media.fields.alt.label,
      required: true,
      validate: validateZod(mediaAltSchema),
      admin: {
        placeholder: i18n.collections.media.fields.alt.admin.placeholder,
      },
    },
  ],
  upload: {
    staticDir: 'media',
  },
};
