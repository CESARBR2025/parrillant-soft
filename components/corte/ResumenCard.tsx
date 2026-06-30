'use client';

import { Banknote, CreditCard, Smartphone, BadgePercent, ShoppingCart } from 'lucide-react';

interface ResumenCardProps {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  descuentos: number;
  totalGeneral: number;
  totalOrdenes: number;
}

export function ResumenCard({
  efectivo,
  tarjeta,
  transferencia,
  descuentos,
  totalGeneral,
  totalOrdenes,
}: ResumenCardProps) {
  const format$ = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-500">
          <Banknote className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Efectivo</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">{format$(efectivo)}</p>
      </div>

      <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-500">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Tarjeta</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">{format$(tarjeta)}</p>
      </div>

      <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-purple-500">
          <Smartphone className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Transferencia</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">{format$(transferencia)}</p>
      </div>

      <div className="bg-card rounded-2xl border-2 border-border/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-500">
          <BadgePercent className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Descuentos</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">{format$(descuentos)}</p>
      </div>

      <div className="bg-card rounded-2xl border-2 border-accent/40 p-4 space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Total Gral</span>
        </div>
        <p className="text-2xl font-bold text-accent">{format$(totalGeneral)}</p>
        <p className="text-xs text-muted">{totalOrdenes} órdenes</p>
      </div>
    </div>
  );
}
