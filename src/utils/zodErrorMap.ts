// In the Name of God, the Creative, the Originator

import type { $ZodErrorMap } from 'zod/v4/core';

/**
 * Custom Zod error map that returns translation keys instead of hardcoded messages.
 * The frontend can use these keys with next-intl to display localized messages.
 *
 * Translation keys follow the pattern: validation.{category}.{type}
 *
 * Note: Zod 4 uses different issue codes than Zod 3:
 * - invalid_format (instead of invalid_string/invalid_date)
 * - invalid_value (instead of invalid_enum_value)
 */
export const zodErrorMap: $ZodErrorMap = issue => {
  let translationKey: string;

  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') {
        translationKey = 'validation.common.required';
      } else {
        translationKey = `validation.invalidType.${issue.expected}`;
      }
      break;

    case 'too_small':
      if (issue.origin === 'string') {
        if (issue.minimum === 1) {
          translationKey = 'validation.common.required';
        } else {
          translationKey = 'validation.common.minLength';
        }
      } else if (issue.origin === 'number') {
        translationKey = 'validation.common.minValue';
      } else if (issue.origin === 'array') {
        translationKey = 'validation.common.minItems';
      } else {
        translationKey = 'validation.common.tooSmall';
      }
      break;

    case 'too_big':
      if (issue.origin === 'string') {
        translationKey = 'validation.common.maxLength';
      } else if (issue.origin === 'number') {
        translationKey = 'validation.common.maxValue';
      } else if (issue.origin === 'array') {
        translationKey = 'validation.common.maxItems';
      } else {
        translationKey = 'validation.common.tooBig';
      }
      break;

    case 'invalid_format':
      // Zod 4 uses invalid_format for string validations (email, url, regex, etc.)
      translationKey = 'validation.common.invalidFormat';
      break;

    case 'invalid_value':
      // Zod 4 uses invalid_value for enum validations
      translationKey = 'validation.common.invalidOption';
      break;

    case 'custom':
      // Custom validations should pass their own translation key in the message
      translationKey = issue.message || 'validation.common.invalid';
      break;

    default:
      // Fallback to a generic message
      translationKey = 'validation.common.invalid';
  }

  return translationKey;
};
