"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Administrador, TpPapelAdmin } from "@/types/database";
import {
  alternarAtivoAdministrador,
  atualizarPapelAdministrador,
  atualizarTaxaCartao,
  criarAdministrador,
} from "./actions";
import { buttonTap } from "@/lib/motion";

export default function ConfiguracoesClient({
  administradores,
  cdAdministradorAtual,
  papelAtual,
  taxaCartaoInicial,
}: {
  administradores: Administrador[];
  cdAdministradorAtual: string | null;
  papelAtual: TpPapelAdmin;
  taxaCartaoInicial: number;
}) {
  const ehSuperAdmin = papelAtual === "SUPER_ADMIN";

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  const [taxaCartao, setTaxaCartao] = useState(String(taxaCartaoInicial));
  const [salvandoTaxa, setSalvandoTaxa] = useState(false);
  const [erroTaxa, setErroTaxa] = useState<string | null>(null);
  const [taxaSalva, setTaxaSalva] = useState(false);

  const aoSalvarTaxa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvandoTaxa(true);
    setErroTaxa(null);
    setTaxaSalva(false);
    try {
      const formData = new FormData(e.currentTarget);
      await atualizarTaxaCartao(formData);
      setTaxaSalva(true);
      setTimeout(() => setTaxaSalva(false), 2000);
    } catch (err) {
      setErroTaxa(err instanceof Error ? err.message : "Erro ao salvar a taxa.");
    } finally {
      setSalvandoTaxa(false);
    }
  };

  const aoSubmeter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const formData = new FormData(e.currentTarget);
      await criarAdministrador(formData);
      setModalAberto(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar administrador.");
    } finally {
      setSalvando(false);
    }
  };

  const aoAlternarAtivo = async (cd: string, ativo: boolean) => {
    setCarregandoId(cd);
    try {
      await alternarAtivoAdministrador(cd, ativo);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar status.");
    } finally {
      setCarregandoId(null);
    }
  };

  const aoMudarPapel = async (cd: string, papel: TpPapelAdmin) => {
    setCarregandoId(cd);
    try {
      await atualizarPapelAdministrador(cd, papel);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar papel.");
    } finally {
      setCarregandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Configurações</h1>
          <p className="text-sm text-[#A78BFA]">Gestão de administradores do painel.</p>
        </div>
        {ehSuperAdmin && (
          <motion.button
            type="button"
            onClick={() => setModalAberto(true)}
            {...buttonTap}
            className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            ＋ Novo Administrador
          </motion.button>
        )}
      </div>

      {!ehSuperAdmin && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm text-amber-400">
          Apenas super administradores podem criar, ativar/desativar ou alterar o papel de outros
          administradores.
        </div>
      )}

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white">Pagamento com Cartão</h2>
        <p className="mt-1 text-sm text-[#A78BFA]">
          Taxa fixa adicional cobrada sobre o valor de qualquer compra paga com cartão.
        </p>
        <form onSubmit={aoSalvarTaxa} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="vl_taxa_cartao" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
              Taxa (R$)
            </label>
            <input
              type="number"
              id="vl_taxa_cartao"
              name="vl_taxa_cartao"
              step="0.01"
              min="0"
              value={taxaCartao}
              onChange={(e) => setTaxaCartao(e.target.value)}
              disabled={!ehSuperAdmin}
              className="w-40 bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white disabled:opacity-50"
            />
          </div>
          {ehSuperAdmin && (
            <motion.button
              type="submit"
              disabled={salvandoTaxa}
              {...buttonTap}
              className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-5 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {salvandoTaxa ? "Salvando..." : taxaSalva ? "Salvo!" : "Salvar"}
            </motion.button>
          )}
          {erroTaxa && <p className="w-full text-sm text-red-400">{erroTaxa}</p>}
        </form>
      </div>

      <div className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[#0D0A1A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(139,92,246,0.15)] bg-[#050208]/50 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">E-mail</th>
                <th className="px-6 py-3">Papel</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Último Login</th>
                {ehSuperAdmin && <th className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="divide-y divide-[rgba(139,92,246,0.15)] text-sm text-white"
            >
              {administradores.map((admin) => {
                const ehVoce = admin.cd_administrador === cdAdministradorAtual;
                const ocupado = carregandoId === admin.cd_administrador;

                return (
                  <motion.tr
                    key={admin.cd_administrador}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="hover:bg-[rgba(139,92,246,0.05)] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {admin.nm_nome}
                      {ehVoce && (
                        <span className="ml-2 rounded-full bg-[#7B2FBE]/20 px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                          Você
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#A78BFA]">{admin.nm_email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          admin.tp_papel === "SUPER_ADMIN"
                            ? "bg-[#7B2FBE]/20 text-[#A78BFA] border border-[#7B2FBE]/30"
                            : "bg-[#050208] text-[#A78BFA]/80 border border-[rgba(139,92,246,0.2)]"
                        }`}
                      >
                        {admin.tp_papel === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {admin.sn_ativo ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#A78BFA]/80">
                      {admin.ts_ultimo_login
                        ? new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(admin.ts_ultimo_login))
                        : "Nunca"}
                    </td>
                    {ehSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={admin.tp_papel}
                            disabled={ocupado}
                            onChange={(e) =>
                              aoMudarPapel(admin.cd_administrador, e.target.value as TpPapelAdmin)
                            }
                            className="rounded border border-[rgba(139,92,246,0.3)] bg-[#050208] px-2 py-1 text-xs text-white disabled:opacity-50"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                          <button
                            type="button"
                            disabled={ehVoce || ocupado}
                            onClick={() => aoAlternarAtivo(admin.cd_administrador, !admin.sn_ativo)}
                            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              admin.sn_ativo
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {admin.sn_ativo ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalAberto && (
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
              className="relative w-full max-w-md rounded-lg border border-[rgba(139,92,246,0.2)] bg-[#0D0A1A] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-[rgba(139,92,246,0.15)] pb-4">
                <h2 className="text-xl font-bold text-white">Novo Administrador</h2>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-[#A78BFA] hover:text-white text-2xl transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="nm_nome" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="nm_nome"
                    name="nm_nome"
                    required
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="nm_email" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="nm_email"
                    name="nm_email"
                    required
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="senha" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    required
                    minLength={8}
                    placeholder="mínimo 8 caracteres"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="tp_papel" className="block text-xs font-semibold text-[#A78BFA] uppercase mb-1">
                    Papel
                  </label>
                  <select
                    id="tp_papel"
                    name="tp_papel"
                    defaultValue="ADMIN"
                    className="w-full bg-[#050208] border border-[rgba(139,92,246,0.3)] focus:border-[#9D4EDD] focus:outline-none rounded-[6px] p-2.5 text-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {erro && <p className="text-sm text-red-400">{erro}</p>}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(139,92,246,0.15)] mt-2">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="rounded-md border border-[rgba(255,255,255,0.2)] hover:bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-md bg-[#7B2FBE] hover:bg-[#6D28D9] disabled:opacity-50 px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
                  >
                    {salvando ? "Criando..." : "Criar"}
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
