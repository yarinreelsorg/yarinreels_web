-- Um plano de assinatura hoje só desbloqueia UMA categoria
-- (PLANOS.nm_categoria) — mas alguns planos precisam desbloquear várias
-- (ex: "Mensal: Americanas, Turcas e Brasileiras"). Digitar isso direto
-- em nm_categoria como "Americano, Brasileira" quebra o acesso de todo
-- mundo que já assina esse plano, porque essa string inteira não bate
-- com nenhuma categoria/sinônimo de verdade (ver categoriasCompativeis).
--
-- nm_categoria continua existindo do jeito que sempre foi — é o campo
-- que o bot legado lê/espera, não pode virar array nem sumir. Essa
-- coluna nova é só um EXTRA que este app (site) passa a considerar
-- também, sem o bot precisar saber que ela existe.
alter table "PLANOS"
  add column if not exists nm_categorias_adicionais text[] not null default '{}';
