# Estado del Sistema — Parrilla Norteña Soft

## Arquitectura

- **Framework**: Next.js 15 (App Router)
- **Auth**: Supabase Auth (email/password)
- **DB**: Supabase PostgreSQL
- **ORM**: Supabase JS client (tipos generados en `types/database.types.ts`)
- **Realtime**: Supabase Realtime (órdenes, mesas)
- **Estilos**: Tailwind CSS (modo oscuro)
- **Componentes**: Lucide React (iconos), Sonner (toasts)

---

## Rutas del Sistema

### Públicas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | Client Component | Login con 2 pasos: email/password → selección sucursal (con registro de turno para meseros) |
| `/auth/callback` | Server Component | Callback OAuth de Supabase |

### Admin Global (super_admin, administrador)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin` | Server | Dashboard global con resumen de sucursales |
| `/admin/roles` | Server + `RolesClient` | CRUD de roles dinámicos + asignación de permisos por rol |
| `/admin/usuarios` | Server + `AdminUsuariosClient` | CRUD de usuarios con asignación de sucursales |
| `/admin/sucursales` | Server + `SucursalesClient` | CRUD de sucursales (con clonación de menú) |
| `/admin/turnos` | Server | Vista global de turnos |
| `/admin/menu` | Server | Selector de sucursal para editar menú |

### Admin por Sucursal (administrador, gerente_sucursal)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/{slug}/admin` | Server | Dashboard de la sucursal (stats, accesos rápidos) |
| `/{slug}/admin/menu` | Server + `AdminMenuClient` | CRUD de categorías y productos del menú |
| `/{slug}/admin/mesas` | Server + `AdminMesasClient` | CRUD de mesas + generación por rango |
| `/{slug}/admin/usuarios` | Server + `SucursalUsuariosClient` | Asignar/remover usuarios de la sucursal |
| `/{slug}/admin/turnos` | Server + `TurnosBranchClient` | Calendario de aperturas de turno + excepciones |

### Mesero

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/{slug}/mesero` | Server | Dashboard del mesero |
| `/{slug}/mesero/mapa` | Server + `TableMap` | Mapa interactivo de mesas con tiempo real |
| `/{slug}/mesero/mesas/[mesaId]` | Server + `ActiveOrderView` | Orden activa de una mesa |
| `/{slug}/mesero/mesas/[mesaId]/nueva` | Server + `NewOrderView` | Crear nueva orden con selector de menú |
| `/{slug}/mesero/ordenes` | Server + `OrderHistoryView` | Historial de órdenes del día |
| `/{slug}/mesero/registrar-turno` | Client | Página para registrar turno (sin apertura activa) |

### Cocina

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/{slug}/cocina` | Client + `StationQueue` | Cola de órdenes con items tipo alimento |

### Barra

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/{slug}/barra` | Client + `StationQueue` | Cola de órdenes con items tipo bebida |

### Caja

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/{slug}/caja` | Client | Dashboard de caja: órdenes por cobrar |
| `/{slug}/caja/ordenes/[ordenId]/cobrar` | Client | Pantalla de cobro: items, descuento, cambio, ticket térmico |
| `/{slug}/caja/historial` | Client | Historial de ventas con filtros y totales |

