// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { createReservation } from '@/scraper/reservation';
import { getContext } from '@/scraper/browser';
import { tripSelectionSchema } from '@/validations/trip';
import { Pilgrim, Reservation } from '@/payload-types';
import { AppError, ErrorCodes } from '@/utils/AppError';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const createReservationHandler: PayloadHandler = async req => {
  // Check authentication
  if (!req.user || req.user.collection !== 'pilgrims') {
    return errorResponse(new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401));
  }

  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    // Safe body parsing
    const body = typeof req.json === 'function' ? await req.json() : (req as any).body;

    // Validation
    const validation = tripSelectionSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error);
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
          return errorResponse(
            new AppError('Cancellation 24h rule', ErrorCodes.CANCELLATION_24H_RULE, 403)
          );
        }
        if (['pending', 'confirmed', 'paid'].includes(lastRes.status)) {
          return errorResponse(
            new AppError('Active reservation exists', ErrorCodes.ACTIVE_RESERVATION_EXISTS, 403)
          );
        }
      }
    }

    // Use Adapter
    const { getAdapter } = await import('@/scraper');
    const adapter = getAdapter();

    // Construct TripData & PassengerInfo
    const tripData: any = { selectButtonId: tripId }; // provisional

    // Passenger info from logged in user
    const passenger = {
      firstName: pilgrim.firstName || '',
      lastName: pilgrim.lastName || '',
      nationalId: pilgrim.nationalId || '',
      phone: pilgrim.phone,
      birthdate: pilgrim.birthdate || '1300/01/01',
    };

    try {
      const reservationResult = await adapter.createReservation(tripData, passenger);

      // Save to Payload
      const finalSnapshot = clientSnapshot || { id: tripId, ...reservationResult };

      const newRes = await req.payload.create({
        collection: 'reservations',
        data: {
          pilgrim: pilgrim.id,
          externalResId: reservationResult.reservationId || 'UNKNOWN',
          status: 'pending',
          tripSnapshot: finalSnapshot,
          bookedAt: new Date().toISOString(),
        },
      });

      return successResponse({ reservation: newRes });
    } catch (adapterError) {
      console.error('Adapter reservation error:', adapterError);
      throw new AppError(
        'Create reservation failed',
        ErrorCodes.CREATE_RESERVATION_FAILED,
        500,
        adapterError
      );
    }
  } catch (error) {
    console.error('Reservation creation error:', error);
    return errorResponse(error);
  }
};

export const getReservationsHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return errorResponse(new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401));
  }

  // safe cast after check
  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    const result = await req.payload.find({
      collection: 'reservations',
      where: {
        pilgrim: { equals: pilgrim.id },
      },
    });
    return successResponse({ reservations: result.docs });
  } catch (error) {
    return errorResponse(error);
  }
};

export const getReceiptHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return errorResponse(new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401));
  }

  const { id } = req.routeParams!;

  try {
    let res;
    try {
      res = await req.payload.findByID({
        collection: 'reservations',
        id: parseInt(id as string),
      });
    } catch (error) {
      throw new AppError('Reservation not found', ErrorCodes.RESERVATION_NOT_FOUND, 404);
    }

    if (!res) {
      throw new AppError('Reservation not found', ErrorCodes.RESERVATION_NOT_FOUND, 404);
    }

    const reservation = res as Reservation;

    // Pilgrim check
    const pilgrimId =
      typeof reservation.pilgrim === 'object' && reservation.pilgrim !== null
        ? reservation.pilgrim.id
        : reservation.pilgrim;

    // Loose comparison for ID safety (string vs number)
    if (String(pilgrimId) !== String(req.user.id)) {
      return errorResponse(new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403));
    }

    if (reservation.receiptData) {
      return successResponse({ receipt: reservation.receiptData });
    }

    return errorResponse(new AppError('Receipt not available', ErrorCodes.NOT_FOUND, 404)); // Or specialized code
  } catch (error) {
    return errorResponse(error);
  }
};
