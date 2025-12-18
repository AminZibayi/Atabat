// In the Name of God, the Creative, the Originator
import type { CollectionConfig } from 'payload';

import { isAdmin } from '@/policies/isAdmin';

import { i18n } from '@/i18n';
import { tripSearchHandler } from '@/endpoints/trips';

export const Trips: CollectionConfig = {
  slug: 'trips',
  labels: i18n.collections.trips.labels,
  endpoints: [
    {
      path: '/search',
      method: 'get',
      handler: tripSearchHandler,
    },
  ],
  admin: {
    group: i18n.collections.trips.admin.group,
    useAsTitle: 'departureDate',
    defaultColumns: ['departureDate', 'city', 'remainingCapacity', 'cost'],
  },
  access: {
    read: () => true, // Publicly readable for search
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'dayOfWeek', type: 'text' },
    { name: 'departureDate', type: 'text', required: true },
    { name: 'remainingCapacity', type: 'number' },
    { name: 'tripType', type: 'text' },
    { name: 'cost', type: 'number' },
    { name: 'departureLocation', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'agentName', type: 'text' },
    { name: 'groupCode', type: 'text' },
    { name: 'executorName', type: 'text' },
    { name: 'najafHotel', type: 'text' },
    { name: 'karbalaHotel', type: 'text' },
    { name: 'kazemainHotel', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'cachedAt', type: 'date', required: true, defaultValue: () => new Date() },
  ],
};
