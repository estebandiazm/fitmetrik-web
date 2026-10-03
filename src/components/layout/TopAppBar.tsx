'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppHeader } from './AppHeader';

interface TopAppBarProps {
  clientName?: string;
}

const navItems = [
  { label: 'Hoy', href: '/dashboard' },
  { label: 'Actividad', href: '/activity' },
];

function ClientPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`border-b-2 pb-1 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-accent-teal text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopAppBar({ clientName = 'Cliente' }: TopAppBarProps) {
  return <AppHeader userName={clientName} center={<ClientPortalNav />} />;
}
