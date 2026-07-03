# CLAUDE.md

This file provides guidance to Claude Code when working with the **Yarinreels Web** repository.

## Commands

- `npm run dev` — start the dev server (Next.js + Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`)

No test runner configured yet.

## Project

Yarinreels Web é uma plataforma de streaming profissional (estilo Netflix) construída sobre um bot Telegram legado já em produção. O bot continua rodando no mesmo Supabase — **nunca quebrar compatibilidade com ele**.

## Architecture

Next.js 14 App Router (`src/app/`), TypeScript strict, Tailwind CSS v4.

- Path alias `@/*` → `src/*`
- `reactCompiler: true` no `next.config.ts` — não usar `useMemo`/`useCallback`/`React.memo` manualmente
- Styling via `@tailwindcss/postcss` (`postcss.config.mjs`), globals em `src/app/globals.css`
- Server Components por padrão — `"use client"` só onde estritamente necessário
- Server Actions para mutações — evitar API Routes desnecessárias
- **Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client**
- Validar acesso sempre no servidor antes de retornar URL de vídeo

## Stack

- **Frontend:** Next.js 14 App Router, React, Tailwind CSS v4
- **Banco:** Supabase (PostgreSQL) — mesmo projeto do bot legado
- **Auth:** Supabase Auth (email+senha e Magic Link)
- **Pagamentos:** Efí Bank via `sdk-node-apis-efi` (Pix + cartão)
- **CDN de vídeo:** Bunny.net (HLS/DASH)
- **Deploy:** Vercel + Cloudflare

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
BUNNY_CDN_URL=
```

## Database Schema (Supabase)

```
CONTEUDOS        cd_conteudo, nm_titulo, nm_categoria, tp_formato[FILME|SERIE|DOCUMENTARIO|AULA],
                 dt_lancamento, nm_idioma, ds_descricao, ds_generos (vírgula separada),
                 ds_url_trailer_youtube, nr_duracao_minutos, vl_aluguel, vl_vitalicio,
                 ds_url_poster, ds_file_id_telegram, ds_url_bunny,
                 tp_fonte_prioritaria[LOCAL|BUNNY|TELEGRAM], sn_destaque, nr_views

EPISODIOS        cd_episodio, cd_conteudo (FK), nr_episodio, nm_titulo,
                 ds_file_id_telegram, ds_url_bunny

VENDAS           cd_venda, nr_id_telegram, cd_conteudo (FK), cd_plano (FK),
                 tp_compra[ALUGUEL|VITALICIO|ASSINATURA], tp_status[PENDENTE|APROVADA],
                 ds_txid, ts_criacao, ts_atualizacao, ts_expiracao

PLANOS           cd_plano, nm_plano, nm_categoria, nr_dias_validade

BANS             nr_id_telegram
```

## Business Rules

- **Validade de acesso:** `tp_status = APROVADA` AND `ts_expiracao > now()`
- **Dias por tipo:** ALUGUEL = 7 dias · VITALICIO = 18250 dias · ASSINATURA = `PLANOS.nr_dias_validade`
- **Sinônimos de categoria:** "todas/tudo/todos" libera tudo · "asiatica" = "dorama" · "americano" = "americana"
- **Fonte do vídeo:** `tp_fonte_prioritaria` define origem — LOCAL (arquivo físico) · BUNNY (CDN) · TELEGRAM (file_id)
- **Pix:** aprovação instantânea via webhook Efí + varredor de fallback a cada 2 min (já existe no bot)
- **Cartão:** taxa adicional fixa configurável sobre o valor

## Modules

| Módulo | Descrição |
|---|---|
| Home | Catálogo Netflix: hero, top 12 por `nr_views`, carrosséis por categoria, busca, filtro |
| Player | Bunny.net/HLS, "Continuar Assistindo", proteção contra download |
| Checkout | Pix QR Code, cartão com taxa, planos de assinatura, upsell pós-filme |
| Auth | Email+senha e Magic Link, vinculação com `nr_id_telegram` existente |
| Minha Lista | Conteúdos salvos e histórico de compras |
| Dashboard Admin | Financeiro em tempo real, CRUD catálogo, gestão de clientes/planos/cupons |

## What NOT to touch

O bot Telegram legado roda em paralelo no mesmo Supabase. As seguintes coisas já existem e **não devem ser reimplementadas nem quebradas:**

- Varredor automático de pagamentos pendentes (polling Efí a cada 2 min)
- Webhook de pagamento Efí Bank
- Wizard de cadastro de conteúdos via bot
- Automação via canal privado do Telegram
- Gestão de clientes/bans via bot