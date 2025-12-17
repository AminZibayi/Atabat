// In the Name of God, the Creative, the Originator
import { z } from 'zod';

// Validation for trip search parameters
export const tripSearchSchema = z.object({
  dateFrom: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Invalid date format')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Invalid date format')
    .optional(),
  province: z.string().optional(),
  adultCount: z.number().int().min(1).optional(),
  infantCount: z.number().int().min(0).optional(),
  borderType: z.enum(['air', 'land', 'accommodation_only', 'flight_only', '---']).optional(),
});

// Validation for selecting a trip to reserve
export const tripSelectionSchema = z.object({
  tripId: z.string().min(1),
  passengerCount: z.number().int().min(1),
});
