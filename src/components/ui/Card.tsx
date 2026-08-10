import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  padding?: 'default' | 'none';
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, className = '', id, padding, as: Tag = 'div' }: CardProps) {
  const classes = ['neu-card', 'relative', padding === 'default' ? 'p-[var(--space-card-p)]' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag id={id} className={classes}>
      {children}
    </Tag>
  );
}
