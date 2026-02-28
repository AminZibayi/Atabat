// In the Name of God, the Creative, the Originator
import type { CollectionBeforeReadHook } from 'payload';
import type { Reservation } from '@/payload-types';
import { checkReservationExists } from '@/scraper/checkReservationExists';

const VALIDATION_BUFFER_MS = 30 * 60 * 1000; // 30 minutes

/**
 * beforeRead hook for Reservations collection.
 * Validates pending reservations against the external Atabat system.
 * If the external reservation page doesn't exist, marks as cancelled.
 * Uses a 30-minute buffer to prevent excessive external checks.
 */
export const beforeReadReservation: CollectionBeforeReadHook<Reservation> = async ({
  doc,
  req,
}) => {
  // Skip if no document (e.g., query operations)
  if (!doc) {
    return doc;
  }

  // Only validate pending reservations
  if (doc.status !== 'pending') {
    return doc;
  }

  // Skip if no external reservation ID
  if (!doc.externalResId || doc.externalResId === 'UNKNOWN') {
    return doc;
  }

  const now = Date.now();
  // Check if we're within the 30-minute buffer
  const lastValidated = doc.lastValidatedAt ? new Date(doc.lastValidatedAt).getTime() : 0;

  if (now - lastValidated < VALIDATION_BUFFER_MS) {
    console.log(`[beforeReadReservation] Skipping validation for ${doc.id} - within 30min buffer`);
    return doc;
  }

  console.log(`[beforeReadReservation] Validating reservation ${doc.id} (${doc.externalResId})`);

  try {
    const exists = await checkReservationExists(doc.externalResId);

    // Always update lastValidatedAt
    const updateData: Partial<Reservation> = {
      lastValidatedAt: new Date().toISOString(),
    };

    // If reservation doesn't exist on external system, mark as cancelled
    if (!exists) {
      console.log(
        `[beforeReadReservation] Reservation ${doc.id} not found on external system - marking as cancelled`
      );
      updateData.status = 'cancelled';
    }

    // Update the reservation in the database
    await req.payload.update({
      collection: 'reservations',
      id: doc.id,
      data: updateData,
      // Avoid triggering hooks recursively
      context: {
        skipValidation: true,
      },
    });

    // Return the updated doc for the current read
    return {
      ...doc,
      ...updateData,
    };
  } catch (error) {
    console.error(`[beforeReadReservation] Error validating reservation ${doc.id}:`, error);
    // Don't block the read on validation errors
    return doc;
  }
};
