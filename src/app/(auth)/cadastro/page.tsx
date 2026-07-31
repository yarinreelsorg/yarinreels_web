"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { cadastrarUsuario } from "./actions";
import AuthCard from "@/components/auth/AuthCard";
import CampoTexto from "@/components/auth/CampoTexto";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
    try {
      const formData = new FormData(e.currentTarget);
      await cadastrarUsuario(formData);
      router.push("/");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar conta.");
      setCarregando(false);
    }
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
          name="nome"
          value={nome}
          onChange={setNome}
          placeholder="Seu nome"
          required
        />
        <CampoTexto
          label="E-mail"
          type="email"
          name="email"
          value={email}
          onChange={setEmail}
          placeholder="voce@email.com"
          required
        />
        <CampoTexto
          label="Senha"
          type="password"
          name="senha"
          value={senha}
          onChange={setSenha}
          placeholder="••••••••"
          required
        />
        <CampoTexto
          label="Confirmar senha"
          type="password"
          name="confirmar_senha"
          value={confirmarSenha}
          onChange={setConfirmarSenha}
          placeholder="••••••••"
          required
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="mt-1 rounded-md bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
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
