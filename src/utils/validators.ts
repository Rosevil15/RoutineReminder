/**
 * Validates an email address format.
 * Returns true for valid email format (local-part@domain.tld).
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password meets minimum requirements (at least 8 characters).
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
}

/**
 * Validates that a title/name is non-empty and not whitespace-only.
 */
export function validateTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false;
  return title.trim().length > 0;
}
