import { redirect } from 'next/navigation';
import { authProvider } from '@/lib/registry';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert } from '@/components/ui/Alert';
import { LoginForm } from './_LoginForm';

/** Translate raw error codes / legacy English messages from redirects into Spanish copy. */
function resolveErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    expired_link: 'Tu enlace de acceso expiró o no es válido. Pide uno nuevo.',
    'Coach profile not found': 'No encontramos tu perfil de coach.',
    'Client profile not found': 'No encontramos tu perfil de cliente.',
    'Unknown role. Contact your administrator.': 'Tu cuenta no tiene un rol asignado. Contacta a tu administrador.',
  };
  return errorMessages[error] ?? error;
}

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  // Redirect authenticated users to their home (prevents flickering)
  const session = await authProvider.getSession();
  if (session?.user) {
    const role = session.user.role;
    redirect(role === 'coach' ? '/clients' : '/dashboard');
  }

  const searchParams = await props.searchParams;

  return (
    <AuthShell>
      <div className="mb-7 flex flex-col items-start gap-4">
        {/* Logo: a single popped blister cell that punches in on load. */}
        <span
          aria-hidden="true"
          className="blister-cell-popped blister-cell-popping flex h-11 w-11 items-center justify-center rounded-xl text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-text-primary">Hola de nuevo</h1>
          <p className="mt-1 text-sm text-text-muted">Inicia sesión para registrar tu día.</p>
        </div>
      </div>

      {searchParams.error && (
        <div className="mb-5 animate-[shake-x_420ms_ease-in-out]" role="alert">
          <Alert type="error" message={resolveErrorMessage(searchParams.error)} />
        </div>
      )}
      {searchParams.message && (
        <div className="animate-enter mb-5" role="status">
          <Alert type="success" message={searchParams.message} />
        </div>
      )}

      <LoginForm />

      <p className="mt-7 border-t border-row-border pt-5 text-center text-[13px] text-text-muted">
        ¿No tienes cuenta? Tu coach te envía la invitación por correo.
      </p>
    </AuthShell>
  );
}
