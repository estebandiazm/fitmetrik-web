'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppHeader } from './AppHeader';

interface TopAppBarProps {
  clientName?: string;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Activity', href: '/activity' },
  { label: 'My Plans', href: '#' },
];

function ClientPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {navItems.map((item) => {
        const isActive = item.href !== '#' && pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`border-b-2 pb-1 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-muted hover:text-on-surface'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TopAppBar({ clientName = 'Client User' }: TopAppBarProps) {
  return <AppHeader userName={clientName} center={<ClientPortalNav />} />;
}
