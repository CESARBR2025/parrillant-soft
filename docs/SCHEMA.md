-- Tablas
[
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": "gen_random_uuid()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "apertura_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "fecha",
"data_type": "date",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "hora_inicio",
"data_type": "time without time zone",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "hora_fin",
"data_type": "time without time zone",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_excepciones",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": "gen_random_uuid()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "fecha",
"data_type": "date",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "hora_inicio",
"data_type": "time without time zone",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "hora_fin",
"data_type": "time without time zone",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "activa",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "creada_por",
"data_type": "uuid",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "recurrencia",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "aperturas_turno",
"column_name": "recurrencia_fin",
"data_type": "date",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": "nextval('categorias_id_seq'::regclass)",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "descripcion",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "activa",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "orden",
"data_type": "smallint",
"is_nullable": "NO",
"column_default": "0",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "categorias",
"column_name": "tipo",
"data_type": "USER-DEFINED",
"is_nullable": "NO",
"column_default": "'alimento'::tipo_producto",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "id",
"data_type": "bigint",
"is_nullable": "NO",
"column_default": "nextval('detalles_orden_id_seq'::regclass)",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "orden_id",
"data_type": "bigint",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "producto_id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "cantidad",
"data_type": "smallint",
"is_nullable": "NO",
"column_default": "1",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "precio_unitario",
"data_type": "numeric",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "notas",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "tipo",
"data_type": "USER-DEFINED",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "listo",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "false",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "ronda",
"data_type": "integer",
"is_nullable": "NO",
"column_default": "1",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "detalles_orden",
"column_name": "servido",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "false",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": "nextval('mesas_id_seq'::regclass)",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "numero",
"data_type": "integer",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "zona",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "capacidad",
"data_type": "smallint",
"is_nullable": "NO",
"column_default": "4",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "estado",
"data_type": "USER-DEFINED",
"is_nullable": "NO",
"column_default": "'disponible'::estado_mesa",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "updated_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "mesas",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "id",
"data_type": "bigint",
"is_nullable": "NO",
"column_default": "nextval('ordenes_id_seq'::regclass)",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "mesa_id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "mesero_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "estado",
"data_type": "USER-DEFINED",
"is_nullable": "NO",
"column_default": "'pendiente'::estado_orden",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "notas",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "total",
"data_type": "numeric",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "pagado_con",
"data_type": "numeric",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "metodo_pago",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "cerrado_por_id",
"data_type": "uuid",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "updated_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "comensales",
"data_type": "integer",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "alimentos_servidos",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "false",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "bebidas_servidos",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "false",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "orden_padre_id",
"data_type": "integer",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "ordenes",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "rol",
"data_type": "text",
"is_nullable": "NO",
"column_default": "'mesero'::text",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "apellido",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "activo",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "perfiles",
"column_name": "updated_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "permisos",
"column_name": "codigo",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "permisos",
"column_name": "descripcion",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "permisos",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": "nextval('productos_menu_id_seq'::regclass)",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "categoria_id",
"data_type": "integer",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "descripcion",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "precio",
"data_type": "numeric",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "tipo",
"data_type": "USER-DEFINED",
"is_nullable": "NO",
"column_default": "'alimento'::tipo_producto",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "disponible",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "imagen_url",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "updated_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "productos_menu",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": "gen_random_uuid()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "apertura_id",
"data_type": "uuid",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "usuario_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "inicio",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "fin",
"data_type": "timestamp with time zone",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "activo",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "reasignado_de",
"data_type": "uuid",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "cerrado_por",
"data_type": "uuid",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "notas",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "registro_turnos_personal",
"column_name": "updated_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles",
"column_name": "nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles",
"column_name": "etiqueta",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles",
"column_name": "descripcion",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles",
"column_name": "nivel",
"data_type": "integer",
"is_nullable": "NO",
"column_default": "1",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles_permisos",
"column_name": "rol_nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles_permisos",
"column_name": "permiso_codigo",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "roles_permisos",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": "gen_random_uuid()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "slug",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "nombre",
"data_type": "text",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "direccion",
"data_type": "text",
"is_nullable": "YES",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "activa",
"data_type": "boolean",
"is_nullable": "NO",
"column_default": "true",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "sucursales",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "usuario_sucursales",
"column_name": "usuario_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "usuario_sucursales",
"column_name": "sucursal_id",
"data_type": "uuid",
"is_nullable": "NO",
"column_default": null,
"character_maximum_length": null
},
{
"table_schema": "public",
"table_name": "usuario_sucursales",
"column_name": "created_at",
"data_type": "timestamp with time zone",
"is_nullable": "NO",
"column_default": "now()",
"character_maximum_length": null
}
]

