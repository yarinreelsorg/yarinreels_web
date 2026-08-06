-- Avatar de perfil (emoji escolhido pelo cliente) — aparece na navbar e no
-- painel admin pra facilitar identificação.
alter table "USUARIOS" add column if not exists ds_avatar text;
