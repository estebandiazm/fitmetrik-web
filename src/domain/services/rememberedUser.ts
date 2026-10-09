/**
 * Rules for the "remember last user" login shortcut.
 *
 * The app stores only the last signed-in email so that, once the Supabase
 * session expires, the login screen asks for the password alone.
 */

export const REMEMBERED_USER_COOKIE = 'fm_last_user';

/** 90 days — outlives the Supabase session so re-login is password-only. */
export const REMEMBERED_USER_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalizes an email for storage, or returns null when it is not a plausible email. */
export function normalizeRememberedEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return email;
}
