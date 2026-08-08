-- Logo do site, editável pelo admin — se vazia, usa /icon.svg (padrão).
create table if not exists "CONFIGURACAO_SITE" (
  cd_configuracao  uuid primary key default gen_random_uuid(),
  ds_logo_url      text
);
