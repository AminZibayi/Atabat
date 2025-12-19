// In the Name of God, the Creative, the Originator
import { z } from 'zod';
import { zodErrorMap } from '@/utils/zodErrorMap';

// Configure global error map for this module using Zod 4 API
z.config({ customError: zodErrorMap });

export const phoneSchema = z
  .string()
  .trim()
  .refine(val => /^09\d{9}$/.test(val), {
    message: 'validation.schema.phone',
  });

export const nationalIdSchema = z
  .string()
  .trim()
  .refine(val => /^\d{10}$/.test(val), {
    message: 'validation.schema.nationalId',
  });

// Simple format check YYYY/MM/DD, further logic validation might be needed elsewhere
export const birthdateSchema = z
  .string()
  .trim()
  .refine(val => /^\d{4}\/\d{2}\/\d{2}$/.test(val), {
    message: 'validation.schema.birthdate',
  });

export const pilgrimSchema = z.object({
  phone: phoneSchema,
  nationalId: nationalIdSchema.optional(),
  birthdate: birthdateSchema.optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});
