'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GridIcon, TrendIcon } from '../ui/icons';

const NAV_ITEMS = [
  { label: 'Hoy', href: '/dashboard', Icon: GridIcon },
  { label: 'Actividad', href: '/activity', Icon: TrendIcon },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 z-40 flex h-20 w-full items-start justify-around border-t border-border bg-panel/95 px-8 pt-3 backdrop-blur-sm lg:hidden"
    >
      {NAV_ITEMS.map(({ label, href, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-w-16 flex-col items-center gap-1 transition-colors active:scale-95 ${
              isActive ? 'text-text-primary' : 'text-text-faint hover:text-text-muted'
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px] font-semibold tracking-[0.04em]">{label}</span>
            <span
              aria-hidden="true"
              className={`h-1 w-1 rounded-full ${isActive ? 'bg-accent-teal' : 'bg-transparent'}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
