// Progress of a shared carbohydrate budget ("bolsa de carbohidratos") across
// the meals that share it: how much of the reference food has been used, how
// much is left, and whether the day lands inside the coach's tolerance band.
import type { CarbPool, PoolPortion } from "../types/CarbPool";
import {
  convertEquivalent,
  findFood,
  listEquivalents,
  type Equivalent,
  type FoodPortion,
} from "./foodEquivalence";

// under: still below the band (normal mid-day) · within: fulfilled · over: exceeded.
export type PoolStatus = "under" | "within" | "over";

export interface CarbPoolProgress {
  /** Eaten so far, in grams of the pool's reference food. */
  usedGrams: number;
  /** Left to eat, in grams of the reference food (never negative). */
  remainingGrams: number;
  /** Eaten beyond `totalGrams` (0 when not exceeded). */
  overGrams: number;
  status: PoolStatus;
}

export function getPoolStatus(pool: CarbPool, usedGrams: number): PoolStatus {
  const band = (pool.totalGrams * pool.tolerancePct) / 100;
  if (usedGrams < pool.totalGrams - band) return "under";
  if (usedGrams > pool.totalGrams + band) return "over";
  return "within";
}

// Portions logged for meals outside the pool are ignored, so callers can pass
// the whole day's log.
export function calculatePoolProgress(
  pool: CarbPool,
  portions: PoolPortion[],
  foods: FoodPortion[],
): CarbPoolProgress {
  const reference = findFood(foods, pool.referenceFood);
  const usedGrams = portions
    .filter((portion) => pool.mealNames.includes(portion.mealName))
    .reduce(
      (sum, portion) => sum + convertEquivalent(portion.grams, findFood(foods, portion.foodName), reference),
      0,
    );

  return {
    usedGrams,
    remainingGrams: Math.max(0, pool.totalGrams - usedGrams),
    overGrams: Math.max(0, usedGrams - pool.totalGrams),
    status: getPoolStatus(pool, usedGrams),
  };
}

// What is left of the pool, expressed in each of `options` (e.g. the carb
// options of the next meal), rounded to `step` grams.
export function listRemainingEquivalents(
  pool: CarbPool,
  portions: PoolPortion[],
  foods: FoodPortion[],
  options: FoodPortion[],
  step = 5,
): Equivalent[] {
  const { remainingGrams } = calculatePoolProgress(pool, portions, foods);
  return listEquivalents(remainingGrams, findFood(foods, pool.referenceFood), options, step);
}
