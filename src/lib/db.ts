import "server-only";
import { Pool, types } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

/**
 * Por padrão o driver `pg` devolve NUMERIC e BIGINT como string (pra não
 * arriscar perder precisão em valores gigantes) — diferente do PostgREST
 * da Supabase, que sempre serializava como number. Como todo o app (tipos
 * TS, `.toFixed()`, comparações de nr_id_telegram) espera number, e nada
 * aqui chega perto de estourar precisão segura de float/int, converte os
 * dois globalmente pra manter o mesmo comportamento de antes.
 */
types.setTypeParser(types.builtins.NUMERIC, (val) => (val === null ? null : parseFloat(val)));
types.setTypeParser(types.builtins.INT8, (val) => (val === null ? null : parseInt(val, 10)));

/**
 * Pool único de conexão com o Postgres (mesmo banco físico usado pela
 * Supabase antes — DATABASE_URL aponta direto pra ele, sem passar pela
 * API/PostgREST). Guardado em `global` pra sobreviver a hot-reload do
 * `next dev` sem abrir uma pool nova a cada reload.
 */
export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}
