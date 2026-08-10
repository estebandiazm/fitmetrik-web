import { redirect } from 'next/navigation';
import { authProvider } from '@/lib/registry';
import styles from './login.module.css';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert } from '@/components/ui/Alert';
import { LoginForm } from './_LoginForm';

/** Translate raw error codes from the auth callback into user-friendly messages. */
function resolveErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    expired_link: 'Your magic link has expired or is invalid. Please request a new one.',
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
      {/* Brand header */}
      <div className={styles.brandHeader}>
        <div className={styles.logoIcon}>
          <svg className="h-8 w-8 text-white" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
        </div>
        <h1 className={styles.brandTitle}>Welcome Back</h1>
        <p className={styles.brandSubtitle}>Track your progress and stay on diet.</p>
      </div>

      {/* Alerts */}
      {searchParams.error && (
        <div className={styles.alertWrap}>
          <Alert type="error" message={resolveErrorMessage(searchParams.error)} />
        </div>
      )}
      {searchParams.message && (
        <div className={styles.alertWrap}>
          <Alert type="success" message={searchParams.message} />
        </div>
      )}

      {/* Login form with tab switcher */}
      <LoginForm />

      {/* Footer Links (Stitch Design) */}
      <div className={styles.footerArea}>
        <p className={styles.footerLinkText}>
          Don&apos;t have an account?{' '}
          <a href="#" className={styles.footerAccent}>Create Account</a>
        </p>
      </div>
    </AuthShell>
  );
}
