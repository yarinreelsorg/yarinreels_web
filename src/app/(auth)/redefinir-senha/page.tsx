"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import AuthCard from "@/components/auth/AuthCard";
import CampoTexto from "@/components/auth/CampoTexto";
import { validarTokenRecuperacao, redefinirSenha } from "./actions";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaInner />
    </Suspense>
  );
}

function RedefinirSenhaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [erroToken, setErroToken] = useState<string | null>(null);
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function checarToken() {
      if (!token) {
        if (!cancelado) {
          setVerificando(false);
          setTokenValido(false);
          setErroToken("Nenhum código de redefinição foi fornecido.");
        }
        return;
      }

      const res = await validarTokenRecuperacao(token);
      if (!cancelado) {
        setVerificando(false);
        if (res.valido) {
          setTokenValido(true);
          setEmailUsuario(res.email || null);
        } else {
          setTokenValido(false);
          setErroToken(res.erro || "Token de redefinição inválido ou expirado.");
        }
      }
    }

    checarToken();

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErroForm(null);

    if (novaSenha !== confirmarSenha) {
      setErroForm("As senhas não coincidem.");
      return;
    }

    if (novaSenha.length < 6) {
      setErroForm("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("token", token);
      await redefinirSenha(formData);
      setSucesso(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : "Erro ao redefinir a senha.");
      setCarregando(false);
    }
  }

  return (
    <AuthCard
      titulo="Redefinir senha"
      subtitulo={
        emailUsuario
          ? `Criando uma nova senha para ${emailUsuario}`
          : "Escolha uma nova senha para acessar sua conta"
      }
    >
      {verificando ? (
        <div className="py-8 text-center text-sm text-secondary">
          Validando link de redefinição...
        </div>
      ) : !tokenValido ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-sm text-red-400">{erroToken}</p>
          <Link
            href="/esqueceu-senha"
            className="mt-2 rounded-md bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Solicitar novo link
          </Link>
        </div>
      ) : sucesso ? (
        <div className="flex flex-col gap-4 text-center py-4">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Senha alterada com sucesso!</h2>
          <p className="text-sm text-secondary">
            Você foi autenticado automaticamente. Redirecionando para a página inicial...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CampoTexto
            label="Nova senha"
            type="password"
            name="nova_senha"
            value={novaSenha}
            onChange={setNovaSenha}
            placeholder="••••••••"
            required
          />

          <CampoTexto
            label="Confirmar nova senha"
            type="password"
            name="confirmar_senha"
            value={confirmarSenha}
            onChange={setConfirmarSenha}
            placeholder="••••••••"
            required
          />

          {erroForm && <p className="text-sm text-red-400">{erroForm}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-md bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
