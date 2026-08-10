import styles from './update-password.module.css';
import { updatePassword } from './actions';
import { createClient } from '@/infrastructure/adapters/supabase/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert } from '@/components/ui/Alert';

export default async function UpdatePasswordPage(props: {
  searchParams: Promise<{ error?: string; success?: string; type?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isRecoveryMode = searchParams.type === 'recovery' || searchParams.type === 'invite';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Debes iniciar sesión para actualizar tu contraseña');
  }

  return (
    <AuthShell footerText={`© ${new Date().getFullYear()} FitMetrik. Secure Area.`}>
      <div className={styles.brandHeader}>
        <div className={styles.logoIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className={styles.brandTitle}>
          {isRecoveryMode ? 'Configura tu contraseña' : 'Cambiar contraseña'}
        </h1>
        <p className={styles.brandSubtitle}>
          {isRecoveryMode
            ? 'Establece una nueva contraseña segura para tu cuenta.'
            : 'Ingresa tu contraseña actual por seguridad.'}
        </p>
      </div>

      {searchParams.error && (
        <div className={styles.alertWrap}>
          <Alert type="error" message={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className={styles.alertWrap}>
          <Alert type="success" message={searchParams.success} />
        </div>
      )}

      <form className={styles.form}>
        {!isRecoveryMode && (
          <div>
            <label className={styles.fieldLabel} htmlFor="currentPassword">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Tu contraseña actual"
              required
              className={styles.input}
            />
          </div>
        )}

        <div>
          <label className={styles.fieldLabel} htmlFor="password">
            Nueva Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            autoComplete="new-password"
            className={styles.input}
          />
        </div>

        <div>
          <label className={styles.fieldLabel} htmlFor="confirmPassword">
            Confirmar Contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repite tu nueva contraseña"
            required
            minLength={6}
            autoComplete="new-password"
            className={styles.input}
          />
        </div>

        <button formAction={updatePassword} className={styles.btnPrimary}>
          {isRecoveryMode ? 'Guardar y Entrar' : 'Actualizar Contraseña'}
        </button>
      </form>

      <div className={styles.footerArea}>
        <p className={styles.footerLinkText}>
          <a href={isRecoveryMode ? "/login" : "/my-plan"} className={styles.footerAccent} style={{ textDecoration: 'none' }}>
            &larr; {isRecoveryMode ? 'Volver al Inicio' : 'Volver a mi plan'}
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
