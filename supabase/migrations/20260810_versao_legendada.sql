-- Permite cadastrar dublado + legendado no MESMO título/episódio, em vez de
-- duplicar o cadastro inteiro. Espelha os campos que já guardam a fonte do
-- vídeo (ds_url_bunny / ds_file_id_telegram, usados conforme
-- tp_fonte_prioritaria em resolverUrlVideo) com uma variante "_legendado" —
-- quando ausente, o player cai de volta pra faixa padrão (dublado).
alter table "CONTEUDOS" add column if not exists ds_url_bunny_legendado text;
alter table "CONTEUDOS" add column if not exists ds_file_id_telegram_legendado text;

alter table "EPISODIOS" add column if not exists ds_url_bunny_legendado text;
alter table "EPISODIOS" add column if not exists ds_file_id_telegram_legendado text;
