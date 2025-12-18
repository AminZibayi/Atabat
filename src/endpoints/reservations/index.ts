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

    const { tripId, tripSnapshot: clientSnapshot } = validation.data;

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
              success: false,
              error: 'You cannot book a new trip within 24 hours of a cancellation.',
            },
            { status: 403 }
          );
        }
        if (['pending', 'confirmed', 'paid'].includes(lastRes.status)) {
          return Response.json(
            {
              success: false,
              error: 'You already have an active reservation.',
            },
            { status: 403 }
          );
        }
      }
    }

    // Use Adapter
    const { getAdapter } = await import('@/scraper');
    const adapter = getAdapter();

    // Construct TripData & PassengerInfo
    // NOTE: In a real scenario, we might need to re-fetch the trip or pass full trip params.
    // For now, mapping incoming ID to what the adapter expects.
    // If RealAdapter needs selectButtonId, we assume tripId IS that ID or we fetch it.
    // But passing just an ID to createReservation might be insufficient for RealAdapter without context.
    // However, for the purpose of this refactor (parity with existing code), we delegate.

    // The previous code was:  tripSnapshot: { id: tripId, mock: true }
    // We'll create a partial TripData
    const tripData: any = { selectButtonId: tripId }; // provisional

    // Passenger info from logged in user
    // Passenger info from logged in user
    const passenger = {
      firstName: pilgrim.firstName || '',
      lastName: pilgrim.lastName || '',
      nationalId: pilgrim.nationalId || '',
      phone: pilgrim.phone,
      birthdate: pilgrim.birthdate || '1300/01/01',
    };

    const reservationResult = await adapter.createReservation(tripData, passenger);

    // Save to Payload (Adapter usually returns existing system ID or we save it now?)
    // The adapter implementation of `createReservation` (Mock) returns a ReservationResult object.
    // We should probably save that result to our DB.

    // Check what adapter returns
    // MockAdapter returns { reservationId, status: 'pending', ... }

    // We need to persist this reservation in Payload "reservations" collection to track it.
    // Use tripSnapshot from client if provided, otherwise use minimal info
    const finalSnapshot = clientSnapshot || { id: tripId, ...reservationResult };

    const newRes = await req.payload.create({
      collection: 'reservations',
      data: {
        pilgrim: pilgrim.id,
        externalResId: reservationResult.reservationId || 'UNKNOWN',
        status: 'pending', // or map from result
        tripSnapshot: finalSnapshot, // store metadata
        bookedAt: new Date().toISOString(),
      },
    });

    return Response.json({ success: true, reservation: newRes });
  } catch (error) {
    console.error('Reservation creation error:', error);
    return Response.json({ success: false, error: 'Internal Error' }, { status: 500 });
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

  let res;
  try {
    res = await req.payload.findByID({
      collection: 'reservations',
      id: parseInt(id as string),
    });
  } catch (error) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

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
