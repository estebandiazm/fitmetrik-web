import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/adapters/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { rememberEmail } from '@/app/(auth)/login/remembered-user';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next');

  if (!next) {
    if (type === 'recovery' || type === 'invite') {
      next = `/update-password?type=${type}`;
    } else {
      next = '/'; // Default to root/dashboard for magiclink or regular login
    }
  }

  const supabase = await createClient();

  // Helper to handle the redirect logic consistently
  const doRedirect = async (email: string | undefined) => {
    await rememberEmail(email);

    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  };

  try {
    // 1. Handle OTP magic links and invites (token_hash + type)
    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return await doRedirect(data.user?.email);
      }
    }

    // 2. Handle PKCE flow (code)
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return await doRedirect(data.user?.email);
      }
    }
  } catch {
    // Expected to fall through to error redirect
  }

  // OTP exchange failed or no valid params present — redirect to login with a clear error
  return NextResponse.redirect(`${origin}/login?error=expired_link`);
}
