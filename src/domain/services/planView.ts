// Maps a DietPlan to the card view-models shown in the client plan view.
import type { DietPlan } from '../types/DietPlan';

export interface PlanCardFood {
  id: string;
  name: string;
  category: string;
  amount: string;
}

export interface PlanCardData {
  title: string;
  description: string;
  totalWeight: string;
  foods: PlanCardFood[];
  variant?: 'meal' | 'snack';
}

export function buildPlanCards(plan: DietPlan): PlanCardData[] {
  const cards: PlanCardData[] = plan.meals.map((meal) => {
    const foods = meal.blocks.flatMap((block, blockIndex) =>
      block.options.map((opt, optionIndex) => ({
        id: `${meal.mealName}-${block.blockType}-${blockIndex}-${optionIndex}-${opt.foodName}`,
        name: opt.foodName,
        category: block.blockType,
        amount: `${opt.grams} ${opt.measureUnit}`,
      })),
    );
    return {
      title: meal.mealName,
      description: foods.map((food) => food.name).join(' · '),
      totalWeight: `${meal.blocks.length} bloques`,
      foods,
    };
  });

  if (plan.snacks && plan.snacks.length > 0) {
    cards.push({
      title: 'Snacks',
      description: 'Elige una opción por día',
      totalWeight: `${plan.snacks.length} opciones`,
      variant: 'snack',
      foods: plan.snacks.map((snack) => ({
        id: `snack-${snack.optionNumber}`,
        name: snack.description,
        category: `Opción ${snack.optionNumber}`,
        amount: '',
      })),
    });
  }

  return cards;
}

// Active plan for the `planIndex` search param: defaults to the latest plan;
// invalid or out-of-range values fall back to the latest plan too.
export function resolveActivePlanIndex(
  planCount: number,
  planIndexRaw: string | string[] | undefined,
): number {
  const last = Math.max(planCount - 1, 0);
  if (typeof planIndexRaw !== 'string' || planIndexRaw === '') return last;
  const parsed = parseInt(planIndexRaw, 10);
  if (isNaN(parsed) || parsed < 0 || parsed >= planCount) return last;
  return parsed;
}
