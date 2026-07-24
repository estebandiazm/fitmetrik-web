import React from 'react';

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-24 px-8 pb-6 neu-surface rounded-t-[2rem] border-t border-white/5 lg:hidden">
      <a className="flex flex-col items-center justify-center text-primary scale-110 active:scale-90 duration-200 ease-out" href="/dashboard">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
        <span className="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Dashboard</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 opacity-70 hover:text-primary transition-colors active:scale-90 duration-200 ease-out" href="/activity">
        <span className="material-symbols-outlined">trending_up</span>
        <span className="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Activity</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 opacity-70 hover:text-primary transition-colors active:scale-90 duration-200 ease-out" href="#">
        <span className="material-symbols-outlined">person</span>
        <span className="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Profile</span>
      </a>
    </nav>
  );
}
