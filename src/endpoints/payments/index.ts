// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { Pilgrim } from '@/payload-types';
import { AppError, ErrorCodes } from '@/utils/AppError';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const initiatePaymentHandler: PayloadHandler = async req => {
  if (!req.user || req.user.collection !== 'pilgrims') {
    return errorResponse(new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401));
  }
  const pilgrim = req.user as unknown as Pilgrim & { collection: 'pilgrims' };

  try {
    const body = typeof req.json === 'function' ? await req.json() : (req as any).body;
    const { reservationId } = body || {};

    if (!reservationId) {
      throw new AppError('Reservation ID required', ErrorCodes.INVALID_PARAMS, 400);
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
      throw new AppError('Reservation not found', ErrorCodes.RESERVATION_NOT_FOUND, 404);
    }

    if (!reservation) {
      throw new AppError('Reservation not found', ErrorCodes.RESERVATION_NOT_FOUND, 404);
    }

    // Verify ownership
    // reservation.pilgrim can be ID or object
    const pilgrimId =
      typeof reservation.pilgrim === 'object' ? reservation.pilgrim.id : reservation.pilgrim;

    if (String(pilgrimId) !== String(req.user.id)) {
      return errorResponse(new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403));
    }

    const { getAdapter } = await import('@/scraper');
    const adapter = getAdapter();

    // Use externalResId for the scraper
    const externalId = reservation.externalResId;
    if (!externalId) {
      return errorResponse(new AppError('Reservation not linked', ErrorCodes.BAD_REQUEST, 400));
    }

    try {
      const paymentUrl = await adapter.getPaymentUrl(externalId);
      return successResponse({ paymentUrl });
    } catch (adapterError) {
      console.error('Adapter payment error:', adapterError);
      throw new AppError(
        'Payment initiation failed',
        ErrorCodes.PAYMENT_INIT_FAILED,
        500,
        adapterError
      );
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return errorResponse(error);
  }
};
