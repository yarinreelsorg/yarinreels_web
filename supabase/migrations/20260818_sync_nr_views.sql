-- Migration: 20260818_sync_nr_views.sql
-- Sincroniza a coluna nr_views da tabela CONTEUDOS com base no histórico real de vendas/visualizações do bot/sistema

UPDATE "CONTEUDOS" c
SET nr_views = GREATEST(c.nr_views, COALESCE(v.total_vendas, 0))
FROM (
  SELECT cd_conteudo, count(*)::int AS total_vendas
  FROM "VENDAS"
  WHERE cd_conteudo IS NOT NULL
  GROUP BY cd_conteudo
) v
WHERE c.cd_conteudo = v.cd_conteudo;
