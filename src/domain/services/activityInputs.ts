// Parsers for the raw form inputs of the activity editors (daily steps, step
// goal, target weight). Each returns a typed result so components only map it
// to UI state.
import { isFutureDate } from "./bodyMeasurements";
import { parseLocalISODate } from "./localDates";

export type ParseResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

const MAX_DAILY_STEPS = 100000;

export function parseDailyStepInput(
  dateISO: string,
  stepsRaw: string,
  now: Date = new Date()
): ParseResult<{ date: Date; steps: number }> {
  const date = parseLocalISODate(dateISO);
  if (isFutureDate(date, now)) {
    return { ok: false, reason: "Date cannot be in the future" };
  }

  const steps = parseInt(stepsRaw, 10);
  if (isNaN(steps) || steps < 0 || steps > MAX_DAILY_STEPS) {
    return { ok: false, reason: "Steps must be between 0 and 100,000" };
  }

  return { ok: true, date, steps };
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
