'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'Diet Plans', href: '/creator', icon: '🥗' },
  { label: 'Analytics', href: '/analytics', icon: '📊' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export function CoachSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-surface-container border-r border-[var(--surface-border)] flex flex-col py-4">
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-muted hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-3 border-t border-[var(--surface-border)]">
        <Link
          href="/clients/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary text-on-primary rounded-[var(--radius-control)] text-sm font-semibold hover:opacity-90 transition-colors"
        >
          <span>+</span>
          New Client
        </Link>
      </div>
    </aside>
  );
}
