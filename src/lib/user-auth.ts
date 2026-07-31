import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const USER_SESSION_COOKIE = "user_session";
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 dias

export interface UserSessionPayload {
  cd_usuario: string;
  nm_email: string;
  nm_nome: string | null;
  nr_id_telegram: number | null;
  nr_id_telegram_web: number | null;
}

function getSecret() {
  const secret = process.env.USER_SESSION_SECRET;
  if (!secret) {
    throw new Error("USER_SESSION_SECRET não configurado no .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function criarSessionToken(payload: UserSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verificarSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

export const USER_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

export async function getSessaoUsuario() {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarSessionToken(token);
}

export async function definirCookieSessao(payload: UserSessionPayload) {
  const token = await criarSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });
}

export async function limparCookieSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
}
