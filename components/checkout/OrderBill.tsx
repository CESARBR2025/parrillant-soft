'use client'

import { Fragment } from 'react'
import { Tag } from 'lucide-react'

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
    <div className="bg-card rounded-2xl border-2 border-border/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Cuenta</h3>
        <span className="text-xs text-muted">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/40">
        {items.map((item) => (
          <div key={item.id} className="px-6 py-3.5 hover:bg-bg-base/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10 text-accent text-sm font-bold shrink-0 mt-0.5">
                  {item.cantidad}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-body truncate">{item.nombre}</p>
                  {item.notas && (
                    <p className="text-xs text-muted italic mt-0.5 line-clamp-1">{item.notas}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-text-primary font-semibold shrink-0 whitespace-nowrap">
                ${(item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border/60 px-6 py-4 space-y-2 bg-bg-base/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="text-body font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-success">
              <Tag className="w-3.5 h-3.5" />
              Descuento
            </span>
            <span className="text-success font-medium">-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-bold pt-2 border-t border-border/40">
          <span className="text-text-primary">Total</span>
          <span className="text-accent text-xl">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
