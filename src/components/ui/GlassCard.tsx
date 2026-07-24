import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function GlassCard({ children, className = '', id }: GlassCardProps) {
  return (
    <div id={id} className={`neu-card rounded-2xl md:rounded-3xl relative ${className}`}>
      {children}
    </div>
  );
}
