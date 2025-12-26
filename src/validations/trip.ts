// In the Name of God, the Creative, the Originator
import { z } from 'zod';
import { zodErrorMap } from '@/utils/zodErrorMap';

// Configure global error map for this module using Zod 4 API
z.config({ customError: zodErrorMap });

// Jalali date format regex (YYYY/MM/DD)
const jalaliDateRegex = /^\d{4}\/\d{2}\/\d{2}$/;

// Validation for trip search parameters - uses client-friendly field names
// These are the names used in API queries and frontend forms
export const tripSearchSchema = z.object({
  departureFrom: z
    .string()
    .refine(val => !val || jalaliDateRegex.test(val), {
      message: 'validation.schema.birthdate', // Same format as birthdate
    })
    .optional(),
  departureTo: z
    .string()
    .refine(val => !val || jalaliDateRegex.test(val), {
      message: 'validation.schema.birthdate',
    })
    .optional(),
  province: z.string().optional(),
  minCapacity: z.coerce.number().int().min(1).optional(),
  infantCount: z.coerce.number().int().min(0).optional(),
  tripType: z.enum(['', '1', '2', '128', '129']).optional(),
});

// TypeScript type inferred from the schema - single source of truth
export type TripSearchInput = z.infer<typeof tripSearchSchema>;

// Validation for selecting a trip to reserve
// tripSnapshot contains the full trip data from the search (including selectButtonScript)
export const tripSelectionSchema = z.object({
  tripSnapshot: z
    .object({
      rowIndex: z.string(),
      tripIdentifier: z.string().min(1),
      departureDate: z.string(),
      groupCode: z.string(),
      agentName: z.string(),
      cost: z.number(),
      selectButtonScript: z.string().min(1),
      // Allow additional fields from TripData
    })
    .passthrough(),
  passengerCount: z.number().int().min(1).optional().default(1),
  // Optional overrides for passenger info (from reservation form)
  passengerOverrides: z
    .object({
      nationalId: z.string().optional(),
      birthdate: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export type TripSelectionInput = z.infer<typeof tripSelectionSchema>;
