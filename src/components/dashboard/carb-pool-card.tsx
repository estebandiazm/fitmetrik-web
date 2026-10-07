'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/Card';
import { MealLogSheet } from '@/components/dashboard/meal-log-sheet';
import {
  buildCarbPoolDay,
  expressInOptions,
  findPreviousLog,
  remainingForMeal,
  usedByMeal,
} from '@/domain/services/mealLogs';
import { toLocalISODate } from '@/domain/services/localDates';
import type { DietPlan } from '@/domain/types/DietPlan';
import type { MealLog } from '@/domain/types/MealLog';

interface CarbPoolCardProps {
  plan: DietPlan;
  logs: MealLog[];
  planIndex: number;
  /** False for the demo plan: nothing real to persist. */
  canLog: boolean;
}

const subscribeNoop = () => () => {};
const VISIBLE_EQUIVALENTS = 4;

/** Today in the VIEWER's timezone; empty during SSR so it never bakes in the server's day. */
function useTodayISO(): string {
  return useSyncExternalStore(subscribeNoop, () => toLocalISODate(), () => '');
}

function formatAmount(amount: number, unit: string): string {
  return `${amount.toLocaleString('es')} ${unit}`;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * "Bolsa de carbohidratos" for today: how much of the shared carb budget the
 * pool meals used, and — for the meal still to eat — what is left, already
 * converted into the plan's options. Each day starts empty.
 */
export function CarbPoolCard({ plan, logs, planIndex, canLog }: CarbPoolCardProps) {
  const todayISO = useTodayISO();
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [showAllFor, setShowAllFor] = useState<string | null>(null);

  const day = todayISO ? buildCarbPoolDay(plan, logs, todayISO) : null;

  if (!day) {
    return (
      <Card padding="default" className="min-h-48">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Bolsa de carbohidratos</p>
      </Card>
    );
  }

  const { pool, progress, reference } = day;
  // Pool totals are shown to the gram; only food portions get kitchen rounding.
  const usedLabel = Math.round(progress.usedGrams);
  const statusText =
    progress.status === 'over'
      ? `Te pasaste ${formatAmount(Math.round(progress.overGrams), 'g')}`
      : progress.status === 'within'
        ? 'Bolsa del día cumplida'
        : `Te quedan ${formatAmount(Math.round(progress.remainingGrams), 'g')}`;
  const editing = day.meals.find((meal) => meal.mealName === editingMeal);

  return (
    <Card padding="default" as="section" className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Bolsa de carbohidratos</h2>
        <span className="text-xs text-text-muted">{pool.mealNames.join(' y ')}</span>
      </header>

      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-mono text-[28px] font-bold leading-none text-text-primary">{usedLabel}</span>
          <span className="font-mono text-sm text-text-faint">/ {formatAmount(pool.totalGrams, 'g')}</span>
          <span className="text-sm text-text-muted">de {reference.name}</span>
        </p>
        <div
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-locked-bg"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={pool.totalGrams}
          aria-valuenow={usedLabel}
          aria-label="Bolsa usada hoy"
        >
          {day.meals.map((meal, index) => {
            const used = usedByMeal(day, meal.mealName);
            if (used <= 0) return null;
            return (
              <div
                key={meal.mealName}
                className={progress.status === 'over' ? 'bg-danger' : index === 0 ? 'bg-accent-teal' : 'bg-accent-teal/60'}
                style={{ width: `${Math.min(100, (used / pool.totalGrams) * 100)}%` }}
              />
            );
          })}
        </div>
        <p className={`text-xs font-medium ${progress.status === 'over' ? 'text-danger-text' : 'text-text-muted'}`}>
          {statusText}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {day.meals.map((meal) => {
          const available = remainingForMeal(day, meal.mealName);
          const othersLogged = day.meals.some((other) => other.mealName !== meal.mealName && other.log);
          const equivalents = othersLogged && !meal.log ? expressInOptions(day, available) : [];
          const showAll = showAllFor === meal.mealName;
          const unit = meal.log
            ? (day.options.find((option) => option.name === meal.log!.foodName)?.measureUnit ?? 'g')
            : 'g';

          return (
            <li key={meal.mealName} className="flex flex-col gap-2.5 rounded-[var(--radius-control)] border border-border bg-bg p-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    meal.log ? 'bg-accent-teal text-accent-teal-ink' : 'border-2 border-border-strong'
                  }`}
                >
                  {meal.log && <CheckIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{meal.mealName}</p>
                  <p className="truncate text-xs text-text-muted">
                    {meal.log
                      ? `${formatAmount(meal.log.grams, unit)} de ${meal.log.foodName}`
                      : othersLogged
                        ? `Te quedan ${formatAmount(Math.round(available), 'g')} · elige tu opción`
                        : 'Reparte la bolsa como quieras'}
                  </p>
                </div>
                {canLog && (
                  <button
                    type="button"
                    onClick={() => setEditingMeal(meal.mealName)}
                    className={`min-h-11 shrink-0 rounded-[10px] px-3.5 text-sm font-semibold ${
                      meal.log ? 'text-accent-teal-text hover:underline' : 'neu-btn-accent'
                    }`}
                  >
                    {meal.log ? 'Editar' : 'Registrar'}
                  </button>
                )}
              </div>

              {equivalents.length > 0 && available > 0 && (
                <div className="flex flex-col gap-2 pl-11">
                  <ul className="flex flex-wrap gap-1.5" aria-label={`Equivalencias para ${meal.mealName}`}>
                    {(showAll ? equivalents : equivalents.slice(0, VISIBLE_EQUIVALENTS)).map((item) => (
                      <li key={item.foodName} className="rounded-lg bg-panel px-2.5 py-1 text-xs text-text-muted">
                        <span className="font-mono font-semibold text-text-primary">
                          {formatAmount(item.amount, item.measureUnit)}
                        </span>{' '}
                        {item.foodName}
                      </li>
                    ))}
                  </ul>
                  {equivalents.length > VISIBLE_EQUIVALENTS && (
                    <button
                      type="button"
                      onClick={() => setShowAllFor(showAll ? null : meal.mealName)}
                      className="self-start text-xs font-semibold text-accent-teal-text hover:underline"
                    >
                      {showAll ? 'Ver menos' : `Ver las ${equivalents.length} opciones`}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {editing && (
        <MealLogSheet
          day={day}
          mealName={editing.mealName}
          dateISO={todayISO}
          planIndex={planIndex}
          existing={editing.log}
          previous={findPreviousLog(logs, editing.mealName, todayISO)}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </Card>
  );
}
