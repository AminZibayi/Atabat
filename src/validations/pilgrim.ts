// In the Name of God, the Creative, the Originator
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'Invalid Iranian phone number format (e.g., 09123456789)');

export const nationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'National ID must be exactly 10 digits');

// Simple format check YYYY/MM/DD, further logic validation might be needed elsewhere
export const birthdateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Invalid Jalali date format (YYYY/MM/DD)');

export const pilgrimSchema = z.object({
  phone: phoneSchema,
  nationalId: nationalIdSchema.optional(),
  birthdate: birthdateSchema.optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});
