-- Pruebas de la seguridad a nivel de fila (§5 y §11 del prompt maestro).
--
-- Se ejecutan contra la base real y NO dejan rastro: todo va dentro de
-- transacciones que terminan en rollback. Conviene correrlas después de tocar
-- cualquier política.
--
-- Lo que comprueban:
--   1. El abogado no alcanza los documentos reservados al socio.
--   2. El cliente solo ve sus asuntos, y solo las gestiones publicadas.
--   3. El cliente nunca ve notas internas ni documentos internos.
--   4. Un cliente no ve los asuntos de otro cliente.
--
-- ORDEN IMPORTANTE: primero `set_config` del usuario simulado y después
-- `set local role authenticated`. Al revés, auth.uid() queda nulo y las
-- consultas devuelven cero por la razón equivocada: parece que la RLS funciona
-- cuando en realidad la prueba está mal escrita.

-- ============================================================
-- PRUEBA 1 · ABOGADO
-- Esperado: es_socio false · ve los documentos del equipo · NO ve los del socio
--           · sí ve las notas internas (son internas frente al cliente, no al equipo)
-- ============================================================
begin;

insert into documento (ruta, nombre_original, tipo_documental, nivel_acceso, asunto_id, subido_por)
select 'prueba/solo-socio.pdf', 'convenio-honorarios.pdf', 'factura', 'socio',
       (select id from asunto limit 1), (select id from perfil limit 1);

insert into gestion (asunto_id, ocurrio_en, tipo, clase, titulo, publicada_al_cliente, autor_id)
select (select id from asunto limit 1), current_date, 'nota', 'nota_interna',
       'Estrategia reservada', false, (select id from perfil limit 1);

update perfil set rol = 'abogado' where id = (select id from perfil limit 1);

select set_config('request.jwt.claims',
  json_build_object('sub', (select id::text from perfil limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;

select 'ABOGADO' as rol,
       es_socio() as es_socio,                                            -- esperado: false
       es_del_equipo() as es_del_equipo,                                  -- esperado: true
       (select count(*) from documento where nivel_acceso = 'socio')
         as reservados_al_socio,                                          -- esperado: 0
       (select count(*) from gestion where clase = 'nota_interna')
         as notas_internas;                                               -- esperado: >= 1
rollback;

-- ============================================================
-- PRUEBA 2 · CLIENTE DEL PORTAL
-- Esperado: ve solo su asunto · solo las gestiones publicadas · ningún
--           documento interno · ningún asunto de otro cliente
-- ============================================================
begin;

insert into documento (ruta, nombre_original, tipo_documental, nivel_acceso, asunto_id, subido_por)
select 'prueba/solo-socio.pdf', 'convenio-honorarios.pdf', 'factura', 'socio',
       (select id from asunto limit 1), (select id from perfil limit 1);
insert into documento (ruta, nombre_original, tipo_documental, nivel_acceso, asunto_id, subido_por)
select 'prueba/interno.pdf', 'analisis-estrategia.pdf', 'escrito', 'equipo',
       (select id from asunto limit 1), (select id from perfil limit 1);

insert into gestion (asunto_id, ocurrio_en, tipo, clase, titulo, publicada_al_cliente, autor_id)
select (select id from asunto limit 1), current_date, 'nota', 'nota_interna',
       'Estrategia reservada', false, (select id from perfil limit 1);
insert into gestion (asunto_id, ocurrio_en, tipo, clase, titulo, publicada_al_cliente, autor_id)
select (select id from asunto limit 1), current_date, 'acuerdo', 'hecho_procesal',
       'Se presentó la contestación', true, (select id from perfil limit 1);

-- Otro cliente con su propio asunto: no deben cruzarse.
insert into cliente (tipo_persona, nombre_o_razon_social)
values ('fisica', 'Cliente Ajeno de Prueba');
insert into asunto (nombre, materia_clave, ambito, etapa)
values ('Asunto de otro cliente', 'civil', 'local_campeche', 'consulta');
insert into parte (asunto_id, cliente_id, nombre, caracter, es_nuestro_cliente)
select (select id from asunto where nombre = 'Asunto de otro cliente'),
       (select id from cliente where nombre_o_razon_social = 'Cliente Ajeno de Prueba'),
       'Cliente Ajeno de Prueba', 'actor', true;

update perfil set rol = 'cliente' where id = (select id from perfil limit 1);
insert into perfil_cliente (perfil_id, cliente_id)
select (select id from perfil limit 1), (select id from cliente order by creado_en limit 1);

select set_config('request.jwt.claims',
  json_build_object('sub', (select id::text from perfil limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;

select 'CLIENTE' as rol,
       es_del_equipo() as es_del_equipo,                                  -- esperado: false
       (select count(*) from asunto) as asuntos,                          -- esperado: 1, el suyo
       (select count(*) from cliente) as clientes,                        -- esperado: 1, él mismo
       (select count(*) from gestion) as gestiones,                       -- esperado: 1, la publicada
       (select count(*) from gestion where clase = 'nota_interna')
         as notas_internas,                                               -- esperado: 0
       (select count(*) from documento where nivel_acceso <> 'cliente')
         as documentos_internos;                                          -- esperado: 0
rollback;

-- ============================================================
-- PRUEBA 3 · ALMACENAMIENTO
-- El bucket no es público: ningún archivo tiene dirección permanente.
-- ============================================================
select 'ALMACENAMIENTO' as prueba,
       id as bucket,
       public as es_publico   -- esperado: false
from storage.buckets where id = 'documentos';
