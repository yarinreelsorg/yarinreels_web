-- Migration: 20260818_recuperacao_senha.sql
-- Tabela para armazenamento de tokens de recuperação de senha dos usuários do site

CREATE TABLE IF NOT EXISTS "RECUPERACAO_SENHA" (
  cd_recuperacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_usuario UUID NOT NULL REFERENCES "USUARIOS"(cd_usuario) ON DELETE CASCADE,
  ds_token TEXT NOT NULL UNIQUE,
  ts_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  sn_utilizado BOOLEAN NOT NULL DEFAULT FALSE,
  ts_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recuperacao_senha_token ON "RECUPERACAO_SENHA"(ds_token);
CREATE INDEX IF NOT EXISTS idx_recuperacao_senha_usuario ON "RECUPERACAO_SENHA"(cd_usuario);
