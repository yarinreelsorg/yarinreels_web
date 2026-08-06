-- VINCULACOES_TELEGRAM.cd_usuario_auth ainda apontava pra auth.users (Supabase
-- Auth, abandonado na migração pra Postgres puro) — todo vínculo novo falhava
-- com "violates foreign key constraint" porque o UUID do usuário nunca
-- existiu naquela tabela. Aponta a FK pra USUARIOS, que é a fonte de verdade
-- atual.
alter table "VINCULACOES_TELEGRAM"
  drop constraint if exists "VINCULACOES_TELEGRAM_cd_usuario_auth_fkey";

alter table "VINCULACOES_TELEGRAM"
  add constraint "VINCULACOES_TELEGRAM_cd_usuario_auth_fkey"
  foreign key (cd_usuario_auth) references "USUARIOS" (cd_usuario) on delete cascade;
