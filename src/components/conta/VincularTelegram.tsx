"use client";

import {
  desvincularTelegram,
  gerarCodigoVinculacao,
  verificarVinculacao,
} from "@/app/(public)/conta/actions";
import { buttonTap } from "@/lib/motion";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Fallback pro username real do bot — se a env var não estiver configurada
// no ambiente de produção, o link não pode virar "t.me/undefined" (isso faz
// o Telegram cair na home telegram.org em vez de abrir o bot).
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YarinTV";

export default function VincularTelegram({
  nrIdTelegramInicial,
}: {
  nrIdTelegramInicial: number | null;
}) {
  const [nrIdTelegram, setNrIdTelegram] = useState(nrIdTelegramInicial);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);
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
    setCopiado(false);
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

  const aoCopiarComando = () => {
    if (!codigo) return;
    const comando = `/vincular ${codigo}`;
    navigator.clipboard.writeText(comando).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }).catch(() => {});
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
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={aoDesvincular}
            disabled={carregando}
            className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
          >
            Desvincular
          </button>

          <motion.a
            href="https://t.me/YarinTV"
            target="_blank"
            rel="noopener noreferrer"
            {...buttonTap}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            💬 Suporte Telegram
          </motion.a>
        </div>
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
            Envie{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
              /vincular {codigo}
            </code>{" "}
            para o bot no Telegram (@{BOT_USERNAME}). Expira em 15 minutos.
          </p>

          <div className="flex flex-col gap-2">
            <motion.a
              href={`https://t.me/${BOT_USERNAME}?start=${codigo}`}
              target="_blank"
              rel="noopener noreferrer"
              {...buttonTap}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
            >
              ✈️ Abrir Telegram (@{BOT_USERNAME})
            </motion.a>

            <motion.button
              type="button"
              onClick={aoCopiarComando}
              {...buttonTap}
              className="w-full rounded-md border border-primary/40 bg-primary/10 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
            >
              {copiado ? "✅ Comando Copiado!" : `📋 Copiar "/vincular ${codigo}"`}
            </motion.button>

            <motion.button
              type="button"
              onClick={checar}
              disabled={verificando}
              {...buttonTap}
              className="w-full rounded-md border border-border py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
            >
              {verificando ? "Verificando..." : "Já enviei, verificar agora"}
            </motion.button>
          </div>
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

      <div className="mt-5 border-t border-border/60 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs text-secondary">Dúvidas ou problemas com a vinculação?</span>
        <motion.a
          href="https://t.me/YarinTV"
          target="_blank"
          rel="noopener noreferrer"
          {...buttonTap}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
        >
          💬 Pedir Ajuda para o Suporte
        </motion.a>
      </div>
    </div>
  );
}
