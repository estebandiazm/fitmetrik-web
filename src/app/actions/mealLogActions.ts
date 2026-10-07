'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '../../lib/db/mongodb';
import { ClientModel } from '../../lib/models/Client';
import { createClient as createSupabaseClient } from '@/infrastructure/adapters/supabase/server';
import { MealLogSchema, type MealLog } from '../../domain/types/MealLog';
import { findFood } from '../../domain/services/foodEquivalence';
import { toLocalISODate } from '../../domain/services/localDates';
import { resolveActivePlanIndex } from '../../domain/services/planView';
import {
  getCarbPoolOptions,
  isWithinLogWindow,
  removeMealLog,
  upsertMealLog,
} from '../../domain/services/mealLogs';

export type MealLogResult = { ok: true } | { ok: false; error: string };

// The signed-in client's own document — never a client id sent by the browser.
async function findSignedInClient() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  await dbConnect();
  return ClientModel.findOne({ authId: user.id });
}

function currentLogs(doc: { toObject(): { mealLogs?: MealLog[] } }): MealLog[] {
  return (doc.toObject().mealLogs ?? []).map(({ date, mealName, foodName, grams }) => ({
    date,
    mealName,
    foodName,
    grams,
  }));
}

// Records (or replaces) what the client ate from the carb pool in one meal.
export async function saveMealLog(input: MealLog & { planIndex: number }): Promise<MealLogResult> {
  const { planIndex, ...rest } = input;
  const parsed = MealLogSchema.safeParse(rest);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  const entry = parsed.data;

  if (!isWithinLogWindow(entry.date, toLocalISODate())) {
    return { ok: false, error: 'Solo puedes registrar hoy o ayer' };
  }

  const doc = await findSignedInClient();
  if (!doc) return { ok: false, error: 'Sesión no válida' };

  const plan = doc.plans[resolveActivePlanIndex(doc.plans.length, String(planIndex))];
  const options = plan ? getCarbPoolOptions(plan) : [];
  if (!plan?.carbPool?.mealNames.includes(entry.mealName) || options.length === 0) {
    return { ok: false, error: 'Esta comida no comparte la bolsa de carbohidratos' };
  }
  try {
    entry.foodName = findFood(options, entry.foodName).name;
  } catch {
    return { ok: false, error: 'Ese alimento no está en tu plan' };
  }

  doc.mealLogs = upsertMealLog(currentLogs(doc), entry);
  await doc.save();
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteMealLog(date: string, mealName: string): Promise<MealLogResult> {
  const doc = await findSignedInClient();
  if (!doc) return { ok: false, error: 'Sesión no válida' };

  doc.mealLogs = removeMealLog(currentLogs(doc), date, mealName);
  await doc.save();
  revalidatePath('/dashboard');
  return { ok: true };
}
