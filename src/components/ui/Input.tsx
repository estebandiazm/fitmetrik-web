import React from 'react';
import { CONTROL_CLASSES, CONTROL_SIZE_CLASSES } from './control-classes';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...rest }: InputProps) {
  return <input className={`${CONTROL_CLASSES} ${CONTROL_SIZE_CLASSES.md} ${className}`} {...rest} />;
}
