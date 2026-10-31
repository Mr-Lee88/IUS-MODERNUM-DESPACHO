-- IUS MODERNUM · esquema inicial
--
-- Convenciones (heredadas de ElectroLEX): tablas y columnas en español, snake_case,
-- uuid como llave, nada se borra —se archiva con `archivado_en`—, y todo lo que
-- captura una persona lleva `creado_por` y `creado_en`.
--
-- Dos reglas del prompt maestro que este archivo tiene que cumplir desde el inicio:
--   §6  La materia y el procedimiento quedan atados al marco normativo DESDE LA
--       PRIMERA MIGRACIÓN, con versión y vigencia. No son etiquetas de texto libre.
--   §8  Ninguna regla de cómputo se aplica sin que un abogado la haya verificado.
--
-- La RLS va en la migración 0002. Aquí solo está la estructura.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Búsqueda en español sin acentos: "Hernandez" encuentra "Hernández".
drop text search configuration if exists public.espanol_sin_acentos;
create text search configuration public.espanol_sin_acentos (copy = spanish);
alter text search configuration public.espanol_sin_acentos
  alter mapping for hword, hword_part, word with extensions.unaccent, spanish_stem;

-- ============================================================
-- IDENTIDAD
-- ============================================================

create table perfil (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  correo      text not null unique,
  rol         text not null default 'pasante'
              check (rol in ('socio', 'abogado', 'pasante', 'cliente')),
  iniciales   text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

comment on column perfil.rol is
  'socio ve todo; abogado y pasante no ven honorarios; cliente solo lo suyo y solo lo publicado.';

-- El primer usuario que se registra es el socio: es su despacho.
create or replace function crear_perfil_al_registrar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  es_primero boolean;
  nombre_usuario text;
begin
  select not exists (select 1 from perfil) into es_primero;
  nombre_usuario := coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1));

  insert into perfil (id, nombre, correo, rol, iniciales, activo)
  values (
    new.id,
    nombre_usuario,
    new.email,
    case when es_primero then 'socio'
         else coalesce(new.raw_user_meta_data->>'rol', 'pasante') end,
    upper(substring(regexp_replace(nombre_usuario, '[^[:alpha:] ]', '', 'g') from 1 for 1)),
    true
  );
  return new;
end $$;

create trigger tr_crear_perfil
after insert on auth.users
for each row execute function crear_perfil_al_registrar();

create or replace function usuario_activo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfil where id = auth.uid() and activo);
$$;

create or replace function es_socio()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfil where id = auth.uid() and activo and rol = 'socio');
$$;

create or replace function es_del_equipo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfil
    where id = auth.uid() and activo and rol in ('socio', 'abogado', 'pasante')
  );
$$;

-- ============================================================
-- CATÁLOGOS NORMATIVOS
-- De aquí sale qué ley rige, cómo corre el plazo y qué calendario aplica.
-- ============================================================

create table materia (
  clave   text primary key,
  nombre  text not null,
  orden   int  not null default 0
);

create table marco_normativo (
  id             uuid primary key default gen_random_uuid(),
  clave          text not null,
  nombre         text not null,
  ambito         text not null check (ambito in ('federal', 'local_campeche')),
  -- Una ley EN UNA VERSIÓN. La reforma de mañana no borra la de hoy.
  vigente_desde  date not null,
  vigente_hasta  date,
  fuente         text,
  -- Nadie usa un marco que no haya revisado una persona (§8).
  verificado_por uuid references perfil(id),
  verificado_en  timestamptz,
  creado_en      timestamptz not null default now(),
  constraint marco_vigencia_coherente check (vigente_hasta is null or vigente_hasta > vigente_desde)
);
create unique index marco_clave_vigencia on marco_normativo (clave, vigente_desde);
create index on marco_normativo (ambito);

create table procedimiento (
  clave          text primary key,
  materia_clave  text not null references materia(clave),
  nombre         text not null,
  orden          int  not null default 0
);
create index on procedimiento (materia_clave);

-- Un procedimiento puede regirse por varias leyes: una principal y otras supletorias.
create table procedimiento_marco (
  procedimiento_clave text not null references procedimiento(clave) on delete cascade,
  marco_id            uuid not null references marco_normativo(id) on delete cascade,
  caracter            text not null check (caracter in ('principal', 'supletorio')),
  orden               int  not null default 0,
  primary key (procedimiento_clave, marco_id)
);

