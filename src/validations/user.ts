// In the Name of God, the Creative, the Originator
import { z } from 'zod';

export const userDisplayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters long')
  .max(120, 'Display name must be 120 characters or fewer')
  .or(z.literal(''))
  .optional();
