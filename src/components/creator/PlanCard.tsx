'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Food } from '../../domain/types/Food';

export type PlanDraft = {
  id: string;
  label: string;
  days: string;
  proteins: number;
  carbs: number;
  fruits: number;
  fats: number;
  foods: Food[];
};

const CATEGORY_EMOJI: Record<string, string> = {
  FRUIT: '🍊',
  BASE: '🍗',
  COMPLEMENT: '🍚',
};

interface PlanCardProps {
  plan: PlanDraft;
  index: number;
  onUpdate: (index: number, updatedPlan: PlanDraft) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, index, onUpdate }) => {
  const update = (field: keyof PlanDraft, value: string | number | Food[]) => {
    onUpdate(index, { ...plan, [field]: value });
  };

  // Derived title: "Plan | {days} days" if days filled, otherwise "Plan | {index+1}"
  const cardTitle = plan.days.trim()
    ? `Plan | ${plan.days.trim()} days`
    : `Plan | ${index + 1}`;

  return (
    <GlassCard className="p-6 mb-6">
      <h6 className="text-white font-bold text-center mb-4">
        {cardTitle}
      </h6>

      <input
        type="text"
        placeholder="Days"
        value={plan.days}
        onChange={(e) => update('days', e.target.value)}
        className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none mb-4"
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-white/70 font-semibold block mb-2">Proteins</label>
          <div className="relative">
            <input
              type="number"
              value={plan.proteins}
              onChange={(e) => update('proteins', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-white/70 font-semibold block mb-2">Carbs</label>
          <div className="relative">
            <input
              type="number"
              value={plan.carbs}
              onChange={(e) => update('carbs', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-white/70 font-semibold block mb-2">Fruits</label>
          <div className="relative">
            <input
              type="number"
              value={plan.fruits}
              onChange={(e) => update('fruits', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-white/70 font-semibold block mb-2">Fats</label>
          <div className="relative">
            <input
              type="number"
              value={plan.fats}
              onChange={(e) => update('fats', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-full neu-inset border border-transparent text-white placeholder-gray-400 focus:border-tertiary focus:outline-none pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
          </div>
        </div>
      </div>

      {plan.foods.length > 0 && (
        <div className="mb-4 space-y-1">
          {plan.foods.map((food, fi) => (
            <div
              key={fi}
              className="flex items-center justify-between py-2 text-white/90 text-sm"
            >
              <span>
                {CATEGORY_EMOJI[food.category] ?? '🍽️'} {food.name} -{' '}
                {food.totalGrams ?? food.grams}g
              </span>
              <button
                onClick={() =>
                  update(
                    'foods',
                    plan.foods.filter((_, i) => i !== fi)
                  )
                }
                className="text-white/40 hover:text-white/60 transition text-lg"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default PlanCard;
