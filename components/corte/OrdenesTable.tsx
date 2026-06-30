'use client';

interface OrdenRow {
  id: number;
  mesa: number;
  zona: string | null;
  mesero: string;
  total: number;
  metodo_pago: string;
  descuento: number;
  items: number;
  cerrado_a_las: string;
}

interface OrdenesTableProps {
  ordenes: OrdenRow[];
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

const METODO_COLOR: Record<string, string> = {
  efectivo: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  tarjeta: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  transferencia: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
};

export function OrdenesTable({ ordenes }: OrdenesTableProps) {
  if (ordenes.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        No hay órdenes cerradas en este período
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-base/80 border-b border-border/60">
            <th className="text-left px-4 py-3 font-semibold text-text-primary">Mesa</th>
            <th className="text-left px-4 py-3 font-semibold text-text-primary">Zona</th>
            <th className="text-left px-4 py-3 font-semibold text-text-primary">Mesero</th>
            <th className="text-right px-4 py-3 font-semibold text-text-primary">Total</th>
            <th className="text-center px-4 py-3 font-semibold text-text-primary">Método</th>
            <th className="text-right px-4 py-3 font-semibold text-text-primary">Descuento</th>
            <th className="text-center px-4 py-3 font-semibold text-text-primary">Items</th>
            <th className="text-right px-4 py-3 font-semibold text-text-primary">Hora</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {ordenes.map((o) => (
            <tr key={o.id} className="hover:bg-bg-base/50 transition-colors">
              <td className="px-4 py-3 font-bold text-text-primary">
                {o.mesa}
              </td>
              <td className="px-4 py-3 text-muted capitalize">
                {o.zona?.replace(/_/g, ' ') ?? '—'}
              </td>
              <td className="px-4 py-3 text-body">
                {o.mesero}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-text-primary">
                ${o.total.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${METODO_COLOR[o.metodo_pago] ?? ''}`}>
                  {METODO_LABEL[o.metodo_pago] ?? o.metodo_pago}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-danger">
                {o.descuento > 0 ? `-$${o.descuento.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3 text-center text-muted">
                {o.items}
              </td>
              <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                {new Date(o.cerrado_a_las).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
