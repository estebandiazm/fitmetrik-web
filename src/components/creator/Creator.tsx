'use client';

import React, { useContext, useState } from 'react';
import { ClientContext } from '../../context/ClientContext';
import { ClientContextType } from '../../context/ClientContextType';
import { DietEngine } from '../../domain/services/DietEngine';
import { FoodDatabase } from '../../domain/services/FoodDatabase';
import { useRouter } from 'next/navigation';
import Menu from '../menu/Menu';
import PlanCard, { PlanDraft } from './PlanCard';
import SavePlanModal from './SavePlanModal';
import { DietPlan } from '../../domain/types/DietPlan';

// ─── helpers ────────────────────────────────────────────────────────────────

const createDefaultPlan = (): PlanDraft => ({
  id: crypto.randomUUID(),
  label: '',
  days: '',
  proteins: 20,
  carbs: 20,
  fruits: 0,
  fats: 0,
  foods: [],
});

// ─── styles ─────────────────────────────────────────────────────────────────

const pillInputClass = 'w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none';

// ─── types ───────────────────────────────────────────────────────────────────

interface CreatorProps {
  coachId: string;
}

// ─── component ──────────────────────────────────────────────────────────────

const Creator = ({ coachId }: CreatorProps) => {
  const router = useRouter();
  const { saveClient } = useContext(ClientContext) as ClientContextType;

  const [clientName, setClientName] = useState('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');
  const [plans, setPlans] = useState<PlanDraft[]>([createDefaultPlan()]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<DietPlan[]>([]);

  // Update a single plan by index
  const handlePlanUpdate = (index: number, updatedPlan: PlanDraft) => {
    setPlans((prev) => prev.map((p, i) => (i === index ? updatedPlan : p)));
  };

  // Add a new empty plan card
  const handleAddPlan = () => {
    setPlans((prev) => [...prev, createDefaultPlan()]);
  };

  // Save ALL plans at once → generate each DietPlan, persist, then navigate
  const handleSaveAll = () => {
    const fruits = FoodDatabase.getFruits();
    const firstMeal = FoodDatabase.getFirstMealFoods();
    const base = FoodDatabase.getSecondMealFoodsByCategory('BASE');
    const complement = FoodDatabase.getSecondMealFoodsByCategory('COMPLEMENT');

    const dietPlans = plans.map((draft, index) => {
      const generated = DietEngine.generatePlan(
        clientName || 'Cliente',
        fruits, draft.fruits,
        firstMeal, draft.proteins,
        base, draft.carbs,
        complement, draft.fats,
        base, draft.carbs,
        complement, draft.fats,
      );

      // Title follows "Plan {days}" if days is set, else "Plan {n}"
      const label = draft.days.trim()
        ? `Plan ${draft.days.trim()}`
        : `Plan ${index + 1}`;

      return {
        ...generated,
        label,
        days: draft.days,
      };
    });

    saveClient({
      name: clientName,
      coachId: '',
      targetWeight: targetWeight !== '' ? targetWeight : undefined,
      plans: dietPlans,
    });

    router.push('/viewer');
  };

  // Generate plans and open the modal so the user can choose a client to persist to
  const handleSaveToDB = () => {
    const fruits = FoodDatabase.getFruits();
    const firstMeal = FoodDatabase.getFirstMealFoods();
    const base = FoodDatabase.getSecondMealFoodsByCategory('BASE');
    const complement = FoodDatabase.getSecondMealFoodsByCategory('COMPLEMENT');

    const dietPlans: DietPlan[] = plans.map((draft, index) => {
      const generated = DietEngine.generatePlan(
        clientName || 'Cliente',
        fruits, draft.fruits,
        firstMeal, draft.proteins,
        base, draft.carbs,
        complement, draft.fats,
        base, draft.carbs,
        complement, draft.fats,
      );

      const label = draft.days.trim()
        ? `Plan ${draft.days.trim()}`
        : `Plan ${index + 1}`;

      return {
        ...generated,
        label,
        days: draft.days,
      };
    });

    setGeneratedPlans(dietPlans);
    setSaveModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-dim py-6 px-4 sm:px-6 md:px-12">
      <Menu />

      {/* ── Client header ── */}
      <div className="max-w-2xl mx-auto mb-8 mt-12">
        <div className="mb-4">
          <label className="text-xs text-white/60 font-semibold block mb-2">Client</label>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full neu-inset border border-transparent focus-within:border-tertiary">
            <span className="material-symbols-outlined text-white/60 text-sm">person</span>
            <input
              type="text"
              placeholder="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 font-semibold block mb-2">Target Weight</label>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full neu-inset border border-transparent focus-within:border-tertiary">
            <span className="material-symbols-outlined text-white/60 text-sm">scale</span>
            <input
              type="number"
              placeholder="Target weight"
              value={targetWeight}
              onChange={(e) =>
                setTargetWeight(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            />
            <span className="text-white/50 text-sm">kg</span>
          </div>
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="max-w-2xl mx-auto">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={index}
            onUpdate={handlePlanUpdate}
          />
        ))}

        {/* ── Add Another Plan ── */}
        <button
          onClick={handleAddPlan}
          className="w-full px-6 py-3 mb-4 rounded-full border border-white/30 text-white/80 font-semibold hover:border-tertiary hover:text-tertiary hover:bg-tertiary/8 transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Plan
        </button>

        {/* ── Save All Plans ── */}
        <button
          onClick={handleSaveAll}
          className="w-full px-6 py-3 mb-6 rounded-full neu-btn-accent font-bold transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span> Guardar Planes
        </button>

        {/* ── Save to Database ── */}
        <button
          onClick={handleSaveToDB}
          className="w-full px-6 py-3 mb-8 rounded-full border border-tertiary/40 text-tertiary font-semibold hover:border-tertiary hover:bg-tertiary/8 transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">cloud_upload</span> Guardar en Base de Datos
        </button>
      </div>

      <SavePlanModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        plans={generatedPlans}
        coachId={coachId}
      />
    </div>
  );
};

export default Creator;
