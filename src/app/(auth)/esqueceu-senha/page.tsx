"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthCard from "@/components/auth/AuthCard";
import CampoTexto from "@/components/auth/CampoTexto";
import { solicitarRecuperacaoSenha } from "./actions";

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ mensagem: string; linkDev?: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await solicitarRecuperacaoSenha(formData);
      setSucesso({ mensagem: res.mensagem, linkDev: res.linkDev });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao solicitar recuperação de senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthCard
      titulo="Recuperar senha"
      subtitulo="Informe seu e-mail para receber as instruções"
    >
      {sucesso ? (
        <div className="flex flex-col gap-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Verifique seu e-mail</h2>
            <p className="text-sm text-secondary leading-relaxed">{sucesso.mensagem}</p>
          </div>

          {sucesso.linkDev && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Modo de Desenvolvimento
              </p>
              <p className="mt-1 text-xs text-amber-200/90">
                Como o serviço de e-mail não está configurado localmente, acesse o link direto abaixo:
              </p>
              <a
                href={sucesso.linkDev}
                className="mt-2 inline-block break-all text-xs text-primary underline hover:text-primary-dark font-mono"
              >
                {sucesso.linkDev}
              </a>
            </div>
          )}

          <Link
            href="/login"
            className="mt-2 rounded-md bg-zinc-800 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-zinc-700"
          >
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CampoTexto
            label="E-mail"
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            required
          />

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-md bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Enviando..." : "Enviar instruções"}
          </button>

          <p className="mt-4 text-center text-sm text-secondary">
            Lembrou sua senha?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
