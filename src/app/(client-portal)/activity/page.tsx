import React, { Suspense } from 'react';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { ActivityPageClient } from '@/components/activity/ActivityPageClient';

import { createClient } from '@/infrastructure/adapters/supabase/server';
import { getClientByAuthId } from '@/app/actions/clientActions';
import { redirect } from 'next/navigation';

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const clientRecord = await getClientByAuthId(user.id);
  if (!clientRecord) {
    redirect('/login?error=Client+profile+not+found');
  }

  const dailySteps = clientRecord.dailySteps || [];
  const stepGoal = clientRecord.stepGoal || undefined;
  const dailyWeights = clientRecord.dailyWeights || [];
  const targetWeight = clientRecord.targetWeight || undefined;
  const measurementPoints = clientRecord.measurementPoints || [];
  const measurements = clientRecord.measurements || [];

  return (
    <div className="font-display bg-surface-dim text-slate-100 min-h-screen pb-32 lg:pb-0 relative overflow-x-hidden w-full">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <TopAppBar clientName={clientRecord.name || "Client User"} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-10 flex flex-col gap-8 mt-4">
        <Suspense fallback={null}>
          <ActivityPageClient
            clientId={clientRecord.id}
            clientName={clientRecord.name}
            dailySteps={dailySteps}
            dailyWeights={dailyWeights}
            stepGoal={stepGoal}
            targetWeight={targetWeight}
            measurementPoints={measurementPoints}
            measurements={measurements}
          />
        </Suspense>
      </main>

      <BottomNavBar />
    </div>
  );
}
