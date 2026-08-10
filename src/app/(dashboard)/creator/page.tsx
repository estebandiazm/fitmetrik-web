import { redirect } from 'next/navigation';
import ClientProvider from '../../../context/ClientContext';
import Creator from '../../../components/creator/Creator';
import { authProvider } from '@/lib/registry';
import { getCoachByAuthId } from '@/app/actions/coachActions';

export default async function CreatorPage() {
  const session = await authProvider.getSession();
  if (!session) {
    redirect('/login');
  }

  const coach = await getCoachByAuthId(session.user.id);
  if (!coach) {
    redirect('/login?error=Coach+profile+not+found');
  }

  return (
    <ClientProvider>
      <Creator coachId={coach.id} />
    </ClientProvider>
  );
}
