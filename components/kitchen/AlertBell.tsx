'use client';

import { AlertTriangle } from 'lucide-react';

interface AlertBellProps {
  visible: boolean;
}

export function AlertBell({ visible }: AlertBellProps) {
  if (!visible) return null;

  return (
    <span className="inline-flex items-center gap-1 text-danger font-semibold text-xs animate-pulse">
      <AlertTriangle className="w-4 h-4" />
      EXCEDE TIEMPO
    </span>
  );
}
