import { redirect } from 'next/navigation';
import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';
import { CoachHeader } from '@/components/coach/CoachHeader';
import { CoachSidebar } from '@/components/coach/CoachSidebar';

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  const coach = await getCoachByAuthId(session.user.id);
  if (!coach) {
    redirect('/login?error=Coach+profile+not+found');
  }

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col">
      <CoachHeader coachName={coach.name} coachEmail={coach.email} />

      <div className="flex flex-1">
        <CoachSidebar />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
