"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TpCompra, Venda, Conteudo, Plano } from "@/types/database";
import { formatarPreco } from "@/lib/catalogo";
import Pagination from "@/components/admin/Pagination";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { buttonTap } from "@/lib/motion";
import { concederAcesso } from "./actions";

const ITENS_POR_PAGINA = 15;

export default function ClientesAdminClient({
  vendas,
  conteudos,
  planos,
}: {
  vendas: Venda[];
  conteudos: Conteudo[];
  planos: Plano[];
}) {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [selectedTelegramId, setSelectedTelegramId] = useState<number | null>(null);

  // Conceder acesso (modal)
  const [concederAberto, setConcederAberto] = useState(false);
  const [telegramIdConceder, setTelegramIdConceder] = useState("");
  const [tipoConceder, setTipoConceder] = useState<TpCompra>("ALUGUEL");
  const [buscaConteudo, setBuscaConteudo] = useState("");
  const [salvandoAcesso, setSalvandoAcesso] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);

  // Quick lookup maps
  const conteudosMap = new Map<string, Conteudo>();
  for (const c of conteudos) {
    conteudosMap.set(c.cd_conteudo, c);
  }

  const planosMap = new Map<string, Plano>();
  for (const p of planos) {
    planosMap.set(p.cd_plano, p);
  }

  const getValorAproximado = (v: Venda) => {
    if (v.tp_compra === "ASSINATURA") return 20;
    if (v.tp_compra === "ALUGUEL") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_aluguel : null) ?? 10;
    }
    if (v.tp_compra === "VITALICIO") {
      return (v.cd_conteudo ? conteudosMap.get(v.cd_conteudo)?.vl_vitalicio : null) ?? 30;
    }
    return 0;
  };

  // Group sales by Telegram ID
  const clientesMap = new Map<
    number,
    {
      nr_id_telegram: number;
      total_compras: number;
      ultima_compra: string;
      tipos_acesso: string[];
      vendas: Venda[];
    }
  >();

  for (const v of vendas) {
    const client = clientesMap.get(v.nr_id_telegram) ?? {
      nr_id_telegram: v.nr_id_telegram,
      total_compras: 0,
      ultima_compra: v.ts_criacao,
      tipos_acesso: [],
      vendas: [],
    };

    client.total_compras += 1;
    if (new Date(v.ts_criacao) > new Date(client.ultima_compra)) {
      client.ultima_compra = v.ts_criacao;
    }
    if (!client.tipos_acesso.includes(v.tp_compra)) {
      client.tipos_acesso.push(v.tp_compra);
    }
    client.vendas.push(v);
    clientesMap.set(v.nr_id_telegram, client);
  }

  const clientesList = Array.from(clientesMap.values()).sort(
    (a, b) => new Date(b.ultima_compra).getTime() - new Date(a.ultima_compra).getTime()
  );

  const clientesFiltrados = clientesList.filter((c) =>
    String(c.nr_id_telegram).includes(busca)
  );

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA));
  const clientesPaginados = clientesFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const aoBuscar = (valor: string) => {
    setBusca(valor);
    setPaginaAtual(1);
  };

  const selectedClient = selectedTelegramId !== null ? clientesMap.get(selectedTelegramId) : null;

  const conteudosFiltradosModal = conteudos
    .filter((c) => c.nm_titulo.toLowerCase().includes(buscaConteudo.toLowerCase()))
    .slice(0, 50);

  const abrirConceder = (nrIdTelegram?: number) => {
    setTelegramIdConceder(nrIdTelegram ? String(nrIdTelegram) : "");
    setTipoConceder("ALUGUEL");
    setBuscaConteudo("");
    setErroAcesso(null);
    setConcederAberto(true);
  };

  const aoSubmeterAcesso = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvandoAcesso(true);
    setErroAcesso(null);
    try {
      const formData = new FormData(e.currentTarget);
      await concederAcesso(formData);
      setConcederAberto(false);
    } catch (err) {
      setErroAcesso(err instanceof Error ? err.message : "Erro ao conceder acesso.");
    } finally {
      setSalvandoAcesso(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Clientes</h1>
          <p className="text-sm text-[#A78BFA]">Controle de acessos e histórico de compradores.</p>
        </div>
        <motion.button
          type="button"
          onClick={() => abrirConceder()}
          {...buttonTap}
          className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
        >
          ＋ Conceder Acesso
        </motion.button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Buscar por ID Telegram..."
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          className="w-full bg-[#0D0A1A] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] py-2 px-4 text-white text-sm"
        />
      </div>

      {/* Clientes Table */}
      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">ID Telegram</th>
                <th className="px-6 py-3">Total de Compras</th>
                <th className="px-6 py-3">Última Compra</th>
                <th className="px-6 py-3">Tipos de Acesso</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              key={paginaAtual}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {clientesPaginados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A78BFA]/70">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((cliente) => {
                  const dataUltima = new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(cliente.ultima_compra));

                  return (
                    <motion.tr
                      key={cliente.nr_id_telegram}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold">
                        {cliente.nr_id_telegram}
                      </td>
                      <td className="px-6 py-4 font-semibold">{cliente.total_compras}</td>
                      <td className="px-6 py-4 text-xs text-[#A78BFA]/80">{dataUltima}</td>
                      <td className="px-6 py-4 flex flex-wrap gap-1.5">
                        {cliente.tipos_acesso.map((tipo) => (
                          <span
                            key={tipo}
                            className="bg-[#050208] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs text-[#A78BFA] font-medium"
                          >
                            {tipo}
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTelegramId(cliente.nr_id_telegram)}
                          className="rounded bg-[#7B2FBE]/20 border border-[#7B2FBE]/30 text-white font-bold text-xs px-3.5 py-1.5 hover:bg-[#7B2FBE]/40 transition-colors cursor-pointer"
                        >
                          👁️ Ver Detalhes
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
        <Pagination
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onChange={setPaginaAtual}
        />
      </div>

      {/* Side Panel (Drawer) for details */}
      <AnimatePresence>
      {selectedClient && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTelegramId(null)}
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] bg-[#0D0A1A] border-l border-[rgba(139,92,246,0.2)] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
          >
            <div>
              {/* Drawer Header */}
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Histórico do Cliente</h2>
                  <p className="text-xs font-mono text-[#A78BFA] mt-0.5">
                    Telegram ID: {selectedClient.nr_id_telegram}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTelegramId(null)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Purchase History */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A78BFA] mb-2">
                  Transações ({selectedClient.vendas.length})
                </h3>

                <StaggerGroup className="space-y-3" staggerChildren={0.05} once={false}>
                  {selectedClient.vendas
                    .sort(
                      (a, b) =>
                        new Date(b.ts_criacao).getTime() - new Date(a.ts_criacao).getTime()
                    )
                    .map((v) => {
                      const valor = getValorAproximado(v);
                      let itemNome = "-";
                      if (v.tp_compra === "ASSINATURA") {
                        itemNome =
                          (v.cd_plano && planosMap.get(v.cd_plano)?.nm_plano) ??
                          `Plano #${v.cd_plano}`;
                      } else {
                        itemNome =
                          (v.cd_conteudo && conteudosMap.get(v.cd_conteudo)?.nm_titulo) ??
                          `Conteúdo #${v.cd_conteudo}`;
                      }

                      const dataVenda = new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(v.ts_criacao));

                      const dataExpiracao = v.ts_expiracao
                        ? new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).format(new Date(v.ts_expiracao))
                        : null;

                      return (
                        <StaggerItem
                          key={v.cd_venda}
                          className="rounded-lg border border-[rgba(139,92,246,0.1)] bg-[#050208]/60 p-4 space-y-2 hover:border-[rgba(139,92,246,0.2)] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="bg-[#0D0A1A] border border-[rgba(139,92,246,0.2)] px-2 py-0.5 rounded text-xs font-semibold text-[#A78BFA]">
                              {v.tp_compra}
                            </span>
                            <span className="font-mono text-xs text-[#A78BFA]/60">{dataVenda}</span>
                          </div>

                          <div className="text-sm font-semibold text-white truncate">
                            {itemNome}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div>
                              <span className="text-[#A78BFA]/70">Preço:</span>{" "}
                              <span className="font-bold text-[#A78BFA]">
                                {formatarPreco(valor)}
                              </span>
                            </div>
                            {dataExpiracao && (
                              <div>
                                <span className="text-[#A78BFA]/70">Expira:</span>{" "}
                                <span className="text-white font-medium">{dataExpiracao}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end pt-1">
                            {v.tp_status === "APROVADA" ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                APROVADA
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                PENDENTE
                              </span>
                            )}
                          </div>
                        </StaggerItem>
                      );
                    })}
                </StaggerGroup>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-[rgba(139,92,246,0.15)] pt-4">
              <button
                type="button"
                onClick={() => setSelectedTelegramId(null)}
                className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => abrirConceder(selectedClient.nr_id_telegram)}
                className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                ＋ Conceder Acesso
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Modal Conceder Acesso */}
      <AnimatePresence>
        {concederAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-lg rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 className="text-xl font-bold text-white">Conceder Acesso</h2>
                <button
                  type="button"
                  onClick={() => setConcederAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSubmeterAcesso} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="nr_id_telegram" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    ID do Telegram
                  </label>
                  <input
                    type="number"
                    id="nr_id_telegram"
                    name="nr_id_telegram"
                    required
                    value={telegramIdConceder}
                    onChange={(e) => setTelegramIdConceder(e.target.value)}
                    placeholder="Ex: 123456789"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="tp_compra" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Tipo de Acesso
                  </label>
                  <select
                    id="tp_compra"
                    name="tp_compra"
                    value={tipoConceder}
                    onChange={(e) => setTipoConceder(e.target.value as TpCompra)}
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  >
                    <option value="ALUGUEL">Aluguel de conteúdo (7 dias)</option>
                    <option value="VITALICIO">Acesso vitalício a conteúdo</option>
                    <option value="ASSINATURA">Plano de assinatura</option>
                  </select>
                </div>

                {tipoConceder === "ASSINATURA" ? (
                  <div>
                    <label htmlFor="cd_plano" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Plano
                    </label>
                    <select
                      id="cd_plano"
                      name="cd_plano"
                      required
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      {planos.map((p) => (
                        <option key={p.cd_plano} value={p.cd_plano}>
                          {p.nm_plano} · {p.nr_dias_validade} dias
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="busca_conteudo" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                      Conteúdo
                    </label>
                    <input
                      type="text"
                      id="busca_conteudo"
                      placeholder="Buscar título..."
                      value={buscaConteudo}
                      onChange={(e) => setBuscaConteudo(e.target.value)}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white mb-2"
                    />
                    <select
                      name="cd_conteudo"
                      required
                      size={6}
                      className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                    >
                      {conteudosFiltradosModal.map((c) => (
                        <option key={c.cd_conteudo} value={c.cd_conteudo}>
                          {c.nm_titulo} ({c.nm_categoria})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {erroAcesso && <p className="text-sm text-red-400">{erroAcesso}</p>}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)] mt-2">
                  <button
                    type="button"
                    onClick={() => setConcederAberto(false)}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoAcesso}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {salvandoAcesso ? "Concedendo..." : "Conceder Acesso"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
