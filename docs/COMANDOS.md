-- Tablas, columnas y tipos
SELECT
t.table_schema,
t.table_name,
c.column_name,
c.data_type,
c.is_nullable,
c.column_default,
c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- Políticas RLS
SELECT
schemaname,
tablename,
policyname,
permissive,
roles,
cmd,
qual,
with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Funciones
SELECT
p.proname AS function_name,
pg_get_function_result(p.oid) AS return_type,
pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;
