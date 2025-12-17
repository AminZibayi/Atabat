// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { createReservation } from '@/scraper/reservation';
import { getContext } from '@/scraper/browser';
import { tripSelectionSchema } from '@/validations/trip';
import { Pilgrim, Reservation } from '@/payload-types';

export const createReservationHandler: PayloadHandler = async req => {
  // Check authentication
  if (!req.user || req.user.collection !== 'pilgrims') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    // Safe body parsing
    const body = typeof req.json === 'function' ? await req.json() : (req as any).body;

    // Validation
    const validation = tripSelectionSchema.safeParse(body);
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { tripId } = validation.data;

    // 24-Hour Rule Check
    const lastReservations = await req.payload.find({
      collection: 'reservations',
      where: {
        pilgrim: { equals: pilgrim.id },
      },
      sort: '-bookedAt',
      limit: 1,
    });

    if (lastReservations.docs.length > 0) {
      const lastRes = lastReservations.docs[0] as Reservation;
      if (lastRes.bookedAt) {
        const timeDiff = Date.now() - new Date(lastRes.bookedAt).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (lastRes.status === 'cancelled' && hoursDiff < 24) {
          return Response.json(
            {
              error: 'You cannot book a new trip within 24 hours of a cancellation.',
            },
            { status: 403 }
          );
        }
        if (['pending', 'confirmed', 'paid'].includes(lastRes.status)) {
          return Response.json(
            {
              error: 'You already have an active reservation.',
            },
            { status: 403 }
          );
        }
      }
    }

    // Mock Implementation for MVP testing (Scraper complexity bypassed for now)
    if (process.env.NODE_ENV !== 'production' && process.env.MOCK_SCRAPER === 'true') {
      const newRes = await req.payload.create({
        collection: 'reservations',
        data: {
          pilgrim: pilgrim.id,
          externalResId: 'MOCK-' + Date.now(),
          status: 'pending',
          tripSnapshot: { id: tripId, mock: true },
          bookedAt: new Date().toISOString(),
        },
      });
      return Response.json({ reservation: newRes });
    }

    // Real logic placeholder
    return Response.json(
      { error: 'Scraper implementation requires browser state handover.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Reservation creation error:', error);
    return Response.json({ error: 'Internal Error' }, { status: 500 });
  }
};

export const getReservationsHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // safe cast after check
  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  const result = await req.payload.find({
    collection: 'reservations',
    where: {
      pilgrim: { equals: pilgrim.id },
    },
  });
  return Response.json({ reservations: result.docs });
};

export const getReceiptHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = req.routeParams!;

  const res = await req.payload.findByID({
    collection: 'reservations',
    id: parseInt(id as string),
  });

  if (!res) return Response.json({ error: 'Not found' }, { status: 404 });

  const reservation = res as Reservation;

  // Pilgrim check
  const pilgrimId =
    typeof reservation.pilgrim === 'object' && reservation.pilgrim !== null
      ? reservation.pilgrim.id
      : reservation.pilgrim;

  if (pilgrimId !== req.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (reservation.receiptData) {
    return Response.json({ receipt: reservation.receiptData });
  }

  return Response.json({ error: 'Receipt not available yet' }, { status: 404 });
};
