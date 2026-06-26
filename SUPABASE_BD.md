-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE public.rol_usuario AS ENUM (
'super_admin',
'admin',
'caja',
'mesero',
'barra',
'cocina'
);

CREATE TYPE public.estado_orden AS ENUM (
'pendiente', -- Mesa abierta, mesero asignó comensales, aún no se toma orden
'en_preparacion', -- Comanda enviada a cocina/barra
'listo', -- Cocina/barra terminó, mesero debe recoger y llevar
'entregado', -- Mesero sirvió al cliente, comensales consumiendo
'cuenta_solicitada', -- Cliente pidió la cuenta, esperando cobro de caja
'cerrado', -- Caja cobró y liberó la mesa
'cancelado' -- Cancelado en cualquier punto
);

CREATE TYPE public.estado_mesa AS ENUM (
'disponible',
'ocupada',
'reservada',
'fuera_de_servicio'
);

CREATE TYPE public.tipo_producto AS ENUM (
'alimento', -- Va a cocina
'bebida', -- Va a barra
'combo' -- Va a ambos (dividir en detalles_orden)
);

-- ============================================================
-- TABLA: perfiles (vinculada 1:1 con auth.users)
-- ============================================================

CREATE TABLE public.perfiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
rol public.rol_usuario NOT NULL DEFAULT 'mesero',
nombre TEXT NOT NULL,
apellido TEXT,
activo BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.perfiles IS 'Extiende auth.users con datos del negocio y el rol RBAC.';

-- ============================================================
-- TABLA: mesas
-- ============================================================

