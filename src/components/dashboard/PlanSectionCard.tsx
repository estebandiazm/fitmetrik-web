'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  colorClass: string;
}

export interface PlanSectionCardProps {
  title: string;
  description: string;
  totalWeight: string;
  totalProtein: string;
  foods: FoodItem[];
  defaultExpanded?: boolean;
  icon?: string;
}

export function PlanSectionCard({ title, description, totalWeight, totalProtein, foods, defaultExpanded = false, icon = 'restaurant_menu' }: PlanSectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState('');

  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="p-5 flex flex-col gap-4 group border-primary/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
      
      {/* Header */}
      <div 
        className="flex items-center gap-4 cursor-pointer z-10" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-16 h-16 rounded-xl shrink-0 border border-white/10 bg-gradient-to-br from-surface-variant to-surface flex items-center justify-center shadow-inner relative overflow-hidden ring-1 ring-primary/20">
          <div className="absolute inset-0 bg-primary/20 blur-xl"></div>
          <span className="material-symbols-outlined text-primary z-10 drop-shadow-lg text-3xl font-light">
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-headline font-bold text-lg leading-tight text-primary text-white">{title}</h4>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm truncate font-light italic">{description}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-[10px] font-bold text-primary/80">{totalWeight} Total</span>
            <span className="text-[10px] font-bold text-tertiary/80">{totalProtein} Protein</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'opacity-100 mt-2' : 'max-h-0 opacity-0'}`} 
        style={{ maxHeight: expanded ? '1000px' : '0px' }}
      >
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm flex">search</span>
            <input 
              className="w-full bg-surface-container/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none placeholder:text-on-surface-variant/50 text-white" 
              placeholder="Filtrar ingredientes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
            />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredFoods.map(food => (
              <div key={food.id} className={`flex items-center justify-between p-3 rounded-xl bg-white/5 border-l-4 ${food.colorClass} hover:bg-white/10 transition-colors`}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-wide text-white">{food.name}</span>
                  <span className="text-[10px] text-on-surface-variant">{food.category}</span>
                </div>
                <span className="text-sm font-black font-headline text-white">{food.amount}</span>
              </div>
            ))}
            {filteredFoods.length === 0 && (
              <p className="text-center text-xs text-on-surface-variant py-4">No se encontraron ingredientes</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
