'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { deleteMealLog, saveMealLog } from '@/app/actions/mealLogActions';
import {
  expressInOptions,
  previewWithLog,
  roundAmount,
  suggestAmounts,
  type CarbPoolDay,
} from '@/domain/services/mealLogs';
import type { MealLog } from '@/domain/types/MealLog';

interface MealLogSheetProps {
  day: CarbPoolDay;
  mealName: string;
  dateISO: string;
  planIndex: number;
  existing?: MealLog;
  previous?: MealLog;
  onClose: () => void;
}

function formatAmount(amount: number, unit: string): string {
  return `${amount.toLocaleString('es')} ${unit}`;
}

/**
 * "¿Cuánto comiste?" — logs one pool meal: pick the carb option eaten and
 * its amount, with a live preview of what that leaves for the other meal(s).
 * Opened open; the parent unmounts it to close.
 */
export function MealLogSheet({ day, mealName, dateISO, planIndex, existing, previous, onClose }: MealLogSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [foodName, setFoodName] = useState(existing?.foodName ?? previous?.foodName ?? day.reference.name);
  // The last meal to log defaults to everything left; earlier ones to half.
  const othersLogged = day.meals.some((meal) => meal.mealName !== mealName && meal.log);
  const defaultAmount = (name: string) => {
    const options = suggestAmounts(day, mealName, name);
    const preferred = options.find((option) => option.kind === (othersLogged ? 'rest' : 'half')) ?? options[0];
    return preferred ? String(preferred.amount) : '';
  };
  const [amountText, setAmountText] = useState(() => (existing ? String(existing.grams) : defaultAmount(foodName)));

  const food = day.options.find((option) => option.name === foodName) ?? day.reference;
  const amount = Number(amountText.replace(',', '.'));
  const isValidAmount = Number.isFinite(amount) && amount > 0;
  const step = food.measureUnit === 'g' ? 5 : 0.5;
  const suggestions = suggestAmounts(day, mealName, food.name);
  const pendingMeals = day.meals.filter((meal) => meal.mealName !== mealName && !meal.log).map((meal) => meal.mealName);
  const preview = isValidAmount ? previewWithLog(day, mealName, food.name, amount) : null;
  const leftovers = preview
    ? expressInOptions(day, preview.remainingGrams).filter((item) => item.amount > 0).slice(0, 3)
    : [];

  function changeFood(nextName: string) {
    setFoodName(nextName);
    const nextAmount = defaultAmount(nextName);
    if (nextAmount) setAmountText(nextAmount);
  }

  function nudge(delta: number) {
    const base = isValidAmount ? amount : 0;
    setAmountText(String(Math.max(0, roundAmount(base + delta, food.measureUnit))));
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? 'No se pudo guardar');
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const save = () =>
    run(() => saveMealLog({ date: dateISO, mealName, foodName: food.name, grams: amount, planIndex }));
  const remove = () => run(() => deleteMealLog(dateISO, mealName));

  return (
    <Modal
      open
      onClose={onClose}
      title={`${mealName} · ¿Cuánto comiste?`}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-3">
          {existing ? (
            <Button variant="ghost" size="sm" onClick={remove} disabled={isPending} className="text-danger-text">
              Quitar registro
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
          )}
          <Button variant="accent" size="md" onClick={save} disabled={isPending || !isValidAmount}>
            {isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {previous && !existing && day.options.some((option) => option.name === previous.foodName) && (
          <button
            type="button"
            onClick={() => {
              setFoodName(previous.foodName);
              setAmountText(String(previous.grams));
            }}
            className="self-start rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary"
          >
            Repetir último: {formatAmount(previous.grams, day.options.find((o) => o.name === previous.foodName)?.measureUnit ?? 'g')}{' '}
            de {previous.foodName}
          </button>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="meal-log-food" className="text-sm text-text-muted">
            Carbohidrato
          </label>
          <Select id="meal-log-food" value={food.name} onChange={(event) => changeFood(event.target.value)}>
            {day.options.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="meal-log-amount" className="text-sm text-text-muted">
            Cantidad ({food.measureUnit === 'g' ? 'gramos' : 'unidades'})
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="surface"
              size="md"
              onClick={() => nudge(-step)}
              aria-label={`Quitar ${formatAmount(step, food.measureUnit)}`}
              className="h-11 w-11 !px-0"
            >
              −
            </Button>
            <Input
              id="meal-log-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step={step}
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              className="flex-1 text-center font-mono text-lg font-semibold"
            />
            <Button
              type="button"
              variant="surface"
              size="md"
              onClick={() => nudge(step)}
              aria-label={`Agregar ${formatAmount(step, food.measureUnit)}`}
              className="h-11 w-11 !px-0"
            >
              +
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Cantidades sugeridas">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.kind}
                  type="button"
                  onClick={() => setAmountText(String(suggestion.amount))}
                  aria-pressed={amount === suggestion.amount}
                  className={`min-h-11 rounded-[10px] border px-3 font-mono text-sm font-semibold ${
                    amount === suggestion.amount
                      ? 'border-accent-teal bg-accent-teal/10 text-text-primary'
                      : 'border-border bg-bg text-text-muted'
                  }`}
                >
                  {formatAmount(suggestion.amount, food.measureUnit)}
                  <span className="ml-1.5 font-sans text-[11px] font-medium text-text-faint">
                    {suggestion.kind === 'rest' ? 'todo lo que queda' : 'mitad'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {preview && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-border bg-bg p-3.5">
            {preview.status === 'over' ? (
              <p className="text-sm text-danger-text">
                Te pasas {formatAmount(roundAmount(preview.overGrams, 'g'), 'g')} de {day.reference.name}. Puedes
                guardarlo igual.
              </p>
            ) : pendingMeals.length === 0 ? (
              <p className="text-sm font-semibold text-text-primary">
                {preview.status === 'within'
                  ? 'Con esto completas tu bolsa del día'
                  : `Quedarían ${formatAmount(Math.round(preview.remainingGrams), 'g')} de ${day.reference.name} sin usar`}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-primary">Te quedan para {pendingMeals.join(' y ')}:</p>
                <ul className="flex flex-wrap gap-2">
                  {leftovers.map((item) => (
                    <li key={item.foodName} className="rounded-lg bg-panel px-2.5 py-1 text-xs text-text-muted">
                      <span className="font-mono font-semibold text-text-primary">
                        {formatAmount(item.amount, item.measureUnit)}
                      </span>{' '}
                      {item.foodName}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger-text">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
