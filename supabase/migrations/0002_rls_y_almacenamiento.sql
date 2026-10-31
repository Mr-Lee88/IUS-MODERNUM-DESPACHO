-- IUS MODERNUM · seguridad a nivel de fila y almacenamiento privado
--
-- §5 del prompt maestro: los permisos se implementan en la interfaz Y en la base
-- de datos. Un abogado no puede consultar honorarios «incluso mediante consultas
-- directas a la API». Aquí es donde eso se cumple de verdad.
--
--   socio             -> todo
--   abogado, pasante  -> todo el trabajo del despacho, menos documentos de nivel 'socio'
--   cliente           -> solo sus asuntos, solo gestiones publicadas, solo documentos 'cliente'

-- Los asuntos en los que el usuario (rol cliente) figura como parte.
create or replace function mis_asuntos_como_cliente()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct pa.asunto_id
  from parte pa
  join perfil_cliente pc on pc.cliente_id = pa.cliente_id
  where pc.perfil_id = auth.uid();
$$;

create or replace function mis_clientes()
returns setof uuid language sql stable security definer set search_path = public as $$
  select cliente_id from perfil_cliente where perfil_id = auth.uid();
$$;

-- ---------- Perfil ----------
alter table perfil enable row level security;

create policy perfil_leer on perfil for select to authenticated
  using (id = auth.uid() or es_del_equipo());
create policy perfil_actualizar_socio on perfil for update to authenticated
  using (es_socio()) with check (es_socio());
create policy perfil_insertar_socio on perfil for insert to authenticated
  with check (es_socio());

alter table perfil_cliente enable row level security;
create policy perfil_cliente_leer on perfil_cliente for select to authenticated
  using (perfil_id = auth.uid() or es_socio());
create policy perfil_cliente_escribir on perfil_cliente for all to authenticated
  using (es_socio()) with check (es_socio());

-- ---------- Catálogos: los lee todo el mundo que entra; los cambia el socio ----------
do $$
declare t text;
begin
  foreach t in array array[
    'materia', 'procedimiento', 'etapa', 'caracter_parte', 'tipo_gestion',
    'tipo_documento', 'organo', 'marco_normativo', 'procedimiento_marco',
    'regla_computo', 'calendario_judicial', 'dia_inhabil'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (usuario_activo())',
      t || '_leer', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (es_socio())',
      t || '_insertar', t);
    execute format(
      'create policy %I on %I for update to authenticated using (es_socio()) with check (es_socio())',
      t || '_actualizar', t);
  end loop;
end $$;

-- ---------- Clientes y contactos ----------
alter table cliente enable row level security;
create policy cliente_leer on cliente for select to authenticated
  using (es_del_equipo() or id in (select mis_clientes()));
create policy cliente_insertar on cliente for insert to authenticated
  with check (es_del_equipo());
create policy cliente_actualizar on cliente for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table contacto enable row level security;
create policy contacto_leer on contacto for select to authenticated
  using (es_del_equipo() or cliente_id in (select mis_clientes()));
create policy contacto_escribir on contacto for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Asuntos y partes ----------
alter table asunto enable row level security;
create policy asunto_leer on asunto for select to authenticated
  using (es_del_equipo() or id in (select mis_asuntos_como_cliente()));
create policy asunto_insertar on asunto for insert to authenticated
  with check (es_del_equipo());
create policy asunto_actualizar on asunto for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table parte enable row level security;
create policy parte_leer on parte for select to authenticated
  using (es_del_equipo() or asunto_id in (select mis_asuntos_como_cliente()));
create policy parte_escribir on parte for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Bitácora ----------
-- El cliente solo ve lo que se publicó expresamente, y nunca las notas internas.
alter table gestion enable row level security;
create policy gestion_leer on gestion for select to authenticated
  using (
    es_del_equipo()
    or (
      publicada_al_cliente
      and clase <> 'nota_interna'
      and asunto_id in (select mis_asuntos_como_cliente())
    )
  );
create policy gestion_insertar on gestion for insert to authenticated
  with check (es_del_equipo());
create policy gestion_actualizar on gestion for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Documentos ----------
-- Tres niveles: 'socio' solo el socio; 'equipo' el despacho; 'cliente' también el cliente.
alter table documento enable row level security;
create policy documento_leer on documento for select to authenticated
  using (
    (es_socio())
    or (es_del_equipo() and nivel_acceso in ('equipo', 'cliente'))
    or (
      nivel_acceso = 'cliente'
      and estado_revision = 'aprobado'
      and (
        asunto_id in (select mis_asuntos_como_cliente())
        or cliente_id in (select mis_clientes())
      )
    )
  );
create policy documento_insertar on documento for insert to authenticated
  with check (
    es_del_equipo()
    -- Lo que sube un cliente entra como 'cliente', en pendiente de revisión (§6).
    or (
      origen = 'cliente'
      and estado_revision = 'pendiente'
      and nivel_acceso = 'cliente'
      and asunto_id in (select mis_asuntos_como_cliente())
    )
  );
create policy documento_actualizar on documento for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table gestion_documento enable row level security;
create policy gestion_documento_leer on gestion_documento for select to authenticated
  using (usuario_activo());
create policy gestion_documento_escribir on gestion_documento for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table dato_extraido enable row level security;
create policy dato_extraido_todo on dato_extraido for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Agenda ----------
alter table evento enable row level security;
create policy evento_leer on evento for select to authenticated
  using (
    es_del_equipo()
    or (clase = 'audiencia' and asunto_id in (select mis_asuntos_como_cliente()))
  );
create policy evento_insertar on evento for insert to authenticated
  with check (es_del_equipo());
create policy evento_actualizar on evento for update to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table evento_calculo enable row level security;
create policy evento_calculo_todo on evento_calculo for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Historial: se escribe, no se modifica ----------
alter table historial enable row level security;
create policy historial_leer on historial for select to authenticated
  using (es_del_equipo());
create policy historial_insertar on historial for insert to authenticated
  with check (es_del_equipo());

-- ---------- Importación ----------
alter table importacion enable row level security;
create policy importacion_todo on importacion for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

alter table importacion_fila enable row level security;
create policy importacion_fila_todo on importacion_fila for all to authenticated
  using (es_del_equipo()) with check (es_del_equipo());

-- ---------- Almacenamiento ----------
-- Bucket privado. Nada se sirve en abierto: cada descarga va con enlace firmado.
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy documentos_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and es_del_equipo());
create policy documentos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and usuario_activo());
create policy documentos_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'documentos' and es_del_equipo());
