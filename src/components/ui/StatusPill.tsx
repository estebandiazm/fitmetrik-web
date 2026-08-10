import React from 'react';

import { Badge } from './Badge';

interface StatusPillProps {
  hasPlan: boolean;
}

export function StatusPill({ hasPlan }: StatusPillProps) {
  return <Badge tone={hasPlan ? 'success' : 'error'}>{hasPlan ? 'Active' : 'No Plan'}</Badge>;
}
