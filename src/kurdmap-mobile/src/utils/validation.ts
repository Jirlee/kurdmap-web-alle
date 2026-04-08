/**
 * Input validation and sanitization utilities.
 * Used at system boundaries (form submissions, API calls).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Max lengths to prevent memory abuse on TextInput fields */
export const MAX_LENGTHS = {
  email: 254,
  password: 128,
  fullName: 100,
  search: 200,
  review: 2000,
  contactName: 100,
  contactMessage: 5000,
} as const;

/**
 * Basic email format validation.
 */
export function isValidEmail(email: string): boolean {
  if (email.length > MAX_LENGTHS.email) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Strip HTML tags and dangerous characters from user input.
 * Prevents XSS when content is rendered in WebViews or Text.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[<>]/g, '')     // strip remaining angle brackets
    .trim();
}

/**
 * Enforce max length on a string, truncating if needed.
 */
export function enforceMaxLength(input: string, maxLength: number): string {
  return input.slice(0, maxLength);
}
