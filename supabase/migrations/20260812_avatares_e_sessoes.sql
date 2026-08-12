-- Migration para tabelas SESSOES (Radar Online em tempo real) e AVATARES (Gerenciador Admin de Avatares)

CREATE TABLE IF NOT EXISTS "SESSOES" (
  nr_id_telegram bigint PRIMARY KEY,
  cd_conteudo uuid,
  status text DEFAULT 'ONLINE',
  dispositivo text,
  ultima_atividade timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AVATARES" (
  cd_avatar uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nm_avatar text NOT NULL,
  nm_categoria text NOT NULL,
  ds_url_foto text NOT NULL,
  nr_ordem int DEFAULT 0,
  fl_ativo boolean DEFAULT true,
  ts_criacao timestamp with time zone DEFAULT now()
);
