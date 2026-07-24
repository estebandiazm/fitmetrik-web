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
    <aside className="w-56 bg-[#0f172a] border-r border-[#1e293b] flex flex-col py-4">
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2dd4bf]/10 text-[#2dd4bf]'
                      : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
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

      <div className="px-4 py-3 border-t border-[#1e293b]">
        <Link
          href="/clients/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#2dd4bf] text-white rounded-lg text-sm font-semibold hover:bg-[#0d9488] transition-colors"
        >
          <span>+</span>
          New Client
        </Link>
      </div>
    </aside>
  );
}
