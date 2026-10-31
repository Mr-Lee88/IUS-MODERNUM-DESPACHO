-- Buscador universal (§2.A): una sola consulta sobre clientes, asuntos, gestiones,
-- partes y documentos, con los resultados etiquetados por tipo.
--
-- SECURITY INVOKER a propósito: la función corre con los permisos de quien
-- pregunta, así que la RLS filtra los resultados. Un cliente que busque solo
-- encontrará lo suyo, sin que esta función tenga que saber nada de roles.

create or replace function buscar_todo(consulta text, limite int default 40)
returns table (
  tipo        text,
  id          uuid,
  titulo      text,
  detalle     text,
  asunto_id   uuid,
  relevancia  real
)
language sql stable security invoker set search_path = public as $$
  with q as (
    select websearch_to_tsquery('public.espanol_sin_acentos', consulta) as t
  )
  select 'cliente', c.id, c.nombre_o_razon_social,
         coalesce(c.rfc, '') || case when c.ciudad is not null then ' · ' || c.ciudad else '' end,
         null::uuid, ts_rank(c.busqueda, q.t)
  from cliente c, q
  where c.archivado_en is null and c.busqueda @@ q.t

  union all
  select 'asunto', a.id, a.nombre,
         coalesce(a.numero_expediente, 'Sin expediente') ||
         case when a.anio is not null then '/' || a.anio else '' end,
         a.id, ts_rank(a.busqueda, q.t)
  from asunto a, q
  where a.archivado_en is null and a.busqueda @@ q.t

  union all
  select 'gestion', g.id, g.titulo,
         to_char(g.ocurrio_en, 'DD/MM/YYYY') || ' · ' || g.tipo,
         g.asunto_id, ts_rank(g.busqueda, q.t)
  from gestion g, q
  where g.archivado_en is null and g.busqueda @@ q.t

  union all
  select 'parte', pa.id, pa.nombre, pa.caracter, pa.asunto_id, ts_rank(pa.busqueda, q.t)
  from parte pa, q
  where pa.archivado_en is null and pa.busqueda @@ q.t

  union all
  select 'documento', d.id, d.nombre_original,
         coalesce(to_char(d.fecha_documento, 'DD/MM/YYYY'), '') || ' · ' || d.tipo_documental,
         d.asunto_id, ts_rank(d.busqueda, q.t)
  from documento d, q
  where d.archivado_en is null and d.busqueda @@ q.t

  order by 6 desc, 3
  limit limite;
$$;

revoke execute on function public.buscar_todo(text, int) from public;
grant execute on function public.buscar_todo(text, int) to authenticated;
