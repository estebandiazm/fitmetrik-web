import { redirect } from 'next/navigation';

import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { getClientsByCoachId } from '@/app/actions/clientActions';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { CoachSidebar } from '@/components/coach/CoachSidebar';
import { MetricsSection } from '@/components/coach/MetricsSection';
import { ClientRosterTable } from '@/components/coach/ClientRosterTable';

export default async function ClientsPage() {
  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  const coach = await getCoachByAuthId(session.user.id);
  if (!coach) {
    redirect('/login?error=Coach+profile+not+found');
  }

  const clients = await getClientsByCoachId(coach.id);

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col">
      <CoachHeader coachName={coach.name} coachEmail={coach.email} />

      <div className="flex flex-1">
        <CoachSidebar />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-on-surface">Clients</h1>
            <p className="text-on-surface-muted text-sm mt-1">
              Manage your client roster and track their progress.
            </p>
          </div>

          <MetricsSection clients={clients} />

          <div className="mt-6">
            <ClientRosterTable clients={clients} />
          </div>
        </main>
      </div>
    </div>
  );
}
