'use client'

import { Printer, CheckCircle } from 'lucide-react'

interface ReceiptItem {
  nombre: string
  cantidad: number
  precio_unitario: number
}

interface ReceiptPreviewProps {
  numeroMesa: number
  zona: string | null | undefined
  items: ReceiptItem[]
  total: number
  metodoPago: string
  recibido: number
  cambio: number
  onClose: () => void
}

export function ReceiptPreview({
  numeroMesa,
  zona,
  items,
  total,
  metodoPago,
  recibido,
  cambio,
  onClose,
}: ReceiptPreviewProps) {
  const METODO_LABEL: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
  }

  function handlePrint() {
    const printWindow = window.open(
      '',
      'ticket',
      'width=380,height=600,menubar=no,toolbar=no,location=no,status=no',
    )
    if (!printWindow) return

    const baseUrl = window.location.origin

    const rows = items
      .map(
        (item) =>
          `<tr><td class="right">${item.cantidad}</td><td>${item.nombre}</td><td class="right">$${(item.cantidad * item.precio_unitario).toFixed(2)}</td></tr>`,
      )
      .join('')

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Ticket</title>
  <style>
    @page { size: 58mm auto; margin: 0; }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Courier', monospace;
      font-size: 10px; color: #000; background: #fff;
      width: 43.5mm; margin: 0 auto; padding: 2mm 0;
    }
    .center { text-align: center; }
    .logo { display: block; margin: 0 auto 3mm; max-width: 40mm; height: auto; }
    h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1mm; }
    .sub { font-size: 10px; margin-bottom: 1mm; }
    .mesa { font-size: 11px; font-weight: bold; margin-bottom: 2mm; }
    .sep { border: none; border-top: 1px dashed #000; margin: 1.5mm 0; }
    .sep-thick { border: none; border-top: 2px dashed #000; margin: 2mm 0; }
    table { width: 100%; font-size: 10px; border-collapse: collapse; }
    thead th { font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 0.8mm; text-align: left; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 0.5mm 0; vertical-align: top; }
    tbody td:first-child { width: 6mm; }
    tbody td:last-child { text-align: right; white-space: nowrap; }
    .totals > div { display: flex; justify-content: space-between; padding: 0.3mm 0; }
    .totals .grand-total { font-size: 12px; font-weight: bold; border-top: 1px solid #000; padding-top: 0.8mm; margin-top: 0.3mm; }
    .footer { text-align: center; font-size: 9px; margin-top: 3mm; }
    @media print { body { width: auto; padding: 0; } }
  </style>
</head>
<body>
  <img src="${baseUrl}/parrillalogo.png" alt="Parrillant" class="logo" onerror="this.style.display='none'" />
  <p class="center sub">Ticket de cierre</p>
  <p class="center mesa">Mesa ${numeroMesa}${zona ? ` - ${zona}` : ''}</p>
  <hr class="sep">
  <table>
    <thead><tr><th>Cant</th><th>Producto</th><th>Importe</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="sep">
  <div class="totals">
    <div><span>Total</span><span>$${total.toFixed(2)}</span></div>
    <div><span>Método</span><span>${METODO_LABEL[metodoPago] ?? metodoPago}</span></div>
    ${metodoPago === 'efectivo' ? `<div><span>Recibido</span><span>$${recibido.toFixed(2)}</span></div><div><span>Cambio</span><span>$${cambio.toFixed(2)}</span></div>` : ''}
  </div>
  <hr class="sep-thick">
  <p class="footer">¡Gracias por su visita!</p>
  <script>window.onload=function(){window.print();window.close()}<\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-text-primary">Pago registrado</h2>
        <p className="text-sm text-muted mt-1">
          Mesa {numeroMesa}{zona ? ` - ${zona}` : ''}
        </p>
      </div>

      {/* Ticket */}
      <div className="bg-bg-base rounded-xl border-2 border-border/60 p-5 space-y-3">
        <div className="text-center pb-3 border-b border-border/60">
          <p className="text-xs font-bold text-text-primary tracking-widest uppercase">
            Parrillant
          </p>
          <p className="text-xs text-muted mt-0.5">Ticket de cierre</p>
        </div>

        <ul className="divide-y divide-border/40">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm py-1.5">
              <span className="text-body">
                {item.cantidad}x {item.nombre}
              </span>
              <span className="text-text-primary font-medium">
                ${(item.cantidad * item.precio_unitario).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border/60 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className="text-text-primary font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Método de pago</span>
            <span className="text-body">
              {METODO_LABEL[metodoPago] ?? metodoPago}
            </span>
          </div>
          {metodoPago === 'efectivo' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Recibido</span>
                <span className="text-body">${recibido.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Cambio</span>
                <span className="text-success">${cambio.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 bg-bg-base border border-border/60 text-body rounded-xl px-4 py-3 text-sm font-medium hover:bg-card transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-accent text-white rounded-xl px-4 py-3 text-sm font-bold hover:bg-accent-dark transition-colors"
        >
          Volver a Caja
        </button>
      </div>
    </div>
  )
}
