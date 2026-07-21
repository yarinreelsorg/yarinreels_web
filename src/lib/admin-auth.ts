import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 horas

export type AdminPapel = "SUPER_ADMIN" | "ADMIN";

export interface AdminSessionPayload {
  cd_administrador: string;
  nm_email: string;
  nm_nome: string;
  tp_papel: AdminPapel;
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET não configurado no .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function criarSessionToken(payload: AdminSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verificarSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

export async function getSessaoAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarSessionToken(token);
}