CREATE TABLE public.mesas (
id SERIAL PRIMARY KEY,
numero INTEGER NOT NULL UNIQUE,
zona TEXT, -- Ej: 'terraza', 'salon_principal'
capacidad SMALLINT NOT NULL DEFAULT 4,
estado public.estado_mesa NOT NULL DEFAULT 'disponible',
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: categorias
-- ============================================================

CREATE TABLE public.categorias (
id SERIAL PRIMARY KEY,
nombre TEXT NOT NULL UNIQUE,
descripcion TEXT,
activa BOOLEAN NOT NULL DEFAULT TRUE,
orden SMALLINT NOT NULL DEFAULT 0, -- Para ordenar en la UI
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: productos_menu
-- ============================================================

CREATE TABLE public.productos_menu (
id SERIAL PRIMARY KEY,
categoria_id INTEGER NOT NULL REFERENCES public.categorias(id),
nombre TEXT NOT NULL,
descripcion TEXT,
precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
tipo public.tipo_producto NOT NULL DEFAULT 'alimento',
disponible BOOLEAN NOT NULL DEFAULT TRUE,
imagen_url TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ordenes
-- ============================================================

CREATE TABLE public.ordenes (
    id BIGSERIAL PRIMARY KEY,
    mesa_id INTEGER NOT NULL REFERENCES public.mesas(id) ON DELETE RESTRICT,
    mesero_id UUID NOT NULL REFERENCES public.perfiles(id),
    comensales INTEGER,
    estado public.estado_orden NOT NULL DEFAULT 'pendiente',
    notas TEXT,
    total NUMERIC(10,2),
    alimentos_servidos BOOLEAN NOT NULL DEFAULT FALSE,   -- Track food serve validation
    bebidas_servidos BOOLEAN NOT NULL DEFAULT FALSE,     -- Track drink serve validation
    metodo_pago public.tipo_pago,
    pagado_con NUMERIC(10,2),
    cerrado_por_id UUID REFERENCES public.perfiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ordenes_mesa_id ON public.ordenes(mesa_id);
CREATE INDEX idx_ordenes_mesero_id ON public.ordenes(mesero_id);
CREATE INDEX idx_ordenes_estado ON public.ordenes(estado);

-- ============================================================
-- TABLA: detalles_orden
-- ============================================================

CREATE TABLE public.detalles_orden (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES public.productos_menu(id),
    cantidad SMALLINT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL,
    notas TEXT,
    tipo public.tipo_producto NOT NULL,
    ronda INTEGER NOT NULL DEFAULT 1,         -- Round number (1 = initial, increments on each add)
    listo BOOLEAN NOT NULL DEFAULT FALSE,
    servido BOOLEAN NOT NULL DEFAULT FALSE,    -- Waiter has served this item to table
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_detalles_orden_id ON public.detalles_orden(orden_id);
CREATE INDEX idx_detalles_tipo ON public.detalles_orden(tipo, listo);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
;

-- Aplicar el trigger a todas las tablas con updated_at
CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_mesas_updated_at
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_productos_updated_at
  BEFORE UPDATE ON public.productos_menu
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_ordenes_updated_at
  BEFORE UPDATE ON public.ordenes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN + TRIGGER: crear perfil automáticamente al registrar usuario
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS
$$

BEGIN
INSERT INTO public.perfiles (id, nombre, rol)
VALUES (
NEW.id,
COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
COALESCE((NEW.raw_user_meta_data->>'rol')::public.rol_usuario, 'mesero')
);
RETURN NEW;
END;

$$
;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLA: aperturas_turno (programación de turnos por sucursal)
-- ============================================================

CREATE TABLE public.aperturas_turno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  recurrencia TEXT CHECK (recurrencia IN ('semanal', 'mensual')), -- NULL = día único
  recurrencia_fin DATE, -- fecha fin de recurrencia
  creada_por UUID REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aperturas_turno_sucursal_fecha ON public.aperturas_turno(sucursal_id, fecha);
CREATE INDEX idx_aperturas_turno_busqueda ON public.aperturas_turno(sucursal_id, fecha, activa) WHERE activa = true;

COMMENT ON TABLE public.aperturas_turno IS 'Programación de ventanas de turno por sucursal. El admin define cuándo los meseros pueden registrar turno.';
COMMENT ON COLUMN public.aperturas_turno.recurrencia IS 'NULL = día único, semanal = todos los días de la semana, mensual = todos los días del mes, anual = todos los días del año';
COMMENT ON COLUMN public.aperturas_turno.recurrencia_fin IS 'Fecha fin de la recurrencia';

-- ============================================================
-- TABLA: aperturas_excepciones (modificaciones a días individuales)
-- ============================================================

CREATE TABLE public.aperturas_excepciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apertura_id UUID NOT NULL REFERENCES public.aperturas_turno(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_excepciones_apertura_fecha ON public.aperturas_excepciones(apertura_id, fecha);

COMMENT ON TABLE public.aperturas_excepciones IS 'Modificaciones manuales a días específicos de una apertura recurrente.';

-- ============================================================
-- TABLA: turnos (registro individual de mesero)
-- ============================================================

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

CREATE INDEX idx_turnos_usuario_activo ON public.turnos(usuario_id, activo) WHERE activo = true;
CREATE INDEX idx_turnos_sucursal_activo ON public.turnos(sucursal_id, activo) WHERE activo = true;

COMMENT ON TABLE public.turnos IS 'Registro de turno de cada mesero. Activo mientras el mesero esté trabajando.';

CREATE TRIGGER trg_turnos_updated_at BEFORE UPDATE ON public.turnos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DATOS SEMILLA (seed)
-- ============================================================

INSERT INTO public.mesas (numero, zona, capacidad) VALUES
  (1, 'salon_principal', 4),
  (2, 'salon_principal', 4),
  (3, 'salon_principal', 6),
  (4, 'terraza', 2),
  (5, 'terraza', 4),
  (10, 'barra', 1);

INSERT INTO public.categorias (nombre, orden) VALUES
  ('Entradas', 1),
  ('Platos Fuertes', 2),
  ('Postres', 3),
  ('Bebidas Sin Alcohol', 4),
  ('Bebidas Con Alcohol', 5);
$$

-- Función helper: devuelve el rol del usuario autenticado
-- SECURITY DEFINER = corre con privilegios del propietario, evita recursión en RLS
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT rol FROM public.perfiles WHERE id = auth.uid();

$$
;

-- Politicas completas
ALTER TABLE public.perfiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_menu  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_orden  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aperturas_turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos          ENABLE ROW LEVEL SECURITY;

-- Politicas de perfiles
-- Cualquier usuario autenticado puede ver su propio perfil
CREATE POLICY "perfil_select_propio"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin/super_admin pueden ver todos los perfiles
CREATE POLICY "perfil_select_admin"
  ON public.perfiles FOR SELECT
  TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'));

-- Solo super_admin puede crear/modificar perfiles de otros
CREATE POLICY "perfil_update_super_admin"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (public.get_my_rol() = 'super_admin');

-- Usuario puede actualizar su propio nombre (no su rol)
CREATE POLICY "perfil_update_propio"
  ON public.perfiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND rol = (SELECT rol FROM public.perfiles WHERE id = auth.uid()) -- El rol no puede cambiar
  );

  -- Politicas de mesas
  -- Todos los autenticados pueden ver mesas
CREATE POLICY "mesas_select_all"
  ON public.mesas FOR SELECT
  TO authenticated
  USING (TRUE);

-- Solo admin/caja pueden modificar estado de mesas
CREATE POLICY "mesas_update_admin_caja"
  ON public.mesas FOR UPDATE
  TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin', 'caja'));

  -- Politicas para categorias y productos
  -- Lectura pública para autenticados (meseros necesitan ver el menú)
CREATE POLICY "categorias_select_all"
  ON public.categorias FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "productos_select_all"
  ON public.productos_menu FOR SELECT TO authenticated USING (disponible = TRUE);

-- Solo admin gestiona el menú
CREATE POLICY "productos_admin_full"
  ON public.productos_menu FOR ALL
  TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'));


  -- Politicas para aperturas_turno
-- Admin/super_admin: control total
CREATE POLICY "aperturas_admin_full"
  ON public.aperturas_turno FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'))
  WITH CHECK (public.get_my_rol() IN ('super_admin', 'admin'));

-- Mesero: solo ver aperturas activas del día
CREATE POLICY "aperturas_select_mesero"
  ON public.aperturas_turno FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'mesero' AND activa = true AND fecha = CURRENT_DATE);

-- Otros: lectura general
CREATE POLICY "aperturas_select_otros"
  ON public.aperturas_turno FOR SELECT TO authenticated
  USING (true);

-- Politicas para aperturas_excepciones
ALTER TABLE public.aperturas_excepciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excepciones_admin_full"
  ON public.aperturas_excepciones FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'))
  WITH CHECK (public.get_my_rol() IN ('super_admin', 'admin'));

CREATE POLICY "excepciones_select_mesero"
  ON public.aperturas_excepciones FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'mesero');

-- Politicas para turnos
-- Admin: control total
CREATE POLICY "turnos_admin_full"
  ON public.turnos FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'))
  WITH CHECK (public.get_my_rol() IN ('super_admin', 'admin'));

-- Mesero: solo sus propios turnos
CREATE POLICY "turnos_select_mesero"
  ON public.turnos FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'mesero' AND usuario_id = auth.uid());

-- Mesero: puede registrar su turno
CREATE POLICY "turnos_insert_mesero"
  ON public.turnos FOR INSERT TO authenticated
  WITH CHECK (public.get_my_rol() = 'mesero' AND usuario_id = auth.uid());

-- Mesero: cerrar su propio turno
CREATE POLICY "turnos_update_mesero"
  ON public.turnos FOR UPDATE TO authenticated
  USING (public.get_my_rol() = 'mesero' AND usuario_id = auth.uid() AND activo = true)
  WITH CHECK (usuario_id = auth.uid() AND (activo = false OR fin IS NOT NULL));

-- Politicas para ordenes
  -- Meseros: solo ven sus propias órdenes activas
CREATE POLICY "ordenes_select_mesero"
  ON public.ordenes FOR SELECT
  TO authenticated
  USING (
    public.get_my_rol() = 'mesero'
    AND mesero_id = auth.uid()
  );

-- Cocina: ve todas las órdenes con ítems de tipo alimento pendientes
CREATE POLICY "ordenes_select_cocina"
  ON public.ordenes FOR SELECT
  TO authenticated
  USING (
    public.get_my_rol() = 'cocina'
    AND estado IN ('pendiente', 'en_preparacion', 'listo')
    AND EXISTS (
      SELECT 1 FROM public.detalles_orden
      WHERE orden_id = ordenes.id AND tipo = 'alimento'
    )
  );

-- Barra: igual que cocina pero para bebidas
CREATE POLICY "ordenes_select_barra"
  ON public.ordenes FOR SELECT
  TO authenticated
  USING (
    public.get_my_rol() = 'barra'
    AND estado IN ('pendiente', 'en_preparacion', 'listo')
    AND EXISTS (
      SELECT 1 FROM public.detalles_orden
      WHERE orden_id = ordenes.id AND tipo = 'bebida'
    )
  );

-- Caja: ve todas las órdenes (necesita gestionar pagos)
CREATE POLICY "ordenes_select_caja"
  ON public.ordenes FOR SELECT
  TO authenticated
  USING (public.get_my_rol() IN ('caja', 'admin', 'super_admin'));

-- Mesero: puede crear órdenes
CREATE POLICY "ordenes_insert_mesero"
  ON public.ordenes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_rol() IN ('mesero', 'admin', 'super_admin')
    AND mesero_id = auth.uid()
  );

-- Mesero: puede actualizar sus órdenes en estados activos (no cerradas)
CREATE POLICY "ordenes_update_mesero"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'mesero'
    AND mesero_id = auth.uid()
    AND estado IN ('pendiente', 'listo', 'entregado')
  )
  WITH CHECK (
    estado IN ('en_preparacion', 'entregado', 'cuenta_solicitada', 'cancelado')
  );

