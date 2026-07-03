"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { traduzirErroAuth } from "@/lib/auth";
import AuthCard from "@/components/auth/AuthCard";
import CampoTexto from "@/components/auth/CampoTexto";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cadastrado, setCadastrado] = useState(false);

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error.message));
      return;
    }

    setCadastrado(true);
  }

  if (cadastrado) {
    return (
      <AuthCard
        titulo="Quase lá"
        subtitulo="Confirme seu e-mail para ativar a conta"
      >
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra
          o e-mail para ativar sua conta.
        </p>
        <p className="mt-6 text-center text-sm text-secondary">
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titulo="Criar conta"
      subtitulo="Assine e comece a assistir em minutos"
    >
      <form onSubmit={cadastrar} className="flex flex-col gap-4">
        <CampoTexto
          label="Nome"
          type="text"
          value={nome}
          onChange={setNome}
          placeholder="Seu nome"
          required
        />
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
        <CampoTexto
          label="Confirmar senha"
          type="password"
          value={confirmarSenha}
          onChange={setConfirmarSenha}
          placeholder="••••••••"
          required
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="mt-1 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(139,92,246,0.4)] transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
