-- ============================================================
-- CORRECCIÓN DE POLÍTICAS RLS
-- ============================================================

-- 1. Recrear get_my_rol() para que sea más eficiente y evite recursión
--    SECURITY DEFINER + llamada directa a perfiles sin RLS
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$;

-- 2. Política de perfiles: evitar que la SELECT llame a get_my_rol()
--    (causa la recursión infinita)
DROP POLICY IF EXISTS "perfil_select_admin" ON public.perfiles;

-- El propio get_my_rol() es SECURITY DEFINER, así que ya puede leer perfiles
-- Solo necesitamos que el usuario pueda ver su propio perfil
-- (admin/super_admin ven todos via get_my_rol() en sus políticas)

-- 3. Permitir que mesero pueda ver todas las mesas (ya existe: mesas_select_all)
--    y permitir que mesero pueda ocupar/liberar mesas
DROP POLICY IF EXISTS "mesas_update_admin_caja" ON public.mesas;

CREATE POLICY "mesas_update_mesero_admin_caja"
  ON public.mesas FOR UPDATE
  TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin', 'caja', 'mesero'));

-- 4. detalles_insert_mesero: aceptar también 'en_preparacion' y 'listo'
DROP POLICY IF EXISTS "detalles_insert_mesero" ON public.detalles_orden;

CREATE POLICY "detalles_insert_mesero"
  ON public.detalles_orden FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_rol() IN ('mesero', 'admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM public.ordenes o
      WHERE o.id = detalles_orden.orden_id
        AND o.estado IN ('pendiente', 'en_preparacion', 'listo')
    )
  );

-- 5. ordenes_update_mesero: permitir actualizar pendiente/en_preparacion/listo/entregado
--    WITH CHECK permite transicionar a entregado/cuenta_solicitada
DROP POLICY IF EXISTS "ordenes_update_mesero" ON public.ordenes;

CREATE POLICY "ordenes_update_mesero"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'mesero'
    AND estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado')
  )
  WITH CHECK (
    estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cuenta_solicitada')
  );

-- 6. ordenes_update_cocina/barra: asegurar que no tengan conflicto
--    con la política de admin (que usa FOR ALL)
DROP POLICY IF EXISTS "ordenes_update_cocina" ON public.ordenes;
DROP POLICY IF EXISTS "ordenes_update_barra" ON public.ordenes;

CREATE POLICY "ordenes_update_cocina"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'cocina'
    AND estado IN ('pendiente', 'en_preparacion')
  )
  WITH CHECK (estado IN ('en_preparacion', 'listo'));

CREATE POLICY "ordenes_update_barra"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'barra'
    AND estado IN ('pendiente', 'en_preparacion')
  )
  WITH CHECK (estado IN ('en_preparacion', 'listo'));

-- 7. Permitir que mesero marque detalles_orden como servido
DROP POLICY IF EXISTS "detalles_update_mesero" ON public.detalles_orden;

CREATE POLICY "detalles_update_mesero"
  ON public.detalles_orden FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() IN ('mesero', 'admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM public.ordenes o
      WHERE o.id = detalles_orden.orden_id
        AND o.estado IN ('listo', 'entregado', 'cuenta_solicitada', 'cerrado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ordenes o
      WHERE o.id = detalles_orden.orden_id
        AND o.estado IN ('listo', 'entregado', 'cuenta_solicitada', 'cerrado')
    )
  );

-- 8. Política para que mesero pueda ver órdenes activas de la mesa
--    (ya existe: ordenes_select_mesero con mesero_id = auth.uid())
--    Pero también necesita ver la orden activa al hacer clic en la mesa
--    La política actual usa mesero_id = auth.uid(), eso está bien

-- Verificar los cambios
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
