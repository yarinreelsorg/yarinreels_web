-- Login de administradores do painel web, separado do Supabase Auth
-- (Supabase Auth continua sendo usado só pelos clientes finais)

create extension if not exists pgcrypto;

create table if not exists "ADMINISTRADORES" (
  cd_administrador uuid primary key default gen_random_uuid(),
  nm_email         text not null unique,
  nm_nome          text not null,
  ds_senha_hash    text not null,
  tp_papel         text not null default 'ADMIN' check (tp_papel in ('SUPER_ADMIN', 'ADMIN')),
  sn_ativo         boolean not null default true,
  ts_criacao       timestamptz not null default now(),
  ts_atualizacao   timestamptz not null default now(),
  ts_ultimo_login  timestamptz
);

create or replace function fn_administradores_touch_updated_at()
returns trigger as $$
begin
  new.ts_atualizacao = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_administradores_touch_updated_at on "ADMINISTRADORES";
create trigger trg_administradores_touch_updated_at
  before update on "ADMINISTRADORES"
  for each row execute function fn_administradores_touch_updated_at();

-- RLS ligada e sem nenhuma policy: só o service_role (usado no server, nunca no client)
-- consegue ler/gravar nessa tabela. anon/authenticated não têm nenhum acesso.
alter table "ADMINISTRADORES" enable row level security;

-- Primeiro administrador (troque o e-mail, nome e senha antes de rodar).
-- crypt(...) gera um hash bcrypt válido, compatível com a checagem feita no app (bcryptjs).
insert into "ADMINISTRADORES" (nm_email, nm_nome, ds_senha_hash, tp_papel)
values (
  'admin@yarinreels.com',
  'Administrador',
  crypt('TROQUE_ESTA_SENHA', gen_salt('bf')),
  'SUPER_ADMIN'
)
on conflict (nm_email) do nothing;
