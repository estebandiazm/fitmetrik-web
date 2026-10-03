'use client';

import React, { useId, useState } from 'react';
import { Card } from '../ui/Card';
import { ChevronDownIcon, CookieIcon, SearchIcon, UtensilsIcon } from '../ui/icons';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  amount: string;
}

export interface PlanSectionCardProps {
  title: string;
  description: string;
  totalWeight: string;
  foods: FoodItem[];
  defaultExpanded?: boolean;
  variant?: 'meal' | 'snack';
}

export function PlanSectionCard({
  title,
  description,
  totalWeight,
  foods,
  defaultExpanded = false,
  variant = 'meal',
}: PlanSectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState('');
  const panelId = useId();
  const Icon = variant === 'snack' ? CookieIcon : UtensilsIcon;

  const query = search.toLowerCase();
  const filteredFoods = foods.filter(
    (f) => f.name.toLowerCase().includes(query) || f.category.toLowerCase().includes(query),
  );

  return (
    <Card padding="default" className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-teal rounded-[var(--radius-control)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-bg text-text-muted">
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight text-text-primary">{title}</span>
          <span className="mt-0.5 block truncate text-[13px] text-text-muted">{description}</span>
        </span>
        <span className="font-mono text-xs font-semibold text-text-faint">{totalWeight}</span>
        <span className={`text-text-faint transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon size={18} />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!expanded}
        className="mt-4 flex flex-col gap-3 border-t border-row-border pt-4"
      >
        {foods.length > 4 && (
          <label className="relative block">
            <span className="sr-only">Filtrar ingredientes</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint">
              <SearchIcon size={14} />
            </span>
            <input
              className="w-full rounded-[var(--radius-control)] border border-border bg-bg py-2 pl-9 pr-3 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-accent-teal"
              placeholder="Filtrar ingredientes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
            />
          </label>
        )}
        <ul className="flex max-h-64 flex-col overflow-y-auto">
          {filteredFoods.map((food) => (
            <li
              key={food.id}
              className="flex items-center justify-between gap-3 border-b border-row-border py-2.5 last:border-b-0"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-text-primary">{food.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                  {food.category}
                </span>
              </span>
              <span className="shrink-0 text-right font-mono text-sm font-semibold text-text-primary">
                {food.amount}
              </span>
            </li>
          ))}
          {filteredFoods.length === 0 && (
            <li className="py-4 text-center text-xs text-text-muted">No se encontraron ingredientes</li>
          )}
        </ul>
      </div>
    </Card>
  );
}
