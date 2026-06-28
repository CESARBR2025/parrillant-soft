<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
# Workflow

1. **Schema**: después de cada cambio en la BD (tablas, RLS, funciones), ejecutar las queries en `docs/SCHEMA.sql.txt` desde el SQL Editor de Supabase y guardar el resultado plano en `docs/SCHEMA.md` (reemplazar contenido completo).
2. **Documentación**: al completar una funcionalidad, actualizar `docs/ESTADO_DEL_SISTEMA.md` reflejando lo implementado y moviendo lo pendiente.
3. **Calidad**: verificar siempre que `npx tsc --noEmit` pase sin errores.
4. **Contexto**: revisar `docs/ESTADO_DEL_SISTEMA.md` al inicio de cada tarea para entender el estado actual del sistema.

# Referencia BD
- Las queries para exportar el schema están en `docs/SCHEMA.sql.txt`
- El schema exportado vivo está en `docs/SCHEMA.md`
- El estado del sistema está en `docs/ESTADO_DEL_SISTEMA.md`
<!-- END:project-rules -->
