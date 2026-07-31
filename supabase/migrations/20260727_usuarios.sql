-- Migração pra fora do Auth da Supabase: tabela própria de usuários do
-- site, com autenticação feita em código (bcrypt + JWT), igual ao que o
-- painel admin já faz com ADMINISTRADORES. Roda ENQUANTO o schema `auth`
-- da Supabase ainda existir (ele não some só porque paramos de usar a API
-- deles — é só mais um schema no mesmo Postgres).

create table if not exists "USUARIOS" (
  cd_usuario          uuid primary key default gen_random_uuid(),
  nm_email            text not null unique,
  ds_senha_hash       text not null,
  nm_nome             text,
  nr_id_telegram      bigint,
  nr_id_telegram_web  bigint,
  ts_criacao          timestamptz not null default now(),
  ts_atualizacao      timestamptz not null default now()
);

-- Copia os usuários existentes preservando o mesmo UUID: LISTA_FAVORITOS
-- e VINCULACOES_TELEGRAM já referenciam esse id (cd_usuario_auth) e não
-- podem ficar órfãs. O hash de senha do Supabase Auth é bcrypt padrão,
-- então bcryptjs.compare() continua funcionando pros usuários migrados.
insert into "USUARIOS" (cd_usuario, nm_email, ds_senha_hash, nm_nome, nr_id_telegram, nr_id_telegram_web, ts_criacao)
select
  id,
  email,
  encrypted_password,
  raw_user_meta_data->>'nome',
  nullif(raw_user_meta_data->>'nr_id_telegram', '')::bigint,
  nullif(raw_user_meta_data->>'nr_id_telegram_web', '')::bigint,
  created_at
from auth.users
on conflict (cd_usuario) do nothing;
