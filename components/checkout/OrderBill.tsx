'use client'

interface BillItem {
  id: number
  cantidad: number
  nombre: string
  precio_unitario: number
  notas: string | null
}

interface OrderBillProps {
  items: BillItem[]
  discount: number
}

export function OrderBill({ items, discount }: OrderBillProps) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.cantidad * item.precio_unitario,
    0,
  )
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="bg-bg-base rounded-xl border-2 border-border/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60">
        <h3 className="text-sm font-semibold text-text-primary">Cuenta</h3>
      </div>

      <ul className="divide-y divide-border/40">
        {items.map((item) => (
          <li key={item.id} className="px-5 py-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-body">
                  <span className="text-muted">{item.cantidad}x</span>{' '}
                  {item.nombre}
                </p>
                {item.notas && (
                  <p className="text-xs text-muted italic mt-0.5">
                    {item.notas}
                  </p>
                )}
              </div>
              <span className="text-sm text-text-primary font-medium shrink-0">
                ${(item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="border-t border-border/60 px-5 py-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-text-primary font-bold">Subtotal</span>
          <span className="text-body">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-success">Descuento</span>
            <span className="text-success">-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border/40">
          <span className="text-text-primary">Total</span>
          <span className="text-accent">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
