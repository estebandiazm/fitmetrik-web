'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppHeader } from '../layout/AppHeader';

interface CoachHeaderProps {
  coachName: string;
  coachEmail: string;
}

const NAV_ITEMS = [
  { label: 'Clientes', href: '/clients' },
  { label: 'Planes', href: '/creator' },
];

function CoachNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className="flex items-center gap-6 sm:gap-8">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
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

export function CoachHeader({ coachName, coachEmail }: CoachHeaderProps) {
  return <AppHeader userName={coachName} userSubtitle={coachEmail} center={<CoachNav />} />;
}
