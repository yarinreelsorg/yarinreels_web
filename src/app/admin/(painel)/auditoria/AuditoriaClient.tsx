"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { Conteudo, LogAuditoria, Plano } from "@/types/database";
import Pagination from "@/components/admin/Pagination";
import { useToast } from "@/components/admin/ToastProvider";
import { restaurarConteudo } from "../catalogo/actions";
import { restaurarPlano } from "../planos/actions";
import { formatarDataHora } from "@/lib/data";

const ROTULO_ACAO: Record<string, string> = {
  CRIACAO: "Criação",
  EDICAO: "Edição",
  EXCLUSAO: "Exclusão",
  RESTAURACAO: "Restauração",
  CONCESSAO_ACESSO: "Concessão de Acesso",
  ALTERACAO_STATUS: "Alteração de Status",
  ALTERACAO_PAPEL: "Alteração de Papel",
  ALTERACAO_CONFIGURACAO: "Alteração de Configuração",
};

const COR_ACAO: Record<string, string> = {
  CRIACAO: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  EDICAO: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  EXCLUSAO: "text-red-400 border-red-500/20 bg-red-500/10",
  RESTAURACAO: "text-amber-400 border-amber-500/20 bg-amber-500/10",
};

export default function AuditoriaClient({
  logs,
  totalRegistros,
  itensPorPagina,
  pagina,
  busca,
}: {
  logs: LogAuditoria[];
  totalRegistros: number;
  itensPorPagina: number;
  pagina: number;
  busca: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [buscaLocal, setBuscaLocal] = useState(busca);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));

  function navegar(mudancas: { busca?: string; page?: number }) {
    const params = new URLSearchParams();
    const novaBusca = mudancas.busca ?? busca;
    const novaPagina = mudancas.page ?? pagina;
    if (novaBusca) params.set("busca", novaBusca);
    if (novaPagina > 1) params.set("page", String(novaPagina));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const aoBuscar = (valor: string) => {
    setBuscaLocal(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navegar({ busca: valor, page: 1 }), 400);
  };

  const aoRestaurar = async (log: LogAuditoria) => {
    if (!log.ds_detalhes) return;
    setRestaurandoId(log.cd_log);
    try {
      if (log.nm_entidade === "CONTEUDOS") {
        await restaurarConteudo(log.ds_detalhes as unknown as Conteudo);
      } else if (log.nm_entidade === "PLANOS") {
        await restaurarPlano(log.ds_detalhes as unknown as Plano);
      }
      toast.sucesso("Registro restaurado.");
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : "Erro ao restaurar.");
    } finally {
      setRestaurandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Auditoria</h1>
        <p className="text-sm text-[#A78BFA]">
          Histórico de ações realizadas no painel — quem fez o quê e quando.
        </p>
      </div>

      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar por administrador ou entidade..."
          value={buscaLocal}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Quando</th>
                <th className="px-6 py-3">Administrador</th>
                <th className="px-6 py-3">Ação</th>
                <th className="px-6 py-3">Entidade</th>
                <th className="px-6 py-3 text-right">Detalhes</th>
              </tr>
            </thead>
            <motion.tbody
              key={pagina}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.02 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const aberto = expandido === log.cd_log;
                  const podeRestaurar =
                    log.tp_acao === "EXCLUSAO" &&
                    (log.nm_entidade === "CONTEUDOS" || log.nm_entidade === "PLANOS") &&
                    !!log.ds_detalhes;

                  return (
                    <motion.tr
                      key={log.cd_log}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      className="hover:bg-[rgba(139,92,246,0.05)] transition-colors align-top"
                    >
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80 whitespace-nowrap">
                        {formatarDataHora(log.ts_criacao, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium">{log.nm_administrador}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold border ${
                            COR_ACAO[log.tp_acao] ?? "text-[#A78BFA] border-[rgba(139,92,246,0.2)] bg-[#050208]"
                          }`}
                        >
                          {ROTULO_ACAO[log.tp_acao] ?? log.tp_acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-mono text-[#A78BFA]">{log.nm_entidade}</div>
                        {log.cd_entidade && (
                          <div className="text-[#A78BFA]/50 truncate max-w-[160px]">
                            {log.cd_entidade}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {log.ds_detalhes && (
                            <button
                              type="button"
                              onClick={() => setExpandido(aberto ? null : log.cd_log)}
                              className="text-xs font-semibold text-[#A78BFA] hover:text-white cursor-pointer"
                            >
                              {aberto ? "Ocultar" : "Ver JSON"}
                            </button>
                          )}
                          {podeRestaurar && (
                            <button
                              type="button"
                              disabled={restaurandoId === log.cd_log}
                              onClick={() => aoRestaurar(log)}
                              className="rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs px-3 py-1.5 hover:bg-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {restaurandoId === log.cd_log ? "Restaurando..." : "↺ Restaurar"}
                            </button>
                          )}
                        </div>
                        {aberto && log.ds_detalhes && (
                          <pre className="mt-2 max-w-sm overflow-x-auto rounded bg-[#050208] p-3 text-left text-[10px] text-[#A78BFA]/80">
                            {JSON.stringify(log.ds_detalhes, null, 2)}
                          </pre>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
        <Pagination
          paginaAtual={pagina}
          totalPaginas={totalPaginas}
          onChange={(p) => navegar({ page: p })}
        />
      </div>
    </div>
  );
}
