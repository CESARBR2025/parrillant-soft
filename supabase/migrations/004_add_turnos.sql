-- Tabla: aperturas_turno (programación de turnos por sucursal)
-- El admin programa cuándo una sucursal acepta registros de turno
CREATE TABLE public.aperturas_turno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  creada_por UUID REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aperturas_turno_sucursal_fecha
  ON public.aperturas_turno(sucursal_id, fecha);

CREATE INDEX idx_aperturas_turno_activas
  ON public.aperturas_turno(fecha, hora_inicio, hora_fin, activa)
  WHERE activa = true;

COMMENT ON TABLE public.aperturas_turno IS
  'Programación de ventanas de turno por sucursal. El admin define cuándo los meseros pueden registrar turno.';

-- Tabla: turnos (registro individual de cada mesero)
-- Cuando un mesero "registra turno", se crea un registro aquí
CREATE TABLE public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apertura_id UUID REFERENCES public.aperturas_turno(id),
  usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  sucursal_id UUID NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fin TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT true,
  reasignado_de UUID REFERENCES public.sucursales(id),
  cerrado_por UUID REFERENCES public.perfiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_turnos_usuario_activo
  ON public.turnos(usuario_id, activo)
  WHERE activo = true;

CREATE INDEX idx_turnos_sucursal_activo
  ON public.turnos(sucursal_id, activo)
  WHERE activo = true;

COMMENT ON TABLE public.turnos IS
  'Registro de turno de cada mesero. Cuando el mesero registra su entrada, se crea un registro activo.';

-- Trigger para updated_at
CREATE TRIGGER trg_turnos_updated_at
  BEFORE UPDATE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
