import { z } from 'zod';
import type { Validate } from 'payload';

export const validateZod = <T>(schema: z.ZodSchema<T>): Validate => {
  return value => {
    const result = schema.safeParse(value);

    if (result.success) {
      return true;
    }

    // Return the first error message
    return result.error.issues[0].message;
  };
};
