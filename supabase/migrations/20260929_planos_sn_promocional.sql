-- Trava de recompra pra planos promocionais (pedido do suporte: cliente
-- comprando o plano promocional mais de uma vez). Plano marcado como
-- promocional só pode ser assinado uma vez por cliente na vida, mesmo
-- depois de expirar — checado em iniciarCheckoutPixPlano/Cartão
-- (checkout/actions.ts) e no /api/create-order do bot legado.
-- Coluna aditiva e compartilhada com o bot legado (Melreels_Server/app.js).
alter table "PLANOS" add column if not exists sn_promocional boolean not null default false;