-- Cocina: puede cambiar estado a en_preparacion y listo (solo sus ítems de alimento)
CREATE POLICY "ordenes_update_cocina"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'cocina'
    AND estado IN ('pendiente', 'en_preparacion')
  )
  WITH CHECK (estado IN ('en_preparacion', 'listo'));

-- Barra: igual que cocina para bebidas
CREATE POLICY "ordenes_update_barra"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (
    public.get_my_rol() = 'barra'
    AND estado IN ('pendiente', 'en_preparacion')
  )
  WITH CHECK (estado IN ('en_preparacion', 'listo'));

-- Caja: puede marcar como cerrado/cancelado y registrar pago
CREATE POLICY "ordenes_update_caja"
  ON public.ordenes FOR UPDATE
  TO authenticated
  USING (public.get_my_rol() IN ('caja', 'admin', 'super_admin'));

-- Admin: control total
CREATE POLICY "ordenes_admin_full"
  ON public.ordenes FOR ALL
  TO authenticated
  USING (public.get_my_rol() IN ('super_admin', 'admin'));


  -- Politicas para detalles orden
  -- Ver detalles: heredan las mismas reglas que ordenes
CREATE POLICY "detalles_select_mesero"
  ON public.detalles_orden FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ordenes o
      WHERE o.id = detalles_orden.orden_id
        AND o.mesero_id = auth.uid()
    )
  );

