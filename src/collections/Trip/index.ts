// In the Name of God, the Creative, the Originator
import type { CollectionConfig } from 'payload';

import { i18n } from '@/i18n';

export const Trips: CollectionConfig = {
  slug: 'trips',
  labels: i18n.collections.trips.labels,
  admin: {
    group: i18n.collections.trips.admin.group,
    useAsTitle: 'departureDate',
    defaultColumns: ['departureDate', 'city', 'remainingCapacity', 'cost'],
  },
  access: {
    read: () => true, // Publicly readable for search
    create: () => false, // Only created by scraper/system
    update: () => false,
    delete: () => false,
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
