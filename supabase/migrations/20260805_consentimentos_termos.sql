-- Log de aceite dos Termos de Uso / Política de Reembolso no checkout,
-- usado como prova documental pra contestar chargebacks fraudulentos.
create table if not exists "CONSENTIMENTOS_TERMOS" (
  cd_consentimento  uuid primary key default gen_random_uuid(),
  cd_usuario        uuid not null,
  nm_email          text not null,
  ds_contexto       text not null,
  nm_versao_termos  text not null,
  ds_ip             text,
  ds_user_agent     text,
  ts_aceite         timestamptz not null default now()
);

create index if not exists idx_consentimentos_termos_usuario
  on "CONSENTIMENTOS_TERMOS" (cd_usuario);
