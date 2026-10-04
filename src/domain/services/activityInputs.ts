// Parsers for the raw form inputs of the activity editors (daily steps, daily
// weight, step goal, target weight). Each returns a typed result so components only map it
// to UI state.
import { isFutureDate } from "./bodyMeasurements";
import { parseLocalISODate } from "./localDates";

export type ParseResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

const MAX_DAILY_STEPS = 100000;
const MIN_DAILY_WEIGHT_KG = 0.1;
const MAX_DAILY_WEIGHT_KG = 500;

// Reason a daily-entry date is rejected, or null when it is a valid past or
// present day.
function validateEntryDate(date: Date, now: Date): string | null {
  if (isNaN(date.getTime())) return "Invalid date";
  if (isFutureDate(date, now)) return "Date cannot be in the future";
  return null;
}

export function parseDailyStepInput(
  dateISO: string,
  stepsRaw: string,
  now: Date = new Date()
): ParseResult<{ date: Date; steps: number }> {
  const date = parseLocalISODate(dateISO);
  const dateError = validateEntryDate(date, now);
  if (dateError) return { ok: false, reason: dateError };

  const steps = parseInt(stepsRaw, 10);
  if (isNaN(steps) || steps < 0 || steps > MAX_DAILY_STEPS) {
    return { ok: false, reason: "Steps must be between 0 and 100,000" };
  }

  return { ok: true, date, steps };
}

export function parseDailyWeightInput(
  dateISO: string,
  weightRaw: string,
  now: Date = new Date()
): ParseResult<{ date: Date; weight: number }> {
  const date = parseLocalISODate(dateISO);
  const dateError = validateEntryDate(date, now);
  if (dateError) return { ok: false, reason: dateError };

  const weight = parseFloat(weightRaw);
  if (isNaN(weight) || weight < MIN_DAILY_WEIGHT_KG || weight > MAX_DAILY_WEIGHT_KG) {
    return { ok: false, reason: "Weight must be between 0.1 and 500 kg" };
  }

  return { ok: true, date, weight };
}

export function parseStepGoal(raw: string): ParseResult<{ value: number }> {
  const value = parseInt(raw, 10);
  if (isNaN(value) || value <= 0) {
    return { ok: false, reason: "Goal must be a positive number" };
  }
  return { ok: true, value };
}

export function parseTargetWeight(raw: string): ParseResult<{ value: number }> {
  const value = parseFloat(raw);
  if (isNaN(value) || value <= 0) {
    return { ok: false, reason: "Target weight must be a positive number" };
  }
  return { ok: true, value };
}
