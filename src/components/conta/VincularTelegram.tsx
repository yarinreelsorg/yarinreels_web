"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  desvincularTelegram,
  gerarCodigoVinculacao,
  verificarVinculacao,
} from "@/app/(public)/conta/actions";
import { buttonTap } from "@/lib/motion";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function VincularTelegram({
  nrIdTelegramInicial,
}: {
  nrIdTelegramInicial: number | null;
}) {
  const [nrIdTelegram, setNrIdTelegram] = useState(nrIdTelegramInicial);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const intervaloRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervaloRef.current) window.clearInterval(intervaloRef.current);
    };
  }, []);

  const pararPolling = () => {
    if (intervaloRef.current) {
      window.clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  };

  const checar = async () => {
    setVerificando(true);
    try {
      const resultado = await verificarVinculacao();
      if (resultado.status === "confirmado") {
        setNrIdTelegram(resultado.nr_id_telegram);
        setCodigo(null);
        pararPolling();
      } else if (resultado.status === "expirado") {
        setErro("O código expirou. Gere um novo.");
        setCodigo(null);
        pararPolling();
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao verificar.");
    } finally {
      setVerificando(false);
    }
  };

  const aoGerarCodigo = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await gerarCodigoVinculacao();
      setCodigo(resultado.codigo);
      pararPolling();
      intervaloRef.current = window.setInterval(checar, 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar código.");
    } finally {
      setCarregando(false);
    }
  };

  const aoDesvincular = async () => {
    if (!window.confirm("Desvincular sua conta do Telegram?")) return;
    setCarregando(true);
    setErro(null);
    try {
      await desvincularTelegram();
      setNrIdTelegram(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao desvincular.");
    } finally {
      setCarregando(false);
    }
  };

  if (nrIdTelegram) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Telegram vinculado
          </span>
        </div>
        <p className="mt-2 font-mono text-sm text-foreground">{nrIdTelegram}</p>
        <p className="mt-1 text-xs text-secondary">
          Suas compras feitas pelo bot aparecem automaticamente na sua conta.
        </p>
        <button
          type="button"
          onClick={aoDesvincular}
          disabled={carregando}
          className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Desvincular
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">Telegram não vinculado</p>
      <p className="mt-1 text-xs text-secondary">
        Isso é opcional — você já pode comprar e assistir normalmente pelo
        site. Vincular só sincroniza o que você comprou pelo nosso bot no
        Telegram, pra aparecer aqui também.
      </p>

      {codigo ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-md border border-dashed border-primary/40 bg-background px-4 py-3 text-center">
            <p className="text-2xl font-black tracking-[0.2em] text-primary">{codigo}</p>
          </div>
          <p className="text-xs leading-relaxed text-secondary">
            {BOT_USERNAME ? (
              <>
                Envie{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
                  /vincular {codigo}
                </code>{" "}
                para{" "}
                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  @{BOT_USERNAME}
                </a>{" "}
                no Telegram.
              </>
            ) : (
              <>
                Envie{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
                  /vincular {codigo}
                </code>{" "}
                para o nosso bot no Telegram.
              </>
            )}
            {" "}Expira em 15 minutos.
          </p>
          <motion.button
            type="button"
            onClick={checar}
            disabled={verificando}
            {...buttonTap}
            className="w-full rounded-md border border-border py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
          >
            {verificando ? "Verificando..." : "Já enviei, verificar agora"}
          </motion.button>
        </motion.div>
      ) : (
        <motion.button
          type="button"
          onClick={aoGerarCodigo}
          disabled={carregando}
          {...buttonTap}
          className="mt-4 rounded-md bg-primary px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {carregando ? "Gerando..." : "Vincular Telegram"}
        </motion.button>
      )}

      {erro && <p className="mt-3 text-xs text-red-400">{erro}</p>}
    </div>
  );
}
