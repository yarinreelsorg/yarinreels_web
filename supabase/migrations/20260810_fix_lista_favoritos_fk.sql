-- LISTA_FAVORITOS.cd_usuario_auth ainda apontava pra auth.users (Supabase
-- Auth, abandonado na migração pra Postgres puro) — mesmo bug já corrigido
-- em VINCULACOES_TELEGRAM (20260806): favoritar falha com "violates foreign
-- key constraint" pra qualquer usuário cadastrado depois da migração, porque
-- o UUID dele nunca existiu em auth.users. Aponta a FK pra USUARIOS.
alter table "LISTA_FAVORITOS"
  drop constraint if exists "LISTA_FAVORITOS_cd_usuario_auth_fkey";

alter table "LISTA_FAVORITOS"
  add constraint "LISTA_FAVORITOS_cd_usuario_auth_fkey"
  foreign key (cd_usuario_auth) references "USUARIOS" (cd_usuario) on delete cascade;
