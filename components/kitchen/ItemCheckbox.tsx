'use client';

import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { marcarItemListo } from '@/app/actions/marcarItemListo';
import { toast } from 'sonner';

interface ItemCheckboxProps {
  itemId: number;
  listo: boolean;
  disabled: boolean;
  onMarked: () => void;
}

export function ItemCheckbox({ itemId, listo, disabled, onMarked }: ItemCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (disabled || isPending) return;
    const nuevoEstado = !listo;
    startTransition(async () => {
      try {
        const res = await marcarItemListo(itemId, nuevoEstado);
        if (res.error) {
          toast.error(res.error);
        } else {
          onMarked();
        }
      } catch {
        toast.error('Error de red al marcar ítem');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-label={listo ? 'Desmarcar ítem' : 'Marcar como listo'}
      className={`
        w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0
        transition-all duration-150
        ${listo
          ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400 cursor-pointer'
          : disabled
            ? 'border-border/30 text-muted/30 cursor-not-allowed'
            : 'border-border/60 text-transparent hover:border-green-500 hover:bg-green-500/10 hover:text-green-400 cursor-pointer'
        }
      `}
    >
      <Check className="w-5 h-5" />
    </button>
  );
}
