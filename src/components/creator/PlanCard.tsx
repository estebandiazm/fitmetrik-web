'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Food } from '../../domain/types/Food';
import { getDraftCardTitle, type PlanDraft } from '@/domain/services/dietPlanDrafts';


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

  const cardTitle = getDraftCardTitle(plan.days, index);

  return (
    <Card className="p-6 mb-6">
      <h6 className="text-text-primary font-bold text-center mb-4">
        {cardTitle}
      </h6>

      <input
        type="text"
        placeholder="Days"
        value={plan.days}
        onChange={(e) => update('days', e.target.value)}
        className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 mb-4"
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-text-muted font-semibold block mb-2">Proteins</label>
          <div className="relative">
            <input
              type="number"
              value={plan.proteins}
              onChange={(e) => update('proteins', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">g</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted font-semibold block mb-2">Carbs</label>
          <div className="relative">
            <input
              type="number"
              value={plan.carbs}
              onChange={(e) => update('carbs', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">g</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-text-muted font-semibold block mb-2">Fruits</label>
          <div className="relative">
            <input
              type="number"
              value={plan.fruits}
              onChange={(e) => update('fruits', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">g</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted font-semibold block mb-2">Fats</label>
          <div className="relative">
            <input
              type="number"
              value={plan.fats}
              onChange={(e) => update('fats', Number(e.target.value))}
              className="w-full px-4 py-2 rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">g</span>
          </div>
        </div>
      </div>

      {plan.foods.length > 0 && (
        <div className="mb-4 space-y-1">
          {plan.foods.map((food, fi) => (
            <div
              key={fi}
              className="flex items-center justify-between py-2 text-text-primary text-sm"
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
                className="text-text-faint hover:text-text-muted transition text-lg"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PlanCard;
