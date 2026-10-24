-- Reportado: cadastrar "STORYREEL" (ou qualquer grafia) em App de Origem
-- nao fazia o conteudo aparecer no filtro desse app -- comparacao exata
-- (case-sensitive) entre CONTEUDOS.nm_app_origem e APPS_NAVEGACAO.nm_app,
-- mesmo bug de maiuscula/minuscula ja corrigido antes pra categorias.
--
-- Tambem pedido: um titulo pode pertencer a MAIS DE UM app de origem (ex:
-- licenciado por dois apps diferentes ao mesmo tempo) e a MAIS DE UMA
-- categoria. Segue o mesmo padrao ja usado em PLANOS.nm_categorias_adicionais
-- (ver 20260908_categorias_adicionais_plano.sql): coluna array ADITIVA,
-- nm_app_origem/nm_categoria originais continuam existindo e sendo o valor
-- "principal" (compatibilidade com o bot legado, que so conhece essas
-- colunas singulares) -- as novas colunas plural sao so pra web.
alter table "CONTEUDOS" add column if not exists nm_apps_origem text[] not null default '{}';
alter table "CONTEUDOS" add column if not exists nm_categorias_adicionais text[] not null default '{}';

-- Backfill: quem ja tinha nm_app_origem preenchido entra tambem na lista
-- nova, pra nao perder o filtro existente enquanto o admin nao reedita.
update "CONTEUDOS"
  set nm_apps_origem = ARRAY[nm_app_origem]
  where nm_app_origem is not null and nm_app_origem <> '' and nm_apps_origem = '{}';
