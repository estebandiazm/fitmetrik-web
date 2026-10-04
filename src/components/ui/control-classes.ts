// Shared look for form controls (Input, Select, Textarea): design-system
// radius, token colors and the teal focus ring. Sizes are separate because
// conflicting padding utilities cannot be overridden through className.
export const CONTROL_CLASSES =
  'rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20';

export const CONTROL_SIZE_CLASSES = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3 py-1 text-sm',
} as const;

export type ControlSize = keyof typeof CONTROL_SIZE_CLASSES;
