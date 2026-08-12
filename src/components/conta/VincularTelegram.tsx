"use client";

import {
  desvincularTelegram,
  gerarCodigoVinculacao,
  obterVideoSuporteAction,
  verificarVinculacao,
} from "@/app/(public)/conta/actions";
import { buttonTap } from "@/lib/motion";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Melreels_bot";

function VideoPlayer({ url }: { url: string }) {
  if (!url) return null;
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");

  if (isYoutube) {
    let embedUrl = url;
    if (url.includes("watch?v=")) {
      const id = url.split("watch?v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${id}`;
    }
    return (
      <iframe
        src={embedUrl}
        className="w-full aspect-video rounded-lg border border-border shadow-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isVimeo) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    return (
      <iframe
        src={`https://player.vimeo.com/video/${id}`}
        className="w-full aspect-video rounded-lg border border-border shadow-lg"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={url}
      controls
      autoPlay
      className="w-full rounded-lg max-h-[380px] bg-black border border-border shadow-lg"
    />
  );
}

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
  const [videoSuporteUrl, setVideoSuporteUrl] = useState<string | null>(null);
  const [modalVideoAberto, setModalVideoAberto] = useState(false);
  const intervaloRef = useRef<number | null>(null);

  useEffect(() => {
    obterVideoSuporteAction().then((url) => {
      if (url && url.trim()) setVideoSuporteUrl(url.trim());
    }).catch(() => {});

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

  const aoClicarPedirAjuda = () => {
    if (videoSuporteUrl) {
      setModalVideoAberto(true);
    } else {
      window.open("https://t.me/YarinTV", "_blank");
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

          <motion.button
            type="button"
            onClick={aoClicarPedirAjuda}
            {...buttonTap}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            💬 Suporte Telegram
          </motion.button>
        </div>

        {modalVideoAberto && videoSuporteUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">🎥 Tutorial de Ajuda do Suporte</h3>
                <button
                  type="button"
                  onClick={() => setModalVideoAberto(false)}
                  className="text-secondary hover:text-foreground text-sm font-bold cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>

              <VideoPlayer url={videoSuporteUrl} />

              <p className="text-xs text-secondary leading-relaxed">
                Assista ao vídeo explicativo acima. Se ainda precisar de ajuda, toque no botão abaixo para falar diretamente com nosso atendimento.
              </p>

              <div className="flex gap-2">
                <a
                  href="https://t.me/YarinTV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-md bg-emerald-500 hover:bg-emerald-600 py-2.5 text-center text-xs font-bold text-white transition-colors"
                >
                  💬 Falar no Telegram (@YarinTV)
                </a>
                <button
                  type="button"
                  onClick={() => setModalVideoAberto(false)}
                  className="rounded-md border border-border px-4 py-2.5 text-xs font-bold text-secondary hover:text-foreground cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
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
              href={`tg://resolve?domain=${BOT_USERNAME}&text=${encodeURIComponent(`/vincular ${codigo}`)}`}
              {...buttonTap}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
            >
              ✈️ Abrir Telegram com /vincular {codigo}
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
        <motion.button
          type="button"
          onClick={aoClicarPedirAjuda}
          {...buttonTap}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0 cursor-pointer"
        >
          💬 Pedir Ajuda para o Suporte
        </motion.button>
      </div>

      {modalVideoAberto && videoSuporteUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">🎥 Tutorial de Ajuda do Suporte</h3>
              <button
                type="button"
                onClick={() => setModalVideoAberto(false)}
                className="text-secondary hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <VideoPlayer url={videoSuporteUrl} />

            <p className="text-xs text-secondary leading-relaxed">
              Assista ao vídeo explicativo acima. Se ainda precisar de ajuda, toque no botão abaixo para falar diretamente com nosso atendimento no Telegram.
            </p>

            <div className="flex gap-2">
              <a
                href="https://t.me/YarinTV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md bg-emerald-500 hover:bg-emerald-600 py-2.5 text-center text-xs font-bold text-white transition-colors"
              >
                💬 Falar no Telegram (@YarinTV)
              </a>
              <button
                type="button"
                onClick={() => setModalVideoAberto(false)}
                className="rounded-md border border-border px-4 py-2.5 text-xs font-bold text-secondary hover:text-foreground cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