-- Cómo corre cada plazo. NINGUNA regla se aplica mientras esté en 'propuesta'.
create table regla_computo (
  id                  uuid primary key default gen_random_uuid(),
  procedimiento_clave text not null references procedimiento(clave),
  marco_id            uuid not null references marco_normativo(id),
  supuesto            text not null,
  dias                int  not null check (dias > 0),
  unidad              text not null check (unidad in ('habiles', 'naturales')),
  desde_evento        text not null
                      check (desde_evento in ('surte_efectos', 'notificacion', 'audiencia', 'acuerdo')),
  regla_efectos       text,
  fundamento_articulo text not null,
  estado              text not null default 'propuesta'
                      check (estado in ('propuesta', 'verificada', 'superada')),
  verificado_por      uuid references perfil(id),
  verificado_en       timestamptz,
  creado_en           timestamptz not null default now()
);
create index on regla_computo (procedimiento_clave, estado);

comment on column regla_computo.estado is
  'propuesta = capturada pero sin revisar, NO se usa para calcular. verificada = la revisó el abogado responsable.';

create table calendario_judicial (
  id            uuid primary key default gen_random_uuid(),
  ambito        text not null check (ambito in ('federal', 'local_campeche')),
  anio          int  not null,
  version       int  not null default 1,
  fuente        text,
  verificado_por uuid references perfil(id),
  verificado_en timestamptz,
  creado_en     timestamptz not null default now()
);
create unique index calendario_unico on calendario_judicial (ambito, anio, version);

create table dia_inhabil (
  calendario_id uuid not null references calendario_judicial(id) on delete cascade,
  fecha         date not null,
  motivo        text,
  primary key (calendario_id, fecha)
);

create table organo (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  ambito        text not null check (ambito in ('federal', 'local_campeche')),
  tipo          text check (tipo in ('juzgado', 'tribunal', 'sala', 'centro', 'dependencia', 'otro')),
  ciudad        text,
  domicilio     text,
  telefono      text,
  archivado_en  timestamptz,
  creado_en     timestamptz not null default now()
);
create index on organo (lower(nombre));

-- ============================================================
-- NÚCLEO: CLIENTES Y ASUNTOS
-- ============================================================

create table cliente (
  -- `clave_externa` es el C-001 de la plantilla. Es lo que hace que reimportar
  -- el mismo archivo actualice en lugar de duplicar.
  clave_externa          text unique,
  id                     uuid primary key default gen_random_uuid(),
  tipo_persona           text not null check (tipo_persona in ('fisica', 'moral')),
  nombre_o_razon_social  text not null,
  rfc                    text,
  representante          text,
  telefono               text,
  correo                 text,
  calle_y_numero         text,
  colonia                text,
  ciudad                 text,
  estado                 text,
  cp                     text,
  cliente_desde          date,
  estado_cliente         text not null default 'activo'
                         check (estado_cliente in ('activo', 'prospecto', 'inactivo')),
  observaciones_internas text,
  archivado_en           timestamptz,
  creado_por             uuid references perfil(id),
  creado_en              timestamptz not null default now(),
  actualizado_en         timestamptz not null default now()
);
create index on cliente (lower(nombre_o_razon_social));
create index on cliente (estado_cliente) where archivado_en is null;

create table contacto (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references cliente(id) on delete cascade,
  nombre      text not null,
  cargo       text,
  telefono    text,
  correo      text,
  notas       text,
  creado_en   timestamptz not null default now()
);
create index on contacto (cliente_id);

-- Acceso del portal: un usuario con rol 'cliente' atado al cliente que puede ver.
create table perfil_cliente (
  perfil_id  uuid not null references perfil(id) on delete cascade,
  cliente_id uuid not null references cliente(id) on delete cascade,
  creado_en  timestamptz not null default now(),
  primary key (perfil_id, cliente_id)
);

