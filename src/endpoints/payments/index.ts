// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';

import { Pilgrim } from '@/payload-types';

export const initiatePaymentHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  // Logic to get payment URL
  return Response.json({ status: 'Not implemented' });
};
