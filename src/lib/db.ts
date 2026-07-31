import "server-only";
import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

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
