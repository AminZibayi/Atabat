// In the Name of God, the Creative, the Originator
import { z } from 'zod';

export const mediaAltSchema = z
  .string()
  .trim()
  .min(3, 'Alt text must be at least 3 characters long')
  .max(160, 'Alt text must be 160 characters or fewer');
