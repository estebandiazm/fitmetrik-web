import React from 'react';
import { CONTROL_CLASSES, CONTROL_SIZE_CLASSES } from './control-classes';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${CONTROL_CLASSES} ${CONTROL_SIZE_CLASSES.md} resize-none ${className}`}
      {...rest}
    />
  );
}
