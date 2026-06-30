'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useNavigate } from '@/components/providers/NavigationProvider'
import { ArrowLeft, Printer, Clock, Receipt, Tag, Percent, CheckCircle2 } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { useSucursal } from '@/components/providers/SucursalProvider'
import { OrderBill } from '@/components/checkout/OrderBill'
import { PaymentPanel, type PaymentMethod } from '@/components/checkout/PaymentPanel'
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

interface BillItem {
  id: number
  cantidad: number
  nombre: string
  precio_unitario: number
  notas: string | null
}

type DiscountType = 'none' | 'percentage' | 'fixed'

export default function CobrarPage() {
  const { ordenId } = useParams<{ ordenId: string }>()
  const router = useNavigate()
  const supabase = createClientSupabaseClient()
  const sucursal = useSucursal()

  const [orden, setOrden] = useState<OrdenData | null>(null)
  const [subOrdenes, setSubOrdenes] = useState<OrdenData[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [ticketGenerado, setTicketGenerado] = useState(false)
  const [receipt, setReceipt] = useState<{
    metodoPago: string
    recibido: number
    cambio: number
    total: number
  } | null>(null)
  const [error, setError] = useState('')

  // Discount UI state
  const [discountType, setDiscountType] = useState<DiscountType>('none')
  const [discountValue, setDiscountValue] = useState('')

  useEffect(() => {
    async function load() {
      if (!sucursal?.id) return

      const [ordenRaw, subsRaw] = await Promise.all([
        supabase
          .from('ordenes')
          .select(
            `id, estado, created_at, mesa_id, ticket_generado_en,
            mesas (numero, zona),
            detalles_orden (id, cantidad, precio_unitario, notas, productos_menu (nombre))`,
          )
          .eq('id', Number(ordenId))
          .eq('sucursal_id', sucursal.id)
          .single(),
        supabase
          .from('ordenes')
          .select(
            `id, estado, created_at, mesa_id,
            detalles_orden (id, cantidad, precio_unitario, notas, productos_menu (nombre))`,
          )
          .eq('orden_padre_id', Number(ordenId))
          .eq('sucursal_id', sucursal.id)
          .in('estado', ['entregado', 'cuenta_solicitada'])
          .order('created_at', { ascending: true }),
      ]);

      const data = ordenRaw.data as OrdenData & { ticket_generado_en: string | null } | null;

      if (!data) {
        router.push(`/${sucursal?.slug}/caja`);
        return;
      }
      if (data.estado !== 'entregado' && data.estado !== 'cuenta_solicitada') {
        router.push(`/${sucursal?.slug}/caja`);
        return;
      }
      setOrden(data);
      setTicketGenerado(!!data.ticket_generado_en);

      const subs = (subsRaw.data ?? []) as unknown as OrdenData[];
      setSubOrdenes(subs);
      setLoading(false);
    }

    load();
  }, [ordenId]);

  const todasOrdenes = useMemo(() => {
    const result = [orden!];
    if (subOrdenes.length > 0) result.push(...subOrdenes);
    return result.filter(Boolean);
  }, [orden, subOrdenes]);

  const billItems: BillItem[] = useMemo(() => {
    return todasOrdenes.flatMap(o =>
      o.detalles_orden.map(d => ({
        id: d.id,
        cantidad: d.cantidad,
        nombre: d.productos_menu?.nombre ?? 'Producto',
        precio_unitario: d.precio_unitario,
        notas: d.notas,
      }))
    );
  }, [todasOrdenes]);

  const subtotal = useMemo(() =>
    billItems.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0),
  [billItems]);

  const totalConDescuento = Math.max(0, subtotal - discount);

  function handleDiscountTypeChange(type: DiscountType) {
    setDiscountType(type)
    setDiscountValue('')
    setDiscount(0)
  }

  function handleDiscountValueChange(raw: string) {
    setDiscountValue(raw)
    const num = parseFloat(raw) || 0
    if (discountType === 'percentage') {
      const maxPct = Math.min(num, 100)
      setDiscount((subtotal * maxPct) / 100)
    } else {
      setDiscount(Math.min(num, subtotal))
    }
  }

  const handleGenerarTicket = useCallback(async () => {
    if (!orden) return

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
  <p class="center sub">Ticket de Consumo</p>
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

    await fetch(`/api/ordenes/${orden.id}/ticket`, { method: 'PATCH' })
    setTicketGenerado(true)
  }, [billItems, subtotal, totalConDescuento, discount, orden])

  const handlePay = useCallback(
    async (method: PaymentMethod, recibido: number) => {
      if (!orden) return;

      setPaying(true);
      setError('');

      try {
        const res = await fetch(`/api/ordenes/${orden.id}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'cerrado',
            metodo_pago: method,
            pagado_con: method === 'efectivo' ? recibido : totalConDescuento,
            descuento: discount > 0 ? discount : 0,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? 'Error al procesar el pago');
        }

        setReceipt({
          metodoPago: method,
          recibido: method === 'efectivo' ? recibido : totalConDescuento,
          cambio: method === 'efectivo' ? recibido - totalConDescuento : 0,
          total: totalConDescuento,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      } finally {
        setPaying(false);
      }
    },
    [orden, totalConDescuento, discount, supabase],
  )

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="bg-card rounded-2xl border-2 border-border/60 p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-bg-base" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-bg-base rounded" />
              <div className="h-3 w-48 bg-bg-base rounded" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl border-2 border-border/60 p-6 space-y-4">
              <div className="h-4 w-20 bg-bg-base rounded" />
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-bg-base" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 bg-bg-base rounded" />
                    <div className="h-3 w-1/2 bg-bg-base rounded" />
                  </div>
                  <div className="h-4 w-16 bg-bg-base rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border-2 border-border/60 p-6 space-y-4">
              <div className="h-8 w-28 bg-bg-base rounded" />
              <div className="h-4 w-full bg-bg-base rounded" />
              <div className="h-12 w-full bg-bg-base rounded-lg" />
            </div>
          </div>
        </div>
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
          items={billItems.map(i => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
          }))}
          total={receipt.total}
          metodoPago={receipt.metodoPago}
          recibido={receipt.recibido}
          cambio={receipt.cambio}
          onClose={() => router.push(`/${sucursal?.slug}/caja`)}
        />
      </div>
    )
  }

  const tiempoTranscurrido = () => {
    if (!orden.created_at) return ''
    const diff = Date.now() - new Date(orden.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '< 1 min'
    return `${mins} min`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with mesa info */}
      <div className="bg-card rounded-2xl border-2 border-border/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${sucursal?.slug}/caja`)}
            className="w-10 h-10 rounded-xl bg-bg-base border border-border/60 flex items-center justify-center text-muted hover:text-body hover:border-border transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">
                Mesa {orden.mesas?.numero}
              </h1>
              {orden.mesas?.zona && (
                <span className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-0.5 rounded-full">
                  {orden.mesas.zona}
                </span>
              )}
              {ticketGenerado && (
                <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ticket generado
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="w-3.5 h-3.5" />
                {tiempoTranscurrido()}
              </span>
              {subOrdenes.length > 0 && (
                <span className="text-xs text-muted">
                  + {subOrdenes.length} pedido{subOrdenes.length > 1 ? 's' : ''} adicional{subOrdenes.length > 1 ? 'es' : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Receipt className="w-3.5 h-3.5" />
                {billItems.length} ítem{billItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-5 py-3.5 text-sm text-danger flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-danger shrink-0" />
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${ticketGenerado ? 'text-emerald-500' : 'text-accent'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            ticketGenerado
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-accent/15 text-accent'
          }`}>
            {ticketGenerado ? <CheckCircle2 className="w-4 h-4" /> : 1}
          </div>
          <span className={`text-sm font-semibold ${ticketGenerado ? 'text-emerald-500' : 'text-text-primary'}`}>
            Generar Ticket
          </span>
        </div>
        <div className="flex-1 h-px bg-border/60" />
        <div className={`flex items-center gap-2 ${ticketGenerado ? 'text-text-primary' : 'text-muted'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            ticketGenerado
              ? 'bg-accent/15 text-accent'
              : 'bg-bg-base text-muted border border-border/60'
          }`}>
            2
          </div>
          <span className={`text-sm font-semibold ${ticketGenerado ? 'text-text-primary' : 'text-muted'}`}>
            Cobro
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-5 items-start">
        {/* Bill - takes 3/5 */}
        <div className="lg:col-span-3 space-y-4">
          <OrderBill items={billItems} discount={discount} />

          {/* Discount controls (only before ticket is generated) */}
          {!ticketGenerado && (
            <div className="bg-card rounded-2xl border-2 border-border/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Descuento</h3>

              <div className="flex rounded-xl border border-border/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange('none')}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    discountType === 'none'
                      ? 'bg-accent text-white'
                      : 'bg-bg-base text-muted hover:text-body'
                  }`}
                >
                  Sin descuento
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange('percentage')}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    discountType === 'percentage'
                      ? 'bg-accent text-white'
                      : 'bg-bg-base text-muted hover:text-body'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  %
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange('fixed')}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    discountType === 'fixed'
                      ? 'bg-accent text-white'
                      : 'bg-bg-base text-muted hover:text-body'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Monto
                </button>
              </div>

              {discountType !== 'none' && (
                <div className="relative">
                  {discountType === 'fixed' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  )}
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    step={discountType === 'percentage' ? '1' : 'any'}
                    value={discountValue}
                    onChange={(e) => handleDiscountValueChange(e.target.value)}
                    placeholder={discountType === 'percentage' ? '0%' : '$0'}
                    className={`w-full bg-bg-base border border-border/60 rounded-xl py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors ${
                      discountType === 'fixed' ? 'pl-8 pr-3' : 'px-3'
                    }`}
                  />
                  {discountType === 'percentage' && discountValue && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
                  )}
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-sm bg-success/10 rounded-xl px-4 py-2.5">
                  <span className="text-success font-medium">Descuento aplicado</span>
                  <span className="text-success font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
          {!ticketGenerado ? (
            <div className="bg-card rounded-2xl border-2 border-border/60 p-6 space-y-5">
              <div className="text-center space-y-2">
                <Receipt className="w-10 h-10 text-muted mx-auto" />
                <h3 className="font-semibold text-text-primary">Paso 1: Generar Ticket de Consumo</h3>
                <p className="text-xs text-muted">
                  Configura el descuento (si aplica) y genera el ticket para entregar al mesero.
                </p>
              </div>

              {/* Totals preview */}
              <div className="bg-bg-base rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-body font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Descuento</span>
                    <span className="text-success">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border/40">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent">${totalConDescuento.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleGenerarTicket}
                className="w-full bg-accent text-white font-bold text-lg py-4 rounded-xl hover:bg-accent-dark transition-all shadow-accent flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Generar Ticket de Consumo
              </button>
            </div>
          ) : (
            <>
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm">Ticket generado</p>
                    <p className="text-xs text-muted">Entregar al mesero para la mesa</p>
                  </div>
                  <button
                    onClick={() => setTicketGenerado(false)}
                    className="text-xs font-medium text-accent hover:text-accent/80 underline underline-offset-2 shrink-0"
                  >
                    Editar ticket
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerarTicket}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Reimprimir ticket
                  </button>
                </div>
              </div>

              <PaymentPanel
                total={totalConDescuento}
                onPay={handlePay}
                loading={paying}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
