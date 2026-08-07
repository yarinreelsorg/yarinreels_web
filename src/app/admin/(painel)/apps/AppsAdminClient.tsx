"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { AppNavegacao } from "@/lib/apps-config";
import { useToast } from "@/components/admin/ToastProvider";
import { buttonTap } from "@/lib/motion";
import {
  alternarVisibilidadeApp,
  atualizarOrdemApps,
  criarApp,
  editarApp,
  removerApp,
} from "./actions";

function ehUrlImagem(valor: string) {
  return valor.startsWith("http://") || valor.startsWith("https://");
}

function IconePreview({ valor, className }: { valor: string; className?: string }) {
  if (ehUrlImagem(valor)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={valor} alt="" className={`rounded-md object-cover ${className ?? ""}`} />
    );
  }
  return <span className={className}>{valor || "▶️"}</span>;
}

export default function AppsAdminClient({ appsIniciais }: { appsIniciais: AppNavegacao[] }) {
  const toast = useToast();
  const [apps, setApps] = useState(appsIniciais);
  const [nomeNovo, setNomeNovo] = useState("");
  const [iconeNovo, setIconeNovo] = useState("▶️");
  const [criando, setCriando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [iconeEdicao, setIconeEdicao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [indiceArrastado, setIndiceArrastado] = useState<number | null>(null);
  const [indiceSobre, setIndiceSobre] = useState<number | null>(null);

  const aoCriar = async () => {
    if (!nomeNovo.trim()) return;
    setCriando(true);
    try {
      await criarApp(nomeNovo, iconeNovo);
      setApps((atual) => [
        ...atual,
        {
          cd_app: crypto.randomUUID(),
          nm_app: nomeNovo.trim(),
          ds_icone: iconeNovo.trim() || "▶️",
          nr_ordem: atual.length,
          sn_visivel: true,
        },
      ]);
      setNomeNovo("");
      setIconeNovo("▶️");
      toast.sucesso("App adicionado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao adicionar app.");
    } finally {
      setCriando(false);
    }
  };

  const iniciarEdicao = (app: AppNavegacao) => {
    setEditandoId(app.cd_app);
    setNomeEdicao(app.nm_app);
    setIconeEdicao(app.ds_icone);
  };

  const salvarEdicao = async (nomeAntigo: string) => {
    if (!editandoId) return;
    setSalvandoEdicao(true);
    try {
      await editarApp(editandoId, nomeEdicao, iconeEdicao, nomeAntigo);
      setApps((atual) =>
        atual.map((a) =>
          a.cd_app === editandoId ? { ...a, nm_app: nomeEdicao.trim(), ds_icone: iconeEdicao.trim() || "▶️" } : a
        )
      );
      toast.sucesso("App atualizado.");
      setEditandoId(null);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const aoRemover = async (cdApp: string) => {
    if (!window.confirm("Remover este app da navegação?")) return;
    setApps((atual) => atual.filter((a) => a.cd_app !== cdApp));
    try {
      await removerApp(cdApp);
      toast.sucesso("App removido.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao remover.");
    }
  };

  const aoAlternarVisivel = async (app: AppNavegacao) => {
    const novoValor = !app.sn_visivel;
    setApps((atual) =>
      atual.map((a) => (a.cd_app === app.cd_app ? { ...a, sn_visivel: novoValor } : a))
    );
    try {
      await alternarVisibilidadeApp(app.cd_app, novoValor);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao atualizar visibilidade.");
    }
  };

  const moverApp = (origem: number, destino: number) => {
    if (destino < 0 || destino >= apps.length || origem === destino) return;
    const proxima = [...apps];
    const [removido] = proxima.splice(origem, 1);
    proxima.splice(destino, 0, removido);
    setApps(proxima);
  };

  const aoSoltarArraste = async (destino: number) => {
    if (indiceArrastado === null) return;
    moverApp(indiceArrastado, destino);
    setIndiceArrastado(null);
    setIndiceSobre(null);
  };

  const aoSalvarOrdem = async () => {
    try {
      await atualizarOrdemApps(apps.map((a) => a.cd_app));
      toast.sucesso("Ordem salva.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao salvar ordem.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Apps de Navegação</h1>
        <p className="text-sm text-[#A78BFA]">
          Gerencia os ícones de app (ReelShort, DramaBox etc.) mostrados no site. O nome aqui
          precisa bater com o campo &quot;App de origem&quot; preenchido no cadastro de cada
          conteúdo, senão o filtro não encontra nada. No campo de ícone, cole o link de uma
          imagem (logo oficial do app) ou digite um emoji.
        </p>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Novo app</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex items-end gap-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#050208] border border-[rgba(139,92,246,0.15)] text-lg">
              <IconePreview valor={iconeNovo} className="h-full w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                Ícone (emoji ou link da logo)
              </label>
              <input
                type="text"
                value={iconeNovo}
                onChange={(e) => setIconeNovo(e.target.value)}
                placeholder="▶️ ou https://..."
                className="w-40 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">Nome</label>
            <input
              type="text"
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
              placeholder="Ex: ReelShort"
              className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
            />
          </div>
          <motion.button
            type="button"
            onClick={aoCriar}
            disabled={criando || !nomeNovo.trim()}
            {...buttonTap}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            Adicionar
          </motion.button>
        </div>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Apps cadastrados</h2>

        {apps.length === 0 ? (
          <p className="mt-4 text-sm text-[#A78BFA]">Nenhum app cadastrado ainda.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-1.5">
            {apps.map((app, indice) => (
              <div
                key={app.cd_app}
                draggable={editandoId !== app.cd_app}
                onDragStart={() => setIndiceArrastado(indice)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (indiceSobre !== indice) setIndiceSobre(indice);
                }}
                onDragEnd={() => {
                  setIndiceArrastado(null);
                  setIndiceSobre(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  aoSoltarArraste(indice);
                }}
                className={`flex cursor-grab items-center justify-between gap-3 rounded-md border bg-[#050208] px-4 py-2.5 transition-colors active:cursor-grabbing ${
                  indiceSobre === indice ? "border-[#9D4EDD]" : "border-[rgba(139,92,246,0.15)]"
                } ${indiceArrastado === indice ? "opacity-40" : ""} ${!app.sn_visivel ? "opacity-50" : ""}`}
              >
                {editandoId === app.cd_app ? (
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#0D0A1A] border border-[rgba(139,92,246,0.15)]">
                      <IconePreview valor={iconeEdicao} className="h-full w-full" />
                    </div>
                    <input
                      type="text"
                      value={iconeEdicao}
                      onChange={(e) => setIconeEdicao(e.target.value)}
                      placeholder="▶️ ou https://..."
                      className="w-32 bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] px-2 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      value={nomeEdicao}
                      onChange={(e) => setNomeEdicao(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && salvarEdicao(app.nm_app)}
                      autoFocus
                      className="flex-1 bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] px-3 py-1.5 text-sm text-white"
                    />
                    <button
                      type="button"
                      disabled={salvandoEdicao}
                      onClick={() => salvarEdicao(app.nm_app)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className="text-xs font-bold text-[#A78BFA] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-2.5 text-sm text-white">
                    <span className="text-[#A78BFA]/60 select-none">⠿</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md text-lg">
                      <IconePreview valor={app.ds_icone} className="h-full w-full" />
                    </span>
                    {app.nm_app}
                    {!app.sn_visivel && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-[#A78BFA]">
                        Oculto
                      </span>
                    )}
                  </span>
                )}

                {editandoId !== app.cd_app && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(app)}
                      aria-label="Editar"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => aoAlternarVisivel(app)}
                      aria-label={app.sn_visivel ? "Ocultar" : "Mostrar"}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 cursor-pointer"
                    >
                      {app.sn_visivel ? "👁" : "🚫"}
                    </button>
                    <button
                      type="button"
                      onClick={() => moverApp(indice, indice - 1)}
                      disabled={indice === 0}
                      aria-label="Mover pra cima"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moverApp(indice, indice + 1)}
                      disabled={indice === apps.length - 1}
                      aria-label="Mover pra baixo"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#A78BFA] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => aoRemover(app.cd_app)}
                      aria-label="Remover"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:text-red-300 hover:bg-white/5 cursor-pointer"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {apps.length > 0 && (
          <motion.button
            type="button"
            onClick={aoSalvarOrdem}
            {...buttonTap}
            className="mt-4 rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            Salvar ordem
          </motion.button>
        )}
      </div>
    </div>
  );
}