create table asunto (
  clave_externa       text unique,
  id                  uuid primary key default gen_random_uuid(),
  clave_interna       text,
  nombre              text not null,
  materia_clave       text not null references materia(clave),
  procedimiento_clave text references procedimiento(clave),
  organo_id           uuid references organo(id),
  ambito              text not null check (ambito in ('federal', 'local_campeche')),
  numero_expediente   text,
  anio                int,
  etapa               text not null default 'consulta',
  estado_asunto       text not null default 'activo'
                      check (estado_asunto in ('activo', 'suspendido', 'concluido', 'archivado')),
  responsable_id      uuid references perfil(id),
  fecha_apertura      date not null default current_date,
  cuantia             numeric(14, 2),
  observaciones       text,
  archivado_en        timestamptz,
  creado_por          uuid references perfil(id),
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now()
);
create index on asunto (materia_clave);
create index on asunto (responsable_id);
create index on asunto (estado_asunto) where archivado_en is null;
create index on asunto (numero_expediente, anio);

comment on column asunto.ambito is
  'Decide qué calendario de días inhábiles aplica. Un asunto federal NUNCA toma el calendario local.';

-- Varias partes por asunto: litisconsorcio, varios herederos, terceros interesados.
create table parte (
  clave_externa text unique,
  id            uuid primary key default gen_random_uuid(),
  asunto_id     uuid not null references asunto(id) on delete cascade,
  -- Nulo cuando la parte es la contraparte o un tercero que no es cliente nuestro.
  cliente_id    uuid references cliente(id),
  nombre        text not null,
  caracter      text not null,
  es_nuestro_cliente boolean not null default false,
  representante text,
  notas         text,
  archivado_en  timestamptz,
  creado_en     timestamptz not null default now()
);
create index on parte (asunto_id);
create index on parte (cliente_id);

-- ============================================================
-- BITÁCORA
-- ============================================================

