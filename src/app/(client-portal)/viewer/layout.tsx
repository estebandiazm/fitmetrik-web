import { createClient } from '@/infrastructure/adapters/supabase/server';
import { getClientByAuthId } from '@/app/actions/clientActions';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';

export default async function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already redirects unauthenticated requests to /login before
  // this layout renders. This route is reached both by clients (viewing
  // their own plan) and by coaches (previewing a plan just created via
  // Creator) — getClientByAuthId gracefully returns null for a coach's
  // auth id, and TopAppBar falls back to its default clientName in that case.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clientRecord = user ? await getClientByAuthId(user.id) : null;

  return (
    <div className="min-h-screen bg-surface-dim">
      <TopAppBar clientName={clientRecord?.name} />
      {children}
      <BottomNavBar />
    </div>
  );
}
