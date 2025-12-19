// In the Name of God, the Creative, the Originator
import { z } from 'zod';
import { zodErrorMap } from '@/utils/zodErrorMap';

// Configure global error map for this module using Zod 4 API
z.config({ customError: zodErrorMap });

export const userDisplayNameSchema = z.string().trim().min(2).max(120).or(z.literal('')).optional();
