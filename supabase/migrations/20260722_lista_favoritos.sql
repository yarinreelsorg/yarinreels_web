-- "Minha Lista" — favoritos do usuário web. Não existe equivalente no bot
-- legado, então isso é uma tabela nova, isolada, que não toca no schema dele.

create table if not exists "LISTA_FAVORITOS" (
  cd_favorito      uuid primary key default gen_random_uuid(),
  cd_usuario_auth  uuid not null references auth.users(id) on delete cascade,
  -- sem FK pra CONTEUDOS de propósito: é tabela do bot legado, não queremos
  -- depender de como a PK dela está declarada por lá.
  cd_conteudo      uuid not null,
  ts_criacao       timestamptz not null default now(),

  unique (cd_usuario_auth, cd_conteudo)
);

create index if not exists idx_lista_favoritos_usuario
  on "LISTA_FAVORITOS" (cd_usuario_auth);

alter table "LISTA_FAVORITOS" enable row level security;

create policy "Usuário gerencia os próprios favoritos"
  on "LISTA_FAVORITOS"
  for all
  using (auth.uid() = cd_usuario_auth)
  with check (auth.uid() = cd_usuario_auth);
