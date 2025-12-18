import type { CollectionConfig } from 'payload';

import { isAdmin } from '@/policies/isAdmin';
import { isUserOwner } from '@/policies/isUserOwner';

import { i18n } from '@/i18n';
import { validateZod } from '@/utils/validateZod';
import { userDisplayNameSchema } from '@/validations/user';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: i18n.collections.users.labels,
  admin: {
    useAsTitle: 'displayName',
    group: i18n.collections.users.admin.group,
    defaultColumns: ['displayName', 'email', 'createdAt'],
  },
  auth: true,
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isUserOwner,
    delete: isUserOwner,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      label: i18n.collections.users.fields.displayName.label,
      validate: validateZod(userDisplayNameSchema),
      admin: {
        placeholder: i18n.collections.users.fields.displayName.admin.placeholder,
      },
    },
  ],
};
