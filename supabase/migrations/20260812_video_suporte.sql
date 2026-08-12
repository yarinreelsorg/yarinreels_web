-- Migration para coluna de vídeo tutorial de suporte na tabela CONFIGURACAO_SITE

ALTER TABLE "CONFIGURACAO_SITE" ADD COLUMN IF NOT EXISTS ds_url_video_suporte text;
