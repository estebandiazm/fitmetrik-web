import { AuthShell } from '@/components/auth/AuthShell';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from './actions';

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface m-0">Set New Password</h1>
      </div>

      {searchParams.message && (
        <div className="mb-6">
          <Alert type="info" message={searchParams.message} />
        </div>
      )}

      {searchParams.error && (
        <div className="mb-6">
          <Alert type="error" message={searchParams.error} />
        </div>
      )}

      <form className="flex flex-col gap-6">
        <div>
          <label
            className="block text-xs font-medium uppercase tracking-wide text-on-surface-muted mb-2"
            htmlFor="password"
          >
            New Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            className="w-full"
          />
          <p className="mt-2 text-xs text-on-surface-muted">Minimum 6 characters</p>
        </div>

        <Button type="submit" formAction={resetPassword} className="w-full">
          Save Password
        </Button>
      </form>
    </AuthShell>
  );
}
