'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileDown, Loader2 } from 'lucide-react';
import { exportarCorteExcel } from '@/app/actions/cortes';

interface ExportButtonProps {
  fecha?: string;
  label?: string;
}

export function ExportButton({ fecha, label = 'Exportar Excel' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const result = await exportarCorteExcel(fecha);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.base64 && result.fileName) {
        const binaryStr = atob(result.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Excel descargado');
      }
    } catch {
      toast.error('Error al exportar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-accent text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-accent-dark transition-all disabled:opacity-50 shadow-accent"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {loading ? 'Generando...' : label}
    </button>
  );
}
