'use client'

import { useContext, useState } from "react";
import { ClientContext } from "../../context/ClientContext";
import { ClientContextType } from "../../context/ClientContextType";
import { DietPlan, Meal, MealBlock, FoodOption } from "../../domain/types/DietPlan";
import { Card } from "../ui/Card";
import { ChevronDownIcon } from "../ui/icons";

interface ViewerProps {
  overridePlans?: DietPlan[];
  overrideClientName?: string;
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal";

const Viewer = ({ overridePlans, overrideClientName }: ViewerProps = {}) => {
  const { client } = useContext(ClientContext) as ClientContextType;
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const clientName = overrideClientName ?? client.name;
  const plans: DietPlan[] = overridePlans ?? client.plans ?? [];

  if (!clientName && !overridePlans) {
    return <p className="m-4 text-text-muted">Cargando cliente...</p>;
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-6 text-text-primary">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-panel font-mono text-lg font-bold text-accent-teal-text"
          >
            {clientName ? clientName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{clientName}</h1>
            {!overridePlans && client.targetWeight && (
              <p className="text-sm text-text-muted">
                Peso objetivo: <span className="font-mono">{client.targetWeight}</span> kg
              </p>
            )}
          </div>
        </header>

        {plans.length === 0 && (
          <p className="text-text-muted">No hay planes guardados para este cliente.</p>
        )}

        {plans.map((plan: DietPlan, planIndex: number) => (
          <section key={planIndex} aria-labelledby={`plan-${planIndex}-title`} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-2">
              <h2 id={`plan-${planIndex}-title`} className="text-lg font-bold text-text-primary">
                {plan.label ?? `Plan ${planIndex + 1}`}
              </h2>
              {plan.days && (
                <span className="rounded-full border border-border px-3 py-0.5 text-xs font-semibold text-accent-teal-text">
                  {plan.days}
                </span>
              )}
            </div>

            {plan.meals.map((meal: Meal, mealIndex: number) => {
              const key = `${planIndex}-${mealIndex}`;
              const isExpanded = expandedMeal === key;
              const panelId = `meal-panel-${key}`;
              const buttonId = `meal-button-${key}`;
              return (
                <Card key={mealIndex} className="overflow-hidden">
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() => setExpandedMeal(isExpanded ? null : key)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-text-primary transition hover:bg-row-border ${FOCUS}`}
                    >
                      <span>{meal.mealName}</span>
                      <ChevronDownIcon
                        className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </h3>

                  {isExpanded && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="border-t border-border p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {meal.blocks.map((block: MealBlock, bIndex: number) => (
                          <div key={bIndex} className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-accent-teal-text">
                              {block.blockType}
                            </span>
                            <ul className="divide-y divide-row-border">
                              {block.options.map((opt: FoodOption, oIndex: number) => (
                                <li key={oIndex} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                                  <span className="text-text-primary">{opt.foodName}</span>
                                  <span className="font-mono text-xs font-medium text-text-muted">
                                    {opt.grams} g
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </section>
        ))}
      </div>
    </main>
  );
};

export default Viewer