create table gestion (
  clave_externa text unique,
  id            uuid primary key default gen_random_uuid(),
  asunto_id     uuid not null references asunto(id) on delete cascade,
  -- Dos fechas distintas: cuándo pasó y cuándo se anotó (§2.B).
  ocurrio_en    date not null,
  hora          time,
  tipo          text not null,
  -- §2.B: se distinguen los hechos procesales de las notas internas y lo administrativo.
  clase         text not null default 'hecho_procesal'
                check (clase in ('hecho_procesal', 'nota_interna', 'administrativa')),
  titulo        text not null,
  descripcion   text,
  -- §6: el cliente solo ve lo que se publica expresamente.
  publicada_al_cliente boolean not null default false,
  autor_id      uuid references perfil(id),
  archivado_en  timestamptz,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index on gestion (asunto_id, ocurrio_en desc);
create index on gestion (clase);

-- ============================================================
-- DOCUMENTOS
-- ============================================================

create table documento (
  clave_externa   text unique,
  id              uuid primary key default gen_random_uuid(),
  bucket          text not null default 'documentos',
  ruta            text unique,
  nombre_original text not null,
  mime            text,
  tamano          bigint,
  tipo_documental text not null default 'otro',
  fecha_documento date,
  -- Versiones: reemplazar un documento no borra el anterior (§3).
  version         int not null default 1,
  reemplaza_a     uuid references documento(id),
  -- Decisión de Irving (2026-10-31): tres niveles.
  nivel_acceso    text not null default 'equipo'
                  check (nivel_acceso in ('socio', 'equipo', 'cliente')),
  asunto_id       uuid references asunto(id) on delete cascade,
  cliente_id      uuid references cliente(id) on delete cascade,
  origen          text not null default 'interno' check (origen in ('interno', 'cliente')),
  -- Lo que sube un cliente queda pendiente de revisión antes de entrar al expediente (§6).
  estado_revision text not null default 'aprobado'
                  check (estado_revision in ('pendiente', 'aprobado', 'rechazado')),
  texto_ocr       text,
  modelo_ocr      text,
  descripcion     text,
  archivado_en    timestamptz,
  subido_por      uuid references perfil(id),
  creado_en       timestamptz not null default now()
);
create index on documento (asunto_id);
create index on documento (cliente_id);
create index on documento (estado_revision) where estado_revision = 'pendiente';

create table gestion_documento (
  gestion_id   uuid not null references gestion(id) on delete cascade,
  documento_id uuid not null references documento(id) on delete cascade,
  primary key (gestion_id, documento_id)
);

-- Lo que la IA propone a partir de un escaneo. Nace PROPUESTO y nadie lo da por
-- cierto hasta que una persona lo aprueba (§3 y §8). Patrón tomado de ElectroLEX.
create table dato_extraido (
  id            uuid primary key default gen_random_uuid(),
  documento_id  uuid not null references documento(id) on delete cascade,
  campo         text not null,
  valor         text,
  evidencia     text,
  banda         text not null check (banda in ('VERIFICADO', 'PROBABLE', 'POSIBLE')),
  estado        text not null default 'PROPUESTO'
                check (estado in ('PROPUESTO', 'APLICADO', 'DESCARTADO', 'SUPERADO')),
  modelo        text,
  decidido_por  uuid references perfil(id),
  decidido_en   timestamptz,
  creado_en     timestamptz not null default now()
);
create index on dato_extraido (documento_id, campo, estado);

-- ============================================================
-- AGENDA, AUDIENCIAS Y TÉRMINOS
-- ============================================================

create table evento (
  clave_externa text unique,
  id            uuid primary key default gen_random_uuid(),
  asunto_id     uuid not null references asunto(id) on delete cascade,
  clase         text not null
                check (clase in ('audiencia', 'termino', 'diligencia', 'reunion', 'interna', 'recordatorio')),
  titulo        text not null,
  fecha_hora    timestamptz,
  organo_id     uuid references organo(id),
  responsable_id uuid references perfil(id),
  ubicacion     text,
  observaciones text,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente_verificar', 'confirmado', 'proximo_vencer',
                                  'vence_hoy', 'cumplido', 'vencido', 'cancelado', 'pendiente')),

  -- --- Solo para clase = 'termino' ---
  -- Fecha de notificación y fecha en que surte efectos son DOS COSAS DISTINTAS (§8).
  fecha_notificacion    date,
  modalidad_notificacion text,
  surte_efectos_en      date,
  dias                  int,
  unidad                text check (unidad in ('habiles', 'naturales')),
  regla_id              uuid references regla_computo(id),
  calendario_id         uuid references calendario_judicial(id),
  fecha_limite          date,
  -- 'manual' = lo escribió una persona. 'calculada' = lo produjo el motor con una
  -- regla verificada. Lo que entra por Excel siempre es 'manual'.
  fecha_limite_origen   text check (fecha_limite_origen in ('calculada', 'manual')),
  estado_verificacion   text not null default 'pendiente_verificar'
                        check (estado_verificacion in ('pendiente_verificar', 'verificado')),
  -- Si falta un dato jurídico esencial, el cálculo se bloquea y se pide validación (§4).
  bloqueado_por_falta_de_datos boolean not null default false,
  fundamento_texto      text,

  archivado_en  timestamptz,
  creado_por    uuid references perfil(id),
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index on evento (asunto_id, fecha_hora);
create index on evento (clase, estado);
create index on evento (fecha_limite) where fecha_limite is not null;

-- La evidencia de cada cómputo: con qué se calculó, qué días se excluyeron y por qué.
create table evento_calculo (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references evento(id) on delete cascade,
  insumos        jsonb not null,
  dias_excluidos date[],
  resultado      date,
  fundamento     text,
  version_motor  text not null,
  creado_por     uuid references perfil(id),
  creado_en      timestamptz not null default now()
);
create index on evento_calculo (evento_id, creado_en desc);

-- ============================================================
-- HISTORIAL
-- §4: los cambios conservan historial, fecha, usuario y justificación.
-- ============================================================

create table historial (
  id             bigserial primary key,
  tabla          text not null,
  registro_id    uuid not null,
  campo          text not null,
  valor_anterior text,
  valor_nuevo    text,
  motivo         text,
  autor_id       uuid references perfil(id),
  creado_en      timestamptz not null default now()
);
create index on historial (tabla, registro_id, creado_en desc);

-- ============================================================
-- IMPORTACIÓN DESDE EXCEL
-- ============================================================

