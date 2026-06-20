'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { OrderBill } from '@/components/checkout/OrderBill'
import { PaymentPanel, type PaymentMethod } from '@/components/checkout/PaymentPanel'
import { DiscountInput } from '@/components/checkout/DiscountInput'
import { ReceiptPreview } from '@/components/checkout/ReceiptPreview'

interface Detalle {
  id: number
  cantidad: number
  precio_unitario: number
  notas: string | null
  productos_menu: { nombre: string } | null
}

interface OrdenData {
  id: number
  estado: string
  created_at: string
  mesa_id: number
  mesas: { numero: number; zona: string | null } | null
  detalles_orden: Detalle[]
}

export default function CobrarPage() {
  const { ordenId } = useParams<{ ordenId: string }>()
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const [orden, setOrden] = useState<OrdenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [receipt, setReceipt] = useState<{
    metodoPago: string
    recibido: number
    cambio: number
    total: number
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('ordenes')
      .select(
        `id, estado, created_at, mesa_id,
        mesas (numero, zona),
        detalles_orden (id, cantidad, precio_unitario, notas, productos_menu (nombre))`,
      )
      .eq('id', Number(ordenId))
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          router.push('/caja')
          return
        }
        if (data.estado !== 'entregado') {
          router.push('/caja')
          return
        }
        setOrden(data as unknown as OrdenData)
        setLoading(false)
      })
  }, [ordenId, router, supabase])

  const handlePay = useCallback(
    async (method: PaymentMethod, recibido: number) => {
      if (!orden) return

      const total = orden.detalles_orden.reduce(
        (acc, d) => acc + d.cantidad * d.precio_unitario,
        0,
      )
      const totalConDescuento = Math.max(0, total - discount)

      setPaying(true)
      setError('')

      try {
        const res = await fetch(`/api/ordenes/${orden.id}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'cerrado',
            metodo_pago: method,
            pagado_con: method === 'efectivo' ? recibido : totalConDescuento,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Error al procesar el pago')
        }

        if (discount > 0) {
          await supabase
            .from('ordenes')
            .update({ notas: `Descuento aplicado: $${discount.toFixed(2)}` })
            .eq('id', orden.id)
        }

        setReceipt({
          metodoPago: method,
          recibido: method === 'efectivo' ? recibido : totalConDescuento,
          cambio: method === 'efectivo' ? recibido - totalConDescuento : 0,
          total: totalConDescuento,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar el pago')
      } finally {
        setPaying(false)
      }
    },
    [orden, discount, supabase],
  )

  const subtotal = orden?.detalles_orden.reduce(
    (acc, d) => acc + d.cantidad * d.precio_unitario,
    0,
  ) ?? 0
  const totalConDescuento = Math.max(0, subtotal - discount)

  const billItems = (orden?.detalles_orden ?? []).map((d) => ({
    id: d.id,
    cantidad: d.cantidad,
    nombre: d.productos_menu?.nombre ?? 'Producto',
    precio_unitario: d.precio_unitario,
    notas: d.notas,
  }))

  const handlePrint = useCallback(() => {
    const printWindow = window.open(
      '',
      'ticket',
      'width=380,height=600,menubar=no,toolbar=no,location=no,status=no',
    )
    if (!printWindow) return

    const baseUrl = window.location.origin

    const rows = billItems
      .map(
        (item) => `
      <tr>
        <td class="right">${item.cantidad}</td>
        <td>${item.nombre}${item.notas ? `<br><span class="nota">${item.notas}</span>` : ''}</td>
        <td class="right">$${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
      </tr>`,
      )
      .join('')

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Cuenta</title>
  <style>
    @page { size: 58mm auto; margin: 0; }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 10px;
      color: #000;
      background: #fff;
      width: 43.5mm;
      margin: 0 auto;
      padding: 2mm 0;
    }
    .center { text-align: center; }
    .logo { display: block; margin: 0 auto 3mm; max-width: 40mm; height: auto; }
    h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1mm; }
    .sub { font-size: 10px; margin-bottom: 1mm; }
    .mesa { font-size: 11px; font-weight: bold; margin-bottom: 2mm; }
    .sep { border: none; border-top: 1px dashed #000; margin: 1.5mm 0; }
    .sep-thick { border: none; border-top: 2px dashed #000; margin: 2mm 0; }
    table { width: 100%; font-size: 10px; border-collapse: collapse; }
    thead th { font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 0.8mm; }
    thead th:first-child { width: 6mm; text-align: left; }
    thead th:nth-child(2) { text-align: left; }
    thead th:last-child { width: 16mm; text-align: right; }
    tbody td { padding: 0.5mm 0; vertical-align: top; }
    tbody td:first-child { text-align: left; }
    tbody td:last-child { text-align: right; white-space: nowrap; }
    .nota { font-size: 8px; font-style: italic; }
    .totals { padding-top: 0.5mm; }
    .totals > div { display: flex; justify-content: space-between; padding: 0.3mm 0; }
    .totals .grand-total { font-size: 12px; font-weight: bold; border-top: 1px solid #000; padding-top: 0.8mm; margin-top: 0.3mm; }
    .footer { text-align: center; font-size: 9px; margin-top: 3mm; }
    @media print { body { width: auto; padding: 0; } }
  </style>
</head>
<body>
  <img src="${baseUrl}/parrillalogo.png" alt="Parrillant" class="logo" onerror="this.style.display='none'" />
  <p class="center sub">Cuenta</p>
  <p class="center mesa">Mesa ${orden?.mesas?.numero ?? ''}${orden?.mesas?.zona ? ` - ${orden.mesas.zona}` : ''}</p>
  <hr class="sep">
  <table>
    <thead>
      <tr>
        <th>Cant</th>
        <th>Producto</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <hr class="sep">
  <div class="totals">
    <div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    ${discount > 0 ? `<div><span>Descuento</span><span>-$${discount.toFixed(2)}</span></div>` : ''}
    <div class="grand-total"><span>Total</span><span>$${totalConDescuento.toFixed(2)}</span></div>
  </div>
  <hr class="sep-thick">
  <p class="footer">¡Gracias por su visita!</p>
  <script>window.onload=function(){window.print();window.close()}<\/script>
</body>
</html>`)
    printWindow.document.close()
  }, [billItems, subtotal, totalConDescuento, discount, orden])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!orden) return null

  if (receipt) {
    return (
      <div className="max-w-md mx-auto">
        <ReceiptPreview
          numeroMesa={orden.mesas?.numero ?? 0}
          zona={orden.mesas?.zona}
          items={orden.detalles_orden.map((d) => ({
            nombre: d.productos_menu?.nombre ?? 'Producto',
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          }))}
          total={receipt.total}
          metodoPago={receipt.metodoPago}
          recibido={receipt.recibido}
          cambio={receipt.cambio}
          onClose={() => router.push('/caja')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/caja')}
        className="flex items-center gap-2 text-sm text-muted hover:text-body transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Caja
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Mesa {orden.mesas?.numero}
        </h1>
        {orden.mesas?.zona && (
          <p className="text-sm text-muted mt-1">{orden.mesas.zona}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bill - takes 3/5 */}
        <div className="lg:col-span-3 space-y-4">
          <OrderBill items={billItems} discount={discount} />

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 flex-1 bg-bg-base border border-border/60 text-body rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-card transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir Cuenta
            </button>
            <DiscountInput subtotal={subtotal} onChange={setDiscount} />
          </div>
        </div>

        {/* Payment panel - takes 2/5 */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <PaymentPanel total={totalConDescuento} onPay={handlePay} loading={paying} />
          </div>
        </div>
      </div>


    </div>
  )
}
