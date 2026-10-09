import { cookies } from 'next/headers';
import {
  REMEMBERED_USER_COOKIE,
  REMEMBERED_USER_MAX_AGE_SECONDS,
  normalizeRememberedEmail,
} from '@/domain/services/rememberedUser';

/** Reads the last signed-in email, if any. Safe to call from Server Components. */
export async function getRememberedEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeRememberedEmail(cookieStore.get(REMEMBERED_USER_COOKIE)?.value);
}

/** Persists the email of a successful sign-in. Server Actions / Route Handlers only. */
export async function rememberEmail(rawEmail: string | null | undefined): Promise<void> {
  const email = normalizeRememberedEmail(rawEmail);
  if (!email) return;

  const cookieStore = await cookies();
  cookieStore.set(REMEMBERED_USER_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REMEMBERED_USER_MAX_AGE_SECONDS,
  });
}

/** Clears the remembered email ("Usar otra cuenta"). Server Actions / Route Handlers only. */
export async function forgetEmail(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBERED_USER_COOKIE);
}
