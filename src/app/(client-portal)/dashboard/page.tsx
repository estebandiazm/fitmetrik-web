import React from 'react';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { StepsCounter } from '@/components/dashboard/StepsCounter';
import { WeightBlisterWidget } from '@/components/dashboard/weight-blister-widget';
import { HydrationTracker } from '@/components/dashboard/HydrationTracker';
import { MacrosHUD } from '@/components/dashboard/MacrosHUD';
import { PlanSectionCard } from '@/components/dashboard/PlanSectionCard';
import { PlanSwitcher } from '@/components/dashboard/PlanSwitcher';

import { DietPlan } from '@/domain/types/DietPlan';
import { createClient } from '@/infrastructure/adapters/supabase/server';
import { getClientByAuthId } from '@/app/actions/clientActions';
import { buildPlanCards, resolveActivePlanIndex } from '@/domain/services/planView';
import { buildWeeklyStrip, countPopped, findEntryForDate } from '@/domain/services/adherence';
import { redirect } from 'next/navigation';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ClientDashboard(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  const mockPlan: DietPlan = {
    label: "Plan General",
    days: "Lunes a Sábado",
    recommendations: "Tomar mucha agua",
    meals: [
      {
        mealName: "Comida 1 (Desayuno)",
        blocks: [
          { blockType: "BASE", options: [{ foodName: "Huevos Enteros", grams: 150, measureUnit: "g" }] },
          { blockType: "ACOMPAÑAMIENTO", options: [{ foodName: "Pan Integral", grams: 80, measureUnit: "g" }] },
          { blockType: "GRASA", options: [{ foodName: "Aguacate Hass", grams: 50, measureUnit: "g" }] }
        ]
      },
      {
        mealName: "Comida 2 (Almuerzo)",
        blocks: [
          { blockType: "BASE", options: [{ foodName: "Pechuga de Pollo", grams: 200, measureUnit: "g" }] },
          { blockType: "ACOMPAÑAMIENTO", options: [{ foodName: "Arroz Blanco", grams: 150, measureUnit: "g" }] },
          { blockType: "FRUTA", options: [{ foodName: "Manzana Verde", grams: 1, measureUnit: "ud" }] }
        ]
      },
      {
        mealName: "Comida 3 (Cena)",
        blocks: [
          { blockType: "BASE", options: [{ foodName: "Salmón", grams: 180, measureUnit: "g" }] },
          { blockType: "ACOMPAÑAMIENTO", options: [{ foodName: "Papa al Horno", grams: 200, measureUnit: "g" }] }
        ]
      }
    ],
    snacks: [
      { optionNumber: 1, description: "Yogurt griego (150g) con almendras (15g)" },
      { optionNumber: 2, description: "Batido de proteína de whey (1 scoop en agua)" }
    ]
  };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const clientRecord = await getClientByAuthId(user.id);
  const isMock = !clientRecord || !clientRecord.plans || clientRecord.plans.length === 0;

  // Calculate daily average from daily steps
  const dailySteps = clientRecord?.dailySteps || [];
  const dailyAverage = dailySteps.length > 0
    ? Math.round(dailySteps.reduce((sum, step) => sum + step.steps, 0) / dailySteps.length)
    : 0;
  const stepGoal = clientRecord?.stepGoal || 10000;

  // Weight data — bucketed into the blister-adherence weekly strip here (the
  // Server Component), not inside WeightBlisterWidget, so the client
  // component never needs its own `new Date()` / domain-service import
  // (keeps the components/ → domain/services dependency rule intact and
  // avoids any server/client clock or timezone skew across the RSC boundary).
  const dailyWeights = clientRecord?.dailyWeights || [];
  const targetWeight = clientRecord?.targetWeight || undefined;
  const weeklyWeightCells = buildWeeklyStrip(dailyWeights);
  const weeklyWeightCount = countPopped(weeklyWeightCells);
  const todayWeightEntry = findEntryForDate(dailyWeights, new Date());

  // Determine active plan
  const plans = isMock ? [mockPlan] : clientRecord.plans;
  
  const activeIndex = resolveActivePlanIndex(plans.length, searchParams?.planIndex);
  const activePlan = plans[activeIndex];

  // Map plans for switcher
  const switcherPlans = plans.map(p => ({ label: p.label, days: p.days }));

  const allCards = buildPlanCards(activePlan);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-bg pb-32 text-text-primary lg:pb-0">
      <TopAppBar clientName={clientRecord?.name || 'Cliente'} />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-6 pb-12 pt-8 lg:px-8">
        {isMock && (
          <p className="rounded-[var(--radius-control)] border border-border bg-panel px-4 py-3 text-[13px] text-text-muted">
            Mostrando datos de demostración — tu coach aún no te asignó un plan.
          </p>
        )}

        {/* Hoy: today's dose cell is the single focal action, with the
            supporting metrics beside it on wide screens and below on phones. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <WeightBlisterWidget
            clientId={clientRecord?.id ?? ''}
            cells={weeklyWeightCells}
            count={weeklyWeightCount}
            todayEntry={todayWeightEntry}
            targetWeight={targetWeight}
          />

          <div className="animate-enter grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ '--enter-delay': '240ms' } as React.CSSProperties}>
            <StepsCounter current={dailyAverage} goal={stepGoal} />
            <HydrationTracker current={3.5} />
            <div className="sm:col-span-2">
              <MacrosHUD />
            </div>
          </div>
        </div>

        <section aria-labelledby="plan-heading" className="flex flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Tu plan</p>
              <h2 id="plan-heading" className="mt-1 text-2xl font-bold text-text-primary">
                {activePlan.label || 'Plan personalizado'}
              </h2>
              {activePlan.days && <p className="mt-1 text-[13px] text-text-muted">{activePlan.days}</p>}
            </div>
            <PlanSwitcher plans={switcherPlans} activeIndex={activeIndex} />
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2">
            {allCards.map((card) => (
              <PlanSectionCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
