'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/adapters/supabase/server';
import { forgetEmail, rememberEmail } from './remembered-user';

function getRedirectUrl(role: string | undefined): string {
  if (role === 'coach') return '/clients';
  if (role === 'client') return '/dashboard';
  return '/login?error=Unknown+role.+Contact+your+administrator.';
}

export async function loginWithPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Ingresa tu correo y contraseña')}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // A remembered account only typed the password, so don't blame the email.
    const message = formData.get('remembered') ? 'Contraseña incorrecta. Inténtalo de nuevo.' : 'Correo o contraseña incorrectos';
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;

  await rememberEmail(user?.email);
  redirect(getRedirectUrl(role));
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    redirect(`/login?error=${encodeURIComponent('Ingresa tu correo')}`);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/login?message=${encodeURIComponent('Revisa tu correo: te enviamos el enlace de acceso.')}`);
}

/** "Usar otra cuenta": drops the remembered email so the full login form shows again. */
export async function switchAccount() {
  await forgetEmail();
  redirect('/login');
}
