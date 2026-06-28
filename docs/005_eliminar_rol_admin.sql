-- 005_eliminar_rol_admin.sql
-- Migra los usuarios con rol 'admin' a 'gerente_sucursal' y elimina el rol legacy

BEGIN;

-- 1. Migrar usuarios existentes con rol 'admin' a 'gerente_sucursal'
UPDATE perfiles
SET rol = 'gerente_sucursal'
WHERE rol = 'admin';

-- 2. Eliminar permisos asociados al rol 'admin'
DELETE FROM roles_permisos
WHERE rol_nombre = 'admin';

-- 3. Eliminar el rol 'admin' de la tabla roles
DELETE FROM roles WHERE nombre = 'admin';

COMMIT;
