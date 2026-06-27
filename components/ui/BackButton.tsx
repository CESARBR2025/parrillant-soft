'use client';

interface BackButtonProps {
  fallbackHref?: string;
}

export function BackButton({ fallbackHref = '/admin' }: BackButtonProps) {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-accent bg-accent/10 hover:bg-accent hover:text-white border border-accent/20 hover:border-accent rounded-md px-3 py-1.5 transition-colors mb-3"
    >
      ← Regresar
    </button>
  );
}
