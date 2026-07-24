'use client'

import FoodTable from "../food-table/FoodTable";
import React, { useContext, useEffect, useState } from "react";
import { ClientContext } from "../../context/ClientContext";
import { ClientContextType } from "../../context/ClientContextType";
import { useRouter } from "next/navigation";
import { DietPlan } from "../../domain/types/DietPlan";

interface ViewerProps {
  overridePlans?: DietPlan[];
  overrideClientName?: string;
}

const Viewer = ({ overridePlans, overrideClientName }: ViewerProps = {}) => {
  const router = useRouter();
  const { client } = useContext(ClientContext) as ClientContextType;
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  let [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    console.log(client)
  }, [client]);

  if (!isLoaded) {
    return <p className="m-4 text-white">Cargando cliente...</p>;
  }

  const clientName = overrideClientName ?? client.name;
  const plans: DietPlan[] = overridePlans ?? client.plans ?? [];

  if (!clientName && !overridePlans) {
    return <p className="m-4 text-white">Cargando cliente...</p>;
  }

  const saveHandler = () => {
    router.back();
  };

  return (
    <div className="m-4 bg-surface-dim min-h-screen p-6">
      {/* Client header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center text-white font-bold text-lg">
          {clientName ? clientName.charAt(0).toUpperCase() : "U"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Nombre: {clientName}</h2>
          {!overridePlans && client.targetWeight && (
            <p className="text-sm text-white/60">Peso objetivo: {client.targetWeight} kg</p>
          )}
        </div>
      </div>

      {plans.length === 0 && (
        <p className="mt-4 text-white/60">No hay planes guardados para este cliente.</p>
      )}

      {plans.map((plan: DietPlan, planIndex: number) => (
        <div key={planIndex} className="mb-8">
          {/* Plan header */}
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-bold text-white">
              {plan.label ?? `Plan ${planIndex + 1}`}
            </h3>
            {plan.days && (
              <span className="text-xs px-3 py-1 rounded-full border border-tertiary/40 text-tertiary font-semibold">
                {plan.days}
              </span>
            )}
          </div>
          <div className="border-t border-white/10 mb-4" />

          {/* Meals */}
          {plan.meals.map((meal: any, mealIndex: number) => {
            const isExpanded = expandedMeal === `${planIndex}-${mealIndex}`;
            return (
              <div key={mealIndex} className="mb-4 border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedMeal(isExpanded ? null : `${planIndex}-${mealIndex}`)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition text-white font-semibold"
                >
                  <span>{meal.mealName}</span>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white/2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meal.blocks.map((block: any, bIndex: number) => (
                        <div key={bIndex} className="space-y-3">
                          <span className="text-xs px-3 py-1 rounded-full border border-tertiary/40 text-tertiary font-semibold inline-block">
                            {block.blockType}
                          </span>
                          <FoodTable
                            list={block.options.map((opt: any) => ({
                              name: opt.foodName,
                              totalGrams: opt.grams,
                              category: block.blockType as any,
                              grams: opt.grams
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <button
        onClick={saveHandler}
        className="w-full mt-6 px-6 py-3 neu-btn-accent font-bold rounded-full transition"
      >
        Regresar
      </button>
    </div>
  );
};

export default Viewer
