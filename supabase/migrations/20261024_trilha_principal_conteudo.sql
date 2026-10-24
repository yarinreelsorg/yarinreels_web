-- Hoje o par de campos "principal" (ds_url_bunny/ds_file_id_telegram,
-- conforme tp_fonte_prioritaria) é sempre tratado como a faixa DUBLADA, e o
-- par "_legendado" sempre como a faixa LEGENDADA (ver resolverUrlVideo em
-- src/lib/catalogo.ts). Isso trava um caso real: título cadastrado
-- originalmente só com a faixa legendada nos campos principais (dublado
-- ainda não existia), e quando o dublado sai depois não há onde cadastrá-lo
-- sem duplicar o título inteiro.
--
-- Essa coluna deixa explícito qual trilha o par de campos principais
-- representa PRA AQUELE título — o par "_legendado" passa a significar
-- "a outra trilha", seja ela qual for. Default DUBLADO preserva o
-- comportamento atual de todo o catálogo já cadastrado. Coluna exclusiva
-- da web (bot legado não lê/escreve).
alter table "CONTEUDOS"
  add column if not exists tp_trilha_principal text not null default 'DUBLADO';

alter table "CONTEUDOS" drop constraint if exists conteudos_tp_trilha_principal_check;
alter table "CONTEUDOS"
  add constraint conteudos_tp_trilha_principal_check
  check (tp_trilha_principal in ('DUBLADO', 'LEGENDADO'));
