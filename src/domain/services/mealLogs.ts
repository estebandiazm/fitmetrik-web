// Daily logging against a plan's carbohydrate pool: which options the pool
// offers, what was logged on a given day, and the amounts to suggest.
import type { CarbPool } from "../types/CarbPool";
import type { DietPlan } from "../types/DietPlan";
import type { MealLog } from "../types/MealLog";
import { calculatePoolProgress, type CarbPoolProgress } from "./carbPool";
import { convertEquivalent, findFood, roundToStep, type FoodPortion } from "./foodEquivalence";

export interface PoolOption extends FoodPortion {
  measureUnit: string;
}

export interface PoolMealView {
  mealName: string;
  log?: MealLog;
}

export interface CarbPoolDay {
  pool: CarbPool;
  options: PoolOption[];
  reference: PoolOption;
  meals: PoolMealView[];
  progress: CarbPoolProgress;
}

export interface SuggestedAmount {
  amount: number;
  kind: "half" | "rest";
}

export interface PoolAmount {
  foodName: string;
  amount: number;
  measureUnit: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isoToUTC(dateISO: string): number {
  const [year, month, day] = dateISO.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

// "YYYY-MM-DD" moved by `days` calendar days (DST-proof: pure UTC math).
export function shiftISODate(dateISO: string, days: number): string {
  return new Date(isoToUTC(dateISO) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Whole calendar days from `fromISO` to `toISO` (negative when earlier).
function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((isoToUTC(toISO) - isoToUTC(fromISO)) / MS_PER_DAY);
}

// Server-side guard: the server only knows its own day, the client's local day
// can be one off either way, and the client may still fix yesterday. So a log
// is accepted from `referenceISO - 2` to `referenceISO + 1`.
export function isWithinLogWindow(dateISO: string, referenceISO: string): boolean {
  const offset = daysBetween(referenceISO, dateISO);
  return offset >= -2 && offset <= 1;
}

// Kitchen-friendly rounding: 5 g for weighed foods, half units otherwise.
export function roundAmount(amount: number, measureUnit: string): number {
  return measureUnit === "g" ? roundToStep(amount, 5) : roundToStep(amount, 0.5);
}

// The pool's swappable options: the ACOMPAÑAMIENTO block of the first pool
// meal that has one (e.g. Comida 2's carbs). Empty when the plan has no pool
// or the reference food is not among them.
export function getCarbPoolOptions(plan: DietPlan): PoolOption[] {
  const pool = plan.carbPool;
  if (!pool) return [];
  const block = plan.meals
    .filter((meal) => pool.mealNames.includes(meal.mealName))
    .flatMap((meal) => meal.blocks)
    .find((candidate) => candidate.blockType === "ACOMPAÑAMIENTO");
  const options = (block?.options ?? []).map((option) => ({
    name: option.foodName,
    grams: option.grams,
    measureUnit: option.measureUnit,
  }));
  try {
    findFood(options, pool.referenceFood);
  } catch {
    return [];
  }
  return options;
}

export function logsForDate(logs: MealLog[], dateISO: string): MealLog[] {
  return logs.filter((log) => log.date === dateISO);
}

// Replaces the entry for the same (date, mealName), else appends. New array.
export function upsertMealLog(logs: MealLog[], entry: MealLog): MealLog[] {
  const rest = logs.filter((log) => !(log.date === entry.date && log.mealName === entry.mealName));
  return [...rest, entry];
}

export function removeMealLog(logs: MealLog[], dateISO: string, mealName: string): MealLog[] {
  return logs.filter((log) => !(log.date === dateISO && log.mealName === mealName));
}

// Most recent log of `mealName` strictly before `dateISO` ("Repetir ayer").
export function findPreviousLog(logs: MealLog[], mealName: string, dateISO: string): MealLog | undefined {
  return logs
    .filter((log) => log.mealName === mealName && log.date < dateISO)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// Everything the "bolsa" card needs for one day; null when the plan has no
// usable pool. Logs of foods missing from the options are ignored (e.g. the
// coach edited the plan) rather than breaking the card.
export function buildCarbPoolDay(plan: DietPlan, logs: MealLog[], dateISO: string): CarbPoolDay | null {
  const pool = plan.carbPool;
  const options = getCarbPoolOptions(plan);
  if (!pool || options.length === 0) return null;

  const knownNames = new Set(options.map((option) => option.name.trim().toLocaleLowerCase("es")));
  const dayLogs = logsForDate(logs, dateISO).filter(
    (log) =>
      pool.mealNames.includes(log.mealName) && knownNames.has(log.foodName.trim().toLocaleLowerCase("es")),
  );

  return {
    pool,
    options,
    reference: findFood(options, pool.referenceFood),
    meals: pool.mealNames.map((mealName) => ({
      mealName,
      log: dayLogs.find((log) => log.mealName === mealName),
    })),
    progress: calculatePoolProgress(pool, dayLogs, options),
  };
}

// `referenceGrams` of the reference food expressed in each option, rounded.
export function expressInOptions(day: CarbPoolDay, referenceGrams: number): PoolAmount[] {
  return day.options.map((option) => ({
    foodName: option.name,
    amount: roundAmount(convertEquivalent(referenceGrams, day.reference, option), option.measureUnit),
    measureUnit: option.measureUnit,
  }));
}

function logsExcept(day: CarbPoolDay, mealName: string): MealLog[] {
  return day.meals.filter((meal) => meal.mealName !== mealName && meal.log).map((meal) => meal.log!);
}

// Pool left for `mealName` if its own log were cleared (what it may eat now).
export function remainingForMeal(day: CarbPoolDay, mealName: string): number {
  return calculatePoolProgress(day.pool, logsExcept(day, mealName), day.options).remainingGrams;
}

// Reference grams `mealName` used today (0 when not logged).
export function usedByMeal(day: CarbPoolDay, mealName: string): number {
  const log = day.meals.find((meal) => meal.mealName === mealName)?.log;
  return log ? calculatePoolProgress(day.pool, [log], day.options).usedGrams : 0;
}

// Quick-pick amounts in `foodName`'s unit for `mealName`: everything still
// available ("rest") and half of the pool ("half", the plan's "mitad y
// mitad") when that fits. Ascending, without zeros; "rest" wins a tie.
export function suggestAmounts(day: CarbPoolDay, mealName: string, foodName: string): SuggestedAmount[] {
  const food = findFood(day.options, foodName) as PoolOption;
  const toFood = (referenceGrams: number) =>
    roundAmount(convertEquivalent(referenceGrams, day.reference, food), food.measureUnit);
  const rest = toFood(remainingForMeal(day, mealName));
  const half = toFood(day.pool.totalGrams / 2);
  const suggestions: SuggestedAmount[] = [];
  if (half > 0 && half < rest) suggestions.push({ amount: half, kind: "half" });
  if (rest > 0) suggestions.push({ amount: rest, kind: "rest" });
  return suggestions;
}

// Pool progress if `mealName` logged `amount` of `foodName` (live preview).
export function previewWithLog(day: CarbPoolDay, mealName: string, foodName: string, amount: number): CarbPoolProgress {
  return calculatePoolProgress(day.pool, [...logsExcept(day, mealName), { mealName, foodName, grams: amount }], day.options);
}
