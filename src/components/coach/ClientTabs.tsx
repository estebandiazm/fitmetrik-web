import Link from 'next/link';

export type ClientTabId = 'plan' | 'progreso' | 'medidas';

export const CLIENT_TABS: { id: ClientTabId; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'progreso', label: 'Progreso' },
  { id: 'medidas', label: 'Medidas' },
];

export function parseClientTab(raw: string | string[] | undefined): ClientTabId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return CLIENT_TABS.some((tab) => tab.id === value) ? (value as ClientTabId) : 'plan';
}

interface ClientTabsProps {
  active: ClientTabId;
}

/** URL-driven tabs (`?tab=`) so each section is linkable and stays a Server Component. */
export function ClientTabs({ active }: ClientTabsProps) {
  return (
    <nav aria-label="Secciones del cliente" className="flex gap-6 border-b border-border">
      {CLIENT_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`?tab=${tab.id}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-teal ${
              isActive
                ? 'border-accent-teal text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
