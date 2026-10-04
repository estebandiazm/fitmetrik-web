// Turns the creator's plan drafts (macro targets per block) into DietPlans.
import type { DietPlan } from "../types/DietPlan";
import type { Food } from "../types/Food";
import { DietEngine } from "./DietEngine";
import { FoodDatabase } from "./FoodDatabase";

export interface DietPlanDraft {
  days: string;
  proteins: number;
  carbs: number;
  fruits: number;
  fats: number;
}

// Editable creator card: macro targets plus the card's own metadata.
export interface PlanDraft extends DietPlanDraft {
  id: string;
  label: string;
  foods: Food[];
}

const DEFAULT_CLIENT_NAME = "Cliente";

// New creator card with the default macro targets.
export function createDefaultPlanDraft(id: string): PlanDraft {
  return { id, label: "", days: "", proteins: 20, carbs: 20, fruits: 0, fats: 0, foods: [] };
}

// "Plan {days}" when days is set, else "Plan {n}" (1-based position).
export function getDraftPlanLabel(days: string, index: number): string {
  const trimmed = days.trim();
  return trimmed ? `Plan ${trimmed}` : `Plan ${index + 1}`;
}

// Creator card heading: "Plan | {days} days" when days is set, else "Plan | {n}".
export function getDraftCardTitle(days: string, index: number): string {
  const trimmed = days.trim();
  return trimmed ? `Plan | ${trimmed} days` : `Plan | ${index + 1}`;
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
