"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { useToast } from "@/components/admin/ToastProvider";
import Reveal from "@/components/motion/Reveal";
import { avisarSolicitacao, excluirSolicitacao, type SolicitacaoAgrupada } from "./actions";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SolicitacoesAdminClient({
  solicitacoesIniciais,
}: {
  solicitacoesIniciais: SolicitacaoAgrupada[];
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [solicitacoes, setSolicitacoes] = useState(solicitacoesIniciais);
  const [busca, setBusca] = useState("");

  const aoExcluir = (s: SolicitacaoAgrupada) => {
    if (
      !window.confirm(
        `Remover todos os pedidos de "${s.ds_titulo}"? Use isso depois de trazer o título pro catálogo.`
      )
    )
      return;

    startTransition(async () => {
      try {
        await excluirSolicitacao(s.chave);
        setSolicitacoes(solicitacoes.filter((item) => item.chave !== s.chave));
        toast.sucesso("Pedido removido da lista.");
      } catch {
        toast.erro("Erro ao remover o pedido.");
      }
    });
  };

  const aoAvisar = (s: SolicitacaoAgrupada) => {
    if (
      !window.confirm(
        `Avisar ${s.total} cliente(s) por Telegram que "${s.ds_titulo}" já está disponível? Isso remove o pedido da lista.`
      )
    )
      return;

    startTransition(async () => {
      try {
        await avisarSolicitacao(s.chave, s.ds_titulo);
        setSolicitacoes(solicitacoes.filter((item) => item.chave !== s.chave));
        toast.sucesso("Clientes avisados!");
      } catch (err) {
        toast.erro(err instanceof Error ? err.message : "Erro ao avisar os clientes.");
      }
    });
  };

  const filtradas = solicitacoes.filter((s) =>
    s.ds_titulo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          📩 Solicitações de Drama
        </h1>
        <p className="text-sm text-[#A78BFA] mt-1">
          Títulos pedidos pelos clientes no Mini App, ordenados pelo número de pedidos — use
          como guia pra decidir o que trazer primeiro.
        </p>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar título..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      <Reveal>
        {filtradas.length === 0 ? (
          <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-12 text-center">
            <span className="text-4xl">📩</span>
            <h3 className="mt-3 text-lg font-bold text-white">Nenhuma solicitação encontrada</h3>
            <p className="mt-1 text-xs text-[#A78BFA]">
              Assim que clientes pedirem títulos pelo Mini App, eles aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                    <th className="px-6 py-3">Título</th>
                    <th className="px-6 py-3">Pedidos</th>
                    <th className="px-6 py-3">Último pedido</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.03 } } }}
                  className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
                >
                  {filtradas.map((s) => (
                    <motion.tr
                      key={s.chave}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold">{s.ds_titulo}</td>
                      <td className="px-6 py-4">
                        <span className="bg-[#7B2FBE]/20 border border-[#7B2FBE]/40 px-2.5 py-1 rounded-full text-xs font-bold text-[#A78BFA]">
                          {s.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#A78BFA]">{formatarData(s.ultima_solicitacao)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => aoAvisar(s)}
                            className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            📢 Avisar
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => aoExcluir(s)}
                            className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
