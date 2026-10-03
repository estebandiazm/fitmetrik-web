'use client';

import React from 'react';
import Link from 'next/link';

export interface PlanSwitcherProps {
  plans: {
    label?: string;
    days?: string;
  }[];
  activeIndex: number;
}

export function PlanSwitcher({ plans, activeIndex }: PlanSwitcherProps) {
  if (!plans || plans.length <= 1) {
    return null; // Don't show switcher if there's only 0 or 1 plan
  }

  return (
    <nav aria-label="Planes" className="flex w-full gap-1 rounded-xl border border-border bg-panel p-1 lg:w-auto">
      {plans.map((plan, index) => {
        const isActive = index === activeIndex;
        const label = plan.label || `Plan ${index + 1}`;
        const days = plan.days ? `(${plan.days})` : '';

        return (
          <Link
            key={index}
            href={`?planIndex=${index}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-center text-xs font-semibold transition-colors lg:px-5 ${
              isActive
                ? 'bg-accent-teal text-accent-teal-ink'
                : 'text-text-muted hover:bg-locked-bg hover:text-text-primary'
            }`}
          >
            {label} {days}
          </Link>
        );
      })}
    </nav>
  );
}