create table importacion (
  id               uuid primary key default gen_random_uuid(),
  nombre_archivo   text not null,
  perfil           jsonb not null,
  estado           text not null default 'ANALIZADO'
                   check (estado in ('ANALIZADO', 'IMPORTADO', 'DESCARTADO')),
  filas_importadas int not null default 0,
  filas_omitidas   int not null default 0,
  creado_por       uuid references perfil(id),
  creado_en        timestamptz not null default now()
);

create table importacion_fila (
  id             bigserial primary key,
  importacion_id uuid not null references importacion(id) on delete cascade,
  hoja           text not null,
  fila           int not null,
  clave_externa  text,
  entidad        text not null,
  estado         text not null check (estado in ('nuevo', 'actualizado', 'duplicado', 'error')),
  registro_id    uuid,
  motivo         text
);
create index on importacion_fila (importacion_id, estado);

-- ============================================================
-- actualizado_en
-- ============================================================

create or replace function tocar_actualizado_en()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;

create trigger tr_cliente_tocar before update on cliente for each row execute function tocar_actualizado_en();
create trigger tr_asunto_tocar  before update on asunto  for each row execute function tocar_actualizado_en();
create trigger tr_gestion_tocar before update on gestion for each row execute function tocar_actualizado_en();
create trigger tr_evento_tocar  before update on evento  for each row execute function tocar_actualizado_en();

-- ============================================================
-- BUSCADOR UNIVERSAL (§2.A)
-- Columnas generadas con tsvector e índice GIN. Nada se filtra en el navegador.
-- ============================================================

alter table cliente add column busqueda tsvector
  generated always as (
    to_tsvector('public.espanol_sin_acentos',
      coalesce(nombre_o_razon_social, '') || ' ' ||
      coalesce(rfc, '') || ' ' ||
      coalesce(representante, '') || ' ' ||
      coalesce(ciudad, ''))
  ) stored;
create index cliente_busqueda on cliente using gin (busqueda);

alter table asunto add column busqueda tsvector
  generated always as (
    to_tsvector('public.espanol_sin_acentos',
      coalesce(nombre, '') || ' ' ||
      coalesce(clave_interna, '') || ' ' ||
      coalesce(numero_expediente, '') || ' ' ||
      coalesce(anio::text, '') || ' ' ||
      coalesce(observaciones, ''))
  ) stored;
create index asunto_busqueda on asunto using gin (busqueda);

alter table gestion add column busqueda tsvector
  generated always as (
    to_tsvector('public.espanol_sin_acentos',
      coalesce(titulo, '') || ' ' ||
      coalesce(descripcion, '') || ' ' ||
      coalesce(tipo, ''))
  ) stored;
create index gestion_busqueda on gestion using gin (busqueda);

alter table parte add column busqueda tsvector
  generated always as (
    to_tsvector('public.espanol_sin_acentos',
      coalesce(nombre, '') || ' ' || coalesce(caracter, ''))
  ) stored;
create index parte_busqueda on parte using gin (busqueda);

alter table documento add column busqueda tsvector
  generated always as (
    to_tsvector('public.espanol_sin_acentos',
      coalesce(nombre_original, '') || ' ' ||
      coalesce(tipo_documental, '') || ' ' ||
      coalesce(descripcion, '') || ' ' ||
      coalesce(texto_ocr, ''))
  ) stored;
create index documento_busqueda on documento using gin (busqueda);

-- ============================================================
-- CATÁLOGOS INICIALES
-- Son los mismos que valida `plantilla-ius-modernum.xlsx`.
-- ============================================================

insert into materia (clave, nombre, orden) values
  ('civil',     'Civil',     1),
  ('mercantil', 'Mercantil', 2),
  ('familiar',  'Familiar',  3),
  ('sucesorio', 'Sucesorio', 4),
  ('amparo',    'Amparo',    5);

