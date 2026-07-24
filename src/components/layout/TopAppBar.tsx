'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/authActions';

interface TopAppBarProps {
  clientName?: string;
  avatarUrl?: string;
}

export function TopAppBar({
  clientName = "Alex Rivera",
  avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDLGK2Uxkg82D9Ie59FqCxm06CNQMKfIbj8V5u0xrHZRMVvKHFt8tofixLFidkzdJV5ZvQLxvg57V7jPgFNyuBl2i7huvdIep-atgjZAJB_gGj4OgyoKywK6BPqKkMP7ndHIoqX9JNwzGQZlZyv6puIpBWIwgrWhepLcBbt2gu2heZHQ2jjR2Od5Hmf71U27o6AdpC6NbtrciSCKRB2mqZKcmm-_EKq1qBiGDvc_r5EroIzdUey7UU5i8HQDKkHWKKTUpYvWy55o3c"
}: TopAppBarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full neu-surface border-b border-white/10 px-6 py-4 lg:px-20">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-dim font-manrope italic">
            FitMetrik
          </h2>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <a
            href="/dashboard"
            className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
              pathname === '/dashboard'
                ? 'text-accent-pink border-accent-pink'
                : 'text-white/90 border-transparent hover:text-accent-pink'
            }`}
          >
            Dashboard
          </a>
          <a
            href="/activity"
            className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
              pathname === '/activity'
                ? 'text-accent-pink border-accent-pink'
                : 'text-white/90 border-transparent hover:text-accent-pink'
            }`}
          >
            Activity
          </a>
          <a
            href="#"
            className="text-sm font-semibold text-white/90 hover:text-accent-pink transition-colors pb-1 border-b-2 border-transparent"
          >
            My Plans
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{clientName}</p>
              <button 
                onClick={() => logout()}
                className="text-xs text-error hover:text-red-400 transition-colors flex items-center gap-1 justify-end font-semibold cursor-pointer w-full text-right"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Log out
              </button>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-accent-pink p-0.5 overflow-hidden bg-white/5">
              <img 
                className="w-full h-full rounded-full object-cover" 
                alt="Client profile picture" 
                src={avatarUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
