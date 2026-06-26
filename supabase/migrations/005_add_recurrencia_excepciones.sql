-- ============================================================
-- Recurrencia en aperturas_turno + tabla de excepciones
-- ============================================================

-- 1. Agregar columnas de recurrencia a aperturas_turno
ALTER TABLE public.aperturas_turno
  ADD COLUMN IF NOT EXISTS recurrencia TEXT,
  ADD COLUMN IF NOT EXISTS recurrencia_fin DATE;

-- Actualizar CHECK para incluir 'anual'
ALTER TABLE public.aperturas_turno
  DROP CONSTRAINT IF EXISTS aperturas_turno_recurrencia_check;

ALTER TABLE public.aperturas_turno
  ADD CONSTRAINT aperturas_turno_recurrencia_check
  CHECK (recurrencia IN ('semanal', 'mensual', 'anual'));

COMMENT ON COLUMN public.aperturas_turno.recurrencia IS
  'NULL = día único, semanal = todos los días de la semana, mensual = todos los días del mes, anual = todos los días del año';

COMMENT ON COLUMN public.aperturas_turno.recurrencia_fin IS
  'Fecha fin de la recurrencia (NULL para día único)';

-- 2. Tabla de excepciones (modificaciones a días individuales)
CREATE TABLE public.aperturas_excepciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apertura_id UUID NOT NULL REFERENCES public.aperturas_turno(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_excepciones_apertura_fecha
  ON public.aperturas_excepciones(apertura_id, fecha);

COMMENT ON TABLE public.aperturas_excepciones IS
  'Excepciones/modificaciones manuales a días específicos de una apertura recurrente. Si existe registro para una fecha, su horario sobreescribe el de la apertura padre.';

-- 3. Recrear índice existente para incluir recurrencia
DROP INDEX IF EXISTS public.idx_aperturas_turno_activas;

CREATE INDEX idx_aperturas_turno_busqueda
  ON public.aperturas_turno(sucursal_id, fecha, activa)
  WHERE activa = true;