### API

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/ordenes/[id]/estado` | PATCH | Cambia estado de orden con validación de transiciones |

---

## Base de Datos

### Tablas (15)

| Tabla | Columnas clave | Propósito |
|-------|---------------|-----------|
| `perfiles` | `id`, `rol` (TEXT), `nombre`, `activo` | Perfiles de usuario 1:1 con auth.users |
| `sucursales` | `id`, `slug`, `nombre`, `activa` | Sucursales/restaurantes |
| `usuario_sucursales` | `usuario_id`, `sucursal_id` | Asignación usuario ↔ sucursal |
| `roles` | `nombre`, `etiqueta`, `descripcion` | Roles dinámicos (CRUD desde UI) |
| `permisos` | `codigo`, `descripcion` | Catálogo de permisos |
| `roles_permisos` | `rol_nombre`, `permiso_codigo` | Asignación permiso → rol |
| `mesas` | `numero`, `zona`, `capacidad`, `estado`, `sucursal_id` | Mesas del restaurante |
| `ordenes` | `estado`, `mesa_id`, `mesero_id`, `sucursal_id`, `total`, `metodo_pago` | Órdenes (cabecera) |
| `detalles_orden` | `producto_id`, `cantidad`, `precio_unitario`, `tipo`, `listo`, `servido`, `ronda` | Items de la orden |
| `categorias` | `nombre`, `tipo`, `orden`, `sucursal_id` | Categorías del menú |
| `productos_menu` | `nombre`, `precio`, `tipo`, `categoria_id`, `sucursal_id`, `imagen_url` | Productos del menú |
| `aperturas_turno` | `fecha`, `hora_inicio`, `hora_fin`, `recurrencia`, `sucursal_id` | Aperturas de turno (horarios) |
| `aperturas_excepciones` | `apertura_id`, `fecha`, `hora_inicio`, `hora_fin` | Excepciones a aperturas recurrentes |
| `registro_turnos_personal` | `usuario_id`, `sucursal_id`, `apertura_id`, `activo`, `inicio`, `fin` | Registro de turno del personal |
| `turnos` | (alias de registro_turnos_personal) | Legacy |

### Enums

| Enum | Valores |
|------|---------|
| `estado_mesa` | `disponible`, `ocupada`, `reservada`, `fuera_de_servicio` |
| `estado_orden` | `pendiente`, `en_preparacion`, `listo`, `entregado`, `cuenta_solicitada`, `cerrado`, `cancelado` |
| `tipo_producto` | `alimento`, `bebida`, `combo`, `postre` |

### Funciones SQL

| Función | Propósito |
|---------|-----------|
| `tiene_permiso(codigo TEXT)` → BOOLEAN | Verifica si el usuario tiene un permiso vía roles_permisos |
| `mis_permisos()` → SETOF TEXT | Todos los códigos de permiso del usuario actual |
| `es_mi_orden(orden_id_param BIGINT)` → BOOLEAN | SECURITY DEFINER: verifica que la orden pertenece al auth.uid() sin activar RLS |
| `handle_new_user()` | Trigger: crea perfil automático al registrarse |
| `handle_updated_at()` | Trigger: actualiza `updated_at` automáticamente |

### Códigos de Permiso

| Código | Roles asignados |
|--------|----------------|
| `roles.administrar` | super_admin |
| `usuarios.administrar` | super_admin, administrador, gerente_sucursal |
| `usuario_sucursal.asignar` | super_admin, administrador |
| `sucursales.administrar` | super_admin, administrador |
| `sucursal.turnos.administrar` | super_admin, administrador, gerente_sucursal |
| `sucursal.mesas.administrar` | super_admin, administrador, gerente_sucursal |
| `sucursal.menu.administrar` | super_admin, administrador, gerente_sucursal |
| `sucursal.ordenes.administrar` | super_admin, administrador, gerente_sucursal, caja |
| `turnos.registrar` | mesero, caja, cocina, barra, gerente_sucursal |
| `turnos.cerrar_cualquiera` | super_admin, administrador, gerente_sucursal |
| `ordenes.cocina` | cocina |
| `ordenes.barra` | barra |

### RLS Policies

Todas las tablas con RLS usan `public.tiene_permiso('codigo')`:

| Tabla | Políticas |
|-------|-----------|
| `perfiles` | SELECT propio (`id = auth.uid()`), SELECT admin (`usuarios.administrar`), UPDATE propio, UPDATE admin (`usuarios.administrar`) |
| `sucursales` | SELECT ALL (`true`), INSERT/UPDATE/DELETE admin (`sucursales.administrar`) |
| `usuario_sucursales` | SELECT/INSERT/UPDATE/DELETE admin (`usuario_sucursal.asignar`) |
| `mesas` | SELECT ALL, INSERT/UPDATE/DELETE admin (`sucursal.mesas.administrar`) |
| `categorias` | SELECT ALL, ALL admin (`sucursal.menu.administrar`) |
| `productos_menu` | SELECT ALL (solo disponibles), ALL admin (`sucursal.menu.administrar`) |
| `aperturas_turno` | ALL admin (`sucursal.turnos.administrar`), SELECT mesero (`turnos.registrar` + fecha/hora activa), SELECT otros (`true`) |
| `aperturas_excepciones` | ALL admin (`sucursal.turnos.administrar`), SELECT mesero (`turnos.registrar`) |
| `registro_turnos_personal` | ALL admin (`sucursal.turnos.administrar`), SELECT/INSERT/UPDATE propio (`turnos.registrar`) |
| `ordenes` | SELECT/INSERT/UPDATE por rol según permiso específico (`turnos.registrar`, `ordenes.cocina`, `ordenes.barra`, `sucursal.ordenes.administrar`) |
| `detalles_orden` | SELECT/INSERT/UPDATE por rol según permiso específico |

---

## Server Actions (18 archivos)

| Archivo | Acciones | Permiso Requerido |
|---------|----------|-------------------|
| `roles.ts` | crearRol, eliminarRol, actualizarRol, asignarPermiso, removerPermiso | `roles.administrar` |
| `usuarios.ts` | crearUsuario, actualizarUsuario, toggleActivoUsuario, eliminarUsuario, asignarSucursal, removerSucursal | `usuarios.administrar` / `usuario_sucursal.asignar` |
| `sucursales.ts` | crearSucursal, actualizarSucursal, toggleSucursalActiva, eliminarSucursal | `sucursales.administrar` |
| `turnos.ts` | programarApertura, modificarApertura, eliminarApertura, crearExcepcion, eliminarExcepcion, registrarTurno, cerrarTurno, reasignarTurno | `sucursal.turnos.administrar` / `turnos.registrar` / `turnos.cerrar_cualquiera` |
| `categorias.ts` | crearCategoria, editarCategoria, eliminarCategoria | `sucursal.menu.administrar` |
| `productos.ts` | crearProducto, editarProducto, eliminarProducto | `sucursal.menu.administrar` |
| `subirImagen.ts` | subirImagen, eliminarImagen | `sucursal.menu.administrar` |
| `generarMesas.ts` | generarMesas | `sucursal.mesas.administrar` |
| `actualizarMesa.ts` | actualizarMesa, cambiarEstadoMesa, eliminarMesa | `sucursal.mesas.administrar` |
| `crearOrden.ts` | crearOrden | Requiere turno activo |
| `crearSubOrden.ts` | crearSubOrden | Requiere turno activo |
| `solicitarCuenta.ts` | solicitarCuenta | Mesero (propia orden) |
| `servirCategoria.ts` | servirCategoria | Mesero (propia orden) |
| `marcarOrdenLista.ts` | marcarOrdenLista | `ordenes.cocina` / `ordenes.barra` |
| `marcarItemListo.ts` | marcarItemListo | `ordenes.cocina` / `ordenes.barra` |
| `marcarEntregado.ts` | marcarEntregado | Mesero (propia orden) |
| `abrirMesa.ts` | abrirMesa | Requiere turno activo |
| `crearSuperAdmin.ts` | crearSuperAdmin | Utilidad |

---

## Componentes

### Layout

| Componente | Tipo | Descripción |
|-----------|------|-------------|
| `AppShell` | Client | Shell principal: sidebar + header + contenido. Drawer móvil. |
| `Sidebar` | Client | Sidebar colapsable con navegación por rol. Logo, avatar, role badge, logout. |
| `Header` | Client | Header superior con hamburguesa, logo, área central dinámica, UserMenu. |
| `UserMenu` | Client | Dropdown de usuario: avatar, nombre, rol, logout con confirmación. |
| `RoleBadge` | Client | Badge coloreado con el nombre del rol. |

### Providers

| Componente | Descripción |
|-----------|-------------|
| `SessionProvider` | Context de sesión: `{ user, perfil, rol, isLoading, refresh }`. Escucha cambios de auth. |
| `PermisoProvider` | Context de permisos: `{ permisos (Set), can(codigo) }`. Carga vía `mis_permisos()` RPC. |
| `SucursalProvider` | Context: `{ id, slug, nombre }` de la sucursal actual. |
| `NavigationProvider` | Wrap de router con overlay de carga. Exporta `useNavigate()`. |
| `HeaderActionsProvider` | Permite a hijos insertar contenido en el centro del header. |

### Funcionales

| Componente | Ubicación | Descripción |
|-----------|-----------|-------------|
| `TableMap` | mesas/ | Mapa interactivo de mesas con tiempo real, búsqueda, filtros, grupos por zona |
| `TableCard` | mesas/ | Card visual de mesa con estado, tiempo transcurrido, comensales |
| `MapaHeader` | mesas/ | Header del mapa (nombre sucursal) |
| `StationQueue` | kitchen/ | Cola de órdenes para cocina/barra |
| `StationTicket` | kitchen/ | Ticket de orden individual con timer y urgencia |
| `ItemCheckbox` | kitchen/ | Checkbox para marcar item individual como listo |
| `OrderTimer` | kitchen/ | Timer de tiempo transcurrido |
| `AlertBell` | kitchen/ | Alerta "EXCEDE TIEMPO" |
| `OrderBill` | checkout/ | Cuenta detallada: subtotal, descuento, total |
| `PaymentPanel` | checkout/ | Selector de método de pago + monto recibido |
| `ReceiptPreview` | checkout/ | Preview de ticket + impresión térmica |
| `DiscountInput` | checkout/ | Input de descuento (% o fijo) |
| `ChangeCalculator` | checkout/ | Cálculo de cambio |
| `OrderCard` | orders/ | Card de orden con items, badges, botones de acción |
| `WaiterNotification` | — | Escucha Realtime: alerta sonora cuando orden pasa a "listo" |

### UI Base

`Button`, `Card`, `Modal`, `BackButton`, `LoadingOverlay`, `Badge`, `EmptyState`, `Spinner`

---

## Middleware

- Protege todas las rutas excepto `/login`, `/auth/callback`, assets estáticos y `/api/*`
- Extrae `sucursal_slug` del path y valida que exista
- Verifica que el usuario tenga acceso a la sucursal
- Redirige por rol: `/admin*` → super_admin/administrador (global) o gerente_sucursal (branch), `/caja*` → caja/gerente_sucursal/super_admin, etc.
- Para meseros: verifica turno activo, redirige a registrar-turno si no tiene

---

## Flujo de Login

1. Email/password → `supabase.auth.signInWithPassword()`
2. Verifica `perfiles.activo = true`
3. **super_admin / administrador** → `/admin` (directo, sin sucursal)
4. **Resto de roles** → verifica turno activo → si existe, redirige directo al dashboard del rol
5. Si no hay turno activo: carga sucursales asignadas
   - **mesero**: filtra sucursales con apertura activa (considerando recurrencias y excepciones)
   - **caja, cocina, barra, gerente_sucursal**: muestra todas las sucursales asignadas
6. Selecciona sucursal → confirma registro de turno → `registrarTurno()` → redirige a `/{slug}/{ruta_inicio}` según rol

---

## Pendiente

- [ ] **Permisos excepcionales por usuario** — hoy los permisos son solo por rol. No hay forma de darle un permiso extra a un usuario específico.
- [ ] **Permisos por sucursal** — hoy los permisos son globales (si tienes `sucursal.mesas.administrar`, aplica en todas tus sucursales). No hay granularidad por sucursal.
- [ ] **SSR inicial de `usePermiso`** — pasar permisos desde el servidor al `PermisoProvider` para evitar el flash de carga inicial.
- [ ] **Pruebas de integración RBAC** — verificar que cada permiso realmente protege su recurso.
- [ ] **Logs de auditoría** — registrar quién cambió permisos, roles, y acciones críticas.
- [ ] **UI de asignación masiva** — asignar permisos a múltiples roles a la vez.
