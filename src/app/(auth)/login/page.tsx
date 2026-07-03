"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzirErroAuth } from "@/lib/auth";
import AuthCard from "@/components/auth/AuthCard";
import CampoTexto from "@/components/auth/CampoTexto";

type Modo = "senha" | "magico";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [linkEnviado, setLinkEnviado] = useState(false);

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    setErro(null);
  }

  async function entrarComSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error.message));
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function enviarLinkMagico(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error.message));
      return;
    }

    setLinkEnviado(true);
  }

  return (
    <AuthCard
      titulo="Entrar"
      subtitulo="Acesse sua conta para continuar assistindo"
    >
      <div className="mb-6 flex rounded-full border border-secondary/20 bg-black/20 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => trocarModo("senha")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            modo === "senha"
              ? "bg-primary text-white"
              : "text-secondary hover:text-foreground"
          }`}
        >
          Senha
        </button>
        <button
          type="button"
          onClick={() => trocarModo("magico")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            modo === "magico"
              ? "bg-primary text-white"
              : "text-secondary hover:text-foreground"
          }`}
        >
          Link mágico
        </button>
      </div>

      {modo === "senha" ? (
        <form onSubmit={entrarComSenha} className="flex flex-col gap-4">
          <CampoTexto
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            required
          />
          <CampoTexto
            label="Senha"
            type="password"
            value={senha}
            onChange={setSenha}
            placeholder="••••••••"
            required
          />
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : linkEnviado ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          Enviamos um link de acesso para <strong>{email}</strong>. Confira
          sua caixa de entrada.
        </p>
      ) : (
        <form onSubmit={enviarLinkMagico} className="flex flex-col gap-4">
          <CampoTexto
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            required
          />
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Enviando..." : "Enviar link mágico"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-secondary">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
