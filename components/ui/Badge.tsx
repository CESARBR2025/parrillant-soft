type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-card text-muted',
  success: 'bg-green-900/30 text-green-400',
  warning: 'bg-yellow-900/30 text-yellow-400',
  danger: 'bg-red-900/30 text-red-400',
  info: 'bg-blue-900/30 text-blue-400',
  purple: 'bg-purple-900/30 text-purple-400',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
