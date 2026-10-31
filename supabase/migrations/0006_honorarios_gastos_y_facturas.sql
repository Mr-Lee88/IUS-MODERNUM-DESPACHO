-- IUS MODERNUM · honorarios, pagos, gastos y facturas (módulo 5)
--
-- §4: se mantienen SEPARADOS los honorarios devengados, los pagos recibidos y
-- los gastos del despacho. Son tres cosas distintas y mezclarlas es la manera
-- más fácil de no saber cuánto se debe.
--
-- §4 y §5: visible EXCLUSIVAMENTE para el socio. No hay política alguna para
-- abogados ni pasantes: sin política, la RLS niega. Un abogado que consulte
-- estas tablas por la API recibe cero filas, no un error.
--
-- No se implementa timbrado CFDI. Las facturas las emite el contador; aquí solo
-- se registra el folio fiscal y se guarda el PDF.

create table honorario (
  id          uuid primary key default gen_random_uuid(),
  asunto_id   uuid not null references asunto(id) on delete cascade,
  concepto    text not null,
  tipo        text not null check (tipo in ('presupuesto', 'pactado', 'devengado')),
  importe     numeric(14, 2) not null check (importe >= 0),
  fecha       date not null default current_date,
  estado      text not null default 'vigente' check (estado in ('vigente', 'cancelado')),
  notas       text,
  archivado_en timestamptz,
  creado_por  uuid references perfil(id),
  creado_en   timestamptz not null default now()
);
create index on honorario (asunto_id);

create table pago (
  id           uuid primary key default gen_random_uuid(),
  asunto_id    uuid not null references asunto(id) on delete cascade,
  honorario_id uuid references honorario(id),
  concepto     text not null,
  importe      numeric(14, 2) not null check (importe > 0),
  fecha        date not null default current_date,
  forma_pago   text check (forma_pago in ('transferencia', 'efectivo', 'cheque', 'tarjeta', 'otro')),
  referencia   text,
  notas        text,
  archivado_en timestamptz,
  creado_por   uuid references perfil(id),
  creado_en    timestamptz not null default now()
);
create index on pago (asunto_id);

create table gasto (
  id            uuid primary key default gen_random_uuid(),
  asunto_id     uuid not null references asunto(id) on delete cascade,
  concepto      text not null,
  importe       numeric(14, 2) not null check (importe > 0),
  fecha         date not null default current_date,
  -- Un gasto reembolsable lo repone el cliente; uno que no, lo absorbe el despacho.
  reembolsable  boolean not null default true,
  reembolsado   boolean not null default false,
  documento_id  uuid references documento(id),
  notas         text,
  archivado_en  timestamptz,
  creado_por    uuid references perfil(id),
  creado_en     timestamptz not null default now()
);
create index on gasto (asunto_id);

create table factura (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references cliente(id) on delete cascade,
  asunto_id    uuid references asunto(id),
  serie        text,
  folio        text,
  -- El UUID que asigna el SAT. Lo emite el contador; aquí solo se registra.
  folio_fiscal text unique,
  fecha        date not null,
  subtotal     numeric(14, 2) not null check (subtotal >= 0),
  iva          numeric(14, 2) not null default 0 check (iva >= 0),
  total        numeric(14, 2) not null check (total >= 0),
  estado       text not null default 'emitida' check (estado in ('emitida', 'pagada', 'cancelada')),
  documento_id uuid references documento(id),
  notas        text,
  archivado_en timestamptz,
  creado_por   uuid references perfil(id),
  creado_en    timestamptz not null default now()
);
create index on factura (cliente_id);
create index on factura (asunto_id);

-- ---------- RLS: solo el socio ----------
do $$
declare t text;
begin
  foreach t in array array['honorario', 'pago', 'gasto', 'factura'] loop
    execute format('alter table %I enable row level security', t);
    -- Una sola política, para todo, y solo para el socio. Quien no es socio no
    -- encuentra ninguna política que lo deje pasar, así que no ve nada.
    execute format(
      'create policy %I on %I for all to authenticated using (es_socio()) with check (es_socio())',
      t || '_solo_socio', t);
  end loop;
end $$;
