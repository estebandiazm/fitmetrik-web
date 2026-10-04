import React from 'react';
import { CONTROL_CLASSES, CONTROL_SIZE_CLASSES, type ControlSize } from './control-classes';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  controlSize?: ControlSize;
  children: React.ReactNode;
}

export function Select({ className = '', controlSize = 'md', children, ...rest }: SelectProps) {
  return (
    <select className={`${CONTROL_CLASSES} ${CONTROL_SIZE_CLASSES[controlSize]} ${className}`} {...rest}>
      {children}
    </select>
  );
}
