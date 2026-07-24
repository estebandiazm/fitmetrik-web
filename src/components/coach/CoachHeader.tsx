'use client';

interface CoachHeaderProps {
  coachName: string;
  coachEmail: string;
}

export function CoachHeader({ coachName, coachEmail }: CoachHeaderProps) {
  return (
    <header className="bg-[#0f172a] border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-white tracking-tight">
          Fit<span className="text-[#2dd4bf]">Metrik</span>
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8">
        <input
          type="search"
          placeholder="Search clients..."
          className="w-full bg-[#1e293b] text-[#e2e8f0] placeholder-[#475569] px-4 py-2 rounded-lg border border-[#334155] focus:outline-none focus:border-[#2dd4bf] text-sm"
        />
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{coachName}</p>
          <p className="text-xs text-[#64748b]">{coachEmail}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#2dd4bf] flex items-center justify-center text-white font-semibold text-sm">
          {coachName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
