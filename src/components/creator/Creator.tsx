'use client';

import React, { useContext, useState } from 'react';
import { ClientContext } from '../../context/ClientContext';
import { ClientContextType } from '../../context/ClientContextType';
import {
  buildDietPlansFromDrafts,
  createDefaultPlanDraft,
  type PlanDraft,
} from '@/domain/services/dietPlanDrafts';
import { useRouter } from 'next/navigation';
import PlanCard from './PlanCard';
import SavePlanModal from './SavePlanModal';
import { DietPlan } from '../../domain/types/DietPlan';

// ─── helpers ────────────────────────────────────────────────────────────────

const createDefaultPlan = (): PlanDraft => createDefaultPlanDraft(crypto.randomUUID());

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
    saveClient({
      name: clientName,
      coachId,
      targetWeight: targetWeight !== '' ? targetWeight : undefined,
      plans: buildDietPlansFromDrafts(plans, clientName),
    });

    router.push('/viewer');
  };

  // Generate plans and open the modal so the user can choose a client to persist to
  const handleSaveToDB = () => {
    setGeneratedPlans(buildDietPlansFromDrafts(plans, clientName));
    setSaveModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-dim py-6 px-4 sm:px-6 md:px-12">
      {/* ── Client header ── */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="mb-4">
          <label className="text-xs text-text-muted font-semibold block mb-2">Client</label>
          <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel focus-within:border-accent-teal focus-within:ring-3 focus-within:ring-accent-teal/20">
            <span className="material-symbols-outlined text-text-muted text-sm">person</span>
            <input
              type="text"
              placeholder="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-faint outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted font-semibold block mb-2">Target Weight</label>
          <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel focus-within:border-accent-teal focus-within:ring-3 focus-within:ring-accent-teal/20">
            <span className="material-symbols-outlined text-text-muted text-sm">scale</span>
            <input
              type="number"
              placeholder="Target weight"
              value={targetWeight}
              onChange={(e) =>
                setTargetWeight(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-faint outline-none"
            />
            <span className="text-text-muted text-sm">kg</span>
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
          className="w-full px-6 py-3 mb-4 rounded-[var(--radius-control)] border border-border-strong text-text-primary font-semibold hover:border-tertiary hover:text-tertiary hover:bg-tertiary/8 transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> Add Another Plan
        </button>

        {/* ── Save All Plans ── */}
        <button
          onClick={handleSaveAll}
          className="w-full px-6 py-3 mb-6 rounded-[var(--radius-control)] neu-btn-accent font-bold transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span> Guardar Planes
        </button>

        {/* ── Save to Database ── */}
        <button
          onClick={handleSaveToDB}
          className="w-full px-6 py-3 mb-8 rounded-[var(--radius-control)] border border-tertiary/40 text-tertiary font-semibold hover:border-tertiary hover:bg-tertiary/8 transition flex items-center justify-center gap-2"
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
