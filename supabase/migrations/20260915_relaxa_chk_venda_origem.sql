-- chk_venda_origem exigia EXATAMENTE UM de cd_conteudo/cd_plano preenchido
-- (nunca os dois nulos, nunca os dois preenchidos). Isso quebrou a
-- exclusão de plano (ON DELETE SET NULL, ver 20260912_venda_plano_fk_set_null.sql):
-- ao apagar um plano, o Postgres tenta zerar cd_plano nas vendas de
-- assinatura que ainda apontavam pra ele (histórico não migrado/expirado)
-- — mas essas vendas já têm cd_conteudo nulo por natureza (é assinatura,
-- não tem conteúdo específico), então zerar cd_plano deixava os dois
-- nulos, violando a constraint e cancelando a exclusão inteira.
--
-- Relaxa pra só proibir os DOIS preenchidos ao mesmo tempo (o que
-- continua sem sentido: uma venda não pode ser ao mesmo tempo compra de
-- conteúdo avulso E assinatura de plano). Uma venda de assinatura cujo
-- plano foi excluído passa a ficar com os dois nulos — órfã, mas com o
-- registro (quem comprou, quando, quanto pagou) preservado, que é
-- exatamente o objetivo do ON DELETE SET NULL.
alter table "VENDAS" drop constraint if exists "chk_venda_origem";
alter table "VENDAS"
  add constraint "chk_venda_origem"
  check (not (cd_conteudo is not null and cd_plano is not null));
