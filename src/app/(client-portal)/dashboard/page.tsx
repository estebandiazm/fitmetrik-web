import React from 'react';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { StepsCounter } from '@/components/dashboard/StepsCounter';
import { WeightCounter } from '@/components/dashboard/WeightCounter';
import { HydrationTracker } from '@/components/dashboard/HydrationTracker';
import { MacrosHUD } from '@/components/dashboard/MacrosHUD';
import { PlanSectionCard, PlanSectionCardProps } from '@/components/dashboard/PlanSectionCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { PlanSwitcher } from '@/components/dashboard/PlanSwitcher';

import { DietPlan } from '@/domain/types/DietPlan';
import { createClient } from '@/infrastructure/adapters/supabase/server';
import { getClientByAuthId } from '@/app/actions/clientActions';
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

  // Weight data
  const dailyWeights = clientRecord?.dailyWeights || [];
  const targetWeight = clientRecord?.targetWeight || undefined;

  // Determine active plan
  const plans = isMock ? [mockPlan] : clientRecord.plans;
  
  // Parse planIndex from search params
  const qsIndex = searchParams?.planIndex;
  let activeIndex = plans.length - 1; // default to the latest plan

  if (qsIndex && typeof qsIndex === 'string') {
    const parsed = parseInt(qsIndex, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < plans.length) {
      activeIndex = parsed;
    }
  }

  const activePlan = plans[activeIndex];

  // Map plans for switcher
  const switcherPlans = plans.map(p => ({ label: p.label, days: p.days }));

  const mealCardsData = activePlan.meals.map((meal, index) => {
    const foods = meal.blocks.flatMap(block => 
      block.options.map(opt => ({
        id: `${meal.mealName}-${opt.foodName}`,
        name: opt.foodName,
        category: block.blockType,
        amount: `${opt.grams}${opt.measureUnit}`,
        colorClass: block.blockType === 'BASE' ? 'border-primary' : block.blockType === 'GRASA' ? 'border-tertiary' : 'border-secondary'
      }))
    );
    return {
      title: meal.mealName,
      description: `${meal.blocks.length} bloques nutricionales`,
      totalWeight: foods.reduce((acc, f) => acc + (parseInt(f.amount) || 0), 0) + 'g',
      totalProtein: 'Calculado',
      foods,
      icon: 'restaurant_menu',
      defaultExpanded: false
    };
  });

  const snacksCardData = {
    title: "Snacks",
    description: "Elige una opción por día",
    totalWeight: activePlan.snacks?.length + " opciones",
    totalProtein: "-",
    foods: activePlan.snacks?.map(snack => ({
      id: `snack-${snack.optionNumber}`,
      name: `Opción ${snack.optionNumber}`,
      category: "Snack",
      amount: snack.description,
      colorClass: "border-primary"
    })) || [],
    icon: 'cookie',
    defaultExpanded: false
  };

  // Only add snacks if the plan has them
  const allCards: PlanSectionCardProps[] = [...mealCardsData];
  if (activePlan.snacks && activePlan.snacks.length > 0) {
    allCards.push(snacksCardData);
  }

  return (
    <div className="font-display bg-surface-dim text-slate-100 min-h-screen pb-32 lg:pb-0 relative overflow-x-hidden w-full">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <TopAppBar clientName={clientRecord?.name || "Client User"} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-10 flex flex-col gap-8 mt-4">
        {/* Page Header & Plan Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Planes Activos</h1>
            <p className="text-on-surface-variant mt-2 font-medium">
              {isMock ? "Mostrando datos de demostración" : `Estrategia nutricional de ${activePlan.label || 'Plan Personalizado'}`}
            </p>
          </div>
          <PlanSwitcher plans={switcherPlans} activeIndex={activeIndex} />
        </div>

        <div className="flex flex-col gap-8">
          {/* TOP SECTION: Summary Widgets row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MacrosHUD />
            <StepsCounter current={dailyAverage} goal={stepGoal} />
            <HydrationTracker current={3.5} goal={3.5} />
            <WeightCounter weights={dailyWeights} targetWeight={targetWeight} />
          </div>

          {/* Snacks count — now below the main widget row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="rounded-3xl p-6 border-b-4 lg:border-l-4 lg:border-b-0 border-tertiary">
              <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Snacks per Day</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary shadow-inner">
                  <span className="material-symbols-outlined text-3xl">cookie</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activePlan.snacks?.length || 0}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* BOTTOM SECTION: Full width Meals/Snacks grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
            {allCards.map((card, idx) => {
              const isLastAndOdd = allCards.length % 2 !== 0 && idx === allCards.length - 1;
              return (
                <div key={idx} className={isLastAndOdd ? "md:col-span-2" : ""}>
                  <PlanSectionCard {...card} />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
