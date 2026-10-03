import React from 'react';
import { Card } from '../ui/Card';

const MACROS = [
  { label: 'Proteína', current: 180, goal: 200 },
  { label: 'Carbohidratos', current: 250, goal: 300 },
  { label: 'Grasas', current: 65, goal: 75 },
];

export function MacrosHUD() {
  return (
    <Card padding="default" className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">Macros</h2>
      <ul className="flex flex-col gap-3.5">
        {MACROS.map((macro) => (
          <li key={macro.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-text-muted">{macro.label}</span>
              <span className="font-mono font-semibold text-text-primary">
                {macro.current}g <span className="text-text-faint">/ {macro.goal}g</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-locked-bg">
              <div
                className="h-full rounded-full bg-text-muted"
                style={{ width: `${Math.min((macro.current / macro.goal) * 100, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
