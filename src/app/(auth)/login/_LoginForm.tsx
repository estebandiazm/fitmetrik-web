'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/ui/icons';
import { loginWithPassword, loginWithMagicLink, switchAccount } from './actions';

type Tab = 'password' | 'magic';

const LABEL_CLASSES = 'mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-text-muted';

const INPUT_CLASSES =
  'w-full rounded-xl border border-border bg-bg py-3 pl-11 pr-4 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-text-faint hover:border-border-strong focus:border-accent-teal focus:bg-panel focus:ring-4 focus:ring-accent-teal/15';

const SUBMIT_CLASSES =
  'group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-teal px-4 py-3.5 text-sm font-semibold text-accent-teal-ink transition-[transform,filter] duration-200 hover:brightness-[0.97] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal';

const TEXT_LINK_CLASSES =
  '-mx-1 rounded-md px-1 py-1 text-xs font-medium text-text-muted underline decoration-border-strong underline-offset-4 transition-colors hover:text-text-primary hover:decoration-accent-teal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-teal';

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-accent-teal-ink/30 border-t-accent-teal-ink"
    />
  );
}

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={SUBMIT_CLASSES} disabled={pending} aria-busy={pending}>
      {/* Sheen sweep on hover — a soft highlight crossing the button. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/25 opacity-0 transition-[left,opacity] duration-700 group-hover:left-[120%] group-hover:opacity-100"
      />
      {pending ? <Spinner /> : null}
      <span>{pending ? pendingLabel : idleLabel}</span>
      {!pending && (
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          <ArrowRightIcon size={16} />
        </span>
      )}
    </button>
  );
}

interface EmailFieldProps {
  id: string;
  delayMs: number;
  defaultValue?: string;
}

function EmailField({ id, delayMs, defaultValue }: EmailFieldProps) {
  return (
    <div className="animate-enter" style={{ '--enter-delay': `${delayMs}ms` } as React.CSSProperties}>
      <label className={LABEL_CLASSES} htmlFor={id}>
        Correo electrónico
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-faint">
          <MailIcon size={18} />
        </span>
        <input
          id={id}
          name="email"
          type="email"
          placeholder="nombre@correo.com"
          required
          autoComplete="email"
          defaultValue={defaultValue}
          className={INPUT_CLASSES}
        />
      </div>
    </div>
  );
}

/**
 * Shown instead of the email input when the last signed-in user is remembered.
 * The hidden input keeps the email in the form (and lets password managers match the account).
 */
function RememberedAccount({ email, delayMs }: { email: string; delayMs: number }) {
  return (
    <div
      className="animate-enter flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5"
      style={{ '--enter-delay': `${delayMs}ms` } as React.CSSProperties}
    >
      <input type="hidden" name="email" value={email} autoComplete="username" />
      <input type="hidden" name="remembered" value="1" />
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-locked-bg text-sm font-bold uppercase text-text-muted"
      >
        {email.charAt(0)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <span className="text-sm font-medium text-text-primary [overflow-wrap:anywhere]">
          <span className="sr-only">Cuenta: </span>
          {/* Prefer wrapping long addresses right after the @ */}
          {email.slice(0, email.indexOf('@') + 1)}
          <wbr />
          {email.slice(email.indexOf('@') + 1)}
        </span>
        <button type="submit" formAction={switchAccount} formNoValidate className={TEXT_LINK_CLASSES}>
          Usar otra cuenta
        </button>
      </div>
    </div>
  );
}

interface LoginFormProps {
  /** Last signed-in email; when present only the password is asked. */
  rememberedEmail?: string;
}

export function LoginForm({ rememberedEmail }: LoginFormProps) {
  const [tab, setTab] = useState<Tab>('password');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Segmented control with a sliding indicator. */}
      <div className="animate-enter relative mb-6 grid grid-cols-2 rounded-xl border border-border bg-bg p-1" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
        <span
          aria-hidden="true"
          className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-[10px] border border-border bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            tab === 'magic' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        {(
          [
            ['password', 'Contraseña'],
            ['magic', 'Enlace mágico'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={`relative z-10 rounded-[10px] py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent-teal ${
              tab === value ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'password' ? (
        <form key="password" className="flex flex-col gap-5" action={loginWithPassword}>
          {rememberedEmail ? (
            <RememberedAccount email={rememberedEmail} delayMs={180} />
          ) : (
            <EmailField id="email-pw" delayMs={180} />
          )}

          <div className="animate-enter" style={{ '--enter-delay': '240ms' } as React.CSSProperties}>
            <div className="mb-2 flex items-center justify-between">
              <label className={`${LABEL_CLASSES} mb-0`} htmlFor="password">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setTab('magic')}
                className={TEXT_LINK_CLASSES}
              >
                ¿La olvidaste? Entra con un enlace
              </button>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-faint">
                <LockIcon size={18} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                autoFocus={Boolean(rememberedEmail)}
                className={`${INPUT_CLASSES} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                aria-controls="password"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-locked-bg hover:text-text-primary"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <div className="animate-enter pt-1" style={{ '--enter-delay': '300ms' } as React.CSSProperties}>
            <SubmitButton idleLabel="Entrar" pendingLabel="Entrando…" />
          </div>
        </form>
      ) : (
        <form key="magic" className="flex flex-col gap-5" action={loginWithMagicLink}>
          <EmailField id="email-magic" delayMs={60} defaultValue={rememberedEmail} />

          <p className="animate-enter text-[13px] leading-relaxed text-text-muted" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
            Te enviamos un enlace de acceso a tu correo. Sin contraseña.
          </p>

          <div className="animate-enter" style={{ '--enter-delay': '180ms' } as React.CSSProperties}>
            <SubmitButton idleLabel="Enviar enlace" pendingLabel="Enviando…" />
          </div>
        </form>
      )}
    </>
  );
}
