-- Tela "Solicitar Drama" no Mini App (bot legado): cliente pede um título
-- que ainda não está no catálogo. A ideia (pedido do suporte) é dar
-- preferência aos dramas com mais pedidos na hora de decidir o que trazer.
-- Escrito pelo bot (Melreels_Server/app.js), lido pelo painel do yarin
-- (admin/solicitacoes) — mesmo banco compartilhado pelos dois projetos.
--
-- Índice único por (usuário, título normalizado) impede que o mesmo
-- cliente infle a contagem pedindo o mesmo título várias vezes.
create table if not exists "SOLICITACOES_DRAMA" (
  cd_solicitacao uuid primary key default gen_random_uuid(),
  nr_id_telegram bigint not null,
  ds_titulo text not null,
  ts_criacao timestamptz not null default now()
);

create unique index if not exists solicitacoes_drama_usuario_titulo_idx
  on "SOLICITACOES_DRAMA" (nr_id_telegram, lower(trim(ds_titulo)));
