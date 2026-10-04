import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

import { inviteClient } from './actions';

export default async function InviteClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-text-primary">Invite New Client</h1>
        
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-[var(--radius-control)] mb-6 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="name">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Jane Doe"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              className="w-full"
            />
            <p className="mt-1 text-sm text-text-faint">
              They will receive an email with instructions to set their password.
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <Button formAction={inviteClient}>Send Invite</Button>
            <Link
              href="/clients"
              className="neu-btn inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-text-primary rounded-[10px]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