CREATE POLICY "detalles_select_cocina"
  ON public.detalles_orden FOR SELECT
  TO authenticated
  USING (
    public.get_my_rol() = 'cocina'
    AND tipo = 'alimento'
  );

CREATE POLICY "detalles_select_barra"
  ON public.detalles_orden FOR SELECT
  TO authenticated
  USING (
    public.get_my_rol() = 'barra'
    AND tipo = 'bebida'
  );

CREATE POLICY "detalles_select_caja_admin"
  ON public.detalles_orden FOR SELECT
  TO authenticated
  USING (public.get_my_rol() IN ('caja', 'admin', 'super_admin'));

-- Insertar detalles: mesero al crear la orden
CREATE POLICY "detalles_insert_mesero"
  ON public.detalles_orden FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_rol() IN ('mesero', 'admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM public.ordenes o
      WHERE o.id = detalles_orden.orden_id
        AND o.mesero_id = auth.uid()
        AND o.estado = 'pendiente'
    )
  );

-- Marcar ítem como listo: cocina/barra
CREATE POLICY "detalles_update_estacion"
  ON public.detalles_orden FOR UPDATE
  TO authenticated
  USING (
    (public.get_my_rol() = 'cocina' AND tipo = 'alimento')
    OR (public.get_my_rol() = 'barra' AND tipo = 'bebida')
    OR public.get_my_rol() IN ('admin', 'super_admin')
  );
$$
