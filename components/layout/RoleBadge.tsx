'use client';

import type { Rol } from '@/types/roles';
import { ROLE_LABELS, ROLE_BADGE_STYLES } from '@/lib/navigation';

interface RoleBadgeProps {
  rol: Rol;
  className?: string;
}

export function RoleBadge({ rol, className = '' }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES[rol]} ${className}`}
    >
      {ROLE_LABELS[rol]}
    </span>
  );
}
