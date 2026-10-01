-- Neoesis CRM — esquema de base de datos
-- Pegar completo en Supabase > SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  place_id text unique,
  name text not null,
  category text,
  district text,
  address text,
  phone text,
  email text,
  reviews integer not null default 0,
  rating numeric(2,1),
  web_status text not null default 'sin_web',   -- sin_web | solo_redes | con_web
  website text,
  maps_url text,
  owner text,
  stage text not null default 'Nuevo',
  touches integer not null default 0,
  first_contact date,
  last_contact date,
  next_follow_up date,
  amount_usd numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prospects_stage_idx on prospects (stage);
create index if not exists prospects_follow_idx on prospects (next_follow_up);
create index if not exists prospects_first_idx on prospects (first_contact);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete cascade,
  kind text not null,          -- whatsapp | llamada | email | nota | estado
  template text,
  detail text,
  author text,
  day date not null default ((now() at time zone 'America/Lima')::date),
  created_at timestamptz not null default now()
);
create index if not exists activities_prospect_idx on activities (prospect_id);
create index if not exists activities_day_idx on activities (day);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete set null,
  title text not null,
  day date not null,
  time text,
  kind text not null default 'reunion',   -- reunion | llamada | entrega | otro
  owner text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_day_idx on events (day);
create index if not exists events_prospect_idx on events (prospect_id);

create table if not exists templates (
  code text primary key,
  name text not null,
  channel text not null default 'whatsapp',   -- whatsapp | email | llamada
  subject text,
  body text not null,
  counts_touch boolean not null default true,
  sort integer not null default 0
);

create table if not exists searches (
  id bigserial primary key,
  query text not null,
  results integer not null default 0,
  author text,
  created_at timestamptz not null default now()
);

-- Solo el servidor (service role) accede a los datos
alter table prospects enable row level security;
alter table activities enable row level security;
alter table events enable row level security;
alter table templates enable row level security;
alter table searches enable row level security;


-- Permisos explícitos para el servidor (funciona aunque "exponer tablas automáticamente" esté apagado)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Plantillas iniciales (se pueden editar desde la app)
insert into templates (code, name, channel, subject, body, counts_touch, sort) values
('A','Primer contacto (día 1)','whatsapp',null,
'Hola, buenos días. ¿Hablo con {negocio}? Soy {yo} de Neoesis DEVS. Vi su ficha en Google Maps: {resenas} reseñas con {estrellas} estrellas, se nota que sus clientes están contentos. Noté que aún no tienen página web, y quienes buscan "{rubro} en {distrito}" terminan en la web de la competencia. Hacemos páginas para negocios como el suyo, con botón de WhatsApp, ubicación y sus reseñas. ¿Le puedo enviar un boceto gratuito de cómo se vería la de {negocio}? Sin compromiso.',
true,1),
('B','Seguimiento con valor (día 3)','whatsapp',null,
'Hola de nuevo. Le comparto un ejemplo de página que hicimos: https://neoesis.pe (cambiar por el enlace real). La de {negocio} podría estar lista en pocos días desde US$ 190, con dominio incluido. ¿Le armo el boceto?',
true,2),
('C','Pregunta corta (día 6)','whatsapp',null,
'Una pregunta rápida: ¿la página web para {negocio} es algo que les interesa este año o lo dejamos para más adelante? Con un sí o un no me ayuda muchísimo.',
true,3),
('D','Cierre de ciclo (día 10)','whatsapp',null,
'Entiendo que deben estar con mucho trabajo. No le escribo más para no incomodar. Si más adelante necesitan su página web, aquí estamos: Neoesis DEVS, +51 940 009 717. ¡Éxitos con {negocio}!',
true,4),
('E','Respuesta a interesado','whatsapp',null,
'¡Excelente! Para armar el boceto de {negocio} me ayudan 3 cosas: su logo (si tienen), 3 a 5 fotos del local o trabajos, y los servicios principales con horarios.',
false,5),
('M1','Email 1 — Primer contacto','email','{negocio} en Google: una idea rápida',
'Hola:

Encontré {negocio} en Google Maps: {resenas} reseñas con {estrellas} estrellas. Noté que aún no tienen página web, así que quien busca "{rubro} en {distrito}" termina en la web de otro negocio.

En Neoesis DEVS creamos páginas para negocios como el suyo: botón de WhatsApp, ubicación, servicios y sus reseñas, listas en pocos días desde US$ 190 con dominio incluido.

¿Le envío un boceto gratuito de cómo se vería la de {negocio}? Basta con responder "sí".

Saludos,
{yo} · Neoesis DEVS® · +51 940 009 717',
true,6),
('M2','Email 2 — Seguimiento (día 4)','email','Re: {negocio} en Google: una idea rápida',
'Hola. Le escribo por si mi correo anterior quedó enterrado. ¿Le interesa ver el boceto gratuito de la página de {negocio}? Si prefiere, conversamos por WhatsApp al +51 940 009 717.

{yo} · Neoesis DEVS®',
true,7),
('M3','Email 3 — Cierre (día 10)','email','¿Cierro su caso?',
'Hola. No quiero llenarle la bandeja, así que este es mi último correo. Si más adelante necesitan su página web, respondan este mensaje y lo retomamos. ¡Éxitos!

{yo} · Neoesis DEVS®',
true,8)
on conflict (code) do nothing;

-- Estado por canal (WhatsApp, llamada, email) y su respuesta
alter table prospects
  add column if not exists wa_sent_at timestamptz,
  add column if not exists wa_result text,
  add column if not exists call_at timestamptz,
  add column if not exists call_result text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_result text;

-- Etiquetas libres (ej. "Rediseño", "Posiblemente sin intranet")
alter table prospects add column if not exists tags text[] not null default '{}';
create index if not exists prospects_tags_idx on prospects using gin (tags);
