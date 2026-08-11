---
name: criar-migration
description: Cria uma nova migration Postgres em supabase/migrations/ seguindo o padrão do projeto (nome, idempotência) e aplica direto no banco de produção (DATABASE_URL) via script one-off, já que não há CLI/runner de migration configurado. Use quando o usuário pedir pra adicionar/alterar coluna, criar tabela, corrigir constraint/FK, ou qualquer mudança de schema no Postgres deste projeto.
---

# Criar e aplicar migration

Este projeto **não tem migration runner** (nem Supabase CLI, nem Prisma, nem Knex configurado). O fluxo real é: escrever o `.sql`, guardar no repo pra histórico, e rodar esse mesmo SQL direto contra o banco via um script Node one-off usando a `DATABASE_URL` do `.env.local`.

O banco é **compartilhado com o bot Telegram legado**, que continua rodando em produção. Isso significa:

- **Nunca** faça `DROP`/`ALTER ... DROP COLUMN`/renomeie coluna em `CONTEUDOS`, `EPISODIOS`, `VENDAS`, `PLANOS`, `BANS` — o bot lê/escreve essas tabelas direto e não sabe nada sobre este código.
- Mudanças em tabelas do bot devem ser só **aditivas** (`ADD COLUMN IF NOT EXISTS`, sempre nullable ou com `DEFAULT`, nunca `NOT NULL` sem default numa tabela que já tem linhas).
- Tabelas exclusivas deste app (`USUARIOS`, `LISTA_FAVORITOS`, `CONFIGURACAO_*`, `ADMINISTRADORES`, `LOGS_AUDITORIA` etc.) têm mais liberdade, mas ainda assim prefira migrations idempotentes e reversíveis.

## Passo a passo

1. **Nomeie o arquivo**: `supabase/migrations/YYYYMMDD_descricao_curta.sql` (data de hoje, snake_case, descreve o que muda — ex: `20260810_carencia_assinante.sql`). Confira os arquivos existentes em `supabase/migrations/` pro tom/estilo do comentário de topo.

2. **Escreva SQL idempotente**:
   - `create table if not exists "TABELA" (...)`
   - `alter table "TABELA" add column if not exists coluna tipo`
   - `alter table "TABELA" drop constraint if exists nome_constraint;` antes de recriar uma constraint/FK
   - Nomes de tabela sempre entre aspas duplas (case-sensitive, vieram da Supabase)
   - Comentário no topo do arquivo explicando o *porquê* da mudança (não o *o quê* — o SQL já mostra isso), principalmente se for corrigindo um bug (referencie o sintoma)

3. **Aplique no banco de produção** com um script one-off (não crie arquivo permanente pra isso — rode via `node -e` e descarte):

   ```bash
   node -e "
   const fs = require('fs');
   const env = fs.readFileSync('.env.local', 'utf8');
   const match = env.match(/DATABASE_URL\s*=\s*\"?([^\"\n]+)\"?/);
   const DATABASE_URL = match[1];
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: DATABASE_URL });
   (async () => {
     await pool.query(fs.readFileSync('supabase/migrations/ARQUIVO.sql', 'utf8'));
     console.log('OK');
     await pool.end();
   })().catch((e) => { console.error(e); process.exit(1); });
   "
   ```

   Ajuste o caminho do arquivo. Se a migration tiver múltiplos statements que dependem de ordem, rode o arquivo inteiro de uma vez (o driver `pg` executa múltiplos statements separados por `;` numa única `query()` sequencialmente).

4. **Atualize os tipos TypeScript** relevantes em `src/types/database.ts` se a migration adicionar/mudar colunas usadas pelo app (campo novo em `Conteudo`, `Episodio` etc.) — sem isso o `tsc` não vai pegar código que esqueceu de popular o campo novo.

5. **Nunca peça pro usuário rodar a migration manualmente no dashboard da Supabase/Railway** — esse projeto não usa mais a API da Supabase, só Postgres direto; aplique você mesmo via `DATABASE_URL`.

## Antes de aplicar

Se a migration for destrutiva (drop, rename, mudança de tipo que perde dado) ou mexer em tabela do bot legado, **mostre o SQL pro usuário e peça confirmação antes de rodar** — mesmo que o resto do fluxo (migrations aditivas simples) não precise de confirmação prévia.
