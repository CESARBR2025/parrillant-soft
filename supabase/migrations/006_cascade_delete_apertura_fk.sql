-- Cambiar la FK de turnos.apertura_id a ON DELETE SET NULL
-- para permitir eliminar aperturas_turno sin perder el historial de turnos
ALTER TABLE public.turnos
  DROP CONSTRAINT IF EXISTS turnos_apertura_id_fkey,
  ADD CONSTRAINT turnos_apertura_id_fkey
    FOREIGN KEY (apertura_id) REFERENCES public.aperturas_turno(id)
    ON DELETE SET NULL;