insert into procedimiento (clave, materia_clave, nombre, orden) values
  ('ordinario_civil',      'civil',     'Ordinario civil',          1),
  ('sumario_civil',        'civil',     'Sumario civil',            2),
  ('ejecutivo_civil',      'civil',     'Ejecutivo civil',          3),
  ('ordinario_mercantil',  'mercantil', 'Ordinario mercantil',      1),
  ('ejecutivo_mercantil',  'mercantil', 'Ejecutivo mercantil',      2),
  ('oral_mercantil',       'mercantil', 'Oral mercantil',           3),
  ('consulta_mercantil',   'mercantil', 'Consulta',                 4),
  ('divorcio_incausado',   'familiar',  'Divorcio incausado',       1),
  ('alimentos',            'familiar',  'Alimentos',                2),
  ('guarda_y_custodia',    'familiar',  'Guarda y custodia',        3),
  ('intestamentario',      'sucesorio', 'Intestamentario',          1),
  ('testamentario',        'sucesorio', 'Testamentario',            2),
  ('amparo_indirecto',     'amparo',    'Amparo indirecto',         1),
  ('amparo_directo',       'amparo',    'Amparo directo',           2);

-- Los marcos normativos NO se siembran con fechas de vigencia inventadas: se
-- capturan desde /ajustes/catalogos, con su fuente, y los verifica el abogado.
-- El §8 prohíbe asumir vigencia normativa.

create table etapa (
  clave  text primary key,
  nombre text not null,
  orden  int not null
);
insert into etapa (clave, nombre, orden) values
  ('consulta',     'Consulta',     1),
  ('demanda',      'Demanda',      2),
  ('contestacion', 'Contestación', 3),
  ('pruebas',      'Pruebas',      4),
  ('alegatos',     'Alegatos',     5),
  ('sentencia',    'Sentencia',    6),
  ('recurso',      'Recurso',      7),
  ('ejecucion',    'Ejecución',    8),
  ('informe',      'Informe',      9),
  ('concluido',    'Concluido',   10);

alter table asunto add constraint asunto_etapa_fk foreign key (etapa) references etapa(clave);

create table caracter_parte (
  clave  text primary key,
  nombre text not null,
  orden  int not null
);
insert into caracter_parte (clave, nombre, orden) values
  ('actor',              'Actor',              1),
  ('demandado',          'Demandado',          2),
  ('quejoso',            'Quejoso',            3),
  ('tercero_interesado', 'Tercero interesado', 4),
  ('promovente',         'Promovente',         5),
  ('denunciante',        'Denunciante',        6),
  ('albacea',            'Albacea',            7),
  ('heredero',           'Heredero',           8),
  ('autoridad',          'Autoridad responsable', 9);

alter table parte add constraint parte_caracter_fk foreign key (caracter) references caracter_parte(clave);

create table tipo_gestion (
  clave  text primary key,
  nombre text not null,
  -- De aquí sale la `clase` por omisión al capturar.
  clase  text not null check (clase in ('hecho_procesal', 'nota_interna', 'administrativa')),
  orden  int not null
);
insert into tipo_gestion (clave, nombre, clase, orden) values
  ('acuerdo',      'Acuerdo',      'hecho_procesal', 1),
  ('notificacion', 'Notificación', 'hecho_procesal', 2),
  ('promocion',    'Promoción',    'hecho_procesal', 3),
  ('audiencia',    'Audiencia',    'hecho_procesal', 4),
  ('plazo',        'Plazo',        'hecho_procesal', 5),
  ('gestion',      'Gestión',      'administrativa', 6),
  ('reunion',      'Reunión',      'administrativa', 7),
  ('llamada',      'Llamada',      'administrativa', 8),
  ('honorarios',   'Honorarios',   'administrativa', 9),
  ('nota',         'Nota',         'nota_interna',  10);

alter table gestion add constraint gestion_tipo_fk foreign key (tipo) references tipo_gestion(clave);

create table tipo_documento (
  clave  text primary key,
  nombre text not null,
  orden  int not null
);
insert into tipo_documento (clave, nombre, orden) values
  ('escrito',        'Escrito',               1),
  ('acuerdo',        'Acuerdo',               2),
  ('cedula',         'Cédula de notificación', 3),
  ('contrato',       'Contrato',              4),
  ('poder',          'Poder',                 5),
  ('identificacion', 'Identificación',        6),
  ('acuse',          'Acuse',                 7),
  ('factura',        'Factura',               8),
  ('comprobante',    'Comprobante',           9),
  ('otro',           'Otro',                 10);

alter table documento add constraint documento_tipo_fk foreign key (tipo_documental) references tipo_documento(clave);
