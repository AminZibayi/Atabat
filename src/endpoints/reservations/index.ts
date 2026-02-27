// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { tripSelectionSchema } from '@/validations/trip';
import { TripData } from '@/scraper/types';
import { Pilgrim } from '@/payload-types';
import { AppError, ErrorCodes, type ErrorCode } from '@/utils/AppError';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const createReservationHandler: PayloadHandler = async req => {
  // Check authentication
  if (!req.user || req.user.collection !== 'pilgrims') {
    return errorResponse(new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401));
  }

  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    // Safe body parsing
    const body: unknown =
      typeof req.json === 'function'
        ? await req.json()
        : (req as unknown as { body: unknown }).body;

    // Validation - now expects tripSnapshot with full trip data
    const validation = tripSelectionSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error);
    }

    const { tripSnapshot, passengers: passengersInput } = validation.data;

    // Validate tripSnapshot has required selectButtonScript
    if (!tripSnapshot.selectButtonScript) {
      return errorResponse(
        new AppError('Invalid trip data: missing selectButtonScript', ErrorCodes.BAD_REQUEST, 400)
      );
    }

    // Use Adapter with tripSnapshot (contains selectButtonScript from original search)
    const { getAdapter } = await import('@/scraper');
    const adapter = getAdapter();

    // Build passengers array: use form data, fall back to profile for first passenger
    const passengers = passengersInput.map((p, index) => ({
      nationalId: p.nationalId || (index === 0 ? pilgrim.nationalId || '' : ''),
      phone: p.phone || (index === 0 ? pilgrim.phone : ''),
      birthdate: p.birthdate || (index === 0 ? pilgrim.birthdate || '' : ''),
    }));

    try {
      const reservationResult = await adapter.createReservation(
        tripSnapshot as unknown as TripData,
        passengers
      );

      if (!reservationResult.success) {
        // Map specific Atabat error messages to error codes for i18n
        const errorMessage = reservationResult.message || 'Reservation failed';
        let errorCode: ErrorCode = ErrorCodes.RESERVATION_CREATE_FAILED;

        // Check for duplicate registration (e.g., "زائري با کد ملي ... قبلا ثبت شده است")
        let duplicateNationalId: string | undefined;
        if (errorMessage.includes('قبلا ثبت شده است') || errorMessage.includes('قبلا ثبت شده')) {
          errorCode = ErrorCodes.RESERVATION_PASSENGER_DUPLICATE;
          const match = errorMessage.match(/کد ملي\s+(\d+)/);
          if (match) duplicateNationalId = match[1];
        }
        // Check for invalid passenger data
        else if (
          errorMessage.includes('نامعتبر') ||
          errorMessage.includes('اشتباه') ||
          errorMessage.includes('مطابقت ندارد')
        ) {
          errorCode = ErrorCodes.RESERVATION_PASSENGER_INVALID;
        }

        return errorResponse(
          new AppError(
            errorMessage,
            errorCode,
            400,
            duplicateNationalId ? { nationalId: duplicateNationalId } : undefined
          )
        );
      }

      // Scrape receipt data after successful reservation
      let receiptData: Record<string, unknown> | null = null;
      let paymentUrl: string | undefined = undefined;
      if (reservationResult.reservationId) {
        try {
          console.log('[Reservation] Scraping receipt for:', reservationResult.reservationId);
          const receipt = await adapter.getReceipt(reservationResult.reservationId);
          // Cast to Record for Payload's JSON field type
          receiptData = receipt as unknown as Record<string, unknown>;
          paymentUrl = receipt.paymentUrl;
          console.log('[Reservation] Receipt scraped successfully');
        } catch (err) {
          console.error('[Reservation] Failed to scrape receipt (non-fatal):', err);
          // Continue without receipt - user can refresh later
        }
      }

      // Save to Payload with externalResId (GUID from Atabat)
      const newRes = await req.payload.create({
        collection: 'reservations',
        data: {
          pilgrim: pilgrim.id,
          externalResId: reservationResult.reservationId || 'UNKNOWN',
          status: 'pending',
          tripSnapshot: tripSnapshot,
          receiptData: receiptData,
          paymentUrl: paymentUrl,
          bookedAt: new Date().toISOString(),
        },
      });

      return successResponse({ reservation: newRes });
    } catch (adapterError) {
      console.error('Adapter reservation error:', adapterError);
      throw new AppError(
        'Create reservation failed',
        ErrorCodes.RESERVATION_CREATE_FAILED,
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
    } catch (_error) {
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
