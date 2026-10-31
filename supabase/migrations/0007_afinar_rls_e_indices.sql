-- Afina lo que señaló el linter de rendimiento de Supabase.
--
-- 1. `auth.uid()` suelto dentro de una política se vuelve a evaluar EN CADA FILA.
--    Envuelto en (select auth.uid()) se evalúa una sola vez por consulta. Con
--    cuatro asuntos da igual; con miles de gestiones, no.
--
-- 2. Dos políticas permisivas para la misma acción obligan a Postgres a evaluar
--    las dos. Pasaba por usar `for all` junto a una de `select`: el `for all`
--    incluía el select. Se separan en insert y update, lo que además deja esas
--    tablas sin política de DELETE: en este sistema nada se borra, se archiva.
--
-- 3. Índices en las llaves foráneas por las que de verdad se filtra o se navega.
--    NO se crean en las columnas de auditoría (creado_por, verificado_por,
--    decidido_por, subido_por): nadie lista el trabajo filtrando por quién lo
--    capturó, y con un despacho de cinco personas el costo de no tenerlas es
--    nulo. Un índice que nadie usa solo hace más lenta cada escritura. El linter
--    los seguirá señalando como INFO; es una decisión tomada, no un descuido.

-- ---------- 1. auth.uid() evaluado una vez por consulta ----------
drop policy perfil_leer on perfil;
create policy perfil_leer on perfil for select to authenticated
  using (id = (select auth.uid()) or es_del_equipo());

drop policy perfil_cliente_leer on perfil_cliente;
create policy perfil_cliente_leer on perfil_cliente for select to authenticated
  using (perfil_id = (select auth.uid()) or es_socio());

-- ---------- 2. Una sola política permisiva por acción ----------
drop policy contacto_escribir on contacto;
create policy contacto_insertar on contacto for insert to authenticated
  with check (es_del_equipo());
create policy contacto_actualizar on contacto for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

drop policy parte_escribir on parte;
create policy parte_insertar on parte for insert to authenticated
  with check (es_del_equipo());
create policy parte_actualizar on parte for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

drop policy gestion_documento_escribir on gestion_documento;
create policy gestion_documento_insertar on gestion_documento for insert to authenticated
  with check (es_del_equipo());
create policy gestion_documento_borrar on gestion_documento for delete to authenticated
  using (es_del_equipo());

drop policy perfil_cliente_escribir on perfil_cliente;
create policy perfil_cliente_insertar on perfil_cliente for insert to authenticated
  with check (es_socio());
-- Revocar el acceso de un cliente al portal sí es un borrado legítimo.
create policy perfil_cliente_borrar on perfil_cliente for delete to authenticated
  using (es_socio());

-- ---------- 3. Índices donde se filtra o se navega ----------
create index if not exists asunto_organo_idx on asunto (organo_id);
create index if not exists asunto_procedimiento_idx on asunto (procedimiento_clave);
create index if not exists asunto_etapa_idx on asunto (etapa);
create index if not exists gestion_autor_idx on gestion (autor_id);
create index if not exists gestion_tipo_idx on gestion (tipo);
create index if not exists documento_tipo_idx on documento (tipo_documental);
create index if not exists documento_reemplaza_idx on documento (reemplaza_a);
create index if not exists gestion_documento_doc_idx on gestion_documento (documento_id);
create index if not exists evento_organo_idx on evento (organo_id);
create index if not exists evento_responsable_idx on evento (responsable_id);
create index if not exists parte_caracter_idx on parte (caracter);
create index if not exists perfil_cliente_cliente_idx on perfil_cliente (cliente_id);
create index if not exists pago_honorario_idx on pago (honorario_id);
create index if not exists gasto_documento_idx on gasto (documento_id);
create index if not exists factura_documento_idx on factura (documento_id);
create index if not exists procedimiento_marco_marco_idx on procedimiento_marco (marco_id);
create index if not exists regla_computo_marco_idx on regla_computo (marco_id);
