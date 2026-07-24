import React from 'react';
import { GlassCard } from '../ui/GlassCard';

export function MacrosHUD() {
  return (
    <GlassCard className="rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 blur-3xl"></div>
      <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Macro Distribution</h3>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1.5 tracking-wider uppercase text-on-surface-variant">
            <span>Protein</span><span className="text-white">180g / 200g</span>
          </div>
          <div className="w-full neu-inset h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: '90%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1.5 tracking-wider uppercase text-on-surface-variant">
            <span>Carbs</span><span className="text-white">250g / 300g</span>
          </div>
          <div className="w-full neu-inset h-2 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full" style={{ width: '83%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1.5 tracking-wider uppercase text-on-surface-variant">
            <span>Fats</span><span className="text-white">65g / 75g</span>
          </div>
          <div className="w-full neu-inset h-2 rounded-full overflow-hidden">
            <div className="bg-white/40 h-full" style={{ width: '86%' }}></div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
