-- Complementa 20260901_teaser_vertical.sql: em vez de exigir sempre um
-- clipe vertical cortado à parte, /trailer/[id] agora também pode tocar o
-- vídeo real do filme direto (já hospedado, object-fit:cover corta as
-- bordas automaticamente pra caber na tela vertical sem distorcer) — mas
-- só uma prévia limitada, já que a página não exige login. Esse campo
-- controla quantos segundos tocam antes do CTA de assinar/comprar assumir
-- a tela; 60s por padrão, editável por título no admin.
alter table "CONTEUDOS"
  add column if not exists nr_segundos_preview_trailer integer not null default 60;
