// In the Name of God, the Creative, the Originator
import { z } from 'zod';

// Jalali date format regex (YYYY/MM/DD)
const jalaliDateRegex = /^\d{4}\/\d{2}\/\d{2}$/;

// Validation for trip search parameters - uses client-friendly field names
// These are the names used in API queries and frontend forms
export const tripSearchSchema = z.object({
  departureFrom: z.string().regex(jalaliDateRegex, 'Invalid date format (YYYY/MM/DD)').optional(),
  departureTo: z.string().regex(jalaliDateRegex, 'Invalid date format (YYYY/MM/DD)').optional(),
  province: z.string().optional(),
  minCapacity: z.coerce.number().int().min(1).optional(),
  infantCount: z.coerce.number().int().min(0).optional(),
  tripType: z.enum(['', '1', '2', '128', '129']).optional(),
});

// TypeScript type inferred from the schema - single source of truth
export type TripSearchInput = z.infer<typeof tripSearchSchema>;

// Validation for selecting a trip to reserve
export const tripSelectionSchema = z.object({
  tripId: z.string().min(1),
  passengerCount: z.number().int().min(1).optional().default(1),
  tripSnapshot: z.record(z.string(), z.unknown()).optional(),
  passengerInfo: z.record(z.string(), z.unknown()).optional(),
});
