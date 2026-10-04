// Turns the creator's plan drafts (macro targets per block) into DietPlans.
import type { DietPlan } from "../types/DietPlan";
import { DietEngine } from "./DietEngine";
import { FoodDatabase } from "./FoodDatabase";

export interface DietPlanDraft {
  days: string;
  proteins: number;
  carbs: number;
  fruits: number;
  fats: number;
}

const DEFAULT_CLIENT_NAME = "Cliente";

// "Plan {days}" when days is set, else "Plan {n}" (1-based position).
export function getDraftPlanLabel(days: string, index: number): string {
  const trimmed = days.trim();
  return trimmed ? `Plan ${trimmed}` : `Plan ${index + 1}`;
}

export function buildDietPlansFromDrafts(
  drafts: DietPlanDraft[],
  clientName: string
): DietPlan[] {
  const fruits = FoodDatabase.getFruits();
  const firstMeal = FoodDatabase.getFirstMealFoods();
  const base = FoodDatabase.getSecondMealFoodsByCategory("BASE");
  const complement = FoodDatabase.getSecondMealFoodsByCategory("COMPLEMENT");

  return drafts.map((draft, index) => ({
    ...DietEngine.generatePlan(
      clientName || DEFAULT_CLIENT_NAME,
      fruits, draft.fruits,
      firstMeal, draft.proteins,
      base, draft.carbs,
      complement, draft.fats,
      base, draft.carbs,
      complement, draft.fats,
    ),
    label: getDraftPlanLabel(draft.days, index),
    days: draft.days,
  }));
}