-- POLITICAS RSL
[
{
"schemaname": "public",
"tablename": "aperturas_excepciones",
"policyname": "excepciones_admin_full",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.turnos.administrar'::text)",
"with_check": "tiene_permiso('sucursal.turnos.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "aperturas_excepciones",
"policyname": "excepciones_select_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('turnos.registrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "aperturas_turno",
"policyname": "aperturas_admin_full",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.turnos.administrar'::text)",
"with_check": "tiene_permiso('sucursal.turnos.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "aperturas_turno",
"policyname": "aperturas_select_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('turnos.registrar'::text) AND (activa = true) AND (fecha = CURRENT_DATE) AND ((hora_inicio)::time with time zone <= CURRENT_TIME) AND ((hora_fin)::time with time zone >= CURRENT_TIME))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "aperturas_turno",
"policyname": "aperturas_select_otros",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "true",
"with_check": null
},
{
"schemaname": "public",
"tablename": "categorias",
"policyname": "categorias_admin_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.menu.administrar'::text)",
"with_check": "tiene_permiso('sucursal.menu.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "categorias",
"policyname": "categorias_select_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "true",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_insert_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "(tiene_permiso('turnos.registrar'::text) AND (EXISTS ( SELECT 1\n FROM ordenes o\n WHERE ((o.id = detalles_orden.orden_id) AND (o.mesero_id = auth.uid()) AND (o.estado = 'pendiente'::estado_orden)))))"
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_select_barra",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('ordenes.barra'::text) AND (tipo = 'bebida'::tipo_producto))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_select_caja_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('sucursal.ordenes.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_select_cocina",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('ordenes.cocina'::text) AND (tipo = 'alimento'::tipo_producto))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_select_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(EXISTS ( SELECT 1\n FROM ordenes o\n WHERE ((o.id = detalles_orden.orden_id) AND (o.mesero_id = auth.uid()))))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_update_estacion",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "((tiene_permiso('ordenes.cocina'::text) AND (tipo = 'alimento'::tipo_producto)) OR (tiene_permiso('ordenes.barra'::text) AND (tipo = 'bebida'::tipo_producto)) OR tiene_permiso('sucursal.ordenes.administrar'::text))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "detalles_orden",
"policyname": "detalles_update_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "(tiene_permiso('turnos.registrar'::text) AND (EXISTS ( SELECT 1\n FROM ordenes o\n WHERE ((o.id = detalles_orden.orden_id) AND (o.estado = ANY (ARRAY['listo'::estado_orden, 'entregado'::estado_orden, 'cuenta_solicitada'::estado_orden, 'cerrado'::estado_orden]))))))",
"with_check": "(EXISTS ( SELECT 1\n FROM ordenes o\n WHERE ((o.id = detalles_orden.orden_id) AND (o.estado = ANY (ARRAY['listo'::estado_orden, 'entregado'::estado_orden, 'cuenta_solicitada'::estado_orden, 'cerrado'::estado_orden])))))"
},
{
"schemaname": "public",
"tablename": "mesas",
"policyname": "mesas_delete_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "DELETE",
"qual": "tiene_permiso('sucursal.mesas.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "mesas",
"policyname": "mesas_insert_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "tiene_permiso('sucursal.mesas.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "mesas",
"policyname": "mesas_select_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "true",
"with_check": null
},
{
"schemaname": "public",
"tablename": "mesas",
"policyname": "mesas_update_admin_caja",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "tiene_permiso('sucursal.mesas.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_admin_full",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.ordenes.administrar'::text)",
"with_check": "tiene_permiso('sucursal.ordenes.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_insert_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "(tiene_permiso('turnos.registrar'::text) AND (mesero_id = auth.uid()))"
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_select_barra",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('ordenes.barra'::text) AND (estado = ANY (ARRAY['pendiente'::estado_orden, 'en_preparacion'::estado_orden, 'listo'::estado_orden])) AND (EXISTS ( SELECT 1\n FROM detalles_orden\n WHERE ((detalles_orden.orden_id = ordenes.id) AND (detalles_orden.tipo = 'bebida'::tipo_producto)))))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_select_caja",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('sucursal.ordenes.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_select_cocina",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('ordenes.cocina'::text) AND (estado = ANY (ARRAY['pendiente'::estado_orden, 'en_preparacion'::estado_orden, 'listo'::estado_orden])) AND (EXISTS ( SELECT 1\n FROM detalles_orden\n WHERE ((detalles_orden.orden_id = ordenes.id) AND (detalles_orden.tipo = 'alimento'::tipo_producto)))))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_select_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(tiene_permiso('turnos.registrar'::text) AND (mesero_id = auth.uid()))",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_update_barra",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "(tiene_permiso('ordenes.barra'::text) AND (estado = ANY (ARRAY['pendiente'::estado_orden, 'en_preparacion'::estado_orden])))",
"with_check": "(estado = ANY (ARRAY['en_preparacion'::estado_orden, 'listo'::estado_orden]))"
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_update_caja",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "tiene_permiso('sucursal.ordenes.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_update_cocina",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "(tiene_permiso('ordenes.cocina'::text) AND (estado = ANY (ARRAY['pendiente'::estado_orden, 'en_preparacion'::estado_orden])))",
"with_check": "(estado = ANY (ARRAY['en_preparacion'::estado_orden, 'listo'::estado_orden]))"
},
{
"schemaname": "public",
"tablename": "ordenes",
"policyname": "ordenes_update_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "(tiene_permiso('turnos.registrar'::text) AND (mesero_id = auth.uid()) AND (estado = ANY (ARRAY['pendiente'::estado_orden, 'listo'::estado_orden, 'entregado'::estado_orden])))",
"with_check": "(estado = ANY (ARRAY['en_preparacion'::estado_orden, 'entregado'::estado_orden, 'cuenta_solicitada'::estado_orden, 'cancelado'::estado_orden]))"
},
{
"schemaname": "public",
"tablename": "perfiles",
"policyname": "perfil_select_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('usuarios.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "perfiles",
"policyname": "perfil_select_propio",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(id = auth.uid())",
"with_check": null
},
{
"schemaname": "public",
"tablename": "perfiles",
"policyname": "perfil_update_propio",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "(id = auth.uid())",
"with_check": "((id = auth.uid()) AND (rol = ( SELECT perfiles_1.rol\n FROM perfiles perfiles_1\n WHERE (perfiles_1.id = auth.uid()))))"
},
{
"schemaname": "public",
"tablename": "perfiles",
"policyname": "perfil_update_super_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "tiene_permiso('usuarios.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "permisos",
"policyname": "permisos_all_super_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('roles.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "permisos",
"policyname": "permisos_select_super_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('roles.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "productos_menu",
"policyname": "productos_admin_full",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.menu.administrar'::text)",
"with_check": "tiene_permiso('sucursal.menu.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "productos_menu",
"policyname": "productos_select_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(disponible = true)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "registro_turnos_personal",
"policyname": "turnos_admin_full",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "ALL",
"qual": "tiene_permiso('sucursal.turnos.administrar'::text)",
"with_check": "tiene_permiso('sucursal.turnos.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "registro_turnos_personal",
"policyname": "turnos_insert_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "(tiene_permiso('turnos.registrar'::text) AND (usuario_id = auth.uid()))"
},
{
"schemaname": "public",
"tablename": "registro_turnos_personal",
"policyname": "turnos_select_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(usuario_id = auth.uid())",
"with_check": null
},
{
"schemaname": "public",
"tablename": "registro_turnos_personal",
"policyname": "turnos_update_mesero",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "((usuario_id = auth.uid()) AND (activo = true))",
"with_check": "((usuario_id = auth.uid()) AND ((activo = false) OR (fin IS NOT NULL)))"
},
{
"schemaname": "public",
"tablename": "roles_permisos",
"policyname": "roles_permisos_delete_super_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "DELETE",
"qual": "tiene_permiso('roles.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "roles_permisos",
"policyname": "roles_permisos_insert_super_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "tiene_permiso('roles.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "roles_permisos",
"policyname": "roles_permisos_select_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "true",
"with_check": null
},
{
"schemaname": "public",
"tablename": "sucursales",
"policyname": "sucursales_delete_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "DELETE",
"qual": "tiene_permiso('sucursales.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "sucursales",
"policyname": "sucursales_insert_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "tiene_permiso('sucursales.administrar'::text)"
},
{
"schemaname": "public",
"tablename": "sucursales",
"policyname": "sucursales_select_all",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "true",
"with_check": null
},
{
"schemaname": "public",
"tablename": "sucursales",
"policyname": "sucursales_update_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "tiene_permiso('sucursales.administrar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "usuario_sucursales",
"policyname": "usuario_sucursales_delete_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "DELETE",
"qual": "tiene_permiso('usuario_sucursal.asignar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "usuario_sucursales",
"policyname": "usuario_sucursales_insert_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "INSERT",
"qual": null,
"with_check": "tiene_permiso('usuario_sucursal.asignar'::text)"
},
{
"schemaname": "public",
"tablename": "usuario_sucursales",
"policyname": "usuario_sucursales_select_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "tiene_permiso('usuario_sucursal.asignar'::text)",
"with_check": null
},
{
"schemaname": "public",
"tablename": "usuario_sucursales",
"policyname": "usuario_sucursales_select_self",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "SELECT",
"qual": "(usuario_id = auth.uid())",
"with_check": null
},
{
"schemaname": "public",
"tablename": "usuario_sucursales",
"policyname": "usuario_sucursales_update_admin",
"permissive": "PERMISSIVE",
"roles": "{authenticated}",
"cmd": "UPDATE",
"qual": "tiene_permiso('usuario_sucursal.asignar'::text)",
"with_check": null
}
]

-- FUNCIONES
[
{
"function_name": "handle_new_user",
"return_type": "trigger",
"definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\nBEGIN\n INSERT INTO public.perfiles (id, nombre, rol)\n VALUES (\n NEW.id,\n COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),\n COALESCE(NEW.raw_user_meta_data->>'rol', 'mesero')\n );\n RETURN NEW;\nEND;\n$function$\n"
},
{
"function_name": "handle_updated_at",
"return_type": "trigger",
"definition": "CREATE OR REPLACE FUNCTION public.handle_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n NEW.updated_at = NOW();\n RETURN NEW;\nEND;\n$function$\n"
},
{
"function_name": "mis_permisos",
"return_type": "SETOF text",
"definition": "CREATE OR REPLACE FUNCTION public.mis_permisos()\n RETURNS SETOF text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\n SELECT rp.permiso_codigo\n FROM public.roles_permisos rp\n JOIN public.perfiles p ON p.rol = rp.rol_nombre\n WHERE p.id = auth.uid();\n$function$\n"
},
{
"function_name": "tiene_permiso",
"return_type": "boolean",
"definition": "CREATE OR REPLACE FUNCTION public.tiene_permiso(permiso_codigo text)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\n SELECT EXISTS (\n SELECT 1 FROM public.roles_permisos rp\n JOIN public.perfiles p ON p.rol = rp.rol_nombre\n WHERE p.id = auth.uid() AND rp.permiso_codigo = permiso_codigo\n );\n$function$\n"
}
]
