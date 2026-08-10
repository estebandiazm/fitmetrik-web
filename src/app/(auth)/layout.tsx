import React from 'react';

/**
 * Auth layout wrapper.
 * Both /login and /update-password own their own layouts via CSS modules,
 * so this wrapper simply passes children through.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="surface-client">{children}</div>;
}
