// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';

import { Pilgrim } from '@/payload-types';

export const initiatePaymentHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    const body = typeof req.json === 'function' ? await req.json() : (req as any).body;
    const { reservationId } = body || {};

    if (!reservationId) {
      return Response.json({ error: 'Reservation ID required' }, { status: 400 });
    }

    // Fetch reservation from Payload to verify ownership and get external ID
    // We try/catch findByID because it can throw or return null depending on version/config
    let reservation;
    try {
      reservation = await req.payload.findByID({
        collection: 'reservations',
        id: reservationId,
      });
    } catch (e) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (!reservation) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify ownership
    // reservation.pilgrim can be ID or object
    const pilgrimId =
      typeof reservation.pilgrim === 'object' ? reservation.pilgrim.id : reservation.pilgrim;

    if (pilgrimId !== req.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { getAdapter } = await import('@/scraper');
    const adapter = getAdapter();

    // Use externalResId for the scraper
    // If not present, maybe use another field or fallback?
    // Assuming externalResId is stored.
    const externalId = reservation.externalResId;
    if (!externalId) {
      return Response.json(
        { error: 'Reservation is not linked to external system' },
        { status: 400 }
      );
    }

    const paymentUrl = await adapter.getPaymentUrl(externalId);

    return Response.json({ paymentUrl });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return Response.json({ error: 'Internal Error' }, { status: 500 });
  }
};
