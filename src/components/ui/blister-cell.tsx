'use client';

import React, { useEffect, useRef, useState } from 'react';

export type BlisterCellState = 'pending' | 'popped' | 'missed' | 'locked';
export type BlisterCellSize = 'sm' | 'md' | 'lg';

interface BlisterCellProps {
  state: BlisterCellState;
  /** @default 'md' */
  size?: BlisterCellSize;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  /**
   * Shown inside the cell only while it is `pending` — e.g. the `lg` hero's
   * "Toca para loguear" prompt. Ignored for every other state, whose icon
   * is the whole message.
   */
  pendingContent?: React.ReactNode;
}

const SIZE_DIMENSION_PX: Record<BlisterCellSize, number> = {
  sm: 22,
  md: 36,
  lg: 168,
};

// `lg` is circular (focal "dome" the thumb taps); `sm`/`md` are rounded
// squares (read as a row of pills in a strip/grid) — deliberate per the
// approved direction contract, not a scaling oversight.
const SIZE_RADIUS: Record<BlisterCellSize, string> = {
  sm: '6px',
  md: '10px',
  lg: '50%',
};

const SIZE_ICON_PX: Record<BlisterCellSize, number> = {
  sm: 10,
  md: 16,
  lg: 56,
};

const SIZE_BORDER_PX: Record<BlisterCellSize, number> = {
  sm: 1,
  md: 1.5,
  lg: 3,
};

// Icon stroke-width scaled inversely to icon size so strokes stay visually
// crisp at `sm` (tiny roster-mini icons) without looking chunky at `lg`.
const SIZE_STROKE_WIDTH: Record<BlisterCellSize, number> = {
  sm: 3,
  md: 2.5,
  lg: 2,
};

// `missed` reuses `pending`'s box treatment (same border/bg) — only the icon
// differs — so it reads as "explicitly skipped", never ambiguous-empty.
const STATE_BASE_CLASS: Record<BlisterCellState, string> = {
  pending: 'blister-cell-pending',
  popped: 'blister-cell-popped',
  missed: 'blister-cell-pending',
  locked: 'blister-cell-locked',
};

interface IconProps {
  size: number;
  strokeWidth: number;
}

function CheckIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MissedIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-text-faint)"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function LockedIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-text-faint)"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function renderIcon(state: BlisterCellState, size: number, strokeWidth: number) {
  switch (state) {
    case 'popped':
      return <CheckIcon size={size} strokeWidth={strokeWidth} />;
    case 'missed':
      return <MissedIcon size={size} strokeWidth={strokeWidth} />;
    case 'locked':
      return <LockedIcon size={size} strokeWidth={strokeWidth} />;
    case 'pending':
      return null;
  }
}

// `.blister-cell-popped` has no border declared — only the bordered states
// (pending/missed/locked) get a size-scaled border-width override.
function buildCellStyle(state: BlisterCellState, size: BlisterCellSize): React.CSSProperties {
  const style: React.CSSProperties = {
    width: SIZE_DIMENSION_PX[size],
    height: SIZE_DIMENSION_PX[size],
    borderRadius: SIZE_RADIUS[size],
    transition:
      'background var(--transition-standard), border-color var(--transition-standard), box-shadow var(--transition-standard)',
  };

  if (state !== 'popped') {
    style.borderWidth = SIZE_BORDER_PX[size];
  }

  return style;
}

function buildCellClassName(
  state: BlisterCellState,
  interactive: boolean,
  isPopping: boolean,
  className: string,
): string {
  return [
    STATE_BASE_CLASS[state],
    'inline-flex shrink-0 items-center justify-center align-middle',
    interactive ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal' : '',
    isPopping ? 'blister-cell-popping' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

// The direction contract's named "signature interaction": tap → pop. Fires
// only on a genuine pending/missed→popped transition (never on mount, so a
// page that loads already-popped cells — e.g. the roster's mini strips —
// stays still). A plain color/shadow fade alone was judged by finish review
// as not satisfying "la interacción de firma"; this adds the authored
// punch-through motion the contract names.
const POP_ANIMATION_MS = 480;

function usePopAnimation(state: BlisterCellState): boolean {
  const prevStateRef = useRef(state);
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev !== 'popped' && state === 'popped') {
      setIsPopping(true);
      const timeout = setTimeout(() => setIsPopping(false), POP_ANIMATION_MS);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  return isPopping;
}

/**
 * The core visual unit of the "Blister Adherence" direction: a single day's
 * dose cell. `pending` = empty dome, `popped` = logged (check), `missed` =
 * explicitly skipped (X, never ambiguous-empty), `locked` = future/blocked.
 *
 * Pure visual primitive — it never invents its own hint/caption text. A
 * consuming page (e.g. the `lg` hero "toca para loguear" prompt) passes it
 * in via `pendingContent`.
 */
export function BlisterCell({
  state,
  size = 'md',
  onClick,
  ariaLabel,
  className = '',
  pendingContent,
}: BlisterCellProps) {
  const isPopping = usePopAnimation(state);
  const style = buildCellStyle(state, size);
  const sharedClassName = buildCellClassName(state, Boolean(onClick), isPopping, className);
  const icon =
    state === 'pending' && pendingContent
      ? pendingContent
      : renderIcon(state, SIZE_ICON_PX[size], SIZE_STROKE_WIDTH[size]);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={state === 'popped'}
        aria-label={ariaLabel}
        className={sharedClassName}
        style={style}
      >
        {icon}
      </button>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel} className={sharedClassName} style={style}>
      {icon}
    </div>
  );
}
